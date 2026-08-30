import fs from "node:fs";
import zlib from "node:zlib";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  createSupabaseResearchRepositoryAdapter,
} from "../src/data/researchRepository/persistence/supabase/createSupabaseResearchRepositoryAdapter.js";

import {
  adaptNFLVerseInjuryRows,
} from "../src/data/footballIntelligence/nfl/availability/NFLVerseInjuryReportAdapter.js";

import {
  createNFLAvailabilityResearchBundle,
  createNFLAvailabilityResearchRepositoryService,
} from "../src/data/footballIntelligence/nfl/availability/research/index.js";

const season = Number(process.argv[2] || new Date().getFullYear());

if (!Number.isInteger(season)) {
  throw new Error("A valid NFL season is required.");
}

const supabaseUrl =
  process.env.RESEARCH_REPOSITORY_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  null;

const serviceRoleKey =
  process.env.RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  null;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Research Repository Supabase configuration is required. Set RESEARCH_REPOSITORY_SUPABASE_URL and RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY."
  );
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
const evidence = adaptNFLVerseInjuryRows(rows, {
  source: "nflverse-injury-reports",
  sourceUrl: downloaded.url,
});

if (!evidence.length) {
  console.log("Provider data produced zero canonical availability records.");
  console.log("Research Repository was not mutated.");
  process.exit(0);
}

const checkedAt = new Date().toISOString();
const bundle = createNFLAvailabilityResearchBundle(evidence, { checkedAt });

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const adapter = createSupabaseResearchRepositoryAdapter({
  supabase,
  options: {
    adapterName: "SUPABASE_RESEARCH_REPOSITORY_NFL_AVAILABILITY_ACQUISITION",
    allowSoftDelete: true,
    allowArchive: true,
    allowHardDelete: false,
  },
});

if (!adapter) {
  throw new Error("Supabase Research Repository adapter could not be created.");
}

const service = createNFLAvailabilityResearchRepositoryService({ adapter });
const result = await service.persistBundle(bundle);

console.log(`Canonical availability rows: ${evidence.length}`);
console.log(`Recorded observations built: ${bundle.summary.observationCount}`);
console.log(`Team/week evidence artifacts: ${bundle.summary.artifactCount}`);
console.log(`Research sessions: ${bundle.summary.sessionCount}`);
console.log(`Observation writes: ${result.observationWrites}`);
console.log(`Artifact writes: ${result.artifactWrites}`);
console.log(`Unchanged team/week artifacts: ${result.unchangedArtifacts}`);
console.log(`Persistence status: ${result.status}`);

if (result.failures.length) {
  console.error(JSON.stringify(result.failures, null, 2));
  process.exitCode = 1;
}
