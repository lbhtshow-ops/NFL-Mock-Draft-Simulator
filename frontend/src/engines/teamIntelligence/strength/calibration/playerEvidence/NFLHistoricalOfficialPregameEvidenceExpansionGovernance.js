export const NFL_HISTORICAL_OFFICIAL_PREGAME_EVIDENCE_EXPANSION_GOVERNANCE = Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-OFFICIAL-PREGAME-EVIDENCE-EXPANSION-GOVERNANCE-1.0.0",
  targetSeasons:Object.freeze([2022,2023,2024]),
  discoveryMode:"SCHEDULE_DRIVEN_GAP_TARGETING",
  sourceClasses:Object.freeze([
    "OFFICIAL_TEAM_ARTICLE",
    "OFFICIAL_TEAM_PDF",
    "OFFICIAL_WEEKLY_GAME_RELEASE",
    "OFFICIAL_DEPTH_CHART_RELEASE",
    "OFFICIAL_STARTER_ANNOUNCEMENT"
  ]),
  officialDomainRequired:true,
  knownGameTargetRequired:true,
  opponentOrExplicitWeekTargetRequired:true,
  publicationTimestampRequired:true,
  publicationMustPrecedeKickoff:true,
  existingQualifiedEvidencePreserved:true,
  fetchOnlyGapTeamWeeks:true,
  articleKeywordPrefilterRequired:true,
  officialPdfLinksMayBeDiscoveredFromOfficialArticles:true,
  pdfPublicationMustStillBeTemporallyAnchored:true,
  replacementMappingsGeneratedByThisSprint:false,
  inferredTimestampAllowed:false,
  nonOfficialSourceAllowed:false,
  calibrationAuthorized:false,
  learnedWeightsAuthorized:false,
  qualificationThresholds:Object.freeze({
    minimumPregameSafeObservations:100,
    minimumTeamBreadth:16,
    minimumSeasonBreadth:3,
  }),
});
export function getNFLHistoricalOfficialPregameEvidenceExpansionGovernance(){
  return NFL_HISTORICAL_OFFICIAL_PREGAME_EVIDENCE_EXPANSION_GOVERNANCE;
}
