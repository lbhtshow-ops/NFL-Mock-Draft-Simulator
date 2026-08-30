#!/usr/bin/env node
import fs from "node:fs";

const src=fs.readFileSync(
  new URL("../src/data/footballIntelligence/nfl/matchup/CanonicalNFLMatchupDirectionalAssessmentEngineV1.js",import.meta.url),
  "utf8"
);
const val=fs.readFileSync(
  new URL("./validateCanonicalNFLMatchupDirectionalAssessmentEngineV1.mjs",import.meta.url),
  "utf8"
);
const both=src+"\n"+val;

const defs=[
 ["engine-export",/assessCanonicalNFLMatchupDirectionV1/],
 ["engine-version",/FIE-NFL-MATCHUP-DIRECTIONAL-ASSESSMENT-ENGINE-V1-1\.0\.0/],
 ["completeness-min",/completenessMinimum: 0\.80/],
 ["confidence-min",/confidenceMinimum: 0\.60/],
 ["home-threshold",/homeEdgeMinimum: 0\.15/],
 ["away-threshold",/awayEdgeMaximum: -0\.15/],
 ["team-cap",/TEAM_STRENGTH_CONTEXT: 0\.30/],
 ["ovd-cap",/OFFENSE_VS_DEFENSE: 0\.20/],
 ["dvo-cap",/DEFENSE_VS_OFFENSE: 0\.20/],
 ["opponent-cap",/OPPONENT_ADJUSTED_PERFORMANCE: 0\.15/],
 ["qb-cap",/QB_AND_DEPENDENCY_CONTEXT: 0\.10/],
 ["availability-cap",/PLAYER_AVAILABILITY_IMPACT: 0\.05/],
 ["opponent-duplicate",/teamStrengthIncludesOpponentAdjustment/],
 ["qb-duplicate",/teamStrengthIncludesQBDependency/],
 ["availability-duplicate",/teamStrengthIncludesAvailabilityImpact/],
 ["duplicate-suppression",/duplicateSuppression/],
 ["invalid-identity-insufficient",/INVALID_OR_INCOMPLETE_MATCHUP_IDENTITY/],
 ["invalid-provenance-neutral",/INVALID_OR_MISSING_PROVENANCE/],
 ["low-completeness-insufficient",/BELOW_MINIMUM_EVIDENCE_COMPLETENESS/],
 ["low-confidence-neutral",/BELOW_MINIMUM_RUNTIME_CONFIDENCE/],
 ["missing-team-strength",/MISSING_REQUIRED_TEAM_STRENGTH_CONTEXT/],
 ["home-edge",/assessment = "HOME_EDGE"/],
 ["away-edge",/assessment = "AWAY_EDGE"/],
 ["neutral-default",/let assessment = "NEUTRAL"/],
 ["confidence-no-inflation",/Math\.min\(\s*runtimeConfidence,\s*evidenceCompleteness/],
 ["probability-zero",/probabilityDelta: 0/],
 ["probability-not-applied",/probabilityDeltaApplied: false/],
 ["winner-not-mutated",/winnerMutationApplied: false/],
 ["additive-only",/mode: "ADDITIVE_ONLY"/],
 ["fixture-home",/home-edge/],
 ["fixture-away",/away-edge/],
 ["fixture-neutral",/neutral-band/],
 ["fixture-threshold-home",/home-threshold-inclusive/],
 ["fixture-threshold-away",/away-threshold-inclusive/],
 ["fixture-duplicate-opponent",/opponent-duplicate-suppressed/],
 ["fixture-duplicate-qb",/qb-duplicate-suppressed/],
 ["fixture-duplicate-availability",/availability-duplicate-suppressed/],
 ["fixture-confidence",/confidence-no-inflation/],
 ["fixture-no-probability",/probability-delta-remains-zero/],
 ["decision-integration-next",/RUN_FINAL_FIE_TO_MDS_MATCHUP_INTELLIGENCE_INTEGRATION_READINESS_GATE/],
 ["decision-probability-locked",/productionDecisionProbabilityMutationAuthorized:false/],
 ["winner-locked",/productionWinnerMutationAuthorized:false/],
 ["pickem-locked",/pickemRepositoryMutationAuthorized:false/],
 ["db-locked",/databaseMutationAuthorized:false/],
 ["ref-locked",/refSprint17CResumptionAuthorized:false/]
];

const tests=defs.map(([name,re])=>({name,passed:re.test(both)}));
const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"Canonical NFL Matchup Directional Assessment Engine RC6 Diagnostics",
  sprint:"2.19-RC6",
  passed,failed,tests
},null,2));

if(failed) process.exitCode=1;
