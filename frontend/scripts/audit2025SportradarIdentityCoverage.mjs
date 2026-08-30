#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  createNFLHistoricalSportradarAcquisitionClient,
} from "../src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarAcquisition.js";
import {
  buildNFLHistoricalSportradarKickoffMap,
  classifyNFLHistoricalSportradarTemporalEvidence,
  NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS,
} from "../src/engines/teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarTemporalQualification.js";
import { adaptSportradarWeeklyInjuriesPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLAvailabilityProviderAdapter.js";
import {
  buildNFLHistoricalSportradarGsisCrosswalk,
  normalizeNFLHistoricalProviderTeamCode,
  resolveNFLHistoricalSportradarPlayerIdentity,
} from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : fallback;
}
const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
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

function loadCrosswalk(rawDir) {
  const rows = [];
  const sourceFiles = [];
  for (const season of [2022, 2023, 2024, 2025]) {
    const file = path.join(rawDir, `roster_weekly_${season}.csv`);
    if (!fs.existsSync(file)) continue;
    const parsed = parseCsv(fs.readFileSync(file, "utf8"));
    const usable = parsed.filter((r) => clean(r.gsis_id) && clean(r.sportradar_id));
    rows.push(...usable);
    sourceFiles.push({ season, file, rowCount: parsed.length, crosswalkRowCount: usable.length });
  }
  return { rows, sourceFiles };
}

function bump(map, key, amount = 1) {
  const k = key ?? "UNKNOWN";
  map[k] = (map[k] ?? 0) + amount;
}

const season = Number(arg("--season", "2025"));
const startWeek = Number(arg("--start-week", "1"));
const endWeek = Number(arg("--end-week", "18"));
const gameType = String(arg("--game-type", "REG")).toUpperCase();
const rawDir = path.resolve(arg("--raw-dir", "data/calibration/historical/v1/raw"));
const sampleLimit = Number(arg("--sample-limit", "100"));
if (season !== 2025) throw new Error("2C.3d audit is scoped to season 2025 only.");
if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) throw new Error("Invalid week range.");

const source = loadCrosswalk(rawDir);
const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk(source.rows);
const client = createNFLHistoricalSportradarAcquisitionClient();

let sourceRecordCount = 0;
let safeRecordCount = 0;
let exactResolvedSafeRecordCount = 0;
let unresolvedSafeRecordCount = 0;
let temporalRejectedRecordCount = 0;
const unresolved = new Map();
const unresolvedByTeam = {};
const unresolvedByPosition = {};
const unresolvedByWeek = {};
const unresolvedReasonCounts = {};

for (let week = startWeek; week <= endWeek; week++) {
  console.error(`[2C.3d identity audit] week ${week}/${endWeek}`);
  const acquired = await client.acquireWeek({ season, week, gameType });
  const { map: kickoffMap } = buildNFLHistoricalSportradarKickoffMap(acquired.schedulePayload);
  const evidenceRecords = adaptSportradarWeeklyInjuriesPayload(acquired.injuryPayload, {
    season, week, gameType, sourceUrl: acquired.injuryUrl,
  });

  for (const evidence of evidenceRecords) {
    sourceRecordCount++;
    const team = normalizeNFLHistoricalProviderTeamCode(evidence?.team);
    const kickoff = team ? kickoffMap.get(team) ?? null : null;
    const modifiedAt = clean(evidence?.provenance?.modifiedAt);
    const temporal = classifyNFLHistoricalSportradarTemporalEvidence(modifiedAt, kickoff);
    if (temporal !== NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS.SAFE_PRIOR_CALENDAR_DATE) {
      temporalRejectedRecordCount++;
      continue;
    }
    safeRecordCount++;

    const providerPlayerId = clean(evidence?.provenance?.providerPlayerId)?.toLowerCase() ?? null;
    const identity = resolveNFLHistoricalSportradarPlayerIdentity(providerPlayerId, crosswalk);
    if (identity.status === "RESOLVED") {
      exactResolvedSafeRecordCount++;
      continue;
    }

    unresolvedSafeRecordCount++;
    bump(unresolvedByTeam, team);
    bump(unresolvedByPosition, clean(evidence?.player?.position));
    bump(unresolvedByWeek, String(week));
    bump(unresolvedReasonCounts, identity.reason);

    const key = providerPlayerId ?? `MISSING:${team}:${clean(evidence?.player?.playerName) ?? "UNKNOWN"}`;
    let item = unresolved.get(key);
    if (!item) {
      item = {
        providerPlayerId,
        playerName: clean(evidence?.player?.playerName),
        position: clean(evidence?.player?.position),
        teams: new Set(),
        firstWeek: week,
        lastWeek: week,
        appearances: 0,
        identityStatus: identity.status,
        identityReason: identity.reason,
      };
      unresolved.set(key, item);
    }
    if (team) item.teams.add(team);
    item.firstWeek = Math.min(item.firstWeek, week);
    item.lastWeek = Math.max(item.lastWeek, week);
    item.appearances++;
  }
}

const unresolvedPlayers = [...unresolved.values()].map((item) => ({
  providerPlayerId: item.providerPlayerId,
  playerName: item.playerName,
  position: item.position,
  teams: [...item.teams].sort(),
  firstWeek: item.firstWeek,
  lastWeek: item.lastWeek,
  appearances: item.appearances,
  identityStatus: item.identityStatus,
  identityReason: item.identityReason,
})).sort((a,b) => b.appearances - a.appearances || String(a.playerName).localeCompare(String(b.playerName)));

const requiredCanonicalFor95 = Math.ceil(sourceRecordCount * 0.95);
const additionalSafeExactRecordsNeeded = Math.max(0, requiredCanonicalFor95 - exactResolvedSafeRecordCount);
const resolvableShareOfUnresolvedNeeded = unresolvedSafeRecordCount
  ? additionalSafeExactRecordsNeeded / unresolvedSafeRecordCount
  : 0;

const report = {
  contractVersion: "FIE-NFL-2025-SPORTRADAR-IDENTITY-COVERAGE-AUDIT-2C3D-1.0.0",
  sprint: "2C.3d",
  mode: "READ_ONLY_EXTERNAL_ACQUISITION_REPOSITORY_CROSSWALK_AUDIT",
  scope: { season, gameType, startWeek, endWeek },
  crosswalk: {
    resolvedProviderIds: crosswalk.resolvedCount,
    conflictProviderIds: crosswalk.conflictCount,
    sourceFiles: source.sourceFiles,
  },
  totals: {
    sourceRecordCount,
    safeRecordCount,
    temporalRejectedRecordCount,
    exactResolvedSafeRecordCount,
    unresolvedSafeRecordCount,
    uniqueUnresolvedProviderPlayers: unresolvedPlayers.length,
    currentExactSafeCoverageRate: sourceRecordCount ? exactResolvedSafeRecordCount / sourceRecordCount : 0,
    requiredCanonicalRecordCountFor95Percent: requiredCanonicalFor95,
    additionalSafeExactRecordsNeededFor95Percent: additionalSafeExactRecordsNeeded,
    shareOfCurrentlyUnresolvedSafeRecordsNeededFor95Percent: resolvableShareOfUnresolvedNeeded,
  },
  unresolvedReasonCounts,
  unresolvedByTeam: Object.fromEntries(Object.entries(unresolvedByTeam).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))),
  unresolvedByPosition: Object.fromEntries(Object.entries(unresolvedByPosition).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))),
  unresolvedByWeek: Object.fromEntries(Object.entries(unresolvedByWeek).sort((a,b) => Number(a[0])-Number(b[0]))),
  unresolvedPlayerSample: unresolvedPlayers.slice(0, Number.isFinite(sampleLimit) && sampleLimit > 0 ? sampleLimit : 100),
  decision: unresolvedSafeRecordCount === 0
    ? "EXACT_IDENTITY_COVERAGE_COMPLETE"
    : "EXACT_IDENTITY_COVERAGE_EXPANSION_REQUIRED",
  safeguards: {
    repositoryFilesMutated: false,
    databaseMutated: false,
    nameFallbackUsed: false,
    fuzzyMatchingUsed: false,
    teamPositionGuessUsed: false,
    canonicalArtifactWritten: false,
    treatmentControlRebuildPerformed: false,
    matchingPerformed: false,
    attRecomputed: false,
    calibrationPerformed: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemMutated: false,
  },
};

console.log(JSON.stringify(report, null, 2));
