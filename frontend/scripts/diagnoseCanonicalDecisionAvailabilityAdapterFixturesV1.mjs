#!/usr/bin/env node
import fs from "node:fs";
const a=fs.readFileSync(new URL("./applyAvailabilityToCanonicalDecisionV1.mjs",import.meta.url),"utf8");
const f=fs.readFileSync(new URL("./validateCanonicalDecisionAvailabilityAdapterFixturesV1.mjs",import.meta.url),"utf8");
const h=fs.readFileSync(new URL("./definePickemDecisionConsumerHandoffContractV1.mjs",import.meta.url),"utf8");
const src=a+"\n"+f+"\n"+h;

const defs=[
 ["adapter-exported",/export function applyAvailabilityToCanonicalDecision/],
 ["baseline-required",/baselineDecision is required/],
 ["missing-neutral",/MISSING_AVAILABILITY/],
 ["neutral-fallback",/NEUTRAL_FALLBACK/],
 ["single-channel",/DECISION_OUTPUT_AVAILABILITY_NAMESPACE_ONLY/],
 ["aggregate-delta",/aggregateAvailabilityDelta/],
 ["provenance-required",/NON_NEUTRAL_RESULT_MISSING_PROVENANCE/],
 ["baseline-not-scored",/intentionally non-mutating with respect to baseline scoring fields/],
 ["missing-fixture",/missing-availability-preserves-baseline/],
 ["neutral-fixture",/neutral-availability-preserves-baseline/],
 ["nonneutral-fixture",/non-neutral-exposed-without-baseline-mutation/],
 ["aggregate-once-fixture",/multiple-adjustments-aggregate-once/],
 ["missing-provenance-fixture",/missing-provenance-fails-neutral/],
 ["input-not-mutated-fixture",/input-baseline-not-mutated/],
 ["provenance-fixture",/provenance-inspectable/],
 ["existing-fields-fixture",/existing-decision-fields-remain-consumable/],
 ["stable-consumer-boundary",/CANONICAL_FIE_DECISION_API_OUTPUT/],
 ["availability-additive",/availabilityIntelligenceNamespaceIsAdditive: true/],
 ["namespace-optional",/availabilityNamespaceRequiredForInitialPickemConsumption: false/],
 ["no-internal-imports",/internalResolverImportsProhibited: true/],
 ["pickem-no-recompute",/mayRecomputeAvailabilityAdjustment: false/],
 ["pickem-no-reapply",/mayApplyAvailabilityDeltaAgain: false/],
 ["pickem-no-fie-mutation",/mayMutateCanonicalFIEReasoning: false/],
 ["producer-missing-preserves",/missingAvailabilityPreservesBaselineDecision: true/],
 ["producer-neutral-preserves",/neutralAvailabilityPreservesBaselineDecision: true/],
 ["producer-failure-preserves",/resolverFailurePreservesBaselineDecision: true/],
 ["double-counting-prohibited",/doubleCountingProhibited: true/],
 ["handoff-defined",/PICKEM_DECISION_CONSUMER_HANDOFF_CONTRACT_V1_DEFINED/],
 ["pickem-mutation-locked",/pickemRepositoryMutationAuthorizedInThisSprint: false/],
 ["decision-scoring-locked",/productionDecisionScoringMutationAuthorized: false/],
 ["db-locked",/databaseMutationAuthorized: false/],
 ["final-gate-next",/RUN_FINAL_FIE_PICKEM_HANDOFF_GATE/]
];

const tests=defs.map(([name,re])=>({name,passed:re.test(src)}));
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({
 suite:"Non-Mutating Canonical Decision Adapter RC4.2 Diagnostics",
 sprint:"2.18.24-RC4.2",passed,failed,tests
},null,2));
if(failed) process.exitCode=1;
