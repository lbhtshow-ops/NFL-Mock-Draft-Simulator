export const NFL_PLAYER_IMPACT_REPLACEMENT_ANCHOR_LINEAGE_GOVERNANCE =
  Object.freeze({
    contractVersion:
      "FIE-NFL-PLAYER-IMPACT-REPLACEMENT-ANCHOR-LINEAGE-GOVERNANCE-2D2B-1.0.0",
    sprint: "2D.2B",
    exactPregameSourceLineageRequired: true,
    depthChartWeekScopeAloneAcceptedAsPregameProof: false,
    injuryTimestampMayStandInForDepthChartPublicationTime: false,
    postgameSnapMayDefineExpectedReplacement: false,
    rosterOrderHeuristicAllowed: false,
    replacementIdentityMustPrecedeReplacementCaliber: true,
    replacementCaliberMustPrecedePlayerImpactCalibration: true,
    lineageMismatchBlocksFiveSeasonExtension: true,
    failedLineageDecision: "HOLD_SHADOW",
    calibrationAuthorized: false,
    learnedWeightsAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  });

export function getNFLPlayerImpactReplacementAnchorLineageGovernance() {
  return NFL_PLAYER_IMPACT_REPLACEMENT_ANCHOR_LINEAGE_GOVERNANCE;
}
