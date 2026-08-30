#!/usr/bin/env node
import fs from "node:fs";
const src=fs.readFileSync(new URL("./defineBoundedPlayerAvailabilityImpactPolicyV1.mjs",import.meta.url),"utf8");

const defs=[
 ["policy-id",/FIE-NFL-BOUNDED-PLAYER-AVAILABILITY-IMPACT-POLICY-V1/],
 ["historical-seasons-locked",/qualifiedSeasons: \[2022, 2023, 2024\]/],
 ["matched-games-locked",/matchedTeamGames: 131/],
 ["att-locked",/matchedATT: -4\.159193203877429/],
 ["direct-att-translation-prohibited",/directATTTranslationAuthorized: false/],
 ["player-coefficient-inference-prohibited",/individualPlayerCoefficientInferenceAuthorized: false/],
 ["position-coefficient-inference-prohibited",/positionCoefficientInferenceAuthorized: false/],
 ["out-status-explicit",/OUT: "PLAYER_EXPECTED_UNAVAILABLE"/],
 ["doubtful-status-explicit",/DOUBTFUL: "PLAYER_AVAILABILITY_SEVERELY_REDUCED"/],
 ["questionable-status-explicit",/QUESTIONABLE: "UNCERTAIN_AVAILABILITY_DO_NOT_PROMOTE_TO_OUT_OR_DOUBTFUL"/],
 ["questionable-not-promoted",/questionableEquivalentToOutOrDoubtful: false/],
 ["provenance-required",/sourceProvenanceRequired: true/],
 ["confidence-required",/confidenceRequired: true/],
 ["completeness-required",/evidenceCompletenessRequired: true/],
 ["base-impact-required",/existingGovernedPlayerImpactRequiredForNonNeutralMagnitude: true/],
 ["att-cannot-supply-player-magnitude",/historicalTeamGameATTMaySupplyPlayerMagnitude: false/],
 ["confidence-neutral-fallback",/belowMediumBehavior: "NEUTRAL_AVAILABILITY_ADJUSTMENT"/],
 ["completeness-neutral-fallback",/belowMinimumBehavior: "NEUTRAL_AVAILABILITY_ADJUSTMENT"/],
 ["out-bound-zero",/OUT: \{ min: 0\.00, max: 0\.00 \}/],
 ["doubtful-bound",/DOUBTFUL: \{ min: 0\.00, max: 0\.25 \}/],
 ["questionable-bound",/QUESTIONABLE: \{ min: 0\.75, max: 1\.00 \}/],
 ["available-neutral",/AVAILABLE: \{ min: 1\.00, max: 1\.00 \}/],
 ["unknown-neutral",/UNKNOWN: \{ min: 1\.00, max: 1\.00 \}/],
 ["no-amplification",/amplificationAboveBaseImpactAuthorized: false/],
 ["no-sign-reversal",/signReversalAuthorized: false/],
 ["no-direct-team-points",/directTeamStrengthPointPenaltyAuthorized: false/],
 ["neutral-fallback-one",/multiplier: 1\.00/],
 ["explainability-required",/provenanceRequiredForEveryNonNeutralAdjustment: true/],
 ["double-counting-prohibited",/doubleCountingWithRosterOrTeamStrengthSignalsProhibited: true/],
 ["team-aggregation-locked",/teamAggregationDesignAuthorizedInThisSprint: false/],
 ["replacement-model-locked",/replacementValueModelAuthorized: false/],
 ["qb-special-case-locked",/quarterbackSpecialCaseAuthorized: false/],
 ["execution-locked",/policyExecutionAuthorized: false/],
 ["matchup-locked",/matchupModelMutationAuthorized: false/],
 ["decision-model-locked",/decisionModelMutationAuthorized: false/],
 ["pickem-locked",/pickemMutationAuthorized: false/],
 ["database-locked",/databaseMutationAuthorized: false/],
 ["next-step-resolver",/IMPLEMENT_AND_VALIDATE_BOUNDED_AVAILABILITY_POLICY_RESOLVER/],
 ["no-leading-digit-identifier",!/^\s*(?:const|let|var)\s+\d/m.test(src)]
];

const tests=defs.map(([name,c])=>({name,passed:c instanceof RegExp?c.test(src):Boolean(c)}));
const passed=tests.filter(t=>t.passed).length, failed=tests.length-passed;
console.log(JSON.stringify({
 suite:"Bounded Player Availability Impact Policy V1 RC2 Diagnostics",
 sprint:"2.18.24-RC2",passed,failed,tests
},null,2));
if(failed) process.exitCode=1;
