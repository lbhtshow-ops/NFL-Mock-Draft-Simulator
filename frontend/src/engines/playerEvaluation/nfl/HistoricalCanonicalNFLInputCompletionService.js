import {
 projectHistoricalCanonicalContextScores,
 flattenHistoricalPerformanceProfile,
} from "./HistoricalCanonicalNFLScoreProjectionService.js";
import {
 buildCanonicalHistoricalPositionModelContext,
} from "./CanonicalNFLPositionModelHistoricalContextAdapter.js";

export const NFL_HISTORICAL_CANONICAL_INPUT_COMPLETION_VERSION =
 "FIE-NFL-HISTORICAL-CANONICAL-INPUT-COMPLETION-1.0.0";

export function completeHistoricalCanonicalPositionModelInput({
 player={},
 asOf=null,
 completedHistoricalInput=null,
}={}){
 if(!asOf){
  return Object.freeze({status:"UNAVAILABLE",reason:"HISTORICAL_AS_OF_REQUIRED"});
 }
 if(!completedHistoricalInput){
  return Object.freeze({status:"UNAVAILABLE",reason:"COMPLETED_HISTORICAL_INPUT_REQUIRED"});
 }

 const position=completedHistoricalInput.normalizedPosition || player?.identity?.position || player?.position || null;
 const performanceProfile=flattenHistoricalPerformanceProfile(
  completedHistoricalInput.performanceProfile
 );
 const scores=projectHistoricalCanonicalContextScores({
  position,
  historicalStatus:completedHistoricalInput.historicalRosterStatus,
  historicalExperience:completedHistoricalInput.historicalExperience,
  usageProfile:completedHistoricalInput.usageProfile,
  performanceProfile,
  recognitionSummary:completedHistoricalInput.recognitionSummary,
 });

 const adapted=buildCanonicalHistoricalPositionModelContext({
  asOf,
  projectedHistoricalContext:{
   recognitionSummary:completedHistoricalInput.recognitionSummary || null,
   performanceProfile,
  },
  historicalScores:scores,
  historicalRecognitionSummary:completedHistoricalInput.recognitionSummary || null,
  historicalPerformanceProfile:performanceProfile,
 });

 return Object.freeze({
  status:adapted.status,
  reason:adapted.reason,
  position,
  scores:Object.freeze(scores),
  context:adapted.context,
  missingScoreFields:adapted.missingScoreFields,
  modelExecutionAuthorized:false,
  adapterVersion:NFL_HISTORICAL_CANONICAL_INPUT_COMPLETION_VERSION,
 });
}

export default {completeHistoricalCanonicalPositionModelInput};
