import fs from "node:fs";
import zlib from "node:zlib";

import pg from "pg";

import {
  createPostgresResearchRepositoryAdapter,
} from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";

const { Pool } = pg;

import {
  adaptNFLVerseInjuryRows,
} from "../src/data/footballIntelligence/nfl/availability/NFLVerseInjuryReportAdapter.js";

import {
  createNFLAvailabilityResearchBundle,
  createNFLAvailabilityResearchRepositoryService,
} from "../src/data/footballIntelligence/nfl/availability/research/index.js";

const args = process.argv.slice(2);
const positionalSeason = args.find((arg) => /^\d{4}$/.test(arg));
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] ?? null : null;
};

const season = Number(valueAfter("--season") || positionalSeason || new Date().getFullYear());
const requestedWeek = valueAfter("--week") == null ? null : Number(valueAfter("--week"));
const requestedTeam = valueAfter("--team")?.trim().toUpperCase() || null;
const dryRun = args.includes("--dry-run");
const executeWrite = args.includes("--execute-write");

if (!Number.isInteger(season)) throw new Error("A valid NFL season is required.");
if (requestedWeek != null && (!Number.isInteger(requestedWeek) || requestedWeek < 1)) {
  throw new Error("--week must be a positive integer.");
}
if (requestedTeam != null && !/^[A-Z]{2,3}$/.test(requestedTeam)) {
  throw new Error("--team must be an NFL abbreviation such as BAL.");
}
if (!dryRun && !executeWrite) {
  throw new Error("Refusing persistence without explicit --execute-write. Use --dry-run first.");
}
if (executeWrite && (requestedWeek == null || requestedTeam == null)) {
  throw new Error("Controlled first-write mode requires both --week and --team.");
}

const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL || null;

if (!dryRun && !databaseUrl) {
  throw new Error(
    "Research Repository PostgreSQL configuration is required for writes. Set only RESEARCH_REPOSITORY_DATABASE_URL."
  );
}

function validateDatabaseUrl(value) {
  if (!value) return null;
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error("RESEARCH_REPOSITORY_DATABASE_URL must be a valid PostgreSQL connection URL."); }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) throw new Error("RESEARCH_REPOSITORY_DATABASE_URL must use postgres:// or postgresql://.");
  if (!parsed.hostname || !parsed.username) throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is incomplete.");
  return value;
}

const validatedDatabaseUrl = dryRun ? null : validateDatabaseUrl(databaseUrl);

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
    try {
      response = await fetch(url);
    } catch {
      continue;
    }
    if (!response.ok) continue;
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = url.endsWith(".gz")
      ? zlib.gunzipSync(buffer).toString("utf8")
      : buffer.toString("utf8");
    return { url, text };
  }

  return null;
}

const downloaded = await download();

if (!downloaded) {
  console.log(`No ${season} nflverse injury-report asset is currently available.`);
  console.log("Research Repository was not mutated.");
  process.exit(0);
}

const rows = parseCSV(downloaded.text);
const allEvidence = adaptNFLVerseInjuryRows(rows, {
  source: "nflverse-injury-reports",
  sourceUrl: downloaded.url,
});

const evidence = allEvidence.filter((record) =>
  (requestedWeek == null || record.week === requestedWeek) &&
  (requestedTeam == null || record.team === requestedTeam)
);

if (!evidence.length) {
  console.log("Provider data produced zero canonical availability records.");
  console.log("Research Repository was not mutated.");
  process.exit(0);
}

const checkedAt = new Date().toISOString();
const bundle = createNFLAvailabilityResearchBundle(evidence, { checkedAt });

console.log(`Selected scope: season=${season}, week=${requestedWeek ?? "ALL"}, team=${requestedTeam ?? "ALL"}`);
console.log(`Canonical availability rows selected: ${evidence.length}`);
console.log(`Recorded observations built: ${bundle.summary.observationCount}`);
console.log(`Team/week evidence artifacts: ${bundle.summary.artifactCount}`);
console.log(`Research sessions: ${bundle.summary.sessionCount}`);

if (dryRun) {
  console.log("DRY RUN COMPLETE — Research Repository was not mutated.");
  process.exit(0);
}

const pool = new Pool({
  connectionString: validatedDatabaseUrl,
  max: 4,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  application_name: "lbht-fie-research-repository-acquisition",
});

let adapter;
try {
  const preflight = await pool.query("select current_database() as database_name, current_schema() as schema_name");
  console.log(`PostgreSQL preflight: connected database=${preflight.rows[0]?.database_name ?? "unknown"}`);
  adapter = createPostgresResearchRepositoryAdapter({
    pool,
    options: { allowSoftDelete: true, allowArchive: true, allowHardDelete: false },
  });
  if (!adapter) throw new Error("PostgreSQL Research Repository adapter could not be created.");
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  const result = await service.persistBundle(bundle);

  console.log(`Observation writes: ${result.observationWrites}`);
  console.log(`Artifact writes: ${result.artifactWrites}`);
  console.log(`Unchanged team/week artifacts: ${result.unchangedArtifacts}`);
  console.log(`Persistence status: ${result.status}`);

  if (result.failures.length) {
    console.error(JSON.stringify(result.failures, null, 2));
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}

