#!/usr/bin/env node
import fs from "node:fs";

const tests = [];
function check(name, condition) {
  tests.push({ name, passed: Boolean(condition) });
}

const rootServer = fs.readFileSync("services/server.mjs", "utf8");
const canonicalServer = fs.readFileSync("services/fieDecisionApi/server.mjs", "utf8");
const composition = fs.readFileSync("services/fieDecisionApi/productionComposition.mjs", "utf8");
const handler = fs.readFileSync("services/fieDecisionApi/handler.mjs", "utf8");
const mapper = fs.readFileSync("services/fieDecisionApi/decisionMapper.mjs", "utf8");
const availability = fs.readFileSync("services/fieDecisionApi/researchRepositoryAvailability.mjs", "utf8");

check(
  "legacy-root-server-delegates-to-canonical-entrypoint",
  /import\s+["']\.\/fieDecisionApi\/server\.mjs["']/.test(rootServer)
);
check(
  "legacy-root-server-does-not-bootstrap-separate-handler",
  !/createFieDecisionApiHandler/.test(rootServer) &&
  !/buildNFLMatchupIntelligenceProfile/.test(rootServer)
);
check(
  "canonical-server-uses-production-composition",
  /createFieDecisionProductionComposition/.test(canonicalServer)
);
check(
  "production-composition-loads-research-repository-availability",
  /createFieResearchRepositoryAvailabilityRuntime/.test(composition) &&
  /runtime\.loadForMatchup/.test(composition)
);
check(
  "handler-forwards-force-refresh",
  /forceRefresh/.test(handler) &&
  /buildMatchup\(\{[\s\S]*forceRefresh/.test(handler)
);
check(
  "mapper-emits-matchup-explainability",
  /matchupExplainability/.test(mapper) &&
  /projectNFLGameIntelligenceDirectionalExplainability/.test(mapper)
);
check(
  "mapper-emits-decision-influence",
  /decisionInfluence/.test(mapper)
);
check(
  "runtime-availability-reads-provider-neutral-research-repository",
  /loadNFLAvailabilityEvidenceFromResearchRepository/.test(availability) &&
  /RESEARCH_REPOSITORY/.test(availability)
);

const passed = tests.filter(t => t.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "FIE Decision API Runtime Entrypoint Parity Diagnostics",
  sprint: "6A",
  passed,
  failed,
  tests,
  requiredRuntimeEntrypoint: "services/fieDecisionApi/server.mjs",
  compatibilityEntrypoint: "services/server.mjs",
  safeguards: {
    pickemMutationAuthorized: false,
    modelMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    databaseMutationAuthorized: false
  }
}, null, 2));

if (failed) process.exitCode = 1;
