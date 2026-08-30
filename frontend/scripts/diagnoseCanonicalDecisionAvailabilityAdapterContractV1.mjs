#!/usr/bin/env node
import fs from "node:fs";

const trace = fs.readFileSync(
  new URL("./traceCanonicalFIEDecisionSurface.mjs", import.meta.url),
  "utf8"
);
const contract = fs.readFileSync(
  new URL("./defineCanonicalDecisionAvailabilityAdapterContractV1.mjs", import.meta.url),
  "utf8"
);
const src = trace + "\n" + contract;

const defs = [
  ["decision-api-anchor", /diagnoseFieDecisionApiJsonImports\.mjs/],
  ["decision-api-esm-anchor", /diagnoseFieDecisionApiNodeEsmImports\.mjs/],
  ["promotion-anchor", /promoteNFLGameDecisionModelV1\.mjs/],
  ["player-impact-shadow-anchor", /runPlayerImpactTeamStrengthShadowAcceptance\.mjs/],
  ["dependency-impact-anchor", /runLiveNFLTeamDependencyImpactAcceptance\.mjs/],
  ["provenance-anchor", /runTeamDependencyEvidenceProvenanceAcceptance\.mjs/],
  ["read-only-import-trace", /READ_ONLY_IMPORT_TRACE/],
  ["fie-owns-availability", /availabilityReasoningOwner: "CANONICAL_FIE"/],
  ["fie-owns-decision", /decisionReasoningOwner: "CANONICAL_FIE"/],
  ["pickem-consumer-only", /READ_ONLY_CONSUMER_OF_STABLE_DECISION_OUTPUT/],
  ["no-pickem-resolver", /pickemMayReimplementAvailabilityResolver: false/],
  ["baseline-required", /baselineDecisionRequired: true/],
  ["availability-optional", /boundedAvailabilityResultOptional: true/],
  ["missing-preserves-baseline", /RETURN_BASELINE_DECISION_UNCHANGED/],
  ["failure-preserves-baseline", /RETURN_BASELINE_DECISION_UNCHANGED_WITH_DIAGNOSTIC/],
  ["one-governed-channel", /availabilityDeltaMayEnterExactlyOneGovernedDecisionChannel: true/],
  ["no-team-strength-double-count", /mayAlsoMutateTeamStrengthInSameRequest: false/],
  ["no-roster-double-count", /mayAlsoMutateRosterSignalInSameRequest: false/],
  ["no-dependency-double-count", /mayAlsoMutateDependencySignalInSameRequest: false/],
  ["provenance-inspectable", /inspectable: true/],
  ["availability-namespace", /availabilityNamespace: "availabilityIntelligence"/],
  ["backwards-compatible", /baselineFieldsMustRemainBackwardCompatible: true/],
  ["pickem-namespace-optional", /pickemRequiredToConsumeAvailabilityNamespace: false/],
  ["existing-fields-consumable", /pickemMayContinueReadingExistingDecisionFields: true/],
  ["stable-api-boundary", /CANONICAL_FIE_DECISION_API_OUTPUT/],
  ["internal-resolver-hidden", /pickemConsumerMustNotDependOnInternalResolverFiles: true/],
  ["execution-locked", /productionAdapterExecutionAuthorized: false/],
  ["pickem-mutation-locked", /pickemRepositoryMutationAuthorized: false/],
  ["database-locked", /databaseMutationAuthorized: false/],
  ["next-step-fixtures", /IMPLEMENT_NON_MUTATING_ADAPTER_FIXTURES_AGAINST_CANONICAL_DECISION_OUTPUT/]
];

const tests = defs.map(([name, re]) => ({ name, passed: re.test(src) }));
const passed = tests.filter(t => t.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Canonical Decision Availability Adapter Contract RC4.1 Diagnostics",
  sprint: "2.18.24-RC4.1",
  passed,
  failed,
  tests
}, null, 2));

if (failed) process.exitCode = 1;
