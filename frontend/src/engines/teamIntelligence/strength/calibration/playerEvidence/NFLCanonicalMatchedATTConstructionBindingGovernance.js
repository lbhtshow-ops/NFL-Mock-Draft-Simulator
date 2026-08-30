export const NFL_CANONICAL_MATCHED_ATT_CONSTRUCTION_BINDING_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-CANONICAL-MATCHED-ATT-CONSTRUCTION-BINDING-GOVERNANCE-2D2G-R2-1.0.0",
  sprint: "2D.2G-R2",
  expansionSeasons: Object.freeze([2020, 2021]),
  requiredCanonicalBuilders: Object.freeze([
    "buildHistoricalAvailabilityMatchedCohort",
    "buildHistoricalAvailabilityMatchedOutcomeJoin",
    "buildHistoricalAvailabilityMatchedATTEffect",
  ]),
  frozenMatchingMethod: "NEAREST_WITH_REPLACEMENT",
  frozenMatchingMode: "SAME_SEASON",
  frozenCaliperLabel: "p75",
  frozenCaliper: 0.7117676224413696,
  effectOrientation: "TREATED_MINUS_MATCHED_CONTROL",
  effectSemantics: "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
  sourceTreatmentClassificationRequired: true,
  treatmentClassificationInferenceAllowed: false,
  sourceResidualRequired: true,
  rawPointMarginResidualSubstitutionAllowed: false,
  approximateMatcherAllowed: false,
  matchingThresholdRetuningAllowed: false,
  newMatchingCovariatesAllowed: false,
  isolatedResearchWriteAllowed: true,
  legacyMatchedEffectMutationAuthorized: false,
  productionPlayerImpactCalibrationAuthorized: false,
  playerImpactTeamStrengthMode: "SHADOW_ONLY",
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLCanonicalMatchedATTConstructionBindingGovernance() {
  return NFL_CANONICAL_MATCHED_ATT_CONSTRUCTION_BINDING_GOVERNANCE;
}
