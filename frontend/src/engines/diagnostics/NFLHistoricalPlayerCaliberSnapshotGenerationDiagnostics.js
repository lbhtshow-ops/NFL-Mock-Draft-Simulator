import assert from "node:assert/strict";
import {getNFLHistoricalPlayerCaliberSnapshotGenerationGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get(),checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-PLAYER-CALIBER-SNAPSHOT-GENERATION-GOVERNANCE-1.0.0",
 evaluator:g.canonicalNFLPlayerEvaluatorRequired===true,
 adapter:g.historicalInputAdapterRequired===true,
 asOf:g.targetAsOfRequired===true,
 kickoff:g.kickoffRequired===true,
 evidenceBefore:g.evidenceMustPrecedeAsOf===true,
 noCurrent:g.currentPlayerStateAllowed===false,
 noCurrentBackfill:g.currentRatingBackfillAllowed===false,
 noFutureWeek:g.currentSeasonFutureWeeksAllowed===false,
 noTargetGame:g.targetWeekGamePerformanceAllowed===false,
 noFutureSeason:g.futureSeasonEvidenceAllowed===false,
 exactId:g.exactCanonicalPlayerIdRequired===true,
 weekly:g.weeklyHistoricalPerformanceEvidenceAllowed===true,
 usage:g.historicalUsageEvidenceAllowed===true,
 recognition:g.historicalRecognitionEvidenceAllowed===true,
 unavailableNoAdapter:g.unavailableIfCanonicalHistoricalEvaluatorMissing===true,
 unavailableSparse:g.unavailableIfEvidenceInsufficient===true,
 availableCanonical:g.availableSnapshotRequiresCanonicalEvaluation===true,
 confidence:g.confidenceRequiredForAvailableSnapshot===true,
 model:g.modelVersionRequiredForAvailableSnapshot===true,
 provenance:g.provenanceRequiredForAvailableSnapshot===true,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Player Caliber Snapshot Generation Governance",contractVersion:g.contractVersion,status:bad.length?"FAIL":"PASS",passed:Object.keys(checks).length-bad.length,failed:bad.length,checks},null,2));
assert.equal(bad.length,0);
