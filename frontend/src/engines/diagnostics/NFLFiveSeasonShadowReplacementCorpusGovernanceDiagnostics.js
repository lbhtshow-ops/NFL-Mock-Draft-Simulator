import {
  NFL_FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_GOVERNANCE,
  getNFLFiveSeasonShadowReplacementCorpusGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLFiveSeasonShadowReplacementCorpusGovernance.js";

const g = getNFLFiveSeasonShadowReplacementCorpusGovernance();

const checks = Object.freeze({
  contractExported:
    g === NFL_FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_GOVERNANCE,
  fiveSeasonScope:
    JSON.stringify(g.targetSeasons) === JSON.stringify([2020,2021,2022,2023,2024]),
  validatedRoleFirstResolver:
    g.validatedResolver.includes("ROLE-FIRST-2D2E"),
  shadowOnly: g.resolverMode === "SHADOW_ONLY",
  truthNotInjected:
    g.strictOfficialTruthMayBeInjectedIntoCorpus === false,
  noLearnedResolverWeights:
    g.learnedResolverWeightsAuthorized === false,
  priorUsageContextAllowed:
    g.priorGameUsageMayProvideContext === true,
  targetSnapBlocked:
    g.targetGameSnapEvidenceAllowed === false,
  futureSnapBlocked:
    g.futureSnapEvidenceAllowed === false,
  untimestampedDepthContextOnly:
    g.untimestampedDepthRoleMayProvideContext === true &&
    g.untimestampedDepthRoleMayProvePregameReplacement === false,
  canonicalCaliberRequired:
    g.caliberAttachmentRequiresCanonicalHistoricalCaliberSource === true,
  noSyntheticCaliberFallback:
    g.syntheticCaliberFallbackAllowed === false,
  caliberCoverageFrozen:
    g.minimumCompleteCaliberCoverageForValidation === 0.75,
  legacyReplacementMutationBlocked:
    g.canonicalLegacyReplacementArtifactMutationAuthorized === false,
  legacyCaliberMutationBlocked:
    g.canonicalLegacyCaliberArtifactMutationAuthorized === false,
  productionResolverBlocked:
    g.productionReplacementResolverAuthorized === false,
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
  suite: "NFL Five-Season Shadow Replacement Corpus Governance",
  contractVersion:
    "FIE-NFL-FIVE-SEASON-SHADOW-REPLACEMENT-CORPUS-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
