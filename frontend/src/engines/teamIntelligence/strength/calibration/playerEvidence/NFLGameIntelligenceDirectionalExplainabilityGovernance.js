export const NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-GAME-INTELLIGENCE-DIRECTIONAL-EXPLAINABILITY-GOVERNANCE-1.0.0",
  sprint: "2D.5C",
  purpose:
    "Expose canonical favorite-supporting matchup advantages and opponent counterweights without changing matchup or decision scoring.",
  canonicalInputs: Object.freeze({
    signedMatchupDimensionsRequired: true,
    canonicalDecisionFavoriteRequired: true,
    directionSemantics:
      "POSITIVE_DIMENSION_FAVORS_HOME_NEGATIVE_DIMENSION_FAVORS_AWAY",
  }),
  apiContract: Object.freeze({
    additiveNamespace: "matchupExplainability",
    keyAdvantagesMeaning:
      "STRONGEST_DISTINCT_CANONICAL_DIMENSIONS_SUPPORTING_DECISION_FAVORITE",
    counterweightsMeaning:
      "STRONGEST_DISTINCT_CANONICAL_DIMENSIONS_SUPPORTING_OPPONENT",
    existingFactorsPreserved: true,
    perDimensionEvidenceMayRemainNull: true,
  }),
  ownership: Object.freeze({
    directionalClassification: "CANONICAL_FIE",
    presentationPrioritization: "PICKEM_CONSUMER",
    pickemMayInferDirection: false,
    pickemMayCalculateAdvantages: false,
  }),
  safeguards: Object.freeze({
    playerImpactActivationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    matchupDimensionMutationAuthorized: false,
    matchupScoringMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    expectedMarginMutationAuthorized: false,
    pickemScoringMutationAuthorized: false,
    databaseMutationAuthorized: false,
  }),
});
