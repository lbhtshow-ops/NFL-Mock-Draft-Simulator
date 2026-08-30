import fs from "node:fs";
const FILE="./data/calibration/historical/v1/historical-availability-matched-att-uncertainty-v1-report.json";
const report=fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,"utf8")):null;
const violations={
  missingReport:report?0:1,
  pointEstimateChanged:report?.lockedPointEstimate?.matchesPersistedDescriptiveATT===true?0:1,
  primaryReplicateMismatch:report?.primaryUncertainty?.result?.replicatesUsable===10000?0:1,
  pValueComputed:report?.interpretationBoundary?.pValueComputed===false?0:1,
  inferentialClaimAuthorized:report?.interpretationBoundary?.inferentialClaimAuthorized===false?0:1,
  calibrationAuthorized:report?.readiness?.calibrationAuthorized===false?0:1
};
console.log(JSON.stringify({
  audit:"HISTORICAL_AVAILABILITY_MATCHED_ATT_UNCERTAINTY",
  mode:"READ_ONLY",
  violations,
  summary:report?{
    pointEstimate:report?.lockedPointEstimate?.value??null,
    primary95Interval:report?.primaryUncertainty?.result?.interval??null,
    primaryProbabilityBelowZero:report?.primaryUncertainty?.result?.probabilityEffectBelowZero??null,
    controlCluster95Interval:report?.sensitivity?.controlClusterBootstrap?.result?.interval??null,
    seasonPair95Interval:report?.sensitivity?.seasonStratifiedPairBootstrap?.result?.interval??null,
    trimmed95Interval:report?.sensitivity?.p95AbsoluteEffectTrimmedBootstrap?.result?.interval??null
  }:null,
  boundary:{
    uncertaintyEstimated:report?.interpretationBoundary?.uncertaintyEstimated===true,
    confidenceIntervalsComputed:report?.interpretationBoundary?.confidenceIntervalsComputed===true,
    inferentialClaimsAuthorized:false,
    statisticalSignificanceLanguageAuthorized:false,
    calibrationAuthorized:false
  },
  safeguards:{
    learnedWeightsCreated:false,
    calibrationExecuted:false,
    teamStrengthMutated:false,
    decisionModelMutated:false,
    pickemScoringMutated:false
  }
},null,2));
