import {
  NFL_PAIR_LEVEL_CALIBER_GAP_RECOVERY_GOVERNANCE,
  getNFLPairLevelCaliberGapRecoveryGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLPairLevelCaliberGapRecoveryGovernance.js";

const g = getNFLPairLevelCaliberGapRecoveryGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_PAIR_LEVEL_CALIBER_GAP_RECOVERY_GOVERNANCE,
  pairGateFrozen: g.targetCompletePairRate === 0.75,
  noThresholdReduction: g.thresholdReductionAllowed === false,
  pairAuditRequired: g.pairLevelAuditRequired === true,
  oneSidePriority: g.oneSideMissingPairsPrioritized === true,
  canonicalRecoveryRequired: g.canonicalEvidenceRecoveryRequired === true,
  syntheticBlocked: g.syntheticCaliberAllowed === false,
  currentRatingBlocked: g.currentRatingBackfillAllowed === false,
  targetGameBlocked: g.targetGamePerformanceAllowed === false,
  futureBlocked: g.futureEvidenceAllowed === false,
  unsupportedPositionForcedScoringBlocked:
    g.unsupportedPositionForcedScoringAllowed === false,
  unresolvedPositionGuessBlocked:
    g.unresolvedPositionGuessAllowed === false,
  noPriorNFLForcedScoringBlocked:
    g.noPriorNFLEvidenceForcedScoringAllowed === false,
  recoveryResearchOnly:
    g.recoveryArtifactMode === "RESEARCH_TARGETS_ONLY",
  snapshotMutationBlocked:
    g.canonicalSnapshotMutationAuthorized === false,
  productionImpactBlocked:
    g.productionPlayerImpactCalibrationAuthorized === false,
  teamStrengthBlocked:
    g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked:
    g.decisionModelMutationAuthorized === false,
  pickemBlocked:
    g.pickemMutationAuthorized === false,
});

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Pair-Level Caliber Gap Recovery Governance",
  contractVersion:
    "FIE-NFL-PAIR-LEVEL-CALIBER-GAP-RECOVERY-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
