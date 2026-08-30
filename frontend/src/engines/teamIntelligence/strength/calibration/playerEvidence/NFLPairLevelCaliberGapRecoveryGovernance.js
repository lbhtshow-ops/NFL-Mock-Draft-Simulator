export const NFL_PAIR_LEVEL_CALIBER_GAP_RECOVERY_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-PAIR-LEVEL-CALIBER-GAP-RECOVERY-GOVERNANCE-2D2F-R2-1.0.0",
  sprint: "2D.2F-R2",
  targetCompletePairRate: 0.75,
  thresholdReductionAllowed: false,
  pairLevelAuditRequired: true,
  oneSideMissingPairsPrioritized: true,
  canonicalEvidenceRecoveryRequired: true,
  syntheticCaliberAllowed: false,
  currentRatingBackfillAllowed: false,
  targetGamePerformanceAllowed: false,
  futureEvidenceAllowed: false,
  unsupportedPositionForcedScoringAllowed: false,
  unresolvedPositionGuessAllowed: false,
  noPriorNFLEvidenceForcedScoringAllowed: false,
  recoveryArtifactMode: "RESEARCH_TARGETS_ONLY",
  canonicalSnapshotMutationAuthorized: false,
  productionPlayerImpactCalibrationAuthorized: false,
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLPairLevelCaliberGapRecoveryGovernance() {
  return NFL_PAIR_LEVEL_CALIBER_GAP_RECOVERY_GOVERNANCE;
}
