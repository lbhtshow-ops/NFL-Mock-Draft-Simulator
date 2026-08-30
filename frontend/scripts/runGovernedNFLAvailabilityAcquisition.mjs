import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import pg from "pg";

import {
  createPostgresResearchRepositoryAdapter,
} from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";

import {
  adaptNFLVerseInjuryRows,
} from "../src/data/footballIntelligence/nfl/availability/NFLVerseInjuryReportAdapter.js";

import {
  createNFLAvailabilityAcquisitionPlan,
  createNFLAvailabilityResearchBundle,
  createNFLAvailabilityResearchRepositoryService,
  summarizeNFLAvailabilityAcquisitionResult,
} from "../src/data/footballIntelligence/nfl/availability/research/index.js";

const { Pool } = pg;
const args = process.argv.slice(2);

function valuesAfter(flag) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
    }
  }
  return values;
}

function valueAfter(flag) {
  const values = valuesAfter(flag);
  return values.length ? values[values.length - 1] : null;
}

function parseTeams() {
  return [...new Set([
    ...valuesAfter("--team"),
    ...valuesAfter("--teams").flatMap((value) => String(value).split(",")),
  ].map((value) => String(value).trim().toUpperCase()).filter(Boolean))];
}

const season = Number(valueAfter("--season") || new Date().getFullYear());
const week = Number(valueAfter("--week"));
const explicitTeams = parseTeams();
const allTeams = args.includes("--all-teams");
const dryRun = args.includes("--dry-run");
const executeWrite = args.includes("--execute-write");
const maxTeamsRaw = valueAfter("--max-teams");
const maxTeams = maxTeamsRaw == null ? null : Number(maxTeamsRaw);
const reportFile = valueAfter("--report-file");

if (!Number.isInteger(season)) throw new Error("A valid --season is required.");
if (!Number.isInteger(week) || week < 1) {
  throw new Error("A positive --week is required for governed acquisition.");
}
if (dryRun === executeWrite) {
  throw new Error("Choose exactly one mode: --dry-run or --execute-write.");
}
if (allTeams && explicitTeams.length) {
  throw new Error("Use either --all-teams or explicit --team/--teams, not both.");
}
if (!allTeams && explicitTeams.length === 0) {
  throw new Error("Select --all-teams or at least one --team/--teams value.");
}
if (maxTeams != null && (!Number.isInteger(maxTeams) || maxTeams < 1)) {
  throw new Error("--max-teams must be a positive integer.");
}

const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL || null;
if (executeWrite && !databaseUrl) {
  throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required for writes.");
}

function validateDatabaseUrl(value) {
  if (!value) return null;
  let parsed;
  try { parsed = new URL(value); }
  catch { throw new Error("RESEARCH_REPOSITORY_DATABASE_URL must be a valid PostgreSQL connection URL."); }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("RESEARCH_REPOSITORY_DATABASE_URL must use postgres:// or postgresql://.");
  }
  if (!parsed.hostname || !parsed.username) {
    throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is incomplete.");
  }
  return value;
}

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const next = line[index + 1];
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? null;
      return record;
    }, {});
  });
}

async function download() {
  const candidates = [
    `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${season}.csv`,
    `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${season}.csv.gz`,
  ];
  for (const url of candidates) {
    console.log(`Trying ${url}`);
    let response;
    try { response = await fetch(url); }
    catch { continue; }
    if (!response.ok) continue;
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      url,
      text: url.endsWith(".gz")
        ? zlib.gunzipSync(buffer).toString("utf8")
        : buffer.toString("utf8"),
    };
  }
  return null;
}

function writeReport(report) {
  if (!reportFile) return;
  const outputPath = path.resolve(process.cwd(), reportFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

const startedAt = new Date().toISOString();
const downloaded = await download();

if (!downloaded) {
  const report = {
    contract: "NFLAvailabilityAcquisitionRunReport",
    version: "1.0.0",
    mode: dryRun ? "DRY_RUN" : "EXECUTE_WRITE",
    season,
    week,
    selectedTeams: allTeams ? ["ALL"] : explicitTeams,
    sourceUrl: null,
    counts: {
      canonicalRecords: 0, observations: 0, artifacts: 0, sessions: 0,
      observationWrites: 0, artifactWrites: 0, sessionWrites: 0,
      unchangedArtifacts: 0, failures: 0,
    },
    teamResults: [],
    persistenceStatus: "SOURCE_UNAVAILABLE",
    startedAt,
    completedAt: new Date().toISOString(),
  };
  console.log(`No ${season} nflverse injury-report asset is currently available.`);
  console.log("Research Repository was not mutated.");
  console.log(JSON.stringify(report, null, 2));
  writeReport(report);
  process.exit(0);
}

const rows = parseCSV(downloaded.text);
const allEvidence = adaptNFLVerseInjuryRows(rows, {
  source: "nflverse-injury-reports",
  sourceUrl: downloaded.url,
});

const plan = createNFLAvailabilityAcquisitionPlan(allEvidence, {
  season,
  week,
  teams: explicitTeams,
  allTeams,
  maxTeams,
});

if (plan.missingTeams.length) {
  console.log(`Missing requested teams: ${plan.missingTeams.join(", ")}`);
}
if (!plan.recordCount) {
  console.log("Provider data produced zero canonical records for the selected scope.");
  console.log("Research Repository was not mutated.");
  process.exit(0);
}

const checkedAt = new Date().toISOString();
const bundle = createNFLAvailabilityResearchBundle(plan.selectedRecords, { checkedAt });

console.log(`Selected scope: season=${season}, week=${week}, teams=${plan.selectedTeams.join(",")}`);
console.log(`Canonical availability rows selected: ${bundle.summary.recordCount}`);
console.log(`Recorded observations built: ${bundle.summary.observationCount}`);
console.log(`Team/week evidence artifacts: ${bundle.summary.artifactCount}`);
console.log(`Research sessions: ${bundle.summary.sessionCount}`);

if (dryRun) {
  const report = summarizeNFLAvailabilityAcquisitionResult({
    plan, bundle, sourceUrl: downloaded.url, mode: "DRY_RUN", startedAt,
  });
  console.log("DRY RUN COMPLETE — Research Repository was not mutated.");
  console.log(JSON.stringify(report, null, 2));
  writeReport(report);
  process.exit(0);
}

const pool = new Pool({
  connectionString: validateDatabaseUrl(databaseUrl),
  max: 4,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  application_name: "lbht-fie-governed-availability-acquisition",
});

try {
  const preflight = await pool.query(`
    select
      current_database() as database_name,
      current_schema() as schema_name,
      to_regclass('public.research_sources') as research_sources,
      to_regclass('public.research_sessions') as research_sessions,
      to_regclass('public.recorded_observations') as recorded_observations,
      to_regclass('public.evidence_artifacts') as evidence_artifacts
  `);
  const state = preflight.rows[0] || {};
  const requiredTables = ["research_sources", "research_sessions", "recorded_observations", "evidence_artifacts"];
  const missingTables = requiredTables.filter((name) => !state[name]);
  if (missingTables.length) {
    throw new Error(`Research Repository PostgreSQL preflight failed. Missing tables: ${missingTables.join(", ")}`);
  }

  console.log(`PostgreSQL preflight: connected database=${state.database_name ?? "unknown"}`);

  const adapter = createPostgresResearchRepositoryAdapter({
    pool,
    options: { allowSoftDelete: true, allowArchive: true, allowHardDelete: false },
  });
  if (!adapter) throw new Error("PostgreSQL Research Repository adapter could not be created.");

  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  const result = await service.persistBundle(bundle);

  const report = summarizeNFLAvailabilityAcquisitionResult({
    plan, bundle, persistence: result, sourceUrl: downloaded.url,
    mode: "EXECUTE_WRITE", startedAt,
  });

  console.log(`Observation writes: ${result.observationWrites}`);
  console.log(`Artifact writes: ${result.artifactWrites}`);
  console.log(`Session writes: ${result.sessionWrites}`);
  console.log(`Unchanged team/week artifacts: ${result.unchangedArtifacts}`);
  console.log(`Persistence status: ${result.status}`);
  for (const teamResult of result.teamResults) {
    console.log(`Team ${teamResult.team || "UNKNOWN"}: ${teamResult.status}`);
  }
  console.log(JSON.stringify(report, null, 2));
  writeReport(report);

  if (result.failures.length) process.exitCode = 1;
} finally {
  await pool.end();
}
