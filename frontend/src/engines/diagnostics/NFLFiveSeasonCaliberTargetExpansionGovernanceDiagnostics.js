import {
  NFL_FIVE_SEASON_CALIBER_TARGET_EXPANSION_GOVERNANCE,
  getNFLFiveSeasonCaliberTargetExpansionGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLFiveSeasonCaliberTargetExpansionGovernance.js";

const g = getNFLFiveSeasonCaliberTargetExpansionGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_FIVE_SEASON_CALIBER_TARGET_EXPANSION_GOVERNANCE,
  fiveSeasonScope:
    JSON.stringify(g.targetSeasons) === JSON.stringify([2020,2021,2022,2023,2024]),
  shadowCorpusRequired:
    g.sourceCorpus === "five-season-shadow-replacement-corpus-v1.jsonl",
  validatedRoleFirstRequired:
    g.sourceResolverRequired === "ROLE_FIRST_FROM_VALIDATED_2D2E",
  unavailableRoleRequired:
    g.unavailablePlayerRoleRequired === true,
  replacementRoleRequired:
    g.expectedReplacementRoleRequired === true,
  kickoffRequired:
    g.kickoffTemporalAnchorRequired === true,
  asOfRequired:
    g.asOfTemporalAnchorRequired === true,
  canonicalEvaluationRequired:
    g.canonicalHistoricalEvaluationRequired === true,
  syntheticCaliberBlocked:
    g.syntheticCaliberFallbackAllowed === false,
  currentRatingBackfillBlocked:
    g.currentRatingBackfillAllowed === false,
  targetGamePerformanceBlocked:
    g.targetGamePerformanceAllowed === false,
  futureEvidenceBlocked:
    g.futureEvidenceAllowed === false,
  legacyTargetMutationBlocked:
    g.legacyTargetArtifactMutationAuthorized === false,
  legacyCaliberMutationBlocked:
    g.legacyCaliberArtifactMutationAuthorized === false,
  isolatedResearchWritesAllowed:
    g.isolatedResearchArtifactWritesAuthorized === true,
  productionResolverBlocked:
    g.productionReplacementResolverAuthorized === false,
  productionImpactCalibrationBlocked:
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
  suite: "NFL Five-Season Caliber Target Expansion Governance",
  contractVersion:
    "FIE-NFL-FIVE-SEASON-CALIBER-TARGET-EXPANSION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
