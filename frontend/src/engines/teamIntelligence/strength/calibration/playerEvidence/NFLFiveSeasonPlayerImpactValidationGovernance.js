export const NFL_FIVE_SEASON_PLAYER_IMPACT_VALIDATION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-FIVE-SEASON-PLAYER-IMPACT-VALIDATION-GOVERNANCE-2D2G-1.0.0",
  sprint: "2D.2G",
  targetSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
  requiredDimensions: Object.freeze([
    "REPLACEMENT_CALIBER_SENSITIVITY",
    "POSITION_SENSITIVITY",
    "DEPENDENCY_USAGE_SENSITIVITY",
    "SEASON_ERA_STABILITY",
    "PERFORMANCE_WINDOW_SENSITIVITY",
    "OPPONENT_ADJUSTMENT_SENSITIVITY",
  ]),
  minimumCaliberPairCoverageRate: 0.75,
  partialValidationMayPromoteToProduction: false,
  missingDimensionMayBeSilentlyIgnored: false,
  productionWeightFitAuthorized: false,
  validationThresholdRetuningAllowed: false,
  targetGameFutureLeakageAllowed: false,
  syntheticEffectEvidenceAllowed: false,
  independentPickemWeightsAllowed: false,
  calibrationAndHoldoutMayProceedOnlyAfterValidationPass: true,
  productionPlayerImpactCalibrationAuthorized: false,
  playerImpactTeamStrengthMode: "SHADOW_ONLY",
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLFiveSeasonPlayerImpactValidationGovernance() {
  return NFL_FIVE_SEASON_PLAYER_IMPACT_VALIDATION_GOVERNANCE;
}
