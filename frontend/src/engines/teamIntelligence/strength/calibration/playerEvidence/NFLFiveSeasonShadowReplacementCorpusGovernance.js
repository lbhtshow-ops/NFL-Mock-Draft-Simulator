export const NFL_FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-FIVE-SEASON-SHADOW-REPLACEMENT-CORPUS-GOVERNANCE-2D2F-1.0.0",
  sprint: "2D.2F",
  targetSeasons: Object.freeze([2020, 2021, 2022, 2023, 2024]),
  validatedResolver:
    "FIE-NFL-MULTI-SIGNAL-REPLACEMENT-SUCCESSION-ROLE-FIRST-2D2E-1.0.0",
  resolverMode: "SHADOW_ONLY",
  strictOfficialTruthMayBeInjectedIntoCorpus: false,
  learnedResolverWeightsAuthorized: false,
  priorGameUsageMayProvideContext: true,
  targetGameSnapEvidenceAllowed: false,
  futureSnapEvidenceAllowed: false,
  untimestampedDepthRoleMayProvideContext: true,
  untimestampedDepthRoleMayProvePregameReplacement: false,
  caliberAttachmentRequiresCanonicalHistoricalCaliberSource: true,
  syntheticCaliberFallbackAllowed: false,
  minimumCompleteCaliberCoverageForValidation: 0.75,
  canonicalLegacyReplacementArtifactMutationAuthorized: false,
  canonicalLegacyCaliberArtifactMutationAuthorized: false,
  playerImpactValidationMayBeAuthorizedAfterCaliberGate: true,
  productionReplacementResolverAuthorized: false,
  productionPlayerImpactCalibrationAuthorized: false,
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLFiveSeasonShadowReplacementCorpusGovernance() {
  return NFL_FIVE_SEASON_SHADOW_REPLACEMENT_CORPUS_GOVERNANCE;
}
