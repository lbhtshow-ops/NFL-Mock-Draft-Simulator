export const NFL_HISTORICAL_OFFICIAL_TEAM_PUBLICATION_GOVERNANCE = Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-OFFICIAL-TEAM-PUBLICATION-GOVERNANCE-1.0.0",
  sourceClass:"OFFICIAL_TEAM_PUBLICATION",
  allowedPublicationTypes:Object.freeze(["DEPTH_CHART_RELEASE","EXPLICIT_STARTER_ANNOUNCEMENT","WEEKLY_GAME_RELEASE"]),
  officialTeamDomainRequired:true,
  publicationTimestampRequired:true,
  teamWeekMappingRequired:true,
  kickoffComparisonRequired:true,
  publicationMustPrecedeKickoff:true,
  articleTitleMatchAloneInsufficientForReplacement:true,
  sourcePublicationMayAnchorWeekScopedDepthChart:true,
  explicitStarterAnnouncementMayIdentifyStarter:true,
  replacementMappingsGeneratedByThisSprint:false,
  inferredPublicationTimestampAllowed:false,
  nonOfficialDomainsAllowed:false,
  learnedWeightsAuthorized:false,
  calibrationAuthorized:false,
});
export function getNFLHistoricalOfficialTeamPublicationGovernance(){
  return NFL_HISTORICAL_OFFICIAL_TEAM_PUBLICATION_GOVERNANCE;
}
