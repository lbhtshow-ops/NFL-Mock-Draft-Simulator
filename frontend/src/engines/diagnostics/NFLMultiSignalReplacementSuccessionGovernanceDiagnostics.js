import {
  NFL_MULTI_SIGNAL_REPLACEMENT_SUCCESSION_GOVERNANCE,
  getNFLMultiSignalReplacementSuccessionGovernance,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLMultiSignalReplacementSuccessionGovernance.js";

const g = getNFLMultiSignalReplacementSuccessionGovernance();
const checks = Object.freeze({
  contractExported: g === NFL_MULTI_SIGNAL_REPLACEMENT_SUCCESSION_GOVERNANCE,
  frozenTruthSetRequired: g.frozenStrictTruthSetRequired === true,
  agreementThresholdFrozen: g.minimumIdentityAgreementRate === 0.60,
  coverageThresholdFrozen: g.minimumStrictLabelEstimableCoverageRate === 0.75,
  noThresholdRetuning: g.thresholdRetuningAfterOutcomeInspectionAllowed === false,
  noLearnedResolverWeights: g.learnedResolverWeightsAuthorized === false,
  labelsValidationOnly:
    g.strictOfficialLabelsMayTrainResolver === false &&
    g.strictOfficialLabelsMayValidateResolver === true,
  priorUsageContextAllowed: g.priorGameUsageMayProvideContext === true,
  targetSnapBlocked: g.targetGameSnapEvidenceAllowed === false,
  futureSnapBlocked: g.futureSnapEvidenceAllowed === false,
  untimestampedDepthContextOnly:
    g.untimestampedDepthRoleMayProvideContext === true &&
    g.untimestampedDepthRoleMayProvePregameReplacement === false,
  rosterMayFilter: g.rosterContextMayFilterCandidates === true,
  availabilityTreatmentOnly:
    g.availabilityMayDefineTreatmentPlayer === true &&
    g.availabilityMayDefineReplacementIdentity === false,
  fuzzyBlocked: g.fuzzyMatchingAllowed === false,
  productionResolverBlocked: g.productionReplacementResolverAuthorized === false,
  productionImpactCalibrationBlocked:
    g.productionPlayerImpactCalibrationAuthorized === false,
  teamStrengthBlocked: g.teamStrengthMutationAuthorized === false,
  decisionModelBlocked: g.decisionModelMutationAuthorized === false,
  pickemBlocked: g.pickemMutationAuthorized === false,
});
const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify({
  suite: "NFL Multi-Signal Replacement Succession Governance",
  contractVersion:
    "FIE-NFL-MULTI-SIGNAL-REPLACEMENT-SUCCESSION-GOVERNANCE-DIAGNOSTIC-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.keys(checks).length - failures.length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
