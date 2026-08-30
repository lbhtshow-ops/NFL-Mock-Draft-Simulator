import assert from "node:assert/strict";
import {getNFLHistoricalPlayerEvaluationCareerBaselineGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get(),checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-PLAYER-EVALUATION-CAREER-BASELINE-GOVERNANCE-1.0.0",
 asOf:g.targetAsOfRequired===true,priorWeeks:g.sameSeasonPriorWeeksAllowed===true,priorSeasons:g.priorNFLSeasonsAllowed===true,
 noTarget:g.targetWeekAllowed===false,noFutureWeek:g.futureWeekAllowed===false,noFutureSeason:g.futureSeasonAllowed===false,
 exactId:g.exactCanonicalPlayerIdRequired===true,positions:g.positionNormalizationRequired===true,
 positionAware:g.positionAwareFeatureFamiliesRequired===true,recency:g.recencyMetadataRequired===true,sample:g.sampleSizeMetadataRequired===true,
 noCurrent:g.currentRatingBackfillAllowed===false,noSynthetic:g.syntheticCaliberAllowed===false,noCollege:g.collegeFallbackAuthorized===false,
 adapter:g.canonicalHistoricalEvaluatorAdapterStillRequired===true,noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,noMutation:g.datasetMutationAuthorized===false
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Player Evaluation Career Baseline Governance",contractVersion:g.contractVersion,status:bad.length?"FAIL":"PASS",passed:Object.keys(checks).length-bad.length,failed:bad.length,checks},null,2));
assert.equal(bad.length,0);
