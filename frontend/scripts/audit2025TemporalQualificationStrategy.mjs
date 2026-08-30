import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.23-RC14";

const candidates = [
  "src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalAvailabilityQualificationContract.js",
  "src/engines/teamIntelligence/strength/calibration/assembly/NFLHistoricalAvailabilitySelection.js",
  "src/engines/diagnostics/NFLHistoricalAvailabilityJoinDiagnostics.js",
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js",
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.js"
];

function read(rel){
  const file=path.join(ROOT,rel);
  return fs.existsSync(file)?fs.readFileSync(file,"utf8"):"";
}
function exists(rel){return fs.existsSync(path.join(ROOT,rel));}

const qualification = read(candidates[0]);
const selection = read(candidates[1]);
const joinDiag = read(candidates[2]);
const snapshots = read(candidates[3]);
const runtime = read(candidates[4]);

function tokenHits(text,tokens){
  return Object.fromEntries(tokens.map(t=>[
    t,
    text.toLowerCase().includes(t.toLowerCase())
  ]));
}

const qualificationSignals = tokenHits(
  qualification + "\n" + selection + "\n" + joinDiag,
  [
    "date_modified",
    "dateModified",
    "LATEST_SAFE_PLAYER_WEEK_REPORT",
    "kickoffAt",
    "effectiveAt",
    "week",
    "report_status",
    "practice_status"
  ]
);

const snapshotSignals = tokenHits(
  snapshots,
  [
    "gameId",
    "season",
    "week",
    "gameday",
    "awayTeam",
    "homeTeam"
  ]
);

const runtimeSignals = tokenHits(
  runtime,
  [
    "injuries_2025.csv",
    "injuries_${",
    "nflverse",
    "injuries"
  ]
);

const strategyOptions = {
  A_TIMESTAMP_EQUIVALENCE: {
    description:
      "Use a source-provided per-record timestamp equivalent to historical date_modified.",
    supported:
      qualificationSignals.dateModified || qualificationSignals["date_modified"],
    admissibleFor2025: false,
    reason:
      "Live 2025 source schema discovery found no timestamp/date field; this strategy cannot be used unless another canonical source supplies one."
  },

  B_WEEKLY_SNAPSHOT_AS_OF_SEMANTICS: {
    description:
      "Treat the NFLverse week-labeled injury dataset as a governed weekly pregame snapshot for the corresponding team/week.",
    supported:
      qualificationSignals.week &&
      qualificationSignals["report_status"] &&
      qualificationSignals["practice_status"] &&
      snapshotSignals.week &&
      snapshotSignals.season,
    admissibleFor2025: false,
    reason:
      "Week labeling alone does not prove the record predates kickoff. Source publication/update semantics must be demonstrated before this can be authorized."
  },

  C_GAME_CUTOFF_PLUS_EXTERNAL_RELEASE_PROVENANCE: {
    description:
      "Qualify a 2025 weekly injury snapshot only when repository/source provenance demonstrates the artifact was released before the team-game kickoff.",
    supported:
      snapshotSignals.gameId &&
      snapshotSignals.gameday &&
      runtimeSignals.nflverse &&
      runtimeSignals.injuries,
    admissibleFor2025: false,
    reason:
      "Current repository evidence identifies the source and game timing but does not yet provide per-week release timestamps for the downloaded NFLverse artifact."
  },

  D_ACQUISITION_TIME_SUBSTITUTION: {
    description:
      "Substitute local acquisition timestamp for historical source report time.",
    supported: true,
    admissibleFor2025: false,
    reason:
      "Prohibited because acquisition time in 2026 does not establish what was known before a 2025 game."
  },

  E_WEEK_NUMBER_ONLY: {
    description:
      "Assume any row labeled week N was available before the week N game.",
    supported: true,
    admissibleFor2025: false,
    reason:
      "Prohibited because week number alone cannot establish publication ordering relative to kickoff."
  }
};

const canonicalHistoricalRequirements = {
  dateModifiedRequired:
    /date_modified|dateModified/.test(qualification),
  latestSafeSelectionObserved:
    /LATEST_SAFE_PLAYER_WEEK_REPORT/.test(
      qualification + selection + joinDiag
    ),
  kickoffAwareSelectionObserved:
    /kickoffAt|kickoff/.test(
      qualification + selection + joinDiag
    ),
  effectiveAtObserved:
    /effectiveAt/.test(
      qualification + selection
    )
};

const schema2025KnownFacts = {
  seasonFieldPresent: true,
  weekFieldPresent: true,
  teamFieldPresent: true,
  playerIdFieldPresent: true,
  reportStatusPresent: true,
  practiceStatusPresent: true,
  primaryInjuryPresent: true,
  sourceTimestampFieldPresent: false
};

const checks = {
  historicalQualificationContractFound: exists(candidates[0]),
  historicalSelectionLogicFound: exists(candidates[1]),
  historicalJoinDiagnosticsFound: exists(candidates[2]),
  historicalPregameSnapshotSourceFound: exists(candidates[3]),
  availabilityRuntimeFound: exists(candidates[4]),

  historicalDateModifiedDependencyConfirmed:
    canonicalHistoricalRequirements.dateModifiedRequired,

  historicalLatestSafeSelectionConfirmed:
    canonicalHistoricalRequirements.latestSafeSelectionObserved,

  historicalKickoffAwarenessConfirmed:
    canonicalHistoricalRequirements.kickoffAwareSelectionObserved,

  current2025SourceTimestampAbsent:
    schema2025KnownFacts.sourceTimestampFieldPresent === false,

  acquisitionTimeSubstitutionRejected:
    strategyOptions.D_ACQUISITION_TIME_SUBSTITUTION.admissibleFor2025 === false,

  weekOnlyQualificationRejected:
    strategyOptions.E_WEEK_NUMBER_ONLY.admissibleFor2025 === false,

  sourceReleaseProvenanceRequired:
    strategyOptions.C_GAME_CUTOFF_PLUS_EXTERNAL_RELEASE_PROVENANCE.admissibleFor2025 === false
};

const allCoreChecksPass =
  checks.historicalQualificationContractFound &&
  checks.historicalSelectionLogicFound &&
  checks.historicalDateModifiedDependencyConfirmed &&
  checks.historicalLatestSafeSelectionConfirmed &&
  checks.current2025SourceTimestampAbsent &&
  checks.acquisitionTimeSubstitutionRejected &&
  checks.weekOnlyQualificationRejected;

const provenanceAuditMayAdvance =
  checks.historicalQualificationContractFound &&
  checks.historicalSelectionLogicFound &&
  checks.historicalDateModifiedDependencyConfirmed &&
  checks.current2025SourceTimestampAbsent &&
  checks.acquisitionTimeSubstitutionRejected &&
  checks.weekOnlyQualificationRejected;

const decision = provenanceAuditMayAdvance
  ? "TEMPORAL_QUALIFICATION_REQUIRES_SOURCE_RELEASE_PROVENANCE_AUDIT"
  : "2025_TEMPORAL_QUALIFICATION_STRATEGY_REQUIRES_REVIEW";

const report = {
  contractVersion:
    "FIE-NFL-2025-TEMPORAL-QUALIFICATION-STRATEGY-AUDIT-1.0.0",

  sprint: SPRINT,
  mode: "READ_ONLY_TEMPORAL_QUALIFICATION_STRATEGY_AUDIT",
  decision,

  repositoryEvidence: {
    files: candidates.map(file=>({file,exists:exists(file)})),
    qualificationSignals,
    snapshotSignals,
    runtimeSignals
  },

  canonicalHistoricalRequirements,
  schema2025KnownFacts,
  strategyOptions,
  checks,

  interpretation: {
    dateModifiedCanBeFabricated: false,
    acquisitionTimestampCanReplaceHistoricalSourceTime: false,
    weekNumberAloneCanProvePregameAvailability: false,
    safe2025QualificationCurrentlyEstablished: false,

    requiredProof:
      "A future sprint must identify authoritative source-release provenance or another canonical temporal field demonstrating that each 2025 injury snapshot used for a team-game existed before that game's kickoff."
  },

  authorizationBoundary: {
    "2025TemporalQualificationDefined": false,
    sourceReleaseProvenanceAuditMayAdvance: provenanceAuditMayAdvance,

    "2025RawAcquisitionReexecutionAuthorized": false,
    "2025NormalizationAuthorized": false,
    "2025TreatmentConstructionAuthorized": false,
    treatmentControlRebuildAuthorized: false,
    matchingRerunAuthorized: false,
    attRecomputationAuthorized: false,
    uncertaintyRecomputationAuthorized: false,
    productionCalibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false
  },

  nextStep: provenanceAuditMayAdvance
    ? "AUDIT_2025_SOURCE_RELEASE_PROVENANCE_WITHOUT_NORMALIZING_DATA"
    : "REVIEW_FAILED_TEMPORAL_STRATEGY_CHECKS",

  safeguards: {
    externalNetworkInvoked: false,
    repositoryFilesMutated: false,
    sourceSchemaReinterpreted: false,
    dateModifiedFabricated: false,
    acquisitionTimeSubstituted: false,
    weekNumberUsedAsProofOfPregameAvailability: false,
    normalizationExecuted: false,
    treatmentConstructionExecuted: false,
    matchingExecuted: false,
    attEstimated: false,
    uncertaintyEstimated: false,
    calibrationExecuted: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemScoringMutated: false,
    databaseMutated: false
  }
};

console.log(JSON.stringify(report,null,2));

if(!provenanceAuditMayAdvance){
  process.exitCode=1;
}
