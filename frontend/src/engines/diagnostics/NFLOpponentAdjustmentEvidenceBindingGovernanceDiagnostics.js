import assert from "node:assert/strict";
import { NFL_OPPONENT_ADJUSTMENT_EVIDENCE_BINDING_2D3A_R1 as G } from "../teamIntelligence/strength/calibration/playerEvidence/NFLOpponentAdjustmentEvidenceBindingGovernance.js";

const tests=[];
const test=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.message})}};

test("contract",()=>assert.equal(G.contractVersion,"FIE-NFL-OPPONENT-ADJUSTMENT-EVIDENCE-BINDING-GOVERNANCE-1.0.0"));
test("treated-actual-path",()=>assert.equal(G.canonicalPaths.treatedActualMargin,"treated.outcome.actualTeamMargin"));
test("control-actual-path",()=>assert.equal(G.canonicalPaths.controlActualMargin,"control.outcome.actualTeamMargin"));
test("treated-expected-path",()=>assert.equal(G.canonicalPaths.treatedExpectedMargin,"treated.outcome.expectedTeamMargin"));
test("control-expected-path",()=>assert.equal(G.canonicalPaths.controlExpectedMargin,"control.outcome.expectedTeamMargin"));
test("treated-residual-path",()=>assert.equal(G.canonicalPaths.treatedResidual,"treated.outcome.gamePerformanceResidual"));
test("control-residual-path",()=>assert.equal(G.canonicalPaths.controlResidual,"control.outcome.gamePerformanceResidual"));
test("no-historical-reopen",()=>assert.equal(G.historicalConstructionReopeningAuthorized,false));
test("no-new-opponent-model",()=>assert.equal(G.newOpponentModelAuthorized,false));
test("raw-margin-not-impact",()=>assert.equal(G.rawPointMarginMayBecomeObservedPlayerImpact,false));
test("att-reconciliation-required",()=>assert.equal(G.canonicalATTReconciliationRequired,true));
test("five-season-required",()=>assert.equal(G.fiveSeasonCoverageRequired,true));
test("shadow-only",()=>assert.equal(G.safeguards.mode,"SHADOW_ONLY"));
test("production-fit-blocked",()=>assert.equal(G.safeguards.productionWeightsFitAuthorized,false));
test("calibration-blocked",()=>assert.equal(G.safeguards.calibrationAuthorized,false));
test("team-strength-blocked",()=>assert.equal(G.safeguards.teamStrengthMutationAuthorized,false));
test("decision-model-blocked",()=>assert.equal(G.safeguards.decisionModelMutationAuthorized,false));
test("pickem-blocked",()=>assert.equal(G.safeguards.pickemMutationAuthorized,false));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"NFL Opponent Adjustment Evidence Binding Governance",
  status:failed?"FAIL":"PASS",
  passed,
  failed,
  tests
},null,2));
if(failed)process.exitCode=1;
