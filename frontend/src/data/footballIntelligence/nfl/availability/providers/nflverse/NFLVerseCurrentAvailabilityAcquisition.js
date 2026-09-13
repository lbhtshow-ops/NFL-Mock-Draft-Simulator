import {
  adaptNFLVerseCurrentDepthChartRows,
  adaptNFLVerseCurrentRosterRows,
} from "./NFLVerseCurrentRosterDepthAdapter.js";

export const NFLVERSE_CURRENT_ROSTER_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv";

export const NFLVERSE_CURRENT_DEPTH_CHART_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_2026.csv";

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

export function parseNFLVerseCsv(text) {
  if (typeof text !== "string" || !text.trim()) return [];

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });
}

export function selectLatestNFLVerseDepthSnapshot(rows = [], { team } = {}) {
  const normalizedTeam = String(team || "").trim().toUpperCase();

  const scoped = rows.filter(
    (row) => String(row?.team || "").trim().toUpperCase() === normalizedTeam
  );

  const timestamps = [...new Set(
    scoped.map((row) => row?.dt).filter(Boolean)
  )].sort();

  const latestTimestamp = timestamps.at(-1) || null;

  return {
    team: normalizedTeam || null,
    snapshotCount: timestamps.length,
    latestTimestamp,
    rows: latestTimestamp
      ? scoped.filter((row) => row.dt === latestTimestamp)
      : [],
  };
}

async function fetchText(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    redirect: "follow",
    headers: {
      "user-agent": "LBHT-FIE-Evidence-Independence/1.0",
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`NFLVERSE_HTTP_${response.status}:${url}`);
  }

  return {
    // Canonical/provider provenance must use the stable requested source URL.
    // Redirect targets (for example temporary GitHub release asset URLs) are
    // transport metadata and must never participate in canonical evidence identity.
    sourceUrl: url,
    transportUrl: response.url || url,
    text: await response.text(),
  };
}

export async function acquireNFLVerseCurrentRosterSignals({
  season = 2026,
  week,
  gameType = "REG",
  team,
  observedAt = new Date().toISOString(),
  rosterUrl = NFLVERSE_CURRENT_ROSTER_URL,
  fetchImpl = fetch,
} = {}) {
  if (!team) throw new Error("team is required.");
  if (!Number.isInteger(Number(week))) throw new Error("integer week is required.");

  const fetched = await fetchText(rosterUrl, fetchImpl);
  const rows = parseNFLVerseCsv(fetched.text);

  const scopedRows = rows.filter(
    (row) =>
      String(row?.season) === String(season) &&
      String(row?.week) === String(week) &&
      String(row?.game_type || "").toUpperCase() === String(gameType).toUpperCase() &&
      String(row?.team || "").toUpperCase() === String(team).toUpperCase()
  );

  const signals = adaptNFLVerseCurrentRosterRows(scopedRows, {
    season: Number(season),
    week: Number(week),
    gameType,
    team,
    observedAt,
    sourceUrl: fetched.sourceUrl,
  });

  return {
    contract: "NFLVerseCurrentRosterAcquisitionResult",
    version: "1.0.0",
    sourceUrl: fetched.sourceUrl,
    transportUrl: fetched.transportUrl,
    scope: {
      season: Number(season),
      week: Number(week),
      gameType: String(gameType).toUpperCase(),
      team: String(team).toUpperCase(),
    },
    rowCount: scopedRows.length,
    signalCount: signals.length,
    rows: scopedRows,
    signals,
  };
}

export async function acquireNFLVerseCurrentDepthSignals({
  season = 2026,
  week,
  gameType = "REG",
  team,
  depthUrl = NFLVERSE_CURRENT_DEPTH_CHART_URL,
  fetchImpl = fetch,
} = {}) {
  if (!team) throw new Error("team is required.");
  if (!Number.isInteger(Number(week))) throw new Error("integer week is required.");

  const fetched = await fetchText(depthUrl, fetchImpl);
  const rows = parseNFLVerseCsv(fetched.text);

  const snapshot = selectLatestNFLVerseDepthSnapshot(rows, { team });

  const signals = adaptNFLVerseCurrentDepthChartRows(snapshot.rows, {
    season: Number(season),
    week: Number(week),
    gameType,
    team,
    sourceUrl: fetched.sourceUrl,
  });

  return {
    contract: "NFLVerseCurrentDepthAcquisitionResult",
    version: "1.0.0",
    sourceUrl: fetched.sourceUrl,
    transportUrl: fetched.transportUrl,
    scope: {
      season: Number(season),
      week: Number(week),
      gameType: String(gameType).toUpperCase(),
      team: String(team).toUpperCase(),
    },
    snapshotCount: snapshot.snapshotCount,
    latestTimestamp: snapshot.latestTimestamp,
    rowCount: snapshot.rows.length,
    signalCount: signals.length,
    rows: snapshot.rows,
    signals,
  };
}

export async function acquireNFLVerseCurrentRosterDepthSignals(options = {}) {
  const [roster, depth] = await Promise.all([
    acquireNFLVerseCurrentRosterSignals(options),
    acquireNFLVerseCurrentDepthSignals(options),
  ]);

  return {
    contract: "NFLVerseCurrentRosterDepthAcquisitionResult",
    version: "1.0.0",
    scope: roster.scope,
    roster,
    depth,
    signals: [...roster.signals, ...depth.signals],
  };
}
