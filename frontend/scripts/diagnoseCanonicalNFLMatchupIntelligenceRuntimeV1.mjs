#!/usr/bin/env node
import fs from "node:fs";
const src=fs.readFileSync(new URL("../src/data/footballIntelligence/nfl/matchup/CanonicalNFLMatchupIntelligenceRuntimeV1.js",import.meta.url),"utf8");
const val=fs.readFileSync(new URL("./validateCanonicalNFLMatchupIntelligenceRuntimeV1.mjs",import.meta.url),"utf8");
const both=src+"\n"+val;
const defs=[
 ["runtime-export",/composeCanonicalNFLMatchupIntelligenceV1/],
 ["runtime-version",/FIE-NFL-MATCHUP-INTELLIGENCE-RUNTIME-V1-1\.0\.0/],
 ["canonical-owner",/owner: "CANONICAL_FIE"/],
 ["team-strength-dimension",/TEAM_STRENGTH_CONTEXT/],
 ["offense-defense-dimension",/OFFENSE_VS_DEFENSE/],
 ["defense-offense-dimension",/DEFENSE_VS_OFFENSE/],
 ["opponent-dimension",/OPPONENT_ADJUSTED_PERFORMANCE/],
 ["dependency-dimension",/QB_AND_DEPENDENCY_CONTEXT/],
 ["availability-dimension",/PLAYER_AVAILABILITY_IMPACT/],
 ["confidence-output",/confidence,/],
 ["completeness-output",/evidenceCompleteness/],
 ["provenance-output",/provenance:/],
 ["fallback-output",/fallbackReasons/],
 ["additive-only",/mode: "ADDITIVE_ONLY"/],
 ["unscored",/scored: false/],
 ["zero-probability-delta",/probabilityDelta: 0/],
 ["probability-not-applied",/probabilityDeltaApplied: false/],
 ["winner-not-mutated",/winnerMutationApplied: false/],
 ["team-strength-no-recompute",/teamStrengthRecomputed: false/],
 ["opponent-no-recompute",/opponentAdjustmentRecomputed: false/],
 ["dependency-no-recompute",/dependencyRecomputed: false/],
 ["availability-no-recompute",/availabilityRecomputed: false/],
 ["no-app-reasoning",/applicationOwnedReasoning: false/],
 ["input-mutation-guard",/CANONICAL_MATCHUP_RUNTIME_INPUT_MUTATION_DETECTED/],
 ["missing-team-context",/MISSING_TEAM_CONTEXT/],
 ["invalid-provenance",/INVALID_OR_MISSING_PROVENANCE/],
 ["fixture-stable-id",/runtime-produces-stable-id/],
 ["fixture-neutral-provenance",/missing-provenance-fails-neutral/],
 ["fixture-no-scoring",/runtime-remains-unscored/],
 ["fixture-no-input-mutation",/input-not-mutated/],
 ["scoring-locked",/matchupScoringAuthorized:false/],
 ["decision-model-locked",/productionDecisionModelMutationAuthorized:false/],
 ["pickem-locked",/pickemRepositoryMutationAuthorized:false/],
 ["db-locked",/databaseMutationAuthorized:false/],
 ["ref-locked",/refSprint17CResumptionAuthorized:false/],
 ["next-assessment-policy",/DEFINE_GOVERNED_MATCHUP_DIRECTIONAL_ASSESSMENT_AND_SCORING_POLICY/]
];
const tests=defs.map(([name,re])=>({name,passed:re.test(both)}));
const passed=tests.filter(x=>x.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Canonical NFL Matchup Intelligence Runtime RC4 Diagnostics",sprint:"2.19-RC4",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
