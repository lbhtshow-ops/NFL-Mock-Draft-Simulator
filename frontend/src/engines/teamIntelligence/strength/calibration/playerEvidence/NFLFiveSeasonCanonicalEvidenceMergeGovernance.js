export const NFL_FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-FIVE-SEASON-CANONICAL-EVIDENCE-MERGE-GOVERNANCE-2D2F-R3-1.0.0",
  sprint: "2D.2F-R3",
  targetSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
  evidenceClasses: Object.freeze([
    "OBSERVATIONS",
    "RESOLVED_PRIOR_PARTICIPATION",
    "DEPTH_ROLE_CONTEXT",
  ]),
  isolatedMergedArtifactsRequired: true,
  conflictingEvidenceOverwriteAllowed: false,
  legacyEvidenceMutationAuthorized: false,
  expansionEvidenceMutationAuthorized: false,
  targetGameSnapEvidenceAllowedForPregameCaliber: false,
  futureEvidenceAllowed: false,
  depthRoleMayProvideContext: true,
  depthRoleMayProvePregamePublication: false,
  canonicalHistoricalEvaluatorRequired: true,
  syntheticCaliberAllowed: false,
  currentRatingBackfillAllowed: false,
  pairCoverageGate: 0.75,
  pairCoverageThresholdReductionAllowed: false,
  productionPlayerImpactCalibrationAuthorized: false,
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLFiveSeasonCanonicalEvidenceMergeGovernance() {
  return NFL_FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_GOVERNANCE;
}
