import assert from "node:assert/strict";
import { NFL_PLAYER_IMPACT_FIXED_CANDIDATE_CONFIRMATION_2D4_R4 as G } from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactFixedCandidateConfirmationGovernance.js";

const tests=[];
const test=(n,f)=>{try{f();tests.push({name:n,passed:true})}catch(e){tests.push({name:n,passed:false,error:e.message})}};

test("contract",()=>assert.equal(G.contractVersion,"FIE-NFL-PLAYER-IMPACT-FIXED-CANDIDATE-CONFIRMATION-GOVERNANCE-1.0.0"));
test("r3-artifact-required",()=>assert.ok(G.sourceCandidate.artifact.includes("player-impact-candidate-2d4-r3-selected-v1.json")));
test("must-be-r3-selected",()=>assert.equal(G.sourceCandidate.mustBeSelectedByR3,true));
test("variant-frozen",()=>assert.equal(G.sourceCandidate.variantMayChange,false));
test("scale-frozen",()=>assert.equal(G.sourceCandidate.scaleMayChange,false));
test("no-new-search",()=>assert.equal(G.sourceCandidate.newCandidateSearchAllowed,false));
test("no-retuning",()=>assert.equal(G.sourceCandidate.retuningAllowed,false));
test("720-confirmation",()=>assert.equal(G.confirmation.validationRows,720));
test("five-seasons",()=>assert.deepEqual([...G.confirmation.seasons],[2020,2021,2022,2023,2024]));
test("exact-reproduction",()=>assert.equal(G.confirmation.exactR3MetricReproductionRequired,true));
test("aggregate-gate",()=>assert.equal(G.confirmation.aggregateR3GateMustStillPass,true));
test("season-stability-gate",()=>assert.equal(G.confirmation.seasonStabilityMustStillPass,true));
test("no-false-forward-holdout",()=>assert.equal(G.confirmation.independentUntouchedForwardHoldoutClaimed,false));
test("handoff-possible",()=>assert.equal(G.handoff.pickemCoordinationMayBeAuthorized,true));
test("handoff-not-production",()=>assert.equal(G.handoff.handoffEqualsProductionActivation,false));
test("no-pickem-injury-weights",()=>assert.equal(G.handoff.independentPickemInjuryWeightsAllowed,false));
test("no-pickem-reimplementation",()=>assert.equal(G.handoff.pickemPlayerImpactReimplementationAllowed,false));
test("decision-api-required",()=>assert.equal(G.handoff.canonicalDecisionAPIConsumptionRequired,true));
test("shadow-only",()=>assert.equal(G.safeguards.mode,"SHADOW_ONLY"));
test("no-historical-reopen",()=>assert.equal(G.safeguards.historicalConstructionReopeningAuthorized,false));
test("production-impact-blocked",()=>assert.equal(G.safeguards.productionPlayerImpactAuthorized,false));
test("production-strength-blocked",()=>assert.equal(G.safeguards.productionTeamStrengthAuthorized,false));
test("canonical-mutation-blocked",()=>assert.equal(G.safeguards.canonicalIntegrationMutationAuthorized,false));
test("decision-model-mutation-blocked",()=>assert.equal(G.safeguards.decisionModelMutationAuthorized,false));
test("pickem-mutation-blocked",()=>assert.equal(G.safeguards.pickemMutationAuthorized,false));

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"NFL Player Impact Fixed Candidate Confirmation Governance",
  status:failed?"FAIL":"PASS",
  passed,failed,tests
},null,2));
if(failed)process.exitCode=1;
