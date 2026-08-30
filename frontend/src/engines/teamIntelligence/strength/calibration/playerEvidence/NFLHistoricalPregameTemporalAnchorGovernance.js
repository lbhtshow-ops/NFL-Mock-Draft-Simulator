export const NFL_HISTORICAL_PREGAME_TEMPORAL_ANCHOR_GOVERNANCE = Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-PREGAME-TEMPORAL-ANCHOR-GOVERNANCE-1.0.0",
  targetSeasons:Object.freeze([2022,2023,2024]),
  evidenceClasses:Object.freeze({
    DEPTH_CHART:"DEPTH_CHART",
    INJURY_REPORT:"INJURY_REPORT",
    STARTER_ANNOUNCEMENT:"STARTER_ANNOUNCEMENT",
    TRANSACTION:"TRANSACTION",
    SOURCE_PUBLICATION_METADATA:"SOURCE_PUBLICATION_METADATA",
    SNAP_COUNT:"SNAP_COUNT",
  }),
  rules:Object.freeze({
    depthChartTimestampDirectlyQualifies:true,
    sourcePublicationMetadataMayQualify:true,
    explicitStarterAnnouncementMayQualify:true,
    injuryTimestampQualifiesAvailabilityNotDepthChartPublication:true,
    transactionTimestampQualifiesTransactionNotDepthChartPublication:true,
    snapCountTimestampQualifiesPregameReplacement:false,
    weekScopeAloneQualifiesPregame:false,
    inferredPublicationTimeAllowed:false,
    futureEvidenceAllowed:false,
    ambiguousTemporalAnchorRemainsUnqualified:true,
  }),
  outputPolicy:Object.freeze({
    replacementMappingsGenerated:false,
    depthChartRowsMutated:false,
    learnedWeightsAuthorized:false,
    calibrationAuthorized:false,
  }),
});

export function getNFLHistoricalPregameTemporalAnchorGovernance(){
  return NFL_HISTORICAL_PREGAME_TEMPORAL_ANCHOR_GOVERNANCE;
}
