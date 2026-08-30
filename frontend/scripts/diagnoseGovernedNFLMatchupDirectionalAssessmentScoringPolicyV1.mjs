#!/usr/bin/env node
import fs from "node:fs";
const src=fs.readFileSync(new URL("./defineGovernedNFLMatchupDirectionalAssessmentScoringPolicyV1.mjs",import.meta.url),"utf8");

const defs=[
 ["policy-owner",/owner: "CANONICAL_FIE"/],
 ["home-edge-state",/"HOME_EDGE"/],
 ["away-edge-state",/"AWAY_EDGE"/],
 ["neutral-state",/"NEUTRAL"/],
 ["insufficient-state",/"INSUFFICIENT_EVIDENCE"/],
 ["team-strength-cap",/maxAbsoluteContribution: 0\.30/],
 ["offense-defense-cap",/maxAbsoluteContribution: 0\.20/],
 ["defense-offense-cap",/maxAbsoluteContribution: 0\.20/],
 ["opponent-cap",/maxAbsoluteContribution: 0\.15/],
 ["dependency-cap",/maxAbsoluteContribution: 0\.10/],
 ["availability-cap",/maxAbsoluteContribution: 0\.05/],
 ["weight-budget",/totalAbsoluteWeightBudget: 1\.00/],
 ["normalized-range",/normalizedScoreRange: \[-1, 1\]/],
 ["no-outcome-leakage",/noOutcomeLeakage: true/],
 ["no-home-field",/noImplicitHomeFieldAdvantage: true/],
 ["no-probability-mutation",/noProbabilityMutation: true/],
 ["no-winner-mutation",/noWinnerMutation: true/],
 ["completeness-min",/minimumEvidenceCompletenessForScoredAssessment: 0\.80/],
 ["confidence-min",/minimumConfidenceForScoredAssessment: 0\.60/],
 ["team-context-required",/teamContextRequired: true/],
 ["provenance-required",/provenanceRequired: true/],
 ["invalid-identity-insufficient",/invalidIdentityBehavior: "INSUFFICIENT_EVIDENCE"/],
 ["invalid-provenance-neutral",/invalidProvenanceBehavior: "NEUTRAL"/],
 ["low-completeness-insufficient",/belowCompletenessBehavior: "INSUFFICIENT_EVIDENCE"/],
 ["low-confidence-neutral",/belowConfidenceBehavior: "NEUTRAL"/],
 ["home-threshold",/homeEdgeMinimum: 0\.15/],
 ["away-threshold",/awayEdgeMaximum: -0\.15/],
 ["confidence-no-inflation",/noConfidenceInflationFromRepeatedSignals: true/],
 ["team-opponent-double-count",/teamStrengthAndOpponentAdjustmentMayNotBeAppliedTwice: true/],
 ["availability-double-count",/availabilityImpactMayNotBeAppliedTwice: true/],
 ["qb-double-count",/qbDependencyMayNotBeAppliedAgainIfAlreadyEmbeddedInTeamStrength: true/],
 ["duplicate-zero-weight",/duplicateSignalMustBeSuppressedOrZeroWeighted: true/],
 ["duplicate-inspectable",/duplicateDetectionMustBeInspectable: true/],
 ["probability-output-zero",/probabilityDelta: 0/],
 ["probability-not-applied",/probabilityDeltaApplied: false/],
 ["winner-output-not-mutated",/winnerMutationApplied: false/],
 ["additive-only",/decisionSupportProjectionMode: "ADDITIVE_ONLY"/],
 ["scoring-implementation-may-advance",/scoringEngineImplementationMayAdvanceAfterPolicyValidation: true/],
 ["decision-model-locked",/policyDoesNotAuthorizeProductionDecisionMutation: true/],
 ["pickem-locked",/policyDoesNotAuthorizePickemMutation: true/],
 ["db-locked",/policyDoesNotAuthorizeDatabaseMutation: true/],
 ["ref-locked",/policyDoesNotResumeREF17C: true/],
 ["next-engine",/IMPLEMENT_CANONICAL_MATCHUP_DIRECTIONAL_ASSESSMENT_ENGINE_WITH_SYNTHETIC_FIXTURES/]
];

const tests=defs.map(([name,re])=>({name,passed:re.test(src)}));
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"Governed Matchup Directional Assessment & Scoring Policy RC5 Diagnostics",
  sprint:"2.19-RC5",passed,failed,tests
},null,2));
if(failed)process.exitCode=1;
