export const NFL_PLAYER_IMPACT_CANDIDATE_CALIBRATION_ABLATION_2D4_R3 =
Object.freeze({
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-CANDIDATE-CALIBRATION-ABLATION-GOVERNANCE-1.0.0",
  sprint: "2D.4-R3",
  prerequisite: Object.freeze({
    joinedValidationRows: 720,
    joinFailures: 0,
    fiveSeasonValidationComplete: true,
  }),
  candidateFamily: Object.freeze({
    variants: Object.freeze([
      "R2_FULL",
      "NO_COUNT",
      "SEVERITY_ONLY",
      "POSITION_ONLY",
      "HIGH_PLUS_ONLY",
      "VERY_HIGH_ONLY",
    ]),
    scales: Object.freeze([0.10,0.20,0.30,0.40,0.50,0.75,1.00]),
    leaveOneSeasonOutRequired: true,
    targetSeasonOutcomeTuningAllowed: false,
    trainingFoldPercentileBoundsRequired: true,
  }),
  promotionCandidateGate: Object.freeze({
    maeMustNotExceedBaseline: true,
    rmseMustNotExceedBaseline: true,
    maxWinnerAccuracyDegradation: 0.005,
    largeErrorCountMayIncrease: false,
    seasonStabilityRequired: true,
    minimumStableSeasons: 4,
  }),
  antiOverfitPolicy: Object.freeze({
    candidateFamilyPredeclared: true,
    noContinuousParameterOptimization: true,
    confirmationRequiredAfterCandidateSelection: true,
    productionPromotionFromR3AloneAllowed: false,
  }),
  safeguards: Object.freeze({
    mode: "SHADOW_ONLY",
    historicalConstructionReopeningAuthorized: false,
    canonicalIntegrationMutationAuthorized: false,
    productionPlayerImpactAuthorized: false,
    productionTeamStrengthAuthorized: false,
    pickemHandoffAuthorized: false,
  }),
});
