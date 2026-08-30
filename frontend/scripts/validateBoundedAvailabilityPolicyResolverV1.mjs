#!/usr/bin/env node
import { resolveBoundedAvailabilityImpact } from "./resolveBoundedAvailabilityImpactV1.mjs";

const valid = {
  sourceClassification: "FIE_AVAILABILITY_EVIDENCE",
  provider: "TEST_FIXTURE",
  observedAtOrPublishedAt: "2026-08-16T12:00:00Z",
  availabilityConfidence: 0.90,
  evidenceCompleteness: 0.90,
  basePlayerImpact: 8,
  basePlayerImpactSource: "GOVERNED_TEST_BASE_IMPACT"
};

const cases = [
  ["out", {...valid, availabilityStatus:"OUT"}, 0, 0, "BOUNDED_AVAILABILITY_REDUCTION"],
  ["doubtful", {...valid, availabilityStatus:"DOUBTFUL"}, 0.25, 2, "BOUNDED_AVAILABILITY_REDUCTION"],
  ["questionable", {...valid, availabilityStatus:"QUESTIONABLE"}, 1, 8, "NO_AVAILABILITY_REDUCTION"],
  ["available", {...valid, availabilityStatus:"AVAILABLE"}, 1, 8, "NO_AVAILABILITY_REDUCTION"],
  ["unknown", {...valid, availabilityStatus:"UNKNOWN"}, 1, 8, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "UNKNOWN_STATUS"],
  ["unsupported", {...valid, availabilityStatus:"PUP"}, 1, 8, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "UNSUPPORTED_STATUS"],
  ["missing-provenance", {...valid, availabilityStatus:"OUT", provider:""}, 1, 8, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "MISSING_PROVENANCE"],
  ["low-confidence", {...valid, availabilityStatus:"OUT", availabilityConfidence:0.59}, 1, 8, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "MISSING_OR_LOW_CONFIDENCE"],
  ["confidence-boundary", {...valid, availabilityStatus:"OUT", availabilityConfidence:0.60}, 0, 0, "BOUNDED_AVAILABILITY_REDUCTION"],
  ["low-completeness", {...valid, availabilityStatus:"OUT", evidenceCompleteness:0.69}, 1, 8, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "MISSING_OR_LOW_EVIDENCE_COMPLETENESS"],
  ["completeness-boundary", {...valid, availabilityStatus:"OUT", evidenceCompleteness:0.70}, 0, 0, "BOUNDED_AVAILABILITY_REDUCTION"],
  ["missing-base-impact", {...valid, availabilityStatus:"OUT", basePlayerImpact:null}, 1, null, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "MISSING_GOVERNED_BASE_PLAYER_IMPACT"],
  ["missing-base-source", {...valid, availabilityStatus:"OUT", basePlayerImpactSource:""}, 1, 8, "NEUTRAL_AVAILABILITY_ADJUSTMENT", "MISSING_GOVERNED_BASE_PLAYER_IMPACT"],
  ["negative-base-impact-no-sign-reversal", {...valid, availabilityStatus:"DOUBTFUL", basePlayerImpact:-8}, 0.25, -2, "BOUNDED_AVAILABILITY_REDUCTION"],
];

const results = cases.map(([name,input,multiplier,adjusted,decision,fallbackReason=null]) => {
  const actual = resolveBoundedAvailabilityImpact(input);
  const passed =
    actual.selectedMultiplier === multiplier &&
    actual.adjustedPlayerImpact === adjusted &&
    actual.decision === decision &&
    actual.fallbackReason === fallbackReason &&
    actual.productionMutationAuthorized === false;
  return {name,passed,actual};
});

const passed = results.filter(x=>x.passed).length;
const failed = results.length-passed;

console.log(JSON.stringify({
  suite:"Bounded Availability Policy Resolver Synthetic Contract Fixtures",
  sprint:"2.18.24-RC3",
  passed,failed,
  tests:results.map(x=>({name:x.name,passed:x.passed})),
  sampleResults:Object.fromEntries(results.slice(0,5).map(x=>[x.name,x.actual])),
  safeguards:{
    syntheticFixturesOnly:true,
    productionDataConsumed:false,
    teamAggregationExecuted:false,
    matchupModelMutated:false,
    decisionModelMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false
  }
},null,2));

if(failed) process.exitCode=1;
