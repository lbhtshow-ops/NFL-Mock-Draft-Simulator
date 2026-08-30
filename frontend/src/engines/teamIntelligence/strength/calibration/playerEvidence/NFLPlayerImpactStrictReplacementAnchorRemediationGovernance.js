export const NFL_PLAYER_IMPACT_STRICT_REPLACEMENT_ANCHOR_REMEDIATION_GOVERNANCE =
  Object.freeze({
    contractVersion:
      "FIE-NFL-PLAYER-IMPACT-STRICT-REPLACEMENT-ANCHOR-REMEDIATION-GOVERNANCE-2D2C-1.0.0",
    sprint: "2D.2C",
    acceptedAnchorPublicationType: "DEPTH_CHART_RELEASE",
    officialTeamDomainRequired: true,
    resolvedWeekRequired: true,
    resolvedPregameSafeRequired: true,
    genericWeekScopeAcceptedAsPregameProof: false,
    genericAvailabilityTimestampAcceptedAsDepthPublicationTime: false,
    explicitPublicationLineageRequired: true,
    legacyArtifactMutationAuthorized: false,
    strictCandidateShadowArtifactAllowed: true,
    calibrationAuthorized: false,
    learnedWeightsAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  });

export function getNFLPlayerImpactStrictReplacementAnchorRemediationGovernance() {
  return NFL_PLAYER_IMPACT_STRICT_REPLACEMENT_ANCHOR_REMEDIATION_GOVERNANCE;
}
