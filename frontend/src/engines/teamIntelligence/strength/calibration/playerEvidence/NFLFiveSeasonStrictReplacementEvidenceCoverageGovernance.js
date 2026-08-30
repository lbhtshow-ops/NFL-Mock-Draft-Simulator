export const NFL_FIVE_SEASON_STRICT_REPLACEMENT_EVIDENCE_COVERAGE_GOVERNANCE =
  Object.freeze({
    contractVersion:
      "FIE-NFL-FIVE-SEASON-STRICT-REPLACEMENT-EVIDENCE-COVERAGE-GOVERNANCE-2D2D-1.0.0",
    sprint: "2D.2D",
    targetSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
    acceptedPublicationType: "DEPTH_CHART_RELEASE",
    officialTeamDomainRequired: true,
    resolvedWeekRequired: true,
    pregameSafeRequired: true,
    minimumSeasonBreadth: 5,
    minimumTeamBreadth: 16,
    minimumStrictTeamWeeks: 100,
    maximumSingleTeamShare: 0.35,
    genericWeekScopeAcceptedAsPregameProof: false,
    injuryTimestampMayStandInForDepthPublicationTime: false,
    postgameSnapMayDefineReplacement: false,
    canonicalReplacementArtifactMutationAuthorized: false,
    shadowReplacementCorpusConstructionMayBeAuthorizedAfterCoverageGate: true,
    replacementCaliberFitAuthorized: false,
    productionPlayerImpactFitAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  });

export function getNFLFiveSeasonStrictReplacementEvidenceCoverageGovernance() {
  return NFL_FIVE_SEASON_STRICT_REPLACEMENT_EVIDENCE_COVERAGE_GOVERNANCE;
}
