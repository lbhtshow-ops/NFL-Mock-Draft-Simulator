export const EXPERIMENT_STATUS = Object.freeze({
  SPECIFIED_NOT_EXECUTED: "SPECIFIED_NOT_EXECUTED",
  EXECUTED: "EXECUTED",
});

export function createNFLTeamStrengthExperimentSpecification(input = {}) {
  return Object.freeze({
    contractVersion: "FIE-NFL-TEAM-STRENGTH-EXPERIMENT-1.0.0",
    experimentId: input.experimentId ?? null,
    hypothesis: input.hypothesis ?? null,
    datasetVersion: input.datasetVersion ?? null,
    featureSetVersion: input.featureSetVersion ?? null,
    methodologyVersion: input.methodologyVersion ?? "FIE-NFL-TEAM-STRENGTH-METHODOLOGY-1.0.0",
    splitPolicy: Object.freeze({
      chronological: true,
      holdoutRequired: true,
      futureSeasonLeakageAllowed: false,
      futureWeekLeakageAllowed: false,
      sameGameOutcomeAsFeatureAllowed: false,
    }),
    requiredAnalyses: Object.freeze([
      "BASELINE_VS_CURRENT_STRENGTH",
      "POSITION_AVAILABILITY_SENSITIVITY",
      "PLAYER_CALIBER_SENSITIVITY",
      "REPLACEMENT_CALIBER_SENSITIVITY",
      "PERFORMANCE_WINDOW_SENSITIVITY",
      "RECENT_FORM_DECAY",
      "COACHING_INCREMENTAL_VALUE",
      "SCHEME_INCREMENTAL_VALUE",
      "SEASON_ERA_STABILITY",
      "HOLDOUT_GENERALIZATION",
    ]),
    status: EXPERIMENT_STATUS.SPECIFIED_NOT_EXECUTED,
    learnedWeights: null,
    learnedCoefficients: null,
    teamStrengthScores: null,
  });
}
