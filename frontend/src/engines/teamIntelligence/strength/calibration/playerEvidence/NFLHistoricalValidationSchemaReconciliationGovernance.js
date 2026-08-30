export const NFL_HISTORICAL_VALIDATION_SCHEMA_RECONCILIATION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-HISTORICAL-VALIDATION-SCHEMA-RECONCILIATION-GOVERNANCE-2D2G-R1-1.0.0",
  sprint: "2D.2G-R1",
  matchedEffectField: "effect.treatedMinusControlResidual",
  matchedEffectSemantics: "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
  rawPointMarginMayRepresentObservedPlayerImpact: false,
  calibrationIdentityField: "identity",
  caliberDeltaField: "pregame.expectedReplacementDelta",
  observedUsageField: "usageEvidence.selectedSnapPct",
  canonicalDependencyField: "teamDependencyEvidence.dependencyIndex",
  unavailableDependencyMayBeSynthesized: false,
  missingFiveSeasonMatchedEffectsMayBeSilentlyPassed: false,
  missingPerformanceWindowValidationMayBeSilentlyPassed: false,
  missingOpponentAdjustmentValidationMayBeSilentlyPassed: false,
  productionWeightFitAuthorized: false,
  playerImpactTeamStrengthMode: "SHADOW_ONLY",
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLHistoricalValidationSchemaReconciliationGovernance() {
  return NFL_HISTORICAL_VALIDATION_SCHEMA_RECONCILIATION_GOVERNANCE;
}
