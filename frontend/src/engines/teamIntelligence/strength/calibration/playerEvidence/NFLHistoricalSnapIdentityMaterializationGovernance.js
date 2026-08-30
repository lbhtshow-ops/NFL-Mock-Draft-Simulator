export const NFL_HISTORICAL_SNAP_IDENTITY_MATERIALIZATION_GOVERNANCE =
  Object.freeze({
    contractVersion:
      "FIE-NFL-HISTORICAL-SNAP-IDENTITY-MATERIALIZATION-GOVERNANCE-2D1F-R1-1.0.0",
    sprint: "2D.1F-R1",
    canonicalProvider: "nflverse/nflverse-data",
    sourceRelease: "snap_counts",
    sourceIdentityField: "pfr_player_id",
    canonicalIdentityField: "gsis_id",
    canonicalIdentityResolvedField: "canonical_identity_resolved",
    exactPfrToGsisOnly: true,
    sourceIdentityMayMasqueradeAsCanonicalIdentity: false,
    nameMatchingAllowed: false,
    fuzzyMatchingAllowed: false,
    teamPositionGuessAllowed: false,
    unresolvedRowsMustBeQuarantined: true,
    rowReconciliationRequired: true,
    minimumCanonicalIdentityCoverageRate: 0.95,
    evidenceTiming: "POSTGAME_PARTICIPATION",
    postgameDependencyCandidateAllowed: true,
    pregameReplacementDeterminationAuthorized: false,
    canonicalV1DatasetMutationAuthorized: false,
    calibrationAuthorized: false,
    learnedWeightsAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  });

export function getNFLHistoricalSnapIdentityMaterializationGovernance() {
  return NFL_HISTORICAL_SNAP_IDENTITY_MATERIALIZATION_GOVERNANCE;
}
