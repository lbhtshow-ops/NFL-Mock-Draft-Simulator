import fs from "node:fs";

const FILE =
  "./data/calibration/historical/v1/historical-availability-matched-att-uncertainty-v1-report.json";

const report = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE,"utf8"))
  : null;

const finite = v =>
  v !== null &&
  v !== undefined &&
  v !== "" &&
  Number.isFinite(Number(v));

function intervalExcludesZero(interval){
  if(!interval || !finite(interval.lower) || !finite(interval.upper)) return false;
  return Number(interval.upper) < 0 || Number(interval.lower) > 0;
}

function intervalIncludesZero(interval){
  if(!interval || !finite(interval.lower) || !finite(interval.upper)) return false;
  return Number(interval.lower) <= 0 && Number(interval.upper) >= 0;
}

const primaryInterval =
  report?.primaryUncertainty?.result?.interval ?? null;

const controlClusterInterval =
  report?.sensitivity?.controlClusterBootstrap?.result?.interval ?? null;

const seasonPairInterval =
  report?.sensitivity?.seasonStratifiedPairBootstrap?.result?.interval ?? null;

const trimmedInterval =
  report?.sensitivity?.p95AbsoluteEffectTrimmedBootstrap?.result?.interval ?? null;

const leaveOneOut =
  report?.sensitivity?.leaveOneSeasonOut ?? {};

const seasonIntervals =
  report?.seasonSpecificIntervals ?? {};

const leaveOneOutValues =
  Object.values(leaveOneOut)
    .map(x=>x?.meanEffect)
    .filter(finite)
    .map(Number);

const seasonPointEstimates =
  Object.values(seasonIntervals)
    .map(x=>x?.pointEstimate)
    .filter(finite)
    .map(Number);

const evidence = {
  pointEstimate:
    report?.lockedPointEstimate?.value ?? null,

  primary95Interval:
    primaryInterval,

  primaryProbabilityBelowZero:
    report?.primaryUncertainty
      ?.result?.probabilityEffectBelowZero ?? null,

  sensitivityIntervals: {
    controlCluster:
      controlClusterInterval,
    seasonStratifiedPair:
      seasonPairInterval,
    p95Trimmed:
      trimmedInterval
  },

  leaveOneSeasonOut:
    leaveOneOut,

  seasonSpecificIntervals:
    seasonIntervals,

  dependence: {
    uniqueControls:
      report?.dependenceDiagnostics?.uniqueControls ?? null,
    maximumControlReuse:
      report?.dependenceDiagnostics?.maximumControlReuse ?? null,
    reusedControls:
      report?.dependenceDiagnostics?.reusedControls ?? null,
    pairIndependenceAssumed:
      report?.dependenceDiagnostics?.pairIndependenceAssumed ?? null
  }
};

const gates = {
  uncertaintyExecutionComplete:
    report?.readiness?.uncertaintyExecutionComplete === true,

  pointEstimateNegative:
    finite(evidence.pointEstimate) &&
    Number(evidence.pointEstimate) < 0,

  primaryIntervalExcludesZero:
    intervalExcludesZero(primaryInterval),

  primaryProbabilityBelowZeroAtLeast95:
    finite(evidence.primaryProbabilityBelowZero) &&
    Number(evidence.primaryProbabilityBelowZero) >= .95,

  atLeastTwoSensitivityIntervalsExcludeZero:
    [
      controlClusterInterval,
      seasonPairInterval,
      trimmedInterval
    ].filter(intervalExcludesZero).length >= 2,

  trimmedIntervalExcludesZero:
    intervalExcludesZero(trimmedInterval),

  leaveOneSeasonOutAllNegative:
    leaveOneOutValues.length === 3 &&
    leaveOneOutValues.every(v=>v<0),

  seasonPointEstimatesAllNegative:
    seasonPointEstimates.length === 3 &&
    seasonPointEstimates.every(v=>v<0),

  allSeasonIntervalsExcludeZero:
    Object.values(seasonIntervals).length === 3 &&
    Object.values(seasonIntervals)
      .every(x=>intervalExcludesZero(x?.interval)),

  dependenceModeled:
    evidence.dependence
      .pairIndependenceAssumed === false,

  canonicalControlReuseReconciles:
    evidence.dependence.uniqueControls === 76 &&
    evidence.dependence.maximumControlReuse === 7,

  productionCalibrationPreviouslyLocked:
    report?.readiness?.calibrationAuthorized === false &&
    report?.interpretationBoundary
      ?.productionCalibrationAuthorized === false,

  pValueNotUsed:
    report?.interpretationBoundary?.pValueComputed === false,

  significanceLanguagePreviouslyLocked:
    report?.interpretationBoundary
      ?.statisticalSignificanceLanguageAuthorized === false
};

const review = {
  primarySupport: {
    pointEstimateNegative:
      gates.pointEstimateNegative,
    intervalExcludesZero:
      gates.primaryIntervalExcludesZero,
    probabilityBelowZeroAtLeast95:
      gates.primaryProbabilityBelowZeroAtLeast95
  },

  robustness: {
    controlClusterIntervalExcludesZero:
      intervalExcludesZero(controlClusterInterval),

    seasonPairIntervalExcludesZero:
      intervalExcludesZero(seasonPairInterval),

    trimmedIntervalExcludesZero:
      gates.trimmedIntervalExcludesZero,

    leaveOneSeasonOutAllNegative:
      gates.leaveOneSeasonOutAllNegative
  },

  seasonStability: {
    allSeasonPointEstimatesNegative:
      gates.seasonPointEstimatesAllNegative,

    allSeasonIntervalsExcludeZero:
      gates.allSeasonIntervalsExcludeZero,

    primarySeasonHeterogeneityPresent:
      Object.values(seasonIntervals).some(
        x=>intervalIncludesZero(x?.interval)
      )
  },

  dependenceIntegrity: {
    modeled:
      gates.dependenceModeled,

    controlReuseReconciles:
      gates.canonicalControlReuseReconciles
  },

  externalValidity: {
    estimandPopulation:
      "SUPPORTED_MATCHED_TREATED_TEAM_GAMES",

    generalizeToAllNFLInjuries:
      false,

    generalizeToIndividualPlayers:
      false,

    generalizeToPositions:
      false,

    generalizeToFutureSeasons:
      false,

    translateDirectlyToTeamStrengthPoints:
      false
  }
};

let classification;

if(
  gates.uncertaintyExecutionComplete &&
  gates.pointEstimateNegative &&
  gates.primaryIntervalExcludesZero &&
  gates.primaryProbabilityBelowZeroAtLeast95 &&
  gates.atLeastTwoSensitivityIntervalsExcludeZero &&
  gates.trimmedIntervalExcludesZero &&
  gates.leaveOneSeasonOutAllNegative &&
  gates.seasonPointEstimatesAllNegative &&
  gates.allSeasonIntervalsExcludeZero &&
  gates.dependenceModeled &&
  gates.canonicalControlReuseReconciles
){
  classification =
    "SUPPORTED_FOR_BOUNDED_EXPERIMENTAL_POLICY_REVIEW";
}else if(
  gates.uncertaintyExecutionComplete &&
  gates.pointEstimateNegative &&
  gates.atLeastTwoSensitivityIntervalsExcludeZero &&
  gates.leaveOneSeasonOutAllNegative &&
  gates.seasonPointEstimatesAllNegative &&
  gates.dependenceModeled &&
  gates.canonicalControlReuseReconciles
){
  classification =
    "SUPPORTED_RESEARCH_SIGNAL_NOT_AUTHORIZED_FOR_PRODUCTION_CALIBRATION";
}else{
  classification =
    "INSUFFICIENT_FOR_PRODUCTION_CALIBRATION";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-HISTORICAL-AVAILABILITY-EVIDENCE-REVIEW-1.0.0",

  sprint:
    "2.18.21-RC1",

  mode:
    "READ_ONLY_EVIDENCE_REVIEW",

  classification,

  evidence,

  gates,

  review,

  authorizationBoundary: {
    researchSignalRecognized:
      classification !==
      "INSUFFICIENT_FOR_PRODUCTION_CALIBRATION",

    boundedExperimentalPolicyReviewMayAdvance:
      classification ===
      "SUPPORTED_FOR_BOUNDED_EXPERIMENTAL_POLICY_REVIEW",

    additionalEvidenceDevelopmentMayAdvance:
      true,

    productionCalibrationAuthorized:
      false,

    learnedAvailabilityWeightsAuthorized:
      false,

    playerCoefficientAuthorized:
      false,

    positionCoefficientAuthorized:
      false,

    teamStrengthPointValueAuthorized:
      false,

    decisionModelMutationAuthorized:
      false,

    pickemMutationAuthorized:
      false,

    inferentialSignificanceLanguageAuthorized:
      false
  },

  recommendedNextStep:
    classification ===
      "SUPPORTED_FOR_BOUNDED_EXPERIMENTAL_POLICY_REVIEW"
      ? "DESIGN_BOUNDED_EXPERIMENTAL_POLICY_WITH_NO_PRODUCTION_MUTATION"
      : classification ===
        "SUPPORTED_RESEARCH_SIGNAL_NOT_AUTHORIZED_FOR_PRODUCTION_CALIBRATION"
        ? "EXPAND_AND_STABILIZE_HISTORICAL_EVIDENCE_BEFORE_POLICY_CALIBRATION"
        : "REVISIT_DATA_DESIGN_AND_EVIDENCE_BEFORE_ANY_CALIBRATION",

  safeguards: {
    sourceUncertaintyReportMutated:
      false,

    evidenceReestimated:
      false,

    matchingChanged:
      false,

    pointEstimateChanged:
      false,

    confidenceIntervalsRecomputed:
      false,

    pValueComputed:
      false,

    inferentialClaimCreated:
      false,

    learnedWeightsCreated:
      false,

    calibrationExecuted:
      false,

    teamStrengthMutated:
      false,

    decisionModelMutated:
      false,

    pickemScoringMutated:
      false,

    databaseMutated:
      false
  }
},null,2));
