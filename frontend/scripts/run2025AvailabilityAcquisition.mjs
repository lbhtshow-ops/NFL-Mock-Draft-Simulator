#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import https from "node:https";
import zlib from "node:zlib";

const SPRINT = "2.18.23-RC13";
const CONTRACT_VERSION = "FIE-NFL-2025-AVAILABILITY-ACQUISITION-EXECUTION-REPORT-1.0.0";
const SEASON = 2025;
const PROVIDER = "nflverse";
const DATASET = "injuries";
const PRIMARY_URL = "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2025.csv";
const FALLBACK_URL = "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2025.csv.gz";
const OUTPUT_DIR = path.resolve("data/calibration/historical/v1/acquisition");
const RAW_OUTPUT = path.join(OUTPUT_DIR, "nflverse-injuries-2025.csv");
const REPORT_OUTPUT = path.join(OUTPUT_DIR, "nflverse-injuries-2025-acquisition-report.json");

const executeFetch = process.argv.includes("--execute-fetch");

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("Too many redirects"));
    const req = https.get(url, {
      headers: {
        "User-Agent": "LBHT-FIE-Governed-Acquisition/1.0",
        "Accept": "text/csv,application/gzip,application/octet-stream,*/*"
      }
    }, (res) => {
      const status = res.statusCode ?? 0;
      if ([301,302,303,307,308].includes(status) && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        resolve(fetchBuffer(next, redirects + 1));
        return;
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve({
        status,
        headers: res.headers,
        body: Buffer.concat(chunks),
        finalUrl: url
      }));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("Fetch timeout")));
  });
}

function parseCsvLine(line) {
  const out = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i+1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function normalizeHeader(s) {
  return String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function findHeader(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = norm.indexOf(normalizeHeader(c));
    if (idx >= 0) return { index: idx, actual: headers[idx] };
  }
  return { index: -1, actual: null };
}

function inspectCsv(csvText) {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(x => x.length > 0);
  if (lines.length < 2) throw new Error("Source content has no data rows.");
  const headers = parseCsvLine(lines[0]);
  const aliases = {
    season: ["season"],
    week: ["week"],
    team: ["team", "team_abbr"],
    playerId: ["gsis_id", "player_id", "playerid"],
    reportStatus: ["report_status", "reportstatus"],
    practiceStatus: ["practice_status", "practicestatus"],
    primaryInjury: ["report_primary_injury", "primary_injury", "injury"],
    dateModified: ["date_modified", "datemodified"]
  };
  const resolved = Object.fromEntries(
    Object.entries(aliases).map(([k,v]) => [k, findHeader(headers, v)])
  );
  const missing = Object.entries(resolved).filter(([,v]) => v.index < 0).map(([k]) => k);

  const schemaDiscovery = {
    headers,
    normalizedHeaders: headers.map(normalizeHeader),
    temporalCandidateHeaders: headers.filter(h =>
      /(date|time|modified|updated|report|practice|game|week)/i.test(String(h))
    ),
    identityCandidateHeaders: headers.filter(h =>
      /(season|week|team|club|player|gsis|id|name|position)/i.test(String(h))
    ),
    statusCandidateHeaders: headers.filter(h =>
      /(status|injury|report|practice|designation)/i.test(String(h))
    ),
    resolvedColumns: resolved,
    missingRequiredFields: missing
  };

  if (missing.length) {
    const err = new Error(`Required source columns missing: ${missing.join(", ")}`);
    err.code = "SOURCE_SCHEMA_MISMATCH";
    err.schemaDiscovery = schemaDiscovery;
    throw err;
  }

  const counts = {
    rows: 0, season2025: 0, withPlayerId: 0, withReportStatus: 0,
    withPracticeStatus: 0, withPrimaryInjury: 0, withDateModified: 0,
    withWeek: 0, withTeam: 0,
    statuses: { OUT: 0, DOUBTFUL: 0, QUESTIONABLE: 0, NOTE: 0, OTHER: 0 }
  };

  for (let i=1; i<lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    counts.rows++;
    const val = key => String(row[resolved[key].index] ?? "").trim();
    if (val("season") === "2025") counts.season2025++;
    if (val("playerId")) counts.withPlayerId++;
    const rs = val("reportStatus").toUpperCase();
    if (rs) {
      counts.withReportStatus++;
      if (Object.hasOwn(counts.statuses, rs)) counts.statuses[rs]++;
      else counts.statuses.OTHER++;
    }
    if (val("practiceStatus")) counts.withPracticeStatus++;
    if (val("primaryInjury")) counts.withPrimaryInjury++;
    if (val("dateModified")) counts.withDateModified++;
    if (val("week")) counts.withWeek++;
    if (val("team")) counts.withTeam++;
  }
  return { headers, resolvedColumns: resolved, coverage: counts };
}

async function acquire() {
  let first = await fetchBuffer(PRIMARY_URL);
  if (first.status >= 200 && first.status < 300 && first.body.length > 0) {
    return { ...first, format: "CSV", sourceUrl: PRIMARY_URL, csv: first.body };
  }
  let second = await fetchBuffer(FALLBACK_URL);
  if (!(second.status >= 200 && second.status < 300) || second.body.length === 0) {
    throw new Error(`Acquisition failed. CSV HTTP=${first.status}; CSV.GZ HTTP=${second.status}`);
  }
  return { ...second, format: "CSV_GZ", sourceUrl: FALLBACK_URL, csv: zlib.gunzipSync(second.body) };
}

const base = {
  contractVersion: CONTRACT_VERSION,
  sprint: SPRINT,
  scope: { season: SEASON, provider: PROVIDER, dataset: DATASET },
  permittedSourceUrls: [PRIMARY_URL, FALLBACK_URL],
  mode: executeFetch ? "EXECUTE_FETCH" : "DRY_RUN",
  authorizationBoundary: {
    externalFetchAuthorizedByExplicitFlag: executeFetch,
    rawAcquisitionArtifactWriteAuthorized: executeFetch,
    normalizationAuthorized: false,
    treatmentConstructionAuthorized: false,
    controlConstructionAuthorized: false,
    matchingAuthorized: false,
    attEstimationAuthorized: false,
    uncertaintyEstimationAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
    databaseWriteAuthorized: false
  }
};

if (!executeFetch) {
  console.log(JSON.stringify({
    ...base,
    decision: "DRY_RUN_FETCH_NOT_EXECUTED",
    plannedAcquisition: {
      primaryUrl: PRIMARY_URL,
      fallbackUrl: FALLBACK_URL,
      rawOutput: RAW_OUTPUT,
      reportOutput: REPORT_OUTPUT
    },
    safeguards: {
      externalNetworkInvoked: false,
      repositoryFilesMutated: false,
      databaseMutated: false,
      normalizationExecuted: false,
      matchingExecuted: false,
      attEstimated: false,
      calibrationExecuted: false,
      pickemScoringMutated: false
    }
  }, null, 2));
  process.exit(0);
}

try {
  const acquired = await acquire();
  const csvText = acquired.csv.toString("utf8");
  const inspection = inspectCsv(csvText);
  if (inspection.coverage.season2025 === 0) throw new Error("Fetched artifact contains no 2025 rows.");

  const hash = crypto.createHash("sha256").update(acquired.csv).digest("hex");
  const timestamp = new Date().toISOString();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(RAW_OUTPUT, acquired.csv);

  const report = {
    ...base,
    decision: "GOVERNED_2025_AVAILABILITY_RAW_ACQUISITION_COMPLETE",
    acquisition: {
      sourceUrl: acquired.sourceUrl,
      sourceFormat: acquired.format,
      httpStatus: acquired.status,
      sourceContentBytes: acquired.csv.length,
      sourceContentSha256: hash,
      acquisitionTimestamp: timestamp,
      rawArtifact: RAW_OUTPUT
    },
    schemaInspection: inspection,
    downstream: {
      normalizedArtifactCreated: false,
      treatmentConstructed: false,
      controlsConstructed: false,
      matchingExecuted: false,
      attEstimated: false,
      uncertaintyEstimated: false
    },
    safeguards: {
      externalNetworkInvoked: true,
      rawAcquisitionArtifactCreated: true,
      normalizationExecuted: false,
      databaseMutated: false,
      matchingExecuted: false,
      attEstimated: false,
      calibrationExecuted: false,
      teamStrengthMutated: false,
      decisionModelMutated: false,
      pickemScoringMutated: false
    }
  };
  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, report: REPORT_OUTPUT }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ...base,
    decision: "ACQUISITION_REJECTED_FAIL_CLOSED",
    error: String(error?.message ?? error),
    errorCode: error?.code ?? null,
    schemaDiscovery: error?.schemaDiscovery ?? null,
    nextStep:
      error?.code === "SOURCE_SCHEMA_MISMATCH"
        ? "REVIEW_ACTUAL_2025_SOURCE_SCHEMA_BEFORE_AMENDING_TEMPORAL_QUALIFICATION_CONTRACT"
        : "REVIEW_ACQUISITION_FAILURE_BEFORE_RETRY",
    safeguards: {
      normalizationExecuted: false,
      databaseMutated: false,
      matchingExecuted: false,
      attEstimated: false,
      calibrationExecuted: false,
      pickemScoringMutated: false
    }
  }, null, 2));
  process.exitCode = 1;
}
