export const NFL_PLAYER_IMPACT_FIXED_CANDIDATE_CONFIRMATION_2D4_R4 =
Object.freeze({
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-FIXED-CANDIDATE-CONFIRMATION-GOVERNANCE-1.0.0",
  sprint: "2D.4-R4",
  purpose:
    "Freeze the R3-selected candidate, reproduce it deterministically, and make a binary Pick'em coordination handoff decision without further candidate search.",
  sourceCandidate: Object.freeze({
    artifact:
      "data/calibration/historical/expansion-2020-2021/player-impact/player-impact-candidate-2d4-r3-selected-v1.json",
    mustBeSelectedByR3: true,
    variantMayChange: false,
    scaleMayChange: false,
    newCandidateSearchAllowed: false,
    retuningAllowed: false,
  }),
  confirmation: Object.freeze({
    validationRows: 720,
    seasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
    exactR3MetricReproductionRequired: true,
    aggregateR3GateMustStillPass: true,
    seasonStabilityMustStillPass: true,
    independentUntouchedForwardHoldoutClaimed: false,
  }),
  handoff: Object.freeze({
    pickemCoordinationMayBeAuthorized: true,
    handoffEqualsProductionActivation: false,
    independentPickemInjuryWeightsAllowed: false,
    pickemPlayerImpactReimplementationAllowed: false,
    canonicalDecisionAPIConsumptionRequired: true,
  }),
  safeguards: Object.freeze({
    mode: "SHADOW_ONLY",
    historicalConstructionReopeningAuthorized: false,
    productionPlayerImpactAuthorized: false,
    productionTeamStrengthAuthorized: false,
    canonicalIntegrationMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  }),
});
