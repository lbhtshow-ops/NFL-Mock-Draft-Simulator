export const NFL_PLAYER_IMPACT_FINAL_TARGETED_SENSITIVITY_GATE_2D3A =
Object.freeze({
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-FINAL-TARGETED-SENSITIVITY-GATE-GOVERNANCE-1.0.0",
  sprint: "2D.3A",
  purpose:
    "Resolve only the remaining performance-window, opponent-adjustment, and player-level heterogeneity questions before shadow Team Strength validation.",
  historicalConstructionReopeningAuthorized: false,
  coreMatchedEffectCorpusRequired: Object.freeze({
    legacyEffects: 131,
    expansionMinimumEffects: 500,
  }),
  performanceWindow: Object.freeze({
    required: true,
    windows: Object.freeze(["EARLY", "MID", "LATE"]),
    variationMayBeCarriedForwardToShadowValidation: true,
  }),
  opponentAdjustment: Object.freeze({
    required: true,
    compareRawMarginEffectToCanonicalResidualizedEffect: true,
    minimumComparableRows: 100,
  }),
  playerHeterogeneity: Object.freeze({
    required: true,
    unitOfEffect: "TEAM_GAME_ATT",
    aggregatePlayerEvidenceWithinTreatedTeamGame: true,
    individualPlayerATTMayBeInvented: false,
  }),
  antiWeedsPolicy: Object.freeze({
    doNotRebuildHistoricalSources: true,
    doNotRetuneMatcher: true,
    doNotCreateNewPlayerImpactModelHere: true,
    doNotCreateIndependentPickemWeights: true,
  }),
  safeguards: Object.freeze({
    mode: "SHADOW_ONLY",
    productionWeightsFitAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  }),
});
