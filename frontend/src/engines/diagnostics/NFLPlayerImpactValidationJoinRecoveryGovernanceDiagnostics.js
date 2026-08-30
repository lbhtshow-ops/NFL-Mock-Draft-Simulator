import assert from "node:assert/strict";
import { NFL_PLAYER_IMPACT_VALIDATION_JOIN_RECOVERY_2D4_R2 as G } from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactValidationJoinRecoveryGovernance.js";

const tests=[];
const test=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.message})}};

test("contract",()=>assert.equal(G.contractVersion,"FIE-NFL-PLAYER-IMPACT-VALIDATION-JOIN-RECOVERY-GOVERNANCE-1.0.0"));
test("corrected-path",()=>assert.equal(
  G.correctedExpansionObservationPath,
  "data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl"
));
test("720-total",()=>assert.equal(G.expectedRows.totalEffects,720));
test("131-legacy",()=>assert.equal(G.expectedRows.legacyEffects,131));
test("589-expansion",()=>assert.equal(G.expectedRows.expansionEffects,589));
test("candidate-frozen-until-join",()=>assert.equal(G.candidateMethodMayChangeBeforeFullJoinRecovery,false));
test("no-historical-reopen",()=>assert.equal(G.historicalConstructionReopeningAuthorized,false));
test("no-matcher-retune",()=>assert.equal(G.matcherRetuningAuthorized,false));
test("production-impact-blocked",()=>assert.equal(G.productionPlayerImpactAuthorized,false));
test("production-strength-blocked",()=>assert.equal(G.productionTeamStrengthAuthorized,false));
test("shadow-only",()=>assert.equal(G.safeguards.mode,"SHADOW_ONLY"));
test("canonical-mutation-blocked",()=>assert.equal(G.safeguards.canonicalIntegrationMutationAuthorized,false));
test("decision-model-blocked",()=>assert.equal(G.safeguards.decisionModelMutationAuthorized,false));
test("pickem-blocked",()=>assert.equal(G.safeguards.pickemMutationAuthorized,false));

const passed=tests.filter(x=>x.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"NFL Player Impact Validation Join Recovery Governance",
  status:failed?"FAIL":"PASS",
  passed,failed,tests
},null,2));

if(failed)process.exitCode=1;
