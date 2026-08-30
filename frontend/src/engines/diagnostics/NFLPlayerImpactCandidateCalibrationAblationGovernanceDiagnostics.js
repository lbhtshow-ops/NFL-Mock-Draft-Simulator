import assert from "node:assert/strict";
import { NFL_PLAYER_IMPACT_CANDIDATE_CALIBRATION_ABLATION_2D4_R3 as G } from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactCandidateCalibrationAblationGovernance.js";

const tests=[];
const test=(n,f)=>{try{f();tests.push({name:n,passed:true})}catch(e){tests.push({name:n,passed:false,error:e.message})}};

test("contract",()=>assert.equal(G.contractVersion,"FIE-NFL-PLAYER-IMPACT-CANDIDATE-CALIBRATION-ABLATION-GOVERNANCE-1.0.0"));
test("720-prerequisite",()=>assert.equal(G.prerequisite.joinedValidationRows,720));
test("zero-join-failures",()=>assert.equal(G.prerequisite.joinFailures,0));
test("five-season-complete",()=>assert.equal(G.prerequisite.fiveSeasonValidationComplete,true));
test("six-variants",()=>assert.equal(G.candidateFamily.variants.length,6));
test("seven-scales",()=>assert.equal(G.candidateFamily.scales.length,7));
test("loso",()=>assert.equal(G.candidateFamily.leaveOneSeasonOutRequired,true));
test("no-target-tuning",()=>assert.equal(G.candidateFamily.targetSeasonOutcomeTuningAllowed,false));
test("bounded",()=>assert.equal(G.candidateFamily.trainingFoldPercentileBoundsRequired,true));
test("mae-gate",()=>assert.equal(G.promotionCandidateGate.maeMustNotExceedBaseline,true));
test("rmse-gate",()=>assert.equal(G.promotionCandidateGate.rmseMustNotExceedBaseline,true));
test("winner-gate",()=>assert.equal(G.promotionCandidateGate.maxWinnerAccuracyDegradation,0.005));
test("large-error-gate",()=>assert.equal(G.promotionCandidateGate.largeErrorCountMayIncrease,false));
test("season-stability",()=>assert.equal(G.promotionCandidateGate.minimumStableSeasons,4));
test("predeclared-family",()=>assert.equal(G.antiOverfitPolicy.candidateFamilyPredeclared,true));
test("no-continuous-search",()=>assert.equal(G.antiOverfitPolicy.noContinuousParameterOptimization,true));
test("confirmation-required",()=>assert.equal(G.antiOverfitPolicy.confirmationRequiredAfterCandidateSelection,true));
test("no-r3-production",()=>assert.equal(G.antiOverfitPolicy.productionPromotionFromR3AloneAllowed,false));
test("shadow-only",()=>assert.equal(G.safeguards.mode,"SHADOW_ONLY"));
test("no-historical-reopen",()=>assert.equal(G.safeguards.historicalConstructionReopeningAuthorized,false));
test("canonical-mutation-blocked",()=>assert.equal(G.safeguards.canonicalIntegrationMutationAuthorized,false));
test("production-impact-blocked",()=>assert.equal(G.safeguards.productionPlayerImpactAuthorized,false));
test("production-strength-blocked",()=>assert.equal(G.safeguards.productionTeamStrengthAuthorized,false));
test("pickem-handoff-blocked",()=>assert.equal(G.safeguards.pickemHandoffAuthorized,false));

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"NFL Player Impact Candidate Calibration & Ablation Governance",
  status:failed?"FAIL":"PASS",
  passed,failed,tests
},null,2));
if(failed)process.exitCode=1;
