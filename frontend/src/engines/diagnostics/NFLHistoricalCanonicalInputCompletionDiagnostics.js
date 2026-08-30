import assert from "node:assert/strict";
import {completeHistoricalCanonicalPositionModelInput} from "../playerEvaluation/nfl/HistoricalCanonicalNFLInputCompletionService.js";
import {getNFLHistoricalCanonicalInputCompletionGovernance as get} from "../teamIntelligence/strength/calibration/index.js";
const g=get();
const out=completeHistoricalCanonicalPositionModelInput({
 player:{position:"QB"},
 asOf:"2024-09-01T12:00:00Z",
 completedHistoricalInput:{
  normalizedPosition:"QB",historicalRosterStatus:"ACT",historicalExperience:4,
  usageProfile:{available:true,totalSnaps:500,gamesTracked:8,maxWeeklySnapShare:.95},
  performanceProfile:{available:true,passingYards:1200,passingTDs:10,interceptions:5},
  recognitionSummary:null,
 }
});
const checks={
 contract:g.contractVersion==="FIE-NFL-HISTORICAL-CANONICAL-INPUT-COMPLETION-GOVERNANCE-1.0.0",
 experience:g.historicalExperienceFromPriorNFLEvidenceAllowed===true,
 usage:g.historicalUsageFromPriorResolvedSnapsAllowed===true,
 roster:g.historicalRosterStatusFromQualifiedWeeklyRosterAllowed===true,
 noInjuryStatus:g.injuryDesignationAsRosterStatusAllowed===false,
 noTargetSnaps:g.targetWeekSnapEvidenceAllowed===false,
 noFuture:g.futureSnapEvidenceAllowed===false,
 noCurrentExp:g.currentYearsExpAllowed===false,
 noCurrentRoster:g.currentRosterStatusAllowed===false,
 normalize:g.positionNormalizationRequired===true,
 noDbGuess:g.ambiguousDBPositionMayBeGuessed===false,
 nullPosition:g.unresolvedPositionRemainsNull===true,
 nullStatus:g.missingStatusRemainsNull===true,
 nullExperience:g.missingExperienceRemainsNull===true,
 nullUsage:g.missingUsageRemainsNull===true,
 recognitionOptional:g.recognitionMayRemainNull===true,
 exactStatus:out.scores.statusScore===72,
 exactExperience:out.scores.experienceScore===70,
 exactUsage:out.scores.usageScore===80,
 exactProduction:out.scores.productionScore===77,
 recognitionNull:out.scores.recognitionScore===null,
 contextReady:out.status==="READY_FOR_POSITION_MODEL",
 executionBlocked:out.modelExecutionAuthorized===false,
 noFull:g.full606ScoringAuthorized===false,
 noCalibration:g.calibrationAuthorized===false,
 noWeights:g.learnedWeightsAuthorized===false,
 noMutation:g.datasetMutationAuthorized===false,
};
const bad=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({suite:"NFL Historical Canonical Input Completion",contractVersion:g.contractVersion,status:bad.length?"FAIL":"PASS",passed:Object.keys(checks).length-bad.length,failed:bad.length,checks},null,2));
assert.equal(bad.length,0);
