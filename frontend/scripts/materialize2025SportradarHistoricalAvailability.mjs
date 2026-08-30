#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  createNFLHistoricalSportradarAcquisitionClient,
} from "../src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarAcquisition.js";
import {
  getNFLHistoricalSportradarMaterializationGovernance,
  materializeNFLHistoricalSportradarWeek,
  NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS,
  qualifyNFLHistoricalSportradarMaterialization,
} from "../src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarAvailabilityMaterializer.js";
import {
  buildNFLHistoricalSportradarGsisCrosswalk,
} from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : fallback;
}
const hasFlag = (name) => process.argv.includes(name);
const clean = (value) => typeof value === "string" && value.trim() ? value.trim() : null;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ""; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).filter((r) => r.some((v) => v !== "")).map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]))
  );
}

function loadCrosswalkRows(rawDir, seasons) {
  const rows = [];
  const sourceFiles = [];
  for (const season of seasons) {
    const file = path.join(rawDir, `roster_weekly_${season}.csv`);
    if (!fs.existsSync(file)) continue;
    const parsed = parseCsv(fs.readFileSync(file, "utf8"));
    const usable = parsed.filter((r) => clean(r.gsis_id) && clean(r.sportradar_id));
    rows.push(...usable);
    sourceFiles.push({ season, file, rowCount: parsed.length, crosswalkRowCount: usable.length });
  }
  return { rows, sourceFiles };
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function toCsv(rows) {
  const header = NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS.join(",");
  const lines = rows.map((row) =>
    NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS.map((column) => csvCell(row[column])).join(",")
  );
  return `${header}\n${lines.join("\n")}${lines.length ? "\n" : ""}`;
}
function duplicateRate(rows) {
  const seen = new Set();
  let duplicates = 0;
  for (const row of rows) {
    const key = [row.gsis_id, row.week, row.team, row.report_status, row.practice_status, row.date_modified].join("|");
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  }
  return rows.length ? duplicates / rows.length : 0;
}

const season = Number(arg("--season", "2025"));
const startWeek = Number(arg("--start-week", "1"));
const endWeek = Number(arg("--end-week", "18"));
const gameType = String(arg("--game-type", "REG")).toUpperCase();
const rawDir = path.resolve(arg("--raw-dir", "data/calibration/historical/v1/raw"));
const outputDir = path.resolve(arg("--output-dir", "data/calibration/historical/v1/materialized"));
const executeWrite = hasFlag("--execute-write");
if (!Number.isInteger(season) || !Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) {
  throw new Error("Invalid season/week arguments.");
}
if (season !== 2025) throw new Error("Sprint 2C.3 materialization is scoped to season 2025 only.");

const crosswalkSource = loadCrosswalkRows(rawDir, [2022, 2023, 2024, 2025]);
const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk(crosswalkSource.rows);
if (!crosswalk.resolvedCount || crosswalk.conflictCount) {
  throw new Error(`SPORTRADAR_GSIS_CROSSWALK_NOT_READY:resolved=${crosswalk.resolvedCount}:conflicts=${crosswalk.conflictCount}`);
}

const client = createNFLHistoricalSportradarAcquisitionClient();
const rows = [];
const quarantined = [];
const weekStats = [];
let sourceRecordCount = 0;
let sourceRecordsWithInjuryStatusDate = 0;
let kickoffResolvedRecords = 0;
let safePriorCalendarDateRecords = 0;
let exactIdentityResolvedRecords = 0;

for (let week = startWeek; week <= endWeek; week++) {
  console.error(`[2C.3 materialization] week ${week}/${endWeek}`);
  const acquired = await client.acquireWeek({ season, week, gameType });
  const result = materializeNFLHistoricalSportradarWeek({
    season,
    week,
    gameType,
    injuryPayload: acquired.injuryPayload,
    schedulePayload: acquired.schedulePayload,
    injuryUrl: acquired.injuryUrl,
    crosswalk,
  });
  rows.push(...result.rows);
  quarantined.push(...result.quarantined);
  sourceRecordCount += result.sourceMetrics.sourceRecordCount;
  sourceRecordsWithInjuryStatusDate += result.sourceMetrics.recordsWithInjuryStatusDate;
  kickoffResolvedRecords += result.sourceMetrics.kickoffResolvedRecords;
  safePriorCalendarDateRecords += result.sourceMetrics.safePriorCalendarDateRecords;
  exactIdentityResolvedRecords += result.sourceMetrics.exactIdentityResolvedRecords;
  weekStats.push({
    week,
    sourceRecordCount: result.sourceMetrics.sourceRecordCount,
    canonicalRowCount: result.rows.length,
    quarantineCount: result.quarantined.length,
    classificationCounts: result.sourceMetrics.classificationCounts,
  });
}

const dupRate = duplicateRate(rows);
const qualification = qualifyNFLHistoricalSportradarMaterialization({
  season,
  sourceRecordCount,
  canonicalRows: rows,
  sourceRecordsWithInjuryStatusDate,
  kickoffResolvedRecords,
  safePriorCalendarDateRecords,
  duplicateRate: dupRate,
});
const governance = getNFLHistoricalSportradarMaterializationGovernance();
const canonicalArtifactEligible = qualification.qualifiedForJoin === true;
const decision = canonicalArtifactEligible
  ? executeWrite
    ? "QUALIFIED_CANONICAL_2025_SPORTRADAR_HISTORICAL_AVAILABILITY_WRITTEN"
    : "QUALIFIED_CANONICAL_2025_SPORTRADAR_HISTORICAL_AVAILABILITY_DRY_RUN"
  : "2025_SPORTRADAR_HISTORICAL_AVAILABILITY_NOT_QUALIFIED_CANONICAL_ARTIFACT_BLOCKED";

const report = {
  contractVersion: "FIE-NFL-2025-SPORTRADAR-HISTORICAL-MATERIALIZATION-REPORT-1.0.0",
  sprint: "2C.3",
  mode: executeWrite ? "EXPLICIT_WRITE" : "DRY_RUN_READ_ONLY",
  scope: { season, gameType, startWeek, endWeek },
  decision,
  crosswalk: {
    resolvedCount: crosswalk.resolvedCount,
    conflictCount: crosswalk.conflictCount,
    sourceFiles: crosswalkSource.sourceFiles,
  },
  totals: {
    sourceRecordCount,
    sourceRecordsWithInjuryStatusDate,
    kickoffResolvedRecords,
    exactIdentityResolvedRecords,
    safePriorCalendarDateRecords,
    canonicalRowCount: rows.length,
    quarantineCount: quarantined.length,
    duplicateRate: dupRate,
  },
  qualification,
  weekStats,
  governance,
  safeguards: {
    exactGsisIdentityOnly: true,
    nameFallbackUsed: false,
    fuzzyMatchingUsed: false,
    sameDayEvidenceAccepted: false,
    acquisitionTimeSubstitutedForSourceTime: false,
    treatmentControlRebuildPerformed: false,
    matchingPerformed: false,
    attRecomputed: false,
    uncertaintyRecomputed: false,
    calibrationPerformed: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemMutated: false,
    databaseMutated: false,
  },
};

if (executeWrite) {
  fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, "sportradar-historical-availability-2025-materialization-report.json");
  const quarantinePath = path.join(outputDir, "sportradar-historical-availability-2025-quarantine.jsonl");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    quarantinePath,
    quarantined.map((row) => JSON.stringify(row)).join("\n") + (quarantined.length ? "\n" : ""),
    "utf8"
  );
  if (canonicalArtifactEligible) {
    const csvPath = path.join(outputDir, "sportradar-historical-availability-2025.csv");
    fs.writeFileSync(csvPath, toCsv(rows), "utf8");
  }
}

console.log(JSON.stringify(report, null, 2));
if (!canonicalArtifactEligible) process.exitCode = 2;
