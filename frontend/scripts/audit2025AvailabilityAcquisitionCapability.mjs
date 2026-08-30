import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.23-RC11";
const CONTRACT = "FIE-NFL-2025-AVAILABILITY-ACQUISITION-CAPABILITY-AUDIT-1.0.0";
const TARGET_SEASON = 2025;

const candidates = [
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.js",
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.mjs",
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.ts",
  "src/data/footballIntelligence/nfl/availability/NFLAvailabilityAcquisitionRuntime.tsx",
];

const runtimeRel = candidates.find((p) => fs.existsSync(path.join(ROOT, p))) ?? null;
const runtimeText = runtimeRel ? fs.readFileSync(path.join(ROOT, runtimeRel), "utf8") : "";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!["node_modules", ".git", "dist", "build"].includes(ent.name)) walk(full, out);
    } else if (/\.(js|mjs|cjs|ts|tsx|json|md)$/i.test(ent.name)) out.push(full);
  }
  return out;
}

const files = [...walk(path.join(ROOT, "src")), ...walk(path.join(ROOT, "scripts"))];
const searchable = files.map((file) => {
  let text = "";
  try { text = fs.readFileSync(file, "utf8"); } catch {}
  return { file, rel: path.relative(ROOT, file), text };
});

const injuryUrlDynamic =
  /injuries_\$\{normalizedSeason\}\.csv/.test(runtimeText) ||
  /injuries_\$\{targetSeason\}\.csv/.test(runtimeText) ||
  /injuries_\$\{season\}\.csv/.test(runtimeText);

const compressedFallback =
  /injuries_\$\{normalizedSeason\}\.csv\.gz/.test(runtimeText) ||
  /injuries_\$\{targetSeason\}\.csv\.gz/.test(runtimeText) ||
  /injuries_\$\{season\}\.csv\.gz/.test(runtimeText);

const providerNFLVerse = /provider\s*:\s*["']nflverse["']/i.test(runtimeText);
const datasetInjuries = /dataset\s*:\s*["']injuries["']/i.test(runtimeText);
const seasonNormalization = /normalizedSeason|targetSeason/i.test(runtimeText);

const fieldTokens = [
  "report_status", "reportStatus", "practice_status", "practiceStatus",
  "report_primary_injury", "primary_injury", "primaryInjury",
  "date_modified", "dateModified", "week", "season", "team", "club"
];
const fieldEvidence = {};
for (const token of fieldTokens) {
  fieldEvidence[token] = searchable
    .filter(({ text }) => text.includes(token))
    .slice(0, 8)
    .map(({ rel }) => rel);
}

const statusEvidence = {};
for (const status of ["OUT", "DOUBTFUL", "QUESTIONABLE"]) {
  const rx = new RegExp(`["']${status}["']`, "i");
  statusEvidence[status] = searchable.filter(({ text }) => rx.test(text)).slice(0, 8).map(({ rel }) => rel);
}

const leakageTokens = [
  "LATEST_SAFE_PLAYER_WEEK_REPORT",
  "latest safe",
  "pregame",
  "pre-game",
  "dateModified",
  "date_modified",
  "kickoff",
  "gameDate",
  "game_date"
];
const leakageEvidence = {};
for (const token of leakageTokens) {
  leakageEvidence[token] = searchable
    .filter(({ text }) => text.toLowerCase().includes(token.toLowerCase()))
    .slice(0, 10)
    .map(({ rel }) => rel);
}

const hasReportStatus = fieldEvidence.report_status.length > 0 || fieldEvidence.reportStatus.length > 0;
const hasPracticeStatus = fieldEvidence.practice_status.length > 0 || fieldEvidence.practiceStatus.length > 0;
const hasInjury = fieldEvidence.report_primary_injury.length > 0 || fieldEvidence.primary_injury.length > 0 || fieldEvidence.primaryInjury.length > 0;
const hasModifiedDate = fieldEvidence.date_modified.length > 0 || fieldEvidence.dateModified.length > 0;
const allGovernedStatusesObserved = ["OUT", "DOUBTFUL", "QUESTIONABLE"].every((s) => statusEvidence[s].length > 0);
const safeJoinTokenObserved = leakageEvidence["LATEST_SAFE_PLAYER_WEEK_REPORT"].length > 0;
const pregameTemporalSignalsObserved =
  safeJoinTokenObserved &&
  hasModifiedDate &&
  (leakageEvidence.kickoff.length > 0 ||
   leakageEvidence.gameDate.length > 0 ||
   leakageEvidence.game_date.length > 0 ||
   leakageEvidence.pregame.length > 0 ||
   leakageEvidence["pre-game"].length > 0);

const schemaCapabilitySupported =
  hasReportStatus && hasPracticeStatus && hasInjury && hasModifiedDate && allGovernedStatusesObserved;

const acquisitionContractSupports2025 =
  Boolean(runtimeRel) && injuryUrlDynamic && providerNFLVerse && datasetInjuries && seasonNormalization;

const leakageSafeCutoffCapabilitySupported = pregameTemporalSignalsObserved;

let decision = "2025_AVAILABILITY_ACQUISITION_CAPABILITY_REQUIRES_REVIEW";
if (acquisitionContractSupports2025 && schemaCapabilitySupported && leakageSafeCutoffCapabilitySupported) {
  decision = "2025_AVAILABILITY_ACQUISITION_CAPABILITY_CONFIRMED_FOR_GOVERNED_EXECUTION_DESIGN";
}

const report = {
  contractVersion: CONTRACT,
  sprint: SPRINT,
  mode: "READ_ONLY_CAPABILITY_AUDIT",
  targetSeason: TARGET_SEASON,
  decision,
  acquisitionRuntime: {
    file: runtimeRel,
    provider: providerNFLVerse ? "nflverse" : null,
    dataset: datasetInjuries ? "injuries" : null,
    seasonParameterized: injuryUrlDynamic && seasonNormalization,
    csvPathCapability: injuryUrlDynamic,
    compressedFallbackCapability: compressedFallback,
    expected2025Url: acquisitionContractSupports2025
      ? "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2025.csv"
      : null,
  },
  schemaCapability: {
    reportStatusObserved: hasReportStatus,
    practiceStatusObserved: hasPracticeStatus,
    primaryInjuryObserved: hasInjury,
    dateModifiedObserved: hasModifiedDate,
    governedStatusesObserved: {
      OUT: statusEvidence.OUT.length > 0,
      DOUBTFUL: statusEvidence.DOUBTFUL.length > 0,
      QUESTIONABLE: statusEvidence.QUESTIONABLE.length > 0,
    },
    equivalentCoreCapabilitySupported: schemaCapabilitySupported,
    evidence: { fieldEvidence, statusEvidence },
  },
  leakageSafetyCapability: {
    latestSafePlayerWeekReportObserved: safeJoinTokenObserved,
    dateModifiedObserved: hasModifiedDate,
    pregameTemporalSignalsObserved,
    leakageSafeCutoffCapabilitySupported,
    evidence: leakageEvidence,
    requirement:
      "A governed 2025 execution must preserve only injury-report information demonstrably available before the applicable team-game cutoff; later reports must not leak into the pregame observation.",
  },
  checks: {
    acquisitionRuntimeFound: Boolean(runtimeRel),
    nflverseInjuryProviderLocked: providerNFLVerse && datasetInjuries,
    dynamicSeasonPathFound: injuryUrlDynamic,
    target2025RepresentableWithoutCodeChange: acquisitionContractSupports2025,
    governedStatusSchemaCapabilityFound: schemaCapabilitySupported,
    leakageSafeCutoffCapabilityFound: leakageSafeCutoffCapabilitySupported,
    externalFetchPerformed: false,
    outcomesUsed: false,
    normalizationPerformed: false,
    treatmentDefinitionChanged: false,
  },
  readiness: {
    capabilityAuditComplete: true,
    governed2025AcquisitionExecutionDesignMayAdvance:
      acquisitionContractSupports2025 && schemaCapabilitySupported && leakageSafeCutoffCapabilitySupported,
    externalFetchAuthorized: false,
    governed2025NormalizationAuthorized: false,
    governed2025TreatmentConstructionAuthorized: false,
    treatmentControlRebuildAuthorized: false,
    matchingRerunAuthorized: false,
    attRecomputationAuthorized: false,
    uncertaintyRecomputationAuthorized: false,
    productionCalibrationAuthorized: false,
  },
  nextStep:
    decision === "2025_AVAILABILITY_ACQUISITION_CAPABILITY_CONFIRMED_FOR_GOVERNED_EXECUTION_DESIGN"
      ? "DEFINE_BOUNDED_2025_AVAILABILITY_ACQUISITION_EXECUTION_CONTRACT"
      : "REVIEW_MISSING_2025_ACQUISITION_SCHEMA_OR_LEAKAGE_SAFETY_CAPABILITY",
  safeguards: {
    repositoryFilesMutated: false,
    externalNetworkInvoked: false,
    historicalBackfillPerformed: false,
    statusValuesInvented: false,
    questionablePromotedToTreatment: false,
    outcomesUsed: false,
    matchingChanged: false,
    attReestimated: false,
    uncertaintyReestimated: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemScoringMutated: false,
    databaseMutated: false,
  },
};

console.log(JSON.stringify(report, null, 2));
if (decision !== "2025_AVAILABILITY_ACQUISITION_CAPABILITY_CONFIRMED_FOR_GOVERNED_EXECUTION_DESIGN") {
  process.exitCode = 2;
}
