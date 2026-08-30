export const NFL_HISTORICAL_REAL_DATASET_V1 = Object.freeze({
  contractVersion: "FIE-NFL-HISTORICAL-REAL-DATASET-V1-1.0.0",
  datasetId: "LBHT-NFL-HISTORICAL-CALIBRATION-V1",
  status: "ACQUISITION_RUNNER_READY_DATA_NOT_BUNDLED",
  defaultSeasonRange: Object.freeze([2022, 2023, 2024, 2025]),
  sources: Object.freeze({
    schedules: Object.freeze({
      id: "NFLVERSE_SCHEDULES",
      provider: "nflverse/nfldata",
      url: "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv",
      format: "CSV",
    }),
    playByPlay: Object.freeze({
      id: "NFLVERSE_PBP",
      provider: "nflverse/nflverse-data",
      urlTemplate: "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.csv.gz",
      format: "CSV_GZIP",
      minimumSeason: 1999,
    }),
    weeklyRosters: Object.freeze({
      id: "NFLVERSE_WEEKLY_ROSTERS",
      provider: "nflverse/nflverse-data",
      urlTemplate: "https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_{season}.csv",
      format: "CSV",
      minimumSeason: 2002,
    }),
  }),
  outputPolicy: Object.freeze({
    persistentDatabaseWrite: false,
    localStagingOnly: true,
    outputFormat: "JSONL_PLUS_MANIFEST",
    rawSourceCaching: true,
    learnedWeights: false,
    teamStrengthScores: false,
  }),
  evidencePolicy: Object.freeze({
    currentGamePbpAsPregameFeatureAllowed: false,
    futureWeekPbpAllowed: false,
    performanceUsesPriorGamesOnly: true,
    recentFormUsesPriorGamesOnly: true,
    rosterUsesRequestedTeamWeekOnly: true,
    missingInjuriesRemainNull: true,
    missingPlayerCaliberRemainsNull: true,
    missingCoachingRemainsNull: true,
    missingSchemeRemainsNull: true,
  }),
});

export function getNFLHistoricalRealDatasetV1Manifest() {
  return NFL_HISTORICAL_REAL_DATASET_V1;
}
