export const NFL_HISTORICAL_DEPTH_CHART_EVIDENCE_GOVERNANCE = Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-DEPTH-CHART-EVIDENCE-GOVERNANCE-1.0.0",
  provider:"nflverse/nflverse-data",
  releaseTag:"depth_charts",
  csvUrlTemplate:"https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_{season}.csv",
  documentedMinimumSeason:2001,
  targetSeasons:Object.freeze([2022,2023,2024]),
  canonicalIdentityField:"gsis_id",
  weekScopedHistoricalStructure:true,
  timestampedStructureFrom2025:true,
  depthOrderingRequired:true,
  explicitStarterEvidencePreferred:true,
  weekScopeAloneAuthorizesPregameReplacement:false,
  postgameSnapCountsMayCorroborateButNotDefineReplacement:true,
  rosterOrderGuessAllowed:false,
  nameGuessAllowed:false,
  replacementMappingsGeneratedByThisSprint:false,
  calibrationAuthorized:false,
  learnedWeightsAuthorized:false,
});
export function getNFLHistoricalDepthChartEvidenceGovernance(){
  return NFL_HISTORICAL_DEPTH_CHART_EVIDENCE_GOVERNANCE;
}
