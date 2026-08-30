export const NFL_HISTORICAL_POSITION_MODEL_CONTEXT_ADAPTER_GOVERNANCE=Object.freeze({
 contractVersion:"FIE-NFL-HISTORICAL-POSITION-MODEL-CONTEXT-ADAPTER-GOVERNANCE-1.0.0",
 sprint:"9D.1C2B2C8",
 canonicalContextFields:Object.freeze([
   "statusScore","experienceScore","usageScore","productionScore",
   "recognitionScore","recognitionSummary","performanceProfile"
 ]),
 positionModelOwnsPlayerQuality:true,
 positionModelOwnsRosterValue:true,
 playerQualityFormulaMayNotBeDuplicated:true,
 historicalScoreProjectionMustBeExplicit:true,
 missingHistoricalScoreRemainsNull:true,
 currentIndexLookupAllowed:false,
 currentRosterLookupAllowed:false,
 currentRecognitionLookupAllowed:false,
 prospectCarryoverDefaultAllowed:false,
 prospectCarryoverRequiresHistoricalEvidence:true,
 genericFallbackScoringAllowed:false,
 asOfRequired:true,
 targetWeekEvidenceAllowed:false,
 futureWeekEvidenceAllowed:false,
 futureSeasonEvidenceAllowed:false,
 controlledScoringSampleAuthorized:false,
 full606ScoringAuthorized:false,
 calibrationAuthorized:false,
 learnedWeightsAuthorized:false,
 datasetMutationAuthorized:false
});
export function getNFLHistoricalPositionModelContextAdapterGovernance(){
 return NFL_HISTORICAL_POSITION_MODEL_CONTEXT_ADAPTER_GOVERNANCE;
}
