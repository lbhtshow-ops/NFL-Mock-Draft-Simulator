export const NFL_PLAYER_IMPACT_FIVE_SEASON_VALIDATION_GOVERNANCE =
  Object.freeze({
    contractVersion:
      "FIE-NFL-PLAYER-IMPACT-FIVE-SEASON-VALIDATION-GOVERNANCE-2D2A-1.0.0",
    sprint: "2D.2A",
    researchSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
    legacyDevelopmentSeasons: Object.freeze([2022, 2023, 2024]),
    newlyAddedExternalValidationSeasons: Object.freeze([2020, 2021]),
    minimumSeasonCoverage: 5,
    specificationFrozenBeforeExpandedOutcomeAnalysis: true,
    externalValidationSeasonsMayTuneSpecification: false,
    newlyAddedSeasonsAreFutureChronologicalHoldout: false,
    futureChronologicalHoldoutSatisfiedByThisExpansion: false,
    requiredValidationDomains: Object.freeze([
      "HISTORICAL_BACKTESTING",
      "EXPECTED_REPLACEMENT",
      "REPLACEMENT_CALIBER",
      "AVAILABILITY_IMPACT",
      "POSITION_REPLACEMENT_SENSITIVITY",
      "DEPENDENCY_USAGE",
      "INJURY_AVAILABILITY_CALIBRATION",
      "PERFORMANCE_WINDOW_CALIBRATION",
      "OPPONENT_ADJUSTMENT_VALIDATION",
      "SEASON_ERA_VALIDATION",
      "HOLDOUT_VALIDATION",
      "THRESHOLD_SENSITIVITY",
      "UNCERTAINTY_VALIDATION",
    ]),
    productionPromotionRequiresAllHardGates: true,
    failedOrIncompleteHardGateDecision: "HOLD_SHADOW",
    playerImpactTeamStrengthModeUntilPromotion: "SHADOW_ONLY",
    playerImpactTeamStrengthAuthorized: false,
    numericDeltaAuthorized: false,
    adjustedTeamStrengthAuthorized: false,
    independentPickemInjuryWeightsAllowed: false,
    calibrationAuthorizedByThisContract: false,
    learnedWeightsAuthorizedByThisContract: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  });

export function getNFLPlayerImpactFiveSeasonValidationGovernance() {
  return NFL_PLAYER_IMPACT_FIVE_SEASON_VALIDATION_GOVERNANCE;
}
