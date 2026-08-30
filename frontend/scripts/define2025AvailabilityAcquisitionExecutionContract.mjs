import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.23-RC12";
const TARGET_SEASON = 2025;

const RUNTIME_CANDIDATES = [
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.js",
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.mjs",
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.ts"
];

const runtimeFile = RUNTIME_CANDIDATES.find(p => fs.existsSync(path.join(ROOT,p))) ?? null;
const runtimeText = runtimeFile ? fs.readFileSync(path.join(ROOT,runtimeFile),"utf8") : "";

const requiredPlayerFields = [
  "playerId",
  "reportStatus",
  "practiceStatus",
  "primaryInjury",
  "dateModified"
];

const permittedStatuses = [
  "OUT",
  "DOUBTFUL",
  "QUESTIONABLE",
  "NOTE"
];

const treatmentStatuses = [
  "OUT",
  "DOUBTFUL"
];

const sourceUrls = [
  "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2025.csv",
  "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2025.csv.gz"
];

const runtimeChecks = {
  runtimeFound: Boolean(runtimeFile),
  providerNFLVerse:
    /provider\s*:\s*["']nflverse["']/i.test(runtimeText),
  datasetInjuries:
    /dataset\s*:\s*["']injuries["']/i.test(runtimeText),
  seasonParameterized:
    /normalizedSeason|targetSeason/i.test(runtimeText),
  csvSupported:
    /injuries_\$\{(?:normalizedSeason|targetSeason|season)\}\.csv/.test(runtimeText),
  csvGzSupported:
    /injuries_\$\{(?:normalizedSeason|targetSeason|season)\}\.csv\.gz/.test(runtimeText)
};

const executionContract = {
  contractVersion:
    "FIE-NFL-2025-AVAILABILITY-ACQUISITION-EXECUTION-CONTRACT-1.0.0",

  sprint: SPRINT,
  mode: "READ_ONLY_EXECUTION_CONTRACT_DEFINITION",

  scope: {
    season: TARGET_SEASON,
    provider: "nflverse",
    dataset: "injuries",
    sourceUrls,
    allowAlternateProvider: false,
    allowAlternateSeason: false,
    allowInferredInjuryDesignations: false
  },

  acquisition: {
    primaryFormat: "CSV",
    fallbackFormat: "CSV_GZ",
    primaryUrl: sourceUrls[0],
    fallbackUrl: sourceUrls[1],

    externalFetchAuthorizedByThisSprint: false,

    executionRequirements: {
      targetSeasonMustEqual2025: true,
      providerMustEqualNFLVerse: true,
      datasetMustEqualInjuries: true,
      sourceUrlMustMatchPermittedList: true,
      sourceContentHashRequired: true,
      acquisitionTimestampRequired: true,
      sourceProvenanceRequired: true
    }
  },

  schema: {
    requiredPlayerFields,
    permittedStatuses,

    requiredIdentityFields: [
      "season",
      "week",
      "team",
      "playerId"
    ],

    treatmentDefinition: {
      treatmentStatuses,
      questionableAloneIsTreatment: false,
      noteIsTreatment: false,
      rosterStatusMaySubstituteForReportStatus: false
    },

    failClosedRules: {
      missingPlayerIdRejectsObservation: true,
      missingSeasonRejectsObservation: true,
      missingWeekRejectsObservation: true,
      missingTeamRejectsObservation: true,
      missingDateModifiedRejectsPregameQualification: true,
      unknownReportStatusDoesNotCreateTreatment: true,
      rosterOnlyEvidenceDoesNotCreateTreatment: true
    }
  },

  leakageSafety: {
    joinPolicy: "LATEST_SAFE_PLAYER_WEEK_REPORT",

    requirement:
      "Only player injury-report evidence demonstrably available before the applicable team-game cutoff may qualify the historical pregame observation.",

    selectionRules: {
      selectLatestEligibleReportBeforeCutoff: true,
      prohibitReportsAfterCutoff: true,
      preserveReportDateModified: true,
      preserveAcquisitionTimestamp: true,
      preserveOriginalProviderRecord: true,
      prohibitOutcomeFieldsDuringSelection: true
    },

    cutoffResolution: {
      requiresGameIdentity: true,
      requiresPregameCutoff: true,
      ifCutoffCannotBeResolved: "FAIL_CLOSED_NULL_AVAILABILITY"
    }
  },

  persistenceBoundary: {
    rawAcquisitionArtifactMayBeCreatedOnlyInLaterAuthorizedSprint: true,
    normalizedAvailabilityArtifactMayBeCreatedOnlyInLaterAuthorizedSprint: true,

    databaseWriteAuthorized: false,
    repositoryWriteAuthorized: false,
    externalFetchAuthorized: false,

    downstreamAutomaticExecution: {
      normalization: false,
      treatmentConstruction: false,
      controlConstruction: false,
      matching: false,
      attEstimation: false,
      uncertaintyEstimation: false,
      calibration: false,
      teamStrengthMutation: false,
      decisionModelMutation: false,
      pickemMutation: false
    }
  },

  validationGatesForFutureExecution: {
    sourceHttpSuccessRequired: true,
    sourceContentNonEmptyRequired: true,
    expectedSchemaPresentRequired: true,
    playerIdentityCoverageMustBeReported: true,
    reportStatusCoverageMustBeReported: true,
    dateModifiedCoverageMustBeReported: true,
    weekCoverageMustBeReported: true,
    teamCoverageMustBeReported: true,
    governedStatusCountsMustBeReported: true,
    pregameSafeSelectionCoverageMustBeReported: true,
    rejectedLateReportCountMustBeReported: true,
    unresolvedCutoffCountMustBeReported: true,
    provenanceHashMustBeReported: true
  }
};

const checks = {
  priorCapabilityRuntimeFound: runtimeChecks.runtimeFound,
  nflverseProviderConfirmed: runtimeChecks.providerNFLVerse,
  injuriesDatasetConfirmed: runtimeChecks.datasetInjuries,
  seasonParameterizationConfirmed: runtimeChecks.seasonParameterized,
  csvCapabilityConfirmed: runtimeChecks.csvSupported,
  csvGzCapabilityConfirmed: runtimeChecks.csvGzSupported,

  targetSeasonLocked: executionContract.scope.season === 2025,
  providerLocked: executionContract.scope.provider === "nflverse",
  datasetLocked: executionContract.scope.dataset === "injuries",

  treatmentStatusesLocked:
    JSON.stringify(executionContract.schema.treatmentDefinition.treatmentStatuses) ===
    JSON.stringify(["OUT","DOUBTFUL"]),

  questionableNotTreatment:
    executionContract.schema.treatmentDefinition.questionableAloneIsTreatment === false,

  rosterSubstitutionProhibited:
    executionContract.schema.treatmentDefinition.rosterStatusMaySubstituteForReportStatus === false,

  latestSafeJoinLocked:
    executionContract.leakageSafety.joinPolicy === "LATEST_SAFE_PLAYER_WEEK_REPORT",

  lateReportsProhibited:
    executionContract.leakageSafety.selectionRules.prohibitReportsAfterCutoff === true,

  failClosedCutoff:
    executionContract.leakageSafety.cutoffResolution.ifCutoffCannotBeResolved ===
    "FAIL_CLOSED_NULL_AVAILABILITY",

  externalFetchStillLocked:
    executionContract.persistenceBoundary.externalFetchAuthorized === false,

  normalizationStillLocked:
    executionContract.persistenceBoundary.downstreamAutomaticExecution.normalization === false,

  matchingStillLocked:
    executionContract.persistenceBoundary.downstreamAutomaticExecution.matching === false,

  attStillLocked:
    executionContract.persistenceBoundary.downstreamAutomaticExecution.attEstimation === false,

  calibrationStillLocked:
    executionContract.persistenceBoundary.downstreamAutomaticExecution.calibration === false,

  pickemStillLocked:
    executionContract.persistenceBoundary.downstreamAutomaticExecution.pickemMutation === false
};

const allChecksPass = Object.values(checks).every(Boolean);

const report = {
  contractVersion:
    "FIE-NFL-2025-AVAILABILITY-ACQUISITION-EXECUTION-CONTRACT-REPORT-1.0.0",

  sprint: SPRINT,
  mode: "READ_ONLY_EXECUTION_CONTRACT_DEFINITION",

  decision: allChecksPass
    ? "BOUNDED_2025_AVAILABILITY_ACQUISITION_EXECUTION_CONTRACT_DEFINED"
    : "EXECUTION_CONTRACT_REJECTED_REQUIRES_REVIEW",

  sourceRuntime: {
    file: runtimeFile,
    ...runtimeChecks
  },

  executionContract,
  checks,

  authorizationBoundary: {
    governed2025AcquisitionExecutionMayAdvanceToImplementation: allChecksPass,

    externalFetchAuthorized: false,
    governed2025NormalizationAuthorized: false,
    governed2025TreatmentConstructionAuthorized: false,
    treatmentControlRebuildAuthorized: false,
    matchingRerunAuthorized: false,
    attRecomputationAuthorized: false,
    uncertaintyRecomputationAuthorized: false,
    productionCalibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false
  },

  nextStep: allChecksPass
    ? "IMPLEMENT_GOVERNED_2025_ACQUISITION_EXECUTION_WITH_DRY_RUN_AND_EXPLICIT_EXECUTE_FETCH_GATE"
    : "REVIEW_FAILED_EXECUTION_CONTRACT_CHECKS",

  safeguards: {
    externalNetworkInvoked: false,
    repositoryFilesMutated: false,
    databaseMutated: false,
    normalizationExecuted: false,
    treatmentConstructionExecuted: false,
    matchingExecuted: false,
    attEstimated: false,
    uncertaintyEstimated: false,
    calibrationExecuted: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemScoringMutated: false
  }
};

console.log(JSON.stringify(report,null,2));

if(!allChecksPass){
  process.exitCode = 1;
}
