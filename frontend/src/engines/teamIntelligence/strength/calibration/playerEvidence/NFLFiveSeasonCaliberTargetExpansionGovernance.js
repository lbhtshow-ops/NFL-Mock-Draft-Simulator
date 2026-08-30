export const NFL_FIVE_SEASON_CALIBER_TARGET_EXPANSION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-FIVE-SEASON-CALIBER-TARGET-EXPANSION-GOVERNANCE-2D2F-R1-1.0.0",
  sprint: "2D.2F-R1",
  targetSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
  sourceCorpus:
    "five-season-shadow-replacement-corpus-v1.jsonl",
  sourceResolverRequired:
    "ROLE_FIRST_FROM_VALIDATED_2D2E",
  unavailablePlayerRoleRequired: true,
  expectedReplacementRoleRequired: true,
  kickoffTemporalAnchorRequired: true,
  asOfTemporalAnchorRequired: true,
  canonicalHistoricalEvaluationRequired: true,
  syntheticCaliberFallbackAllowed: false,
  currentRatingBackfillAllowed: false,
  targetGamePerformanceAllowed: false,
  futureEvidenceAllowed: false,
  legacyTargetArtifactMutationAuthorized: false,
  legacyCaliberArtifactMutationAuthorized: false,
  isolatedResearchArtifactWritesAuthorized: true,
  productionReplacementResolverAuthorized: false,
  productionPlayerImpactCalibrationAuthorized: false,
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLFiveSeasonCaliberTargetExpansionGovernance() {
  return NFL_FIVE_SEASON_CALIBER_TARGET_EXPANSION_GOVERNANCE;
}
