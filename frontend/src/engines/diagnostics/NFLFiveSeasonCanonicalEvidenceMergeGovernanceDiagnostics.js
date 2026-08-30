import {
  NFL_FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_GOVERNANCE,
  getNFLFiveSeasonCanonicalEvidenceMergeGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLFiveSeasonCanonicalEvidenceMergeGovernance.js";

const g = getNFLFiveSeasonCanonicalEvidenceMergeGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_FIVE_SEASON_CANONICAL_EVIDENCE_MERGE_GOVERNANCE,
  fiveSeasonScope:
    JSON.stringify(g.targetSeasons) === JSON.stringify([2020,2021,2022,2023,2024]),
  isolatedArtifactsRequired:
    g.isolatedMergedArtifactsRequired === true,
  conflictsNotOverwritten:
    g.conflictingEvidenceOverwriteAllowed === false,
  legacyMutationBlocked:
    g.legacyEvidenceMutationAuthorized === false,
  expansionMutationBlocked:
    g.expansionEvidenceMutationAuthorized === false,
  targetSnapBlocked:
    g.targetGameSnapEvidenceAllowedForPregameCaliber === false,
  futureBlocked:
    g.futureEvidenceAllowed === false,
  depthContextOnly:
    g.depthRoleMayProvideContext === true &&
    g.depthRoleMayProvePregamePublication === false,
  canonicalEvaluatorRequired:
    g.canonicalHistoricalEvaluatorRequired === true,
  syntheticBlocked:
    g.syntheticCaliberAllowed === false,
  currentRatingBlocked:
    g.currentRatingBackfillAllowed === false,
  pairGateFrozen:
    g.pairCoverageGate === 0.75,
  noGateReduction:
    g.pairCoverageThresholdReductionAllowed === false,
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
  suite: "NFL Five-Season Canonical Evidence Merge Governance",
  contractVersion:
    "FIE-NFL-FIVE-SEASON-CANONICAL-EVIDENCE-MERGE-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
