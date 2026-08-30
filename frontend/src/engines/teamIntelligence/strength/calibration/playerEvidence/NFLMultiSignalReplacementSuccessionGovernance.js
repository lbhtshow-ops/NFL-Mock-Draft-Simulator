export const NFL_MULTI_SIGNAL_REPLACEMENT_SUCCESSION_GOVERNANCE =
Object.freeze({
  contractVersion:
    "FIE-NFL-MULTI-SIGNAL-REPLACEMENT-SUCCESSION-GOVERNANCE-2D2E-1.0.0",
  sprint: "2D.2E",
  frozenStrictTruthSetRequired: true,
  minimumIdentityAgreementRate: 0.60,
  minimumStrictLabelEstimableCoverageRate: 0.75,
  thresholdRetuningAfterOutcomeInspectionAllowed: false,
  learnedResolverWeightsAuthorized: false,
  strictOfficialLabelsMayTrainResolver: false,
  strictOfficialLabelsMayValidateResolver: true,
  priorGameUsageMayProvideContext: true,
  targetGameSnapEvidenceAllowed: false,
  futureSnapEvidenceAllowed: false,
  untimestampedDepthRoleMayProvideContext: true,
  untimestampedDepthRoleMayProvePregameReplacement: false,
  rosterContextMayFilterCandidates: true,
  availabilityMayDefineTreatmentPlayer: true,
  availabilityMayDefineReplacementIdentity: false,
  fuzzyMatchingAllowed: false,
  shadowCorpusConstructionMayBeAuthorizedAfterGate: true,
  productionReplacementResolverAuthorized: false,
  productionPlayerImpactCalibrationAuthorized: false,
  teamStrengthMutationAuthorized: false,
  decisionModelMutationAuthorized: false,
  pickemMutationAuthorized: false,
});

export function getNFLMultiSignalReplacementSuccessionGovernance() {
  return NFL_MULTI_SIGNAL_REPLACEMENT_SUCCESSION_GOVERNANCE;
}
