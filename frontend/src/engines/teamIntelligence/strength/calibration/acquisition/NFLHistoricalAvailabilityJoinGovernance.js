export const NFL_HISTORICAL_AVAILABILITY_JOIN_GOVERNANCE = Object.freeze({
  contractVersion: "FIE-NFL-HISTORICAL-AVAILABILITY-JOIN-GOVERNANCE-1.0.0",
  qualifiedSeasonsRequired: true,
  currentlyQualifiedSeasons: Object.freeze([2022, 2023, 2024]),
  currentlyUnqualifiedSeasons: Object.freeze([2025]),
  selectionPolicy: Object.freeze({
    playerWeekKeyRequired: true,
    teamWeekKeyRequired: true,
    latestTemporallySafeRecordBeforeKickoff: true,
    postKickoffRecordAllowed: false,
    duplicateRowsCollapsed: true,
    missingAvailabilityRemainsNull: true,
    rosterStatusMaySubstituteForInjuryEvidence: false,
  }),
  statusPolicy: Object.freeze({
    reportStatusPreserved: true,
    practiceStatusPreserved: true,
    injuryTextPreserved: true,
    questionableForcedUnavailable: false,
    doubtfulForcedUnavailable: false,
    outRecognizedUnavailable: true,
  }),
  outputPolicy: Object.freeze({
    mutatesSourceDatasetInPlace: false,
    writesNewEnrichedDataset: true,
    preservesOriginalObservationCount: true,
    learnedWeightsAuthorized: false,
    teamStrengthScoringAuthorized: false,
  }),
});

export function getNFLHistoricalAvailabilityJoinGovernance() {
  return NFL_HISTORICAL_AVAILABILITY_JOIN_GOVERNANCE;
}
