import assert from "node:assert/strict";
import {
 buildCanonicalHistoricalPositionModelContext,
 evaluateCanonicalPositionModelWithHistoricalContext,
} from "../playerEvaluation/nfl/CanonicalNFLPositionModelHistoricalContextAdapter.js";
import {
 getNFLHistoricalPositionModelContextAdapterGovernance as get,
} from "../teamIntelligence/strength/calibration/index.js";

const g=get();
const missingAsOf=buildCanonicalHistoricalPositionModelContext({projectedHistoricalContext:{}});
const ready=buildCanonicalHistoricalPositionModelContext({
 asOf:"2024-09-01T12:00:00Z",
 projectedHistoricalContext:{recognitionSummary:null,performanceProfile:{available:true}},
 historicalScores:{statusScore:72,experienceScore:64,usageScore:80,productionScore:77},
});
const carry=evaluateCanonicalPositionModelWithHistoricalContext({
 player:{position:"RB"},asOf:"2024-09-01T12:00:00Z",
 projectedHistoricalContext:{},historicalScores:{},
 allowHistoricalProspectCarryover:true,
});
const dispatch=evaluateCanonicalPositionModelWithHistoricalContext({
 player:{position:"QB"},asOf:"2024-09-01T12:00:00Z",
 projectedHistoricalContext:{},historicalScores:{statusScore:72},
});
const checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-POSITION-MODEL-CONTEXT-ADAPTER-GOVERNANCE-1.0.0",
 exactFields:g.canonicalContextFields.length===7,
 qualityOwner:g.positionModelOwnsPlayerQuality===true,
 noDuplicate:g.playerQualityFormulaMayNotBeDuplicated===true,
 explicitProjection:g.historicalScoreProjectionMustBeExplicit===true,
 nullMissing:g.missingHistoricalScoreRemainsNull===true,
 noCurrentIndexes:g.currentIndexLookupAllowed===false,
 noCurrentRoster:g.currentRosterLookupAllowed===false,
 noCurrentRecognition:g.currentRecognitionLookupAllowed===false,
 noProspectDefault:g.prospectCarryoverDefaultAllowed===false,
 asOf:g.asOfRequired===true,
 noTarget:g.targetWeekEvidenceAllowed===false,
 noFuture:g.futureWeekEvidenceAllowed===false && g.futureSeasonEvidenceAllowed===false,
 missingAsOfBlocked:missingAsOf.reason==="HISTORICAL_AS_OF_REQUIRED",
 exactProjection:ready.context.statusScore===72 && ready.context.productionScore===77,
 missingRecognitionNull:ready.context.recognitionScore===null,
 carryoverBlocked:carry.reason==="HISTORICAL_PROSPECT_CARRYOVER_NOT_YET_QUALIFIED",
 canonicalDispatch:dispatch.dispatchOwner==="CANONICAL_NFL_POSITION_MODELS",
 executionStillBlocked:dispatch.evaluation===null && dispatch.status==="READY_FOR_CONTROLLED_MODEL_EXECUTION",
 noControlledScoring:g.controlledScoringSampleAuthorized===false,
 noFullScoring:g.full606ScoringAuthorized===false,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false,
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({
 suite:"NFL Historical Position Model Context Adapter",
 contractVersion:g.contractVersion,
 status:bad.length?"FAIL":"PASS",
 passed:Object.keys(checks).length-bad.length,
 failed:bad.length,
 checks
},null,2));
assert.equal(bad.length,0);
