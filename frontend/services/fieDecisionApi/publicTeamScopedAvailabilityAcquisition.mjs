import {
  adaptNFLVerseCurrentDepthChartRows,
  adaptNFLVerseCurrentRosterRows,
} from "../../src/data/footballIntelligence/nfl/availability/providers/nflverse/NFLVerseCurrentRosterDepthAdapter.js";

export const NFLVERSE_CURRENT_ROSTER_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv";

export const NFLVERSE_CURRENT_DEPTH_CHART_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_2026.csv";

const DATASET_CACHE = new Map();
const DEFAULT_DATASET_TTL_MS = 15 * 60 * 1000;

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function normalize(value) {
  return String(value ?? "").trim();
}

function upper(value) {
  return normalize(value).toUpperCase();
}

function buildHeaderIndex(headers) {
  const index = new Map();
  headers.forEach((header, i) => index.set(header, i));
  return index;
}

function field(values, index, name) {
  const i = index.get(name);
  return i === undefined ? "" : (values[i] ?? "");
}

function materializeRow(headers, values) {
  return Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));
}

async function streamCsv(url, { fetchImpl = fetch, onHeaders, onValues } = {}) {
  const response = await fetchImpl(url, {
    redirect: "follow",
    headers: {
      "user-agent": "LBHT-FIE-Public-Team/1.0",
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`NFLVERSE_HTTP_${response.status}:${url}`);
  }
  if (!response.body || typeof response.body.getReader !== "function") {
    throw new Error(`NFLVERSE_STREAM_UNAVAILABLE:${url}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let headers = null;
  let index = null;

  const consumeLine = (rawLine) => {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line.trim()) return;

    const values = parseCsvLine(line);
    if (!headers) {
      headers = values;
      index = buildHeaderIndex(headers);
      onHeaders?.(headers, index);
      return;
    }
    onValues?.(values, headers, index);
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        consumeLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
      }
    }

    buffer += decoder.decode();
    if (buffer.length) consumeLine(buffer);
  } finally {
    reader.releaseLock?.();
  }

  if (!headers) {
    throw new Error(`NFLVERSE_EMPTY_CSV:${url}`);
  }

  return {
    sourceUrl: url,
    transportUrl: response.url || url,
  };
}

async function loadRosterDataset({ season, week, gameType, rosterUrl, fetchImpl }) {
  const rows = [];
  const targetSeason = String(season);
  const targetWeek = String(week);
  const targetGameType = upper(gameType);

  const provenance = await streamCsv(rosterUrl, {
    fetchImpl,
    onValues(values, headers, index) {
      if (
        normalize(field(values, index, "season")) !== targetSeason ||
        normalize(field(values, index, "week")) !== targetWeek ||
        upper(field(values, index, "game_type")) !== targetGameType
      ) return;

      rows.push(materializeRow(headers, values));
    },
  });

  return { ...provenance, rows };
}

async function loadDepthDataset({ depthUrl, fetchImpl }) {
  const latestByTeam = new Map();
  const timestampsByTeam = new Map();

  const provenance = await streamCsv(depthUrl, {
    fetchImpl,
    onValues(values, headers, index) {
      const team = upper(field(values, index, "team"));
      const timestamp = normalize(field(values, index, "dt"));
      if (!team || !timestamp) return;

      let seen = timestampsByTeam.get(team);
      if (!seen) {
        seen = new Set();
        timestampsByTeam.set(team, seen);
      }
      seen.add(timestamp);

      const current = latestByTeam.get(team);
      if (!current || timestamp > current.latestTimestamp) {
        latestByTeam.set(team, {
          latestTimestamp: timestamp,
          rows: [materializeRow(headers, values)],
        });
      } else if (timestamp === current.latestTimestamp) {
        current.rows.push(materializeRow(headers, values));
      }
    },
  });

  return { ...provenance, latestByTeam, timestampsByTeam };
}

async function loadScopedDatasets({
  season = 2026,
  week,
  gameType = "REG",
  rosterUrl = NFLVERSE_CURRENT_ROSTER_URL,
  depthUrl = NFLVERSE_CURRENT_DEPTH_CHART_URL,
  fetchImpl = fetch,
  ttlMs = Number(process.env.FIE_PUBLIC_TEAM_CACHE_TTL_MS || DEFAULT_DATASET_TTL_MS),
} = {}) {
  const normalizedWeek = Number(week);
  if (!Number.isInteger(normalizedWeek)) throw new Error("integer week is required.");

  const key = `${season}|${normalizedWeek}|${upper(gameType)}|${rosterUrl}|${depthUrl}`;
  const now = Date.now();
  const cached = DATASET_CACHE.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  // Sequential by design: never hold two full provider response bodies at once.
  const roster = await loadRosterDataset({
    season: Number(season),
    week: normalizedWeek,
    gameType,
    rosterUrl,
    fetchImpl,
  });
  const depth = await loadDepthDataset({ depthUrl, fetchImpl });

  const value = Object.freeze({ roster, depth });
  DATASET_CACHE.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

export async function acquireNFLVerseCurrentRosterDepthSignals({
  season = 2026,
  week,
  gameType = "REG",
  team,
  observedAt = new Date().toISOString(),
  rosterUrl = NFLVERSE_CURRENT_ROSTER_URL,
  depthUrl = NFLVERSE_CURRENT_DEPTH_CHART_URL,
  fetchImpl = fetch,
  ttlMs,
} = {}) {
  const normalizedTeam = upper(team);
  const normalizedWeek = Number(week);
  const normalizedGameType = upper(gameType) || "REG";
  if (!normalizedTeam) throw new Error("team is required.");
  if (!Number.isInteger(normalizedWeek)) throw new Error("integer week is required.");

  const datasets = await loadScopedDatasets({
    season: Number(season),
    week: normalizedWeek,
    gameType: normalizedGameType,
    rosterUrl,
    depthUrl,
    fetchImpl,
    ttlMs,
  });

  const rosterRows = datasets.roster.rows.filter(
    (row) => upper(row?.team) === normalizedTeam
  );
  const depthEntry = datasets.depth.latestByTeam.get(normalizedTeam) || null;
  const depthRows = depthEntry?.rows || [];

  const rosterSignals = adaptNFLVerseCurrentRosterRows(rosterRows, {
    season: Number(season),
    week: normalizedWeek,
    gameType: normalizedGameType,
    team: normalizedTeam,
    observedAt,
    sourceUrl: datasets.roster.sourceUrl,
  });
  const depthSignals = adaptNFLVerseCurrentDepthChartRows(depthRows, {
    season: Number(season),
    week: normalizedWeek,
    gameType: normalizedGameType,
    team: normalizedTeam,
    sourceUrl: datasets.depth.sourceUrl,
  });

  const roster = Object.freeze({
    contract: "NFLVerseCurrentRosterAcquisitionResult",
    version: "1.0.0",
    sourceUrl: datasets.roster.sourceUrl,
    transportUrl: datasets.roster.transportUrl,
    scope: Object.freeze({
      season: Number(season),
      week: normalizedWeek,
      gameType: normalizedGameType,
      team: normalizedTeam,
    }),
    rowCount: rosterRows.length,
    signalCount: rosterSignals.length,
    rows: Object.freeze(rosterRows),
    signals: Object.freeze(rosterSignals),
  });

  const snapshotCount = datasets.depth.timestampsByTeam.get(normalizedTeam)?.size || 0;
  const depth = Object.freeze({
    contract: "NFLVerseCurrentDepthAcquisitionResult",
    version: "1.0.0",
    sourceUrl: datasets.depth.sourceUrl,
    transportUrl: datasets.depth.transportUrl,
    scope: roster.scope,
    snapshotCount,
    latestTimestamp: depthEntry?.latestTimestamp || null,
    rowCount: depthRows.length,
    signalCount: depthSignals.length,
    rows: Object.freeze(depthRows),
    signals: Object.freeze(depthSignals),
  });

  return Object.freeze({
    contract: "NFLVerseCurrentRosterDepthAcquisitionResult",
    version: "1.0.0",
    scope: roster.scope,
    roster,
    depth,
    signals: Object.freeze([...rosterSignals, ...depthSignals]),
  });
}

export function clearPublicNFLVerseDatasetCache() {
  DATASET_CACHE.clear();
}

export default { acquireNFLVerseCurrentRosterDepthSignals, clearPublicNFLVerseDatasetCache };
