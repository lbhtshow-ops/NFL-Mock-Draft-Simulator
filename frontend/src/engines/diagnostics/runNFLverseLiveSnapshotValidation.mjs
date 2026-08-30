import { gunzipSync } from "node:zlib";
import {
  createNFLversePlayByPlayDatasetLoader,
  createNFLTeamPerformanceSnapshotCache,
  createNFLTeamPerformanceSnapshotLoader,
} from "../teamIntelligence/performance/index.js";

const season = Number(process.env.LBHT_FIE_LIVE_SEASON || 2025);
const team = String(process.env.LBHT_FIE_LIVE_TEAM || "BAL").toUpperCase();
const throughWeek = Number(process.env.LBHT_FIE_LIVE_WEEK || 3);

function parseCsvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else value += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(value); value = ""; }
    else value += ch;
  }
  out.push(value);
  return out;
}

async function loadRows({ sourceUrl }) {
  const response = await fetch(sourceUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const text = gunzipSync(buffer).toString("utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const wanted = ["game_id", "season", "week", "season_type", "posteam", "defteam", "epa", "success", "no_play", "qb_kneel", "qb_spike"];
  const index = Object.fromEntries(wanted.map((name) => [name, header.indexOf(name)]));
  const missing = wanted.filter((name) => index[name] < 0);
  if (missing.length) throw new Error(`Missing nflverse columns: ${missing.join(", ")}`);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = parseCsvLine(lines[i]);
    const posteam = fields[index.posteam];
    const defteam = fields[index.defteam];
    if (posteam !== team && defteam !== team) continue;
    const week = Number(fields[index.week]);
    if (!Number.isFinite(week) || week > throughWeek) continue;
    rows.push(Object.fromEntries(wanted.map((name) => [name, fields[index[name]]])));
  }
  return {
    rows,
    retrievedAt: new Date().toISOString(),
    datasetVersion: `NFLVERSE-PBP-${season}`,
    sourceRefs: [sourceUrl],
  };
}

const datasetLoader = createNFLversePlayByPlayDatasetLoader({ loadRows });
const snapshotLoader = createNFLTeamPerformanceSnapshotLoader({
  datasetLoader,
  cache: createNFLTeamPerformanceSnapshotCache({ maxAgeMs: 60 * 60 * 1000 }),
});
const result = await snapshotLoader.load({ team, season, throughWeek, forceRefresh: true });
const snapshot = result.snapshot;
const checks = {
  provider_load_succeeded: result.status === "OK",
  snapshot_valid: snapshot?.validation?.valid === true,
  requested_team_preserved: snapshot?.teamAbbreviation === team,
  requested_season_preserved: snapshot?.season === season,
  requested_week_preserved: snapshot?.throughWeek === throughWeek,
  real_games_observed: (snapshot?.evidence?.sample?.games || 0) > 0,
  real_offensive_plays_observed: (snapshot?.evidence?.sample?.offensivePlays || 0) > 0,
  real_defensive_plays_observed: (snapshot?.evidence?.sample?.defensivePlays || 0) > 0,
  epa_available: typeof snapshot?.evidence?.offense?.epaPerPlay === "number" && typeof snapshot?.evidence?.defense?.epaPerPlay === "number",
  success_rate_available: typeof snapshot?.evidence?.offense?.successRate === "number" && typeof snapshot?.evidence?.defense?.successRate === "number",
  provenance_points_to_nflverse: snapshot?.provider === "NFLVERSE" && snapshot?.sourceUrl?.includes("nflverse-data"),
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
console.log(JSON.stringify({
  suite: "NFLverse Live Team Performance Snapshot Validation",
  live: true,
  request: { team, season, throughWeek },
  status: failures.length ? "FAIL" : "PASS",
  checks,
  failures,
  snapshot: snapshot ? {
    sample: snapshot.evidence.sample,
    offense: snapshot.evidence.offense,
    defense: snapshot.evidence.defense,
    freshness: snapshot.evidence.freshness,
    provenance: snapshot.evidence.provenance,
  } : null,
}, null, 2));
if (failures.length) process.exitCode = 1;
