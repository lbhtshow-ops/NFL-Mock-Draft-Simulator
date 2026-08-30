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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function loadCanonicalGsisDirectory(playersFile) {
  if (!fs.existsSync(playersFile)) throw new Error(`CANONICAL_PLAYER_DIRECTORY_MISSING:${playersFile}`);
  const rows = parseCsv(fs.readFileSync(playersFile, "utf8"));
  const ids = new Set(rows.map((r) => clean(r.gsis_id)).filter(Boolean));
  return { ids, rowCount: rows.length, gsisCount: ids.size };
}

function extractProfileGsisReferences(profile) {
  const player = profile?.player ?? profile ?? {};
  const refs = Array.isArray(player?.references)
    ? player.references
    : player?.reference ? [player.reference] : [];
  const values = [...new Set(refs
    .map((r) => clean(r?.source_id ?? r?.sourceId))
    .filter((id) => /^00-\d{7}$/.test(id))
  )].sort();
  return { player, values };
}

function makeProfileClient({ apiKey, accessLevel, minRequestIntervalMs, max429Retries }) {
  if (!apiKey) throw new Error("SPORTRADAR_NFL_API_KEY is required.");
  const root = `https://api.sportradar.com/nfl/official/${accessLevel}/v7/en`;
  let lastStartedAt = 0;
  async function fetchProfile(providerPlayerId) {
    const wait = Math.max(0, minRequestIntervalMs - (Date.now() - lastStartedAt));
    if (wait) await sleep(wait);
    const url = `${root}/players/${providerPlayerId}/profile.json`;
    for (let attempt = 0; attempt <= max429Retries; attempt++) {
      lastStartedAt = Date.now();
      const response = await fetch(url, {
        headers: { accept: "application/json", "x-api-key": apiKey },
      });
      if (response.status !== 429) {
        if (!response.ok) throw new Error(`SPORTRADAR_PROFILE_HTTP_${response.status}`);
        return { url, payload: await response.json() };
      }
      if (attempt >= max429Retries) throw new Error("SPORTRADAR_PROFILE_RATE_LIMIT_EXHAUSTED");
      const retryAfter = Number(response.headers?.get?.("retry-after"));
      const delay = Number.isFinite(retryAfter)
        ? Math.max(minRequestIntervalMs, retryAfter * 1000)
        : Math.max(2500, minRequestIntervalMs * (attempt + 2));
      console.error(`[2C.3f profile audit] HTTP 429; bounded retry ${attempt + 1}/${max429Retries} after ${delay}ms.`);
      await sleep(delay);
    }
    throw new Error("SPORTRADAR_PROFILE_FETCH_EXHAUSTED");
  }
  return { fetchProfile };
}

const season = Number(arg("--season", "2025"));
const startWeek = Number(arg("--start-week", "1"));
const endWeek = Number(arg("--end-week", "18"));
const gameType = String(arg("--game-type", "REG")).toUpperCase();
const rawDir = path.resolve(arg("--raw-dir", "data/calibration/historical/v1/raw"));
const playersFile = path.resolve(arg("--players-file", "data/calibration/historical/v1/raw/players/players.csv"));
const validationSampleLimit = Number(arg("--validation-sample", "25"));
const profileSampleLimit = Number(arg("--profile-sample", "50"));
const accessLevel = process.env.SPORTRADAR_NFL_ACCESS_LEVEL || "trial";
const apiKey = process.env.SPORTRADAR_NFL_API_KEY;
if (season !== 2025) throw new Error("2C.3f audit is scoped to season 2025 only.");

const source = loadCrosswalk(rawDir);
const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk(source.rows);
const canonicalDirectory = loadCanonicalGsisDirectory(playersFile);
const acquisition = createNFLHistoricalSportradarAcquisitionClient();
const profileClient = makeProfileClient({
  apiKey,
  accessLevel,
  minRequestIntervalMs: Number(arg("--profile-interval-ms", "1800")),
  max429Retries: Number(arg("--profile-429-retries", "2")),
});

let sourceRecordCount = 0;
let safeRecordCount = 0;
let baseResolvedSafeRecordCount = 0;
let temporalRejectedRecordCount = 0;
const unresolved = new Map();
const resolvedSeen = new Map();

for (let week = startWeek; week <= endWeek; week++) {
  console.error(`[2C.3f recovery audit] acquiring week ${week}/${endWeek}`);
  const acquired = await acquisition.acquireWeek({ season, week, gameType });
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
      baseResolvedSafeRecordCount++;
      if (providerPlayerId && !resolvedSeen.has(providerPlayerId)) {
        resolvedSeen.set(providerPlayerId, {
          providerPlayerId,
          expectedGsisId: identity.canonicalPlayerId,
          playerName: clean(evidence?.player?.playerName),
        });
      }
      continue;
    }
    if (!providerPlayerId) continue;
    let item = unresolved.get(providerPlayerId);
    if (!item) {
      item = {
        providerPlayerId,
        playerName: clean(evidence?.player?.playerName),
        position: clean(evidence?.player?.position),
        appearances: 0,
        safeAppearances: 0,
        teams: new Set(),
        firstWeek: week,
        lastWeek: week,
      };
      unresolved.set(providerPlayerId, item);
    }
    item.appearances++;
    item.safeAppearances++;
    if (team) item.teams.add(team);
    item.firstWeek = Math.min(item.firstWeek, week);
    item.lastWeek = Math.max(item.lastWeek, week);
  }
}

const validationTargets = [...resolvedSeen.values()]
  .sort((a,b) => a.providerPlayerId.localeCompare(b.providerPlayerId))
  .slice(0, Number.isFinite(validationSampleLimit) && validationSampleLimit > 0 ? validationSampleLimit : 25);

const validation = {
  attempted: 0,
  profileFetchSuccess: 0,
  exactAgreement: 0,
  missingGsisReference: 0,
  multipleGsisReferences: 0,
  canonicalDirectoryMiss: 0,
  conflictWithExistingCrosswalk: 0,
  errors: 0,
  samples: [],
};

for (const target of validationTargets) {
  validation.attempted++;
  try {
    const { payload } = await profileClient.fetchProfile(target.providerPlayerId);
    validation.profileFetchSuccess++;
    const { player, values } = extractProfileGsisReferences(payload);
    let status;
    if (values.length === 0) { validation.missingGsisReference++; status = "NO_GSIS_REFERENCE"; }
    else if (values.length > 1) { validation.multipleGsisReferences++; status = "MULTIPLE_GSIS_REFERENCES"; }
    else if (!canonicalDirectory.ids.has(values[0])) { validation.canonicalDirectoryMiss++; status = "GSIS_REFERENCE_NOT_IN_CANONICAL_DIRECTORY"; }
    else if (values[0] !== target.expectedGsisId) { validation.conflictWithExistingCrosswalk++; status = "CONFLICT_WITH_EXISTING_CROSSWALK"; }
    else { validation.exactAgreement++; status = "EXACT_AGREEMENT"; }
    validation.samples.push({ providerPlayerId: target.providerPlayerId, playerName: target.playerName, profileName: clean(player?.name), expectedGsisId: target.expectedGsisId, profileGsisReferences: values, status });
  } catch (error) {
    validation.errors++;
    validation.samples.push({ providerPlayerId: target.providerPlayerId, playerName: target.playerName, expectedGsisId: target.expectedGsisId, profileGsisReferences: [], status: "PROFILE_FETCH_ERROR", error: String(error?.message || error) });
  }
}

const unresolvedTargets = [...unresolved.values()]
  .sort((a,b) => b.safeAppearances - a.safeAppearances || String(a.playerName).localeCompare(String(b.playerName)));
const requiredCanonicalFor95 = Math.ceil(sourceRecordCount * 0.95);
const neededFor95 = Math.max(0, requiredCanonicalFor95 - baseResolvedSafeRecordCount);
let recoveredSafeRecords = 0;
const recovery = {
  attemptedProfiles: 0,
  profileFetchSuccess: 0,
  exactRecoveredPlayers: 0,
  exactRecoveredSafeRecords: 0,
  missingGsisReference: 0,
  multipleGsisReferences: 0,
  canonicalDirectoryMiss: 0,
  errors: 0,
  samples: [],
};

for (const item of unresolvedTargets) {
  recovery.attemptedProfiles++;
  try {
    const { payload } = await profileClient.fetchProfile(item.providerPlayerId);
    recovery.profileFetchSuccess++;
    const { player, values } = extractProfileGsisReferences(payload);
    let status;
    let recoveredGsisId = null;
    if (values.length === 0) { recovery.missingGsisReference++; status = "NO_GSIS_REFERENCE"; }
    else if (values.length > 1) { recovery.multipleGsisReferences++; status = "MULTIPLE_GSIS_REFERENCES"; }
    else if (!canonicalDirectory.ids.has(values[0])) { recovery.canonicalDirectoryMiss++; status = "GSIS_REFERENCE_NOT_IN_CANONICAL_DIRECTORY"; }
    else {
      recoveredGsisId = values[0];
      recovery.exactRecoveredPlayers++;
      recoveredSafeRecords += item.safeAppearances;
      recovery.exactRecoveredSafeRecords += item.safeAppearances;
      status = "EXACT_PROFILE_GSIS_RECOVERY";
    }
    if (recovery.samples.length < profileSampleLimit) {
      recovery.samples.push({
        providerPlayerId: item.providerPlayerId,
        playerName: item.playerName,
        profileName: clean(player?.name),
        position: item.position,
        teams: [...item.teams].sort(),
        firstWeek: item.firstWeek,
        lastWeek: item.lastWeek,
        safeAppearances: item.safeAppearances,
        profileGsisReferences: values,
        recoveredGsisId,
        status,
      });
    }
    if (baseResolvedSafeRecordCount + recoveredSafeRecords >= requiredCanonicalFor95) break;
  } catch (error) {
    recovery.errors++;
    if (recovery.samples.length < profileSampleLimit) {
      recovery.samples.push({ providerPlayerId: item.providerPlayerId, playerName: item.playerName, position: item.position, teams: [...item.teams].sort(), safeAppearances: item.safeAppearances, profileGsisReferences: [], recoveredGsisId: null, status: "PROFILE_FETCH_ERROR", error: String(error?.message || error) });
    }
  }
}

const projectedResolvedSafeRecords = baseResolvedSafeRecordCount + recovery.exactRecoveredSafeRecords;
const projectedCoverageRate = sourceRecordCount ? projectedResolvedSafeRecords / sourceRecordCount : 0;
const validationEligible = validation.conflictWithExistingCrosswalk === 0 && validation.multipleGsisReferences === 0;
const thresholdReached = projectedResolvedSafeRecords >= requiredCanonicalFor95;

const report = {
  contractVersion: "FIE-NFL-2025-SPORTRADAR-PROFILE-GSIS-RECOVERY-AUDIT-2C3F-1.0.0",
  sprint: "2C.3f",
  mode: "READ_ONLY_EXTERNAL_PROFILE_REFERENCE_ID_AUDIT",
  scope: { season, gameType, startWeek, endWeek },
  canonicalDirectory: { file: playersFile, rowCount: canonicalDirectory.rowCount, uniqueGsisIds: canonicalDirectory.gsisCount },
  baseCrosswalk: { resolvedProviderIds: crosswalk.resolvedCount, conflictProviderIds: crosswalk.conflictCount, sourceFiles: source.sourceFiles },
  totals: {
    sourceRecordCount,
    safeRecordCount,
    temporalRejectedRecordCount,
    baseResolvedSafeRecordCount,
    uniqueUnresolvedProviderPlayers: unresolvedTargets.length,
    requiredCanonicalRecordCountFor95Percent: requiredCanonicalFor95,
    additionalSafeExactRecordsNeededFor95PercentBeforeProfileRecovery: neededFor95,
  },
  validation,
  recovery,
  projection: {
    projectedResolvedSafeRecords,
    projectedCoverageRate,
    thresholdReached,
    remainingSafeExactRecordsNeededFor95Percent: Math.max(0, requiredCanonicalFor95 - projectedResolvedSafeRecords),
  },
  decision: !validationEligible
    ? "PROFILE_REFERENCE_SEMANTICS_NOT_VALIDATED"
    : thresholdReached
      ? "EXACT_SPORTRADAR_PROFILE_GSIS_RECOVERY_SUFFICIENT_FOR_95_PERCENT_REVIEW"
      : "EXACT_SPORTRADAR_PROFILE_GSIS_RECOVERY_INSUFFICIENT_FOR_95_PERCENT",
  safeguards: {
    gsisPatternOnly: true,
    canonicalDirectoryMembershipRequired: true,
    nameUsedForIdentityResolution: false,
    fuzzyMatchingUsed: false,
    teamPositionGuessUsed: false,
    repositoryFilesMutated: false,
    databaseMutated: false,
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
