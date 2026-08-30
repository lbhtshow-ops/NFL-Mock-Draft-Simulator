export const NFL_HISTORICAL_SNAP_EVIDENCE_ACQUISITION_GOVERNANCE = Object.freeze({
  contractVersion: "FIE-NFL-HISTORICAL-SNAP-EVIDENCE-ACQUISITION-GOVERNANCE-1.0.0",
  canonicalProvider: "nflverse/nflverse-data",
  releaseTag: "snap_counts",
  csvUrlTemplate: "https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_{season}.csv",
  minimumSupportedSeason: 2012,
  intendedSeasons: Object.freeze([2022, 2023, 2024]),
  sourceIdentityField: "pfr_player_id",
  canonicalIdentityField: "gsis_id",
  sourceIdentityMayMasqueradeAsCanonicalIdentity: false,
  postgameParticipationEvidenceOnly: true,
  pregameReplacementDeterminationAuthorized: false,
  currentRatingBackfillAllowed: false,
  learnedWeightsAuthorized: false,
  datasetMutationAuthorized: false,
});

export function getNFLHistoricalSnapEvidenceAcquisitionGovernance() {
  return NFL_HISTORICAL_SNAP_EVIDENCE_ACQUISITION_GOVERNANCE;
}
