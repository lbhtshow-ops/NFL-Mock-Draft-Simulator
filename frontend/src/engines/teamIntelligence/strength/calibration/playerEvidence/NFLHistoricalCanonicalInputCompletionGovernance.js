export const NFL_HISTORICAL_CANONICAL_INPUT_COMPLETION_GOVERNANCE=Object.freeze({
 contractVersion:"FIE-NFL-HISTORICAL-CANONICAL-INPUT-COMPLETION-GOVERNANCE-1.0.0",
 sprint:"9D.1C2B2C9A",
 historicalExperienceFromPriorNFLEvidenceAllowed:true,
 historicalUsageFromPriorResolvedSnapsAllowed:true,
 historicalRosterStatusFromQualifiedWeeklyRosterAllowed:true,
 injuryDesignationAsRosterStatusAllowed:false,
 targetWeekSnapEvidenceAllowed:false,
 futureSnapEvidenceAllowed:false,
 currentYearsExpAllowed:false,
 currentRosterStatusAllowed:false,
 positionNormalizationRequired:true,
 ambiguousDBPositionMayBeGuessed:false,
 unresolvedPositionRemainsNull:true,
 missingStatusRemainsNull:true,
 missingExperienceRemainsNull:true,
 missingUsageRemainsNull:true,
 recognitionMayRemainNull:true,
 positionModelExecutionAuthorized:false,
 full606ScoringAuthorized:false,
 calibrationAuthorized:false,
 learnedWeightsAuthorized:false,
 datasetMutationAuthorized:false
});
export function getNFLHistoricalCanonicalInputCompletionGovernance(){
 return NFL_HISTORICAL_CANONICAL_INPUT_COMPLETION_GOVERNANCE;
}
