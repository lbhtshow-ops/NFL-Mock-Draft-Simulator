import fs from "node:fs";
import path from "node:path";
import { materializeHistoricalObservedUsageDependency } from "../src/engines/teamIntelligence/dependency/research/NFLHistoricalPlayerTeamDependencyMaterializer.js";

const ROOT = "./data/calibration/historical/v1";
const OBS = `${ROOT}/historical-availability-impact-calibration-observations-v1.jsonl`;
const SNAPS = `${ROOT}/historical-snap-counts-resolved.jsonl`;
const STATS = "./src/data/footballIntelligence/nfl/rosters/sources/generatedNFLVersePlayerStatsSource.json";
const OUT = `${ROOT}/historical-observed-usage-dependency-v1.jsonl`;
const REPORT = `${ROOT}/historical-observed-usage-dependency-v1-report.json`;

const readJsonl = (file) => fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const observations = readJsonl(OBS);
const snapRows = readJsonl(SNAPS);
const playerStatRows = JSON.parse(fs.readFileSync(STATS, "utf8"));
const records = materializeHistoricalObservedUsageDependency({ observations, snapRows, playerStatRows });

const usageAvailable = records.filter((r) => r?.usageEvidence?.status === "AVAILABLE").length;
const dependencyAvailable = records.filter((r) => r?.teamDependencyEvidence?.status === "AVAILABLE").length;
const temporalViolations = records.filter((r) => r?.usageEvidence?.temporalSafe === false).length;
const targetOrFutureSafeguardViolations = records.filter((r) =>
  r?.safeguards?.targetWeekSnapEvidenceUsed || r?.safeguards?.futureSnapEvidenceUsed ||
  r?.safeguards?.targetWeekPlayerStatsUsed || r?.safeguards?.futurePlayerStatsUsed
).length;
const bySeason = {};
for (const row of records) {
  const season = String(row?.identity?.season ?? "UNKNOWN");
  bySeason[season] ||= { total: 0, usageAvailable: 0, dependencyAvailable: 0 };
  bySeason[season].total++;
  if (row?.usageEvidence?.status === "AVAILABLE") bySeason[season].usageAvailable++;
  if (row?.teamDependencyEvidence?.status === "AVAILABLE") bySeason[season].dependencyAvailable++;
}
const dependencyReasons = {};
for (const row of records) {
  const reason = row?.teamDependencyEvidence?.reason || "AVAILABLE";
  dependencyReasons[reason] = (dependencyReasons[reason] || 0) + 1;
}
const report = {
  contractVersion: "FIE-NFL-HISTORICAL-OBSERVED-USAGE-DEPENDENCY-MATERIALIZATION-REPORT-1.0.0",
  sprint: "2.21.0-RC1",
  mode: "RESEARCH_ONLY_TEMPORALLY_GOVERNED_MATERIALIZATION",
  source: { observations: observations.length, snapRows: snapRows.length, playerStatRows: playerStatRows.length },
  output: {
    records: records.length,
    usageAvailable,
    usageCoverage: records.length ? usageAvailable / records.length : 0,
    dependencyAvailable,
    dependencyCoverage: records.length ? dependencyAvailable / records.length : 0,
    bySeason,
    dependencyReasons,
  },
  temporalGovernance: {
    temporalViolations,
    targetOrFutureSafeguardViolations,
    targetWeekAndFutureEvidenceExcluded: temporalViolations === 0 && targetOrFutureSafeguardViolations === 0,
  },
  readiness: {
    historicalUsageMaterialized: usageAvailable > 0,
    historicalDependencyMaterialized: dependencyAvailable > 0,
    positionRoleDependencySensitivityMayRerun: usageAvailable > 0,
    fullPlayerImpactTransformationReadyForHoldout: false,
    calibrationAuthorized: false,
    productionImpactPolicyAuthorized: false,
  },
  safeguards: {
    sourceDatasetsMutated: false,
    productionCoefficientCreated: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemMutated: false,
    databaseMutated: false,
    shadowOnlyPreserved: true,
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
