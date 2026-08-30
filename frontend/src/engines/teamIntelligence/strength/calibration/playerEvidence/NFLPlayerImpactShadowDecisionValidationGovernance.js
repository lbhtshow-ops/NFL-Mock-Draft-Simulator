export const NFL_PLAYER_IMPACT_SHADOW_DECISION_VALIDATION_2D4 =
Object.freeze({
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-SHADOW-DECISION-VALIDATION-GOVERNANCE-1.0.0",
  sprint: "2D.4",
  purpose:
    "Validate a bounded out-of-season Player Impact shadow candidate against canonical decision quality before Pick'em coordination handoff.",
  historicalConstructionReopeningAuthorized: false,
  validation: Object.freeze({
    seasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
    leaveOneSeasonOutRequired: true,
    targetSeasonOutcomeMayTuneCandidate: false,
    matchedATTTargetRequired: true,
    caliberAndReplacementEvidenceRequired: true,
    quarterbackBehaviorMustBeReported: true,
    severityBehaviorMustBeReported: true,
  }),
  candidate: Object.freeze({
    productionAuthorized: false,
    boundedByTrainingFoldDistribution: true,
    syntheticInjuryWeightsAuthorized: false,
    independentPickemWeightsAuthorized: false,
  }),
  canonicalPath: Object.freeze({
    playerImpactShadowIntegrationRequired: true,
    teamStrengthToMatchupRequired: true,
    matchupToDecisionModelRequired: true,
  }),
  promotionGate: Object.freeze({
    maxMAEDegradation: 0.10,
    maxRMSEDegradation: 0.15,
    maxWinnerAccuracyDegradation: 0.005,
    largeErrorCountMayIncrease: false,
  }),
  safeguards: Object.freeze({
    mode: "SHADOW_ONLY",
    productionPlayerImpactAuthorized: false,
    productionTeamStrengthAuthorized: false,
    canonicalIntegrationMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  }),
});
