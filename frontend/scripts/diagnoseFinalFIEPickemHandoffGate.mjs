#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("./runFinalFIEPickemHandoffGate.mjs", import.meta.url),
  "utf8"
);

const defs = [
  ["rc2-policy-required", /defineBoundedPlayerAvailabilityImpactPolicyV1\.mjs/],
  ["rc3-resolver-required", /resolveBoundedAvailabilityImpactV1\.mjs/],
  ["rc3-fixtures-required", /validateBoundedAvailabilityPolicyResolverV1\.mjs/],
  ["rc4-1-contract-required", /defineCanonicalDecisionAvailabilityAdapterContractV1\.mjs/],
  ["rc4-2-adapter-required", /applyAvailabilityToCanonicalDecisionV1\.mjs/],
  ["rc4-2-fixtures-required", /validateCanonicalDecisionAvailabilityAdapterFixturesV1\.mjs/],
  ["handoff-contract-required", /definePickemDecisionConsumerHandoffContractV1\.mjs/],
  ["read-only-gate", /READ_ONLY_RELEASE_READINESS_GATE/],
  ["producer-canonical-fie", /producerIsCanonicalFIE/],
  ["consumer-pickem", /consumerIsPickem/],
  ["stable-boundary", /CANONICAL_FIE_DECISION_API_OUTPUT/],
  ["existing-fields-supported", /existingDecisionFieldsRemainSupported/],
  ["availability-additive", /availabilityNamespaceAdditive/],
  ["availability-optional", /availabilityNamespaceOptionalInitially/],
  ["no-internal-resolver", /noInternalResolverImports/],
  ["no-recompute", /noRecomputation/],
  ["no-reapply", /noReapplication/],
  ["no-reasoning-mutation", /noCanonicalReasoningMutation/],
  ["missing-preserves-baseline", /missingAvailabilityPreservesBaseline/],
  ["neutral-preserves-baseline", /neutralAvailabilityPreservesBaseline/],
  ["failure-preserves-baseline", /resolverFailurePreservesBaseline/],
  ["single-namespace", /singleNamespaceExposure/],
  ["double-counting-prohibited", /doubleCountingProhibited/],
  ["provenance-inspectable", /provenanceInspectable/],
  ["handoff-ready-decision", /FIE_PICKEM_HANDOFF_READY/],
  ["handoff-blocked-decision", /FIE_PICKEM_HANDOFF_BLOCKED/],
  ["pickem-implementation-gated", /pickemConsumerImplementationMayAdvance:\s*handoffReady/],
  ["no-duplicate-reasoning", /pickemMayDuplicateFIEReasoning:\s*false/],
  ["no-pickem-mutation", /pickemRepositoryMutated:\s*false/],
  ["no-decision-scoring-mutation", /productionDecisionScoringMutated:\s*false/],
  ["no-db-mutation", /databaseMutated:\s*false/],
  ["next-step-pickem", /BEGIN_PICKEM_CONSUMER_IMPLEMENTATION_AGAINST_CANONICAL_FIE_DECISION_API_OUTPUT/]
];

const tests = defs.map(([name, re]) => ({
  name,
  passed: re.test(src)
}));

const passed = tests.filter(x => x.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Final FIE Pick'em Handoff Gate RC4.3 Diagnostics",
  sprint: "2.18.24-RC4.3",
  passed,
  failed,
  tests
}, null, 2));

if (failed) process.exitCode = 1;
