export const NFL_PLAYER_IMPACT_VALIDATION_JOIN_RECOVERY_2D4_R2 =
Object.freeze({
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-VALIDATION-JOIN-RECOVERY-GOVERNANCE-1.0.0",
  sprint: "2D.4-R2",
  rootCause:
    "2D.4-R1 bound expansion validation to the generic availability observation artifact instead of the canonical matched-ATT calibration observation artifact.",
  correctedExpansionObservationPath:
    "data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl",
  expectedRows: Object.freeze({
    totalEffects: 720,
    legacyEffects: 131,
    expansionEffects: 589,
  }),
  candidateMethodMayChangeBeforeFullJoinRecovery: false,
  historicalConstructionReopeningAuthorized: false,
  matcherRetuningAuthorized: false,
  productionPlayerImpactAuthorized: false,
  productionTeamStrengthAuthorized: false,
  safeguards: Object.freeze({
    mode: "SHADOW_ONLY",
    canonicalIntegrationMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  }),
});
