import fs from "node:fs";

const SOURCE =
  "./data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl";

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);
}

const rows = readJsonl(SOURCE);

const controlReuse = new Map();
const bySeason = new Map();

for(const row of rows){
  const controlKey = row?.control?.key ?? null;
  if(controlKey){
    controlReuse.set(
      controlKey,
      (controlReuse.get(controlKey) ?? 0) + 1
    );
  }

  const season = row?.treated?.season ?? null;
  if(season != null){
    bySeason.set(
      season,
      (bySeason.get(season) ?? 0) + 1
    );
  }
}

const uniqueControls = controlReuse.size;
const maximumControlReuse =
  uniqueControls
    ? Math.max(...controlReuse.values())
    : 0;

const reusedControls =
  [...controlReuse.values()].filter(v=>v>1).length;

const seasons = Object.fromEntries(
  [...bySeason.entries()]
    .sort(([a],[b])=>Number(a)-Number(b))
);

const design = {
  uncertaintyDesignId:
    "HISTORICAL-AVAILABILITY-MATCHED-ATT-UNCERTAINTY-V1",

  estimand:
    "ATT_SUPPORTED_MATCHED_TREATED_TEAM_GAMES",

  sourceEffectRecords: rows.length,

  dependenceStructure: {
    pairCount: rows.length,
    uniqueControlCount: uniqueControls,
    maximumControlReuse,
    reusedControlCount: reusedControls,
    pairEffectsIndependentAssumptionAuthorized: false,
    reason:
      "Matching with replacement creates dependence because multiple treated observations may share the same matched control."
  },

  seasonStructure: {
    counts: seasons,
    seasonHeterogeneityMustBeReported: true,
    pooledEstimateAloneSufficient: false
  },

  primaryUncertaintyMethod: {
    method:
      "TWO_WAY_CLUSTER_BOOTSTRAP_BY_TREATED_PAIR_AND_CONTROL_IDENTITY",
    role:
      "PRIMARY_UNCERTAINTY_SENSITIVITY_ESTIMATOR",
    bootstrapReplicates: 10000,
    confidenceLevel: 0.95,
    randomSeed: 2181901,

    treatedSamplingUnit:
      "MATCHED_TREATED_PAIR",

    controlDependenceHandling:
      "CONTROL_IDENTITY_CLUSTER_RESAMPLING",

    seasonHandling:
      "STRATIFY_RESAMPLING_BY_SEASON",

    estimatorPerReplicate:
      "MEAN_OF_RESAMPLED_PAIR_LEVEL_TREATED_MINUS_CONTROL_RESIDUAL_DIFFERENCES",

    percentileInterval:
      true,

    interpretation:
      "Bootstrap distribution describes uncertainty of the supported matched ATT under the locked matched design while preserving season structure and control-reuse dependence."
  },

  requiredSensitivityMethods: [
    {
      method:
        "CONTROL_CLUSTER_BOOTSTRAP",
      purpose:
        "Stress-test uncertainty under maximal dependence induced by reused controls."
    },
    {
      method:
        "SEASON_STRATIFIED_PAIR_BOOTSTRAP",
      purpose:
        "Stress-test the result when pair resampling preserves annual composition but does not explicitly cluster reused controls."
    },
    {
      method:
        "LEAVE_ONE_SEASON_OUT",
      purpose:
        "Measure whether pooled ATT direction or magnitude is dominated by one season."
    },
    {
      method:
        "P95_ABSOLUTE_EFFECT_TRIMMED_BOOTSTRAP",
      purpose:
        "Measure uncertainty after excluding the predeclared six most extreme pair effects identified by the descriptive audit."
    }
  ],

  reportingRequirements: {
    pointEstimateMustRemainLockedToPersistedATT: true,
    reportPrimary95Interval: true,
    reportBootstrapMedian: true,
    reportBootstrapMean: true,
    reportProbabilityEffectBelowZero: true,
    reportSeasonSpecificIntervals: true,
    reportLeaveOneSeasonOutEstimates: true,
    reportSensitivityIntervals: true,
    reportControlReuseDiagnostics: true,
    reportEffectiveUniqueControls: true
  },

  inferenceBoundary: {
    uncertaintyComputationMayAdvance: true,
    inferentialClaimAuthorized: false,
    statisticalSignificanceLanguageAuthorized: false,
    productionCalibrationAuthorized: false,
    playerCoefficientAuthorized: false,
    positionCoefficientAuthorized: false,
    teamStrengthPointValueAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false
  }
};

const checks = {
  sourceRecordCountMatches:
    rows.length === 131,

  uniqueControlCountMatches:
    uniqueControls === 76,

  maximumControlReuseMatches:
    maximumControlReuse === 7,

  dependenceExplicitlyModeled:
    design.dependenceStructure
      .pairEffectsIndependentAssumptionAuthorized === false,

  seasonHeterogeneityExplicitlyModeled:
    design.seasonStructure
      .seasonHeterogeneityMustBeReported === true,

  primaryMethodDefined:
    design.primaryUncertaintyMethod.method ===
      "TWO_WAY_CLUSTER_BOOTSTRAP_BY_TREATED_PAIR_AND_CONTROL_IDENTITY",

  seasonStratificationDefined:
    design.primaryUncertaintyMethod.seasonHandling ===
      "STRATIFY_RESAMPLING_BY_SEASON",

  fixedSeedDefined:
    Number.isInteger(
      design.primaryUncertaintyMethod.randomSeed
    ),

  bootstrapReplicatesSufficient:
    design.primaryUncertaintyMethod
      .bootstrapReplicates >= 10000,

  confidenceLevelDefined:
    design.primaryUncertaintyMethod
      .confidenceLevel === 0.95,

  requiredSensitivityMethodsDefined:
    design.requiredSensitivityMethods.length === 4,

  inferenceStillLocked:
    design.inferenceBoundary
      .inferentialClaimAuthorized === false,

  calibrationStillLocked:
    design.inferenceBoundary
      .productionCalibrationAuthorized === false,

  playerCoefficientStillLocked:
    design.inferenceBoundary
      .playerCoefficientAuthorized === false,

  pickemStillLocked:
    design.inferenceBoundary
      .pickemMutationAuthorized === false
};

const allChecksPass =
  Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-HISTORICAL-AVAILABILITY-UNCERTAINTY-DESIGN-1.0.0",

  sprint:
    "2.18.19-RC1",

  mode:
    "READ_ONLY_UNCERTAINTY_DESIGN",

  decision:
    allChecksPass
      ? "UNCERTAINTY_DESIGN_DEFINED_FOR_EXECUTION"
      : "UNCERTAINTY_DESIGN_REJECTED_REQUIRES_REVIEW",

  design,

  checks,

  authorizationBoundary: {
    uncertaintyExecutionMayAdvance:
      allChecksPass,

    confidenceIntervalComputationAuthorized:
      allChecksPass,

    inferentialClaimsAuthorized:
      false,

    statisticalSignificanceLanguageAuthorized:
      false,

    calibrationAuthorized:
      false,

    teamStrengthMutationAuthorized:
      false,

    decisionModelMutationAuthorized:
      false,

    pickemMutationAuthorized:
      false
  },

  safeguards: {
    uncertaintyEstimated:
      false,

    confidenceIntervalComputed:
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

if(!allChecksPass){
  process.exitCode = 2;
}
