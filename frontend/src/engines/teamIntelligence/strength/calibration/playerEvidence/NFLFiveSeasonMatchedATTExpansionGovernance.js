export const NFL_FIVE_SEASON_MATCHED_ATT_EXPANSION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-FIVE-SEASON-MATCHED-ATT-EXPANSION-GOVERNANCE-2D2G-R2-1.0.0",
  sprint: "2D.2G-R2",
  expansionSeasons: Object.freeze([2020, 2021]),
  canonicalMatcherReuseRequired: true,
  frozenLegacyMatchingMethodRequired: true,
  approximateMatcherAllowed: false,
  matchingThresholdRetuningAllowed: false,
  newMatchingCovariatesAllowed: false,
  matchedEffectOrientation: "TREATED_MINUS_MATCHED_CONTROL",
  matchedEffectSemantics: "DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY",
  rawPointMarginMayRepresentObservedPlayerImpact: false,
  sourceEntryPointMustBeProvenBeforeConstruction: true,
  productionPlayerImpactCalibrationAuthorized: false,
  playerImpactTeamStrengthMode: "SHADOW_ONLY",
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLFiveSeasonMatchedATTExpansionGovernance() {
  return NFL_FIVE_SEASON_MATCHED_ATT_EXPANSION_GOVERNANCE;
}
