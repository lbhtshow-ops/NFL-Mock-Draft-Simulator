import assert from "node:assert/strict";
import {executeHistoricalCanonicalPositionModel} from "../playerEvaluation/nfl/HistoricalCanonicalPositionModelExecutor.js";
import {getNFLHistoricalControlledPositionModelExecutionGovernance as get} from "../teamIntelligence/strength/calibration/index.js";

const g=get();
const baseContext={
 historical:true,
 asOf:"2024-09-01T12:00:00Z",
 statusScore:72,experienceScore:70,usageScore:80,productionScore:77,
 recognitionScore:null,recognitionSummary:null,
 performanceProfile:{available:true,passingYards:1200,passingTDs:10,interceptions:5},
 prospectCarryover:null,
};

const qb=executeHistoricalCanonicalPositionModel({
 player:{identity:{position:"QB"},position:"QB"},
 context:baseContext,
});
const qb2=executeHistoricalCanonicalPositionModel({
 player:{identity:{position:"QB"},position:"QB"},
 context:baseContext,
});
const blocked=executeHistoricalCanonicalPositionModel({
 player:{identity:{position:"RB"}},
 context:baseContext,
 allowProspectCarryover:true,
});
const noContext=executeHistoricalCanonicalPositionModel({
 player:{identity:{position:"QB"}},
 context:{},
});

const checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-CONTROLLED-POSITION-MODEL-EXECUTION-GOVERNANCE-1.0.0",
 cohort:g.cohortSize===25,
 deterministic:g.deterministicSelectionRequired===true,
 stratified:g.stratifiedSelectionRequired===true,
 families:g.requiredFamilies.length===7,
 canonicalOnly:g.canonicalPositionModelsOnly===true,
 c9a:g.c9aCompletedInputsRequired===true,
 noCurrent:g.currentIndexesAllowed===false && g.currentRosterLookupAllowed===false && g.currentRecognitionLookupAllowed===false,
 noCarryover:g.prospectCarryoverAllowed===false,
 noAlternate:g.alternatePlayerQualityFormulaAllowed===false,
 qbAvailable:qb.status==="AVAILABLE",
 qbFamily:qb.family==="QB",
 repeatable:JSON.stringify(qb.evaluation)===JSON.stringify(qb2.evaluation),
 carryBlocked:blocked.reason==="HISTORICAL_PROSPECT_CARRYOVER_NOT_AUTHORIZED",
 historicalRequired:noContext.reason==="HISTORICAL_CONTEXT_REQUIRED",
 fullBlocked:g.full606ScoringAuthorized===false,
 snapshotsBlocked:g.historicalSnapshotGenerationAuthorized===false,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false,
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({
 suite:"NFL Historical Controlled Position Model Execution",
 contractVersion:g.contractVersion,
 status:bad.length?"FAIL":"PASS",
 passed:Object.keys(checks).length-bad.length,
 failed:bad.length,
 checks
},null,2));
assert.equal(bad.length,0);
