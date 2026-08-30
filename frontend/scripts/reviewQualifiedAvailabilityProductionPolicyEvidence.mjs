#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.24-RC1";

const EXPECTED = Object.freeze({
  qualifiedSeasons: [2022, 2023, 2024],
  matchedRecords: 131,
  pointEstimate: -4.159193203877429,
  primaryProbabilityBelowZero: 0.9391,
  primaryInterval: [-9.378357356060773, 1.1276121539242592],
  controlClusterInterval: [-7.576023726166446, -0.6203451560768768],
  seasonPairInterval: [-7.091811656454302, -1.2140357168058442],
  trimmedInterval: [-7.612974286056197, 1.311551551219521]
});

const files = {
  uncertainty: path.join(ROOT, "data/calibration/historical/v1/historical-availability-matched-att-uncertainty-v1-report.json"),
  matched: path.join(ROOT, "data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl")
};

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return null; }
}
function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}
function near(a,b,tol=1e-12){ return Number.isFinite(a) && Math.abs(a-b)<=tol; }
function intervalNear(actual, expected) {
  return actual && near(actual.lower, expected[0]) && near(actual.upper, expected[1]);
}

const uncertainty = readJson(files.uncertainty);
const matched = readJsonl(files.matched);

const seasonCounts = {};
for (const r of matched) {
  const season = Number(r.season ?? r.identity?.season ?? r.treated?.season);
  if (Number.isFinite(season)) seasonCounts[season] = (seasonCounts[season] ?? 0) + 1;
}
const matchedSeasons = Object.keys(seasonCounts).map(Number).sort();

const pointEstimate = uncertainty?.lockedPointEstimate?.value ?? uncertainty?.primaryUncertainty?.result?.pointEstimate;
const primary = uncertainty?.primaryUncertainty?.result;
const control = uncertainty?.sensitivity?.controlClusterBootstrap?.result;
const seasonPair = uncertainty?.sensitivity?.seasonStratifiedPairBootstrap?.result;
const trimmed = uncertainty?.sensitivity?.p95AbsoluteEffectTrimmedBootstrap?.result;
const loo = uncertainty?.sensitivity?.leaveOneSeasonOut ?? {};
const seasonSpecific = uncertainty?.seasonSpecificIntervals ?? {};

const primaryCrossesZero = primary?.interval?.lower < 0 && primary?.interval?.upper > 0;
const controlExcludesZeroNegative = control?.interval?.upper < 0;
const seasonPairExcludesZeroNegative = seasonPair?.interval?.upper < 0;
const trimmedCrossesZero = trimmed?.interval?.lower < 0 && trimmed?.interval?.upper > 0;
const leaveOneSeasonOutAllNegative = Object.values(loo).length > 0 &&
  Object.values(loo).every(x => Number(x.meanEffect) < 0);
const allSeasonPointEstimatesNegative = Object.values(seasonSpecific).length > 0 &&
  Object.values(seasonSpecific).every(x => Number(x.pointEstimate) < 0);
const allSeasonIntervalsExcludeZero = Object.values(seasonSpecific).length > 0 &&
  Object.values(seasonSpecific).every(x => x.interval?.upper < 0);

const evidence = {
  qualifiedSeasons: matchedSeasons,
  matchedRecords: matched.length,
  seasonCounts,
  pointEstimate,
  primary95Interval: primary?.interval ?? null,
  primaryProbabilityBelowZero: primary?.probabilityEffectBelowZero ?? null,
  controlCluster95Interval: control?.interval ?? null,
  seasonStratifiedPair95Interval: seasonPair?.interval ?? null,
  trimmed95Interval: trimmed?.interval ?? null,
  leaveOneSeasonOutAllNegative,
  allSeasonPointEstimatesNegative,
  allSeasonIntervalsExcludeZero
};

const checks = {
  uncertaintyReportPresent: Boolean(uncertainty),
  matchedOutcomeArtifactPresent: matched.length > 0,
  qualifiedSeasonsExactly2022To2024:
    JSON.stringify(matchedSeasons) === JSON.stringify(EXPECTED.qualifiedSeasons),
  matchedRecordCountLocked: matched.length === EXPECTED.matchedRecords,
  pointEstimateLocked: near(pointEstimate, EXPECTED.pointEstimate),
  primaryIntervalLocked: intervalNear(primary?.interval, EXPECTED.primaryInterval),
  primaryProbabilityLocked: near(primary?.probabilityEffectBelowZero, EXPECTED.primaryProbabilityBelowZero),
  controlClusterIntervalLocked: intervalNear(control?.interval, EXPECTED.controlClusterInterval),
  seasonPairIntervalLocked: intervalNear(seasonPair?.interval, EXPECTED.seasonPairInterval),
  trimmedIntervalLocked: intervalNear(trimmed?.interval, EXPECTED.trimmedInterval),
  primaryIntervalCrossesZero: primaryCrossesZero,
  primaryProbabilityBelow95Percent: Number(primary?.probabilityEffectBelowZero) < 0.95,
  controlSensitivityNegative: controlExcludesZeroNegative,
  seasonPairSensitivityNegative: seasonPairExcludesZeroNegative,
  trimmedSensitivityCrossesZero: trimmedCrossesZero,
  leaveOneSeasonOutAllNegative,
  allSeasonPointEstimatesNegative,
  notAllSeasonIntervalsExcludeZero: !allSeasonIntervalsExcludeZero,
  directPointTranslationRejected: true,
  individualPlayerCoefficientInferenceRejected: true,
  positionCoefficientInferenceRejected: true,
  unrestrictedProductionCalibrationRejected: true
};

const allEvidenceLocked =
  checks.uncertaintyReportPresent &&
  checks.matchedOutcomeArtifactPresent &&
  checks.qualifiedSeasonsExactly2022To2024 &&
  checks.matchedRecordCountLocked &&
  checks.pointEstimateLocked &&
  checks.primaryIntervalLocked &&
  checks.primaryProbabilityLocked &&
  checks.controlClusterIntervalLocked &&
  checks.seasonPairIntervalLocked &&
  checks.trimmedIntervalLocked;

const policyReview = {
  evidenceStrength: "DIRECTIONALLY_SUPPORTED_BUT_NOT_STABLE_ENOUGH_FOR_UNRESTRICTED_CALIBRATION",
  supportingFactors: [
    "LOCKED_MATCHED_ATT_IS_NEGATIVE",
    "CONTROL_CLUSTER_SENSITIVITY_INTERVAL_IS_NEGATIVE",
    "SEASON_STRATIFIED_PAIR_SENSITIVITY_INTERVAL_IS_NEGATIVE",
    "LEAVE_ONE_SEASON_OUT_ESTIMATES_ARE_ALL_NEGATIVE",
    "SEASON_POINT_ESTIMATES_ARE_ALL_NEGATIVE"
  ],
  limitingFactors: [
    "PRIMARY_95_INTERVAL_CROSSES_ZERO",
    "PRIMARY_PROBABILITY_BELOW_ZERO_IS_BELOW_0_95",
    "P95_TRIMMED_95_INTERVAL_CROSSES_ZERO",
    "SEASON_SPECIFIC_UNCERTAINTY_IS_HETEROGENEOUS",
    "ESTIMAND_IS_MATCHED_TREATED_TEAM_GAMES_NOT_INDIVIDUAL_PLAYERS"
  ],
  prohibitedTranslations: [
    "DO_NOT_USE_MINUS_4_159_AS_A_DIRECT_TEAM_STRENGTH_POINT_PENALTY",
    "DO_NOT_DERIVE_PLAYER_COEFFICIENTS_FROM_TEAM_GAME_ATT",
    "DO_NOT_DERIVE_POSITION_COEFFICIENTS_FROM_TEAM_GAME_ATT",
    "DO_NOT_TREAT_QUESTIONABLE_AS_EQUIVALENT_TO_OUT_OR_DOUBTFUL_WITHOUT_SEPARATE_EVIDENCE",
    "DO_NOT_AUTHORIZE_UNBOUNDED_OR_LEARNED_PRODUCTION_WEIGHTS"
  ],
  boundedPolicyDesignRequirements: {
    conservativeMagnitudeCapRequired: true,
    confidenceGatingRequired: true,
    evidenceCompletenessGatingRequired: true,
    availabilityStatusScopeMustRemainExplicit: true,
    playerImpactMustComeFromSeparatePlayerImpactEvidenceOrExistingGovernedInputs: true,
    teamGameATTMayInformPolicyDirectionButNotDirectPlayerMagnitude: true,
    fallbackToNeutralWhenEvidenceInsufficient: true,
    provenanceRequired: true,
    explainabilityRequired: true,
    noSilentPickemScoringMutation: true
  }
};

const boundedPolicyDesignMayAdvance =
  allEvidenceLocked &&
  primaryCrossesZero &&
  Number(primary?.probabilityEffectBelowZero) < 0.95 &&
  controlExcludesZeroNegative &&
  seasonPairExcludesZeroNegative &&
  trimmedCrossesZero &&
  leaveOneSeasonOutAllNegative &&
  allSeasonPointEstimatesNegative &&
  !allSeasonIntervalsExcludeZero;

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-QUALIFIED-AVAILABILITY-PRODUCTION-POLICY-EVIDENCE-REVIEW-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_PRODUCTION_POLICY_EVIDENCE_REVIEW",
  decision: boundedPolicyDesignMayAdvance
    ? "BOUNDED_AVAILABILITY_IMPACT_POLICY_DESIGN_MAY_ADVANCE_WITH_CONSERVATIVE_GUARDRAILS"
    : "BOUNDED_AVAILABILITY_IMPACT_POLICY_DESIGN_BLOCKED_PENDING_EVIDENCE_RECONCILIATION",
  evidence,
  checks,
  policyReview,
  authorizationBoundary: {
    evidenceReviewComplete: true,
    boundedAvailabilityImpactPolicyDesignMayAdvance: boundedPolicyDesignMayAdvance,
    boundedAvailabilityImpactPolicyExecutionAuthorized: false,
    directATTPointTranslationAuthorized: false,
    individualPlayerCoefficientAuthorized: false,
    positionCoefficientAuthorized: false,
    learnedAvailabilityWeightsAuthorized: false,
    productionCalibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
    databaseMutationAuthorized: false
  },
  nextStep: boundedPolicyDesignMayAdvance
    ? "DEFINE_BOUNDED_PLAYER_AVAILABILITY_IMPACT_POLICY_V1_WITH_CONSERVATIVE_CAPS_CONFIDENCE_GATES_AND_NEUTRAL_FALLBACK"
    : "RECONCILE_QUALIFIED_2022_2024_EVIDENCE_BEFORE_POLICY_DESIGN",
  safeguards: {
    historicalArtifactsMutated: false,
    cohortRebuilt: false,
    matchingRerun: false,
    attRecomputed: false,
    uncertaintyRecomputed: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemScoringMutated: false,
    databaseMutated: false
  }
}, null, 2));
