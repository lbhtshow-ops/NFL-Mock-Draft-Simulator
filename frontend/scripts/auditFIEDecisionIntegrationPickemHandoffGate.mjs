#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const SPRINT = "2.18.24-RC4";
const cwd = process.cwd();

const REQUIRED_RESOLVER = path.join(cwd, "scripts", "resolveBoundedAvailabilityImpactV1.mjs");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", "build", ".git"].includes(entry.name)) walk(full, out);
    } else if (/\.(mjs|js|ts|tsx|jsx|json)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const roots = ["scripts", "src"].map(x => path.join(cwd, x)).filter(fs.existsSync);
const files = roots.flatMap(r => walk(r));
const patterns = [
  /Decision API/i,
  /decision[-_ ]?model/i,
  /decision[-_ ]?api/i,
  /matchup[-_ ]?intelligence/i,
  /NFL-GAME-DECISION-MODEL-V1\.0\.0/i,
  /team[-_ ]?intelligence/i
];

const candidates = [];
for (const file of files) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
  const hits = patterns.filter(p => p.test(text)).map(p => p.source);
  if (hits.length) {
    candidates.push({
      file: path.relative(cwd, file),
      hits,
      resolverReference: /resolveBoundedAvailabilityImpactV1/.test(text)
    });
  }
}

const resolverPresent = fs.existsSync(REQUIRED_RESOLVER);
const decision = resolverPresent && candidates.length
  ? "CANONICAL_DECISION_INTEGRATION_SURFACE_IDENTIFIED_FOR_GOVERNED_ADAPTER_DESIGN"
  : "INTEGRATION_SURFACE_NOT_YET_IDENTIFIED_FAIL_CLOSED";

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-DECISION-INTEGRATION-PICKEM-HANDOFF-GATE-AUDIT-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_REPOSITORY_AUDIT",
  resolver: {
    requiredFile: "scripts/resolveBoundedAvailabilityImpactV1.mjs",
    present: resolverPresent
  },
  scan: {
    roots: roots.map(r => path.relative(cwd, r)),
    filesInspected: files.length,
    candidateCount: candidates.length,
    candidates: candidates.slice(0, 80)
  },
  requiredIntegrationContract: {
    canonicalFIEOwnsAvailabilityReasoning: true,
    pickemConsumesStableDecisionContract: true,
    pickemReimplementationProhibited: true,
    availabilityMustNotDoubleCountTeamOrRosterSignals: true,
    neutralFallbackMustPreserveBaselineDecision: true,
    missingAvailabilityMustNotFailDecisionRequest: true,
    provenanceMustRemainInspectable: true
  },
  authorizationBoundary: {
    repositoryAuditAuthorized: true,
    adapterDesignMayAdvance: resolverPresent && candidates.length > 0,
    productionAdapterMutationAuthorized: false,
    matchupScoringMutationAuthorized: false,
    decisionModelScoringMutationAuthorized: false,
    pickemRepositoryMutationAuthorized: false,
    databaseMutationAuthorized: false
  },
  decision,
  nextStep: decision === "CANONICAL_DECISION_INTEGRATION_SURFACE_IDENTIFIED_FOR_GOVERNED_ADAPTER_DESIGN"
    ? "DEFINE_NON_MUTATING_DECISION_AVAILABILITY_ADAPTER_CONTRACT_AGAINST_IDENTIFIED_CANONICAL_SURFACE"
    : "RECONCILE_CANONICAL_FIE_DECISION_API_SURFACE_BEFORE_HANDOFF",
  safeguards: {
    repositoryFilesMutated: false,
    productionDataMutated: false,
    teamStrengthMutated: false,
    matchupModelMutated: false,
    decisionModelMutated: false,
    pickemMutated: false,
    databaseMutated: false
  }
}, null, 2));
