export const NFL_CANONICAL_2020_2021_MATCHED_ATT_EXPANSION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-CANONICAL-2020-2021-MATCHED-ATT-EXPANSION-GOVERNANCE-2D2G-R2-1.0.1",
  sprint: "2D.2G-R2",
  expansionSeasons: Object.freeze([2020, 2021]),

  residualConstruction: Object.freeze({
    canonicalFunctionsRequired: Object.freeze([
      "loadCanonicalDecisionDataset",
      "indexDecisionRecords",
      "resolveDecisionRecord",
      "constructBaselineResidual",
    ]),
    legacyNoArgumentRunnerMayOverwriteV1: false,
    isolatedExpansionArtifactsRequired: true,
    rawPointMarginMayRepresentObservedPlayerImpact: false,
    gameResidualMayRepresentObservedPlayerImpact: false,
  }),

  controlCohort: Object.freeze({
    canonicalBuilderRequired: "buildHistoricalAvailabilityControlCohort",
    allowedSeasons: Object.freeze([2020, 2021]),
    canonicalClassificationRequired: true,
    externalTreatmentControlInferenceAllowed: false,
    unsafeControlAllowed: false,
    exposedOutOrDoubtfulControlAllowed: false,
    legacy187TreatedGameExpectationAppliesToExpansion: false,
    legacy286ResidualExpectationAppliesToExpansion: false,
  }),

  matching: Object.freeze({
    canonicalBuilderRequired: "buildHistoricalAvailabilityMatchedCohort",
    mode: "SAME_SEASON",
    method: "NEAREST_WITH_REPLACEMENT",
    caliperLabel: "p75",
    caliper: 0.7117676224413696,
    thresholdRetuningAllowed: false,
    newCovariatesAllowed: false,
  }),

  outcome: Object.freeze({
    canonicalBuilderRequired: "buildHistoricalAvailabilityMatchedOutcomeJoin",
    sourceResidualRequired: true,
    rawMarginSubstitutionAllowed: false,
  }),

  att: Object.freeze({
    canonicalBuilderRequired: "buildHistoricalAvailabilityMatchedATTEffect",
    orientation: "TREATED_MINUS_MATCHED_CONTROL",
    semantics: "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
    causalClaimAuthorized: false,
  }),

  productionPlayerImpactCalibrationAuthorized: false,
  playerImpactTeamStrengthMode: "SHADOW_ONLY",
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLCanonical2020_2021MatchedATTExpansionGovernance() {
  return NFL_CANONICAL_2020_2021_MATCHED_ATT_EXPANSION_GOVERNANCE;
}
