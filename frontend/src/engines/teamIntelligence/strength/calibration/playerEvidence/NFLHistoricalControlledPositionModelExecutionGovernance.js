export const NFL_HISTORICAL_CONTROLLED_POSITION_MODEL_EXECUTION_GOVERNANCE=Object.freeze({
 contractVersion:"FIE-NFL-HISTORICAL-CONTROLLED-POSITION-MODEL-EXECUTION-GOVERNANCE-1.0.0",
 sprint:"9D.1C2B2C10",
 cohortSize:25,
 deterministicSelectionRequired:true,
 stratifiedSelectionRequired:true,
 requiredFamilies:Object.freeze(["QB","RB","RECEIVER","DEFENSIVE_LINE","LB","SECONDARY","OFFENSIVE_LINE"]),
 canonicalPositionModelsOnly:true,
 c9aCompletedInputsRequired:true,
 currentIndexesAllowed:false,
 currentRosterLookupAllowed:false,
 currentRecognitionLookupAllowed:false,
 prospectCarryoverAllowed:false,
 alternatePlayerQualityFormulaAllowed:false,
 modelResultDeterminismRequired:true,
 finitePlayerQualityRequiredForSuccessfulExecution:true,
 finiteRosterValueRequiredForSuccessfulExecution:true,
 full606ScoringAuthorized:false,
 historicalSnapshotGenerationAuthorized:false,
 calibrationAuthorized:false,
 learnedWeightsAuthorized:false,
 datasetMutationAuthorized:false
});
export function getNFLHistoricalControlledPositionModelExecutionGovernance(){
 return NFL_HISTORICAL_CONTROLLED_POSITION_MODEL_EXECUTION_GOVERNANCE;
}
