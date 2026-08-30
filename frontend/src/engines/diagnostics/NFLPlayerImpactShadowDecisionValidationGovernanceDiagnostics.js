import assert from "node:assert/strict";
import { NFL_PLAYER_IMPACT_SHADOW_DECISION_VALIDATION_2D4 as G } from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactShadowDecisionValidationGovernance.js";

const tests=[];
const test=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.message})}};

test("contract",()=>assert.equal(G.contractVersion,"FIE-NFL-PLAYER-IMPACT-SHADOW-DECISION-VALIDATION-GOVERNANCE-1.0.0"));
test("five-season-scope",()=>assert.deepEqual([...G.validation.seasons],[2020,2021,2022,2023,2024]));
test("no-historical-reopen",()=>assert.equal(G.historicalConstructionReopeningAuthorized,false));
test("loso-required",()=>assert.equal(G.validation.leaveOneSeasonOutRequired,true));
test("no-target-outcome-tuning",()=>assert.equal(G.validation.targetSeasonOutcomeMayTuneCandidate,false));
test("matched-att-target",()=>assert.equal(G.validation.matchedATTTargetRequired,true));
test("caliber-replacement-required",()=>assert.equal(G.validation.caliberAndReplacementEvidenceRequired,true));
test("qb-report-required",()=>assert.equal(G.validation.quarterbackBehaviorMustBeReported,true));
test("severity-report-required",()=>assert.equal(G.validation.severityBehaviorMustBeReported,true));
test("candidate-production-blocked",()=>assert.equal(G.candidate.productionAuthorized,false));
test("candidate-bounded",()=>assert.equal(G.candidate.boundedByTrainingFoldDistribution,true));
test("no-synthetic-weights",()=>assert.equal(G.candidate.syntheticInjuryWeightsAuthorized,false));
test("no-pickem-weights",()=>assert.equal(G.candidate.independentPickemWeightsAuthorized,false));
test("shadow-integration-required",()=>assert.equal(G.canonicalPath.playerImpactShadowIntegrationRequired,true));
test("team-strength-matchup-required",()=>assert.equal(G.canonicalPath.teamStrengthToMatchupRequired,true));
test("matchup-decision-required",()=>assert.equal(G.canonicalPath.matchupToDecisionModelRequired,true));
test("mae-gate",()=>assert.equal(G.promotionGate.maxMAEDegradation,0.10));
test("rmse-gate",()=>assert.equal(G.promotionGate.maxRMSEDegradation,0.15));
test("winner-gate",()=>assert.equal(G.promotionGate.maxWinnerAccuracyDegradation,0.005));
test("large-error-no-increase",()=>assert.equal(G.promotionGate.largeErrorCountMayIncrease,false));
test("shadow-only",()=>assert.equal(G.safeguards.mode,"SHADOW_ONLY"));
test("production-player-impact-blocked",()=>assert.equal(G.safeguards.productionPlayerImpactAuthorized,false));
test("production-team-strength-blocked",()=>assert.equal(G.safeguards.productionTeamStrengthAuthorized,false));
test("canonical-mutation-blocked",()=>assert.equal(G.safeguards.canonicalIntegrationMutationAuthorized,false));
test("decision-model-mutation-blocked",()=>assert.equal(G.safeguards.decisionModelMutationAuthorized,false));
test("pickem-mutation-blocked",()=>assert.equal(G.safeguards.pickemMutationAuthorized,false));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"NFL Player Impact Shadow Decision Validation Governance",
  status:failed?"FAIL":"PASS",
  passed,failed,tests
},null,2));
if(failed)process.exitCode=1;
