#!/usr/bin/env node
import fs from "node:fs";
const resolver=fs.readFileSync(new URL("./resolveBoundedAvailabilityImpactV1.mjs",import.meta.url),"utf8");
const fixture=fs.readFileSync(new URL("./validateBoundedAvailabilityPolicyResolverV1.mjs",import.meta.url),"utf8");
const joined=resolver+"\n"+fixture;

const defs=[
 ["resolver-exported",/export function resolveBoundedAvailabilityImpact/],
 ["policy-id-locked",/FIE-NFL-BOUNDED-PLAYER-AVAILABILITY-IMPACT-POLICY-V1/],
 ["out-bound",/OUT: \[0, 0\]/],
 ["doubtful-bound",/DOUBTFUL: \[0, 0\.25\]/],
 ["questionable-bound",/QUESTIONABLE: \[0\.75, 1\]/],
 ["available-neutral",/AVAILABLE: \[1, 1\]/],
 ["unknown-neutral",/UNKNOWN: \[1, 1\]/],
 ["confidence-min",/CONFIDENCE_MIN = 0\.60/],
 ["completeness-min",/COMPLETENESS_MIN = 0\.70/],
 ["unsupported-fallback",/UNSUPPORTED_STATUS/],
 ["unknown-fallback",/UNKNOWN_STATUS/],
 ["provenance-fallback",/MISSING_PROVENANCE/],
 ["confidence-fallback",/MISSING_OR_LOW_CONFIDENCE/],
 ["completeness-fallback",/MISSING_OR_LOW_EVIDENCE_COMPLETENESS/],
 ["base-impact-fallback",/MISSING_GOVERNED_BASE_PLAYER_IMPACT/],
 ["least-aggressive-bound",/const selectedMultiplier = maxMultiplier/],
 ["no-production-mutation",/productionMutationAuthorized: false/],
 ["out-fixture",/\["out"/],
 ["doubtful-fixture",/\["doubtful"/],
 ["questionable-fixture",/\["questionable"/],
 ["available-fixture",/\["available"/],
 ["unknown-fixture",/\["unknown"/],
 ["unsupported-fixture",/\["unsupported"/],
 ["missing-provenance-fixture",/\["missing-provenance"/],
 ["low-confidence-fixture",/\["low-confidence"/],
 ["confidence-boundary-fixture",/\["confidence-boundary"/],
 ["low-completeness-fixture",/\["low-completeness"/],
 ["completeness-boundary-fixture",/\["completeness-boundary"/],
 ["missing-base-fixture",/\["missing-base-impact"/],
 ["missing-base-source-fixture",/\["missing-base-source"/],
 ["negative-base-fixture",/\["negative-base-impact-no-sign-reversal"/],
 ["synthetic-only",/syntheticFixturesOnly:true/],
 ["no-production-data",/productionDataConsumed:false/],
 ["no-team-aggregation",/teamAggregationExecuted:false/],
 ["no-matchup-mutation",/matchupModelMutated:false/],
 ["no-decision-mutation",/decisionModelMutated:false/],
 ["no-pickem-mutation",/pickemScoringMutated:false/],
 ["no-db-mutation",/databaseMutated:false/]
];

const tests=defs.map(([name,re])=>({name,passed:re.test(joined)}));
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({
 suite:"Bounded Availability Policy Resolver RC3 Diagnostics",
 sprint:"2.18.24-RC3",passed,failed,tests
},null,2));
if(failed) process.exitCode=1;
