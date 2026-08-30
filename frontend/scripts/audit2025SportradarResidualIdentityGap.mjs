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

const clean = (v) =>
  typeof v === "string" && v.trim()
    ? v.trim()
    : v !== null && v !== undefined && String(v).trim()
      ? String(v).trim()
      : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseCsv(text) {
  const input = String(text ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      if (row.some((v) => String(v).length)) rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((v) => String(v).length)) rows.push(row);
  }

  if (!rows.length) return [];
  const header = rows[0].map((v) => String(v).trim());

  return rows.slice(1).map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]))
  );
}

function loadCsv(file) {
  return parseCsv(fs.readFileSync(file, "utf8"));
}

function loadCrosswalk(rawDir) {
  const rows = [];
  const sourceFiles = [];

  for (const season of [2022, 2023, 2024, 2025]) {
    const file = path.join(rawDir, `roster_weekly_${season}.csv`);
    if (!fs.existsSync(file)) continue;

    const parsed = loadCsv(file);
    const usable = parsed.filter(
      (r) => clean(r.gsis_id) && clean(r.sportradar_id),
    );

    rows.push(...usable);
    sourceFiles.push({
      season,
      file,
      rowCount: parsed.length,
      crosswalkRowCount: usable.length,
    });
  }

  return { rows, sourceFiles };
}

const EXTERNAL_NAMESPACES = Object.freeze([
  "esb_id",
  "nfl_id",
  "espn_id",
  "pfr_id",
  "pff_id",
  "otc_id",
  "smart_id",
]);

function loadCanonicalDirectory(playersFile) {
  const rows = loadCsv(playersFile);
  const gsisIds = new Set();
  const byGsis = new Map();
  const indexes = Object.fromEntries(
    EXTERNAL_NAMESPACES.map((ns) => [ns, new Map()]),
  );
  const collisions = Object.fromEntries(
    EXTERNAL_NAMESPACES.map((ns) => [ns, new Set()]),
  );

  for (const row of rows) {
    const gsisId = clean(row.gsis_id);
    if (!gsisId) continue;
    gsisIds.add(gsisId);
    byGsis.set(gsisId, row);

    for (const namespace of EXTERNAL_NAMESPACES) {
      const value = clean(row[namespace]);
      if (!value) continue;
      const key = value.toLowerCase();
      const prior = indexes[namespace].get(key);

      if (!prior) indexes[namespace].set(key, gsisId);
      else if (prior !== gsisId) collisions[namespace].add(key);
    }
  }

  for (const namespace of EXTERNAL_NAMESPACES) {
    for (const key of collisions[namespace]) {
      indexes[namespace].delete(key);
    }
  }

  return {
    rows,
    gsisIds,
    byGsis,
    indexes,
    collisionCounts: Object.fromEntries(
      EXTERNAL_NAMESPACES.map((ns) => [ns, collisions[ns].size]),
    ),
  };
}

function extractProfileReferences(payload) {
  const player = payload?.player ?? payload ?? {};
  const refs = Array.isArray(player?.references)
    ? player.references
    : player?.reference
      ? [player.reference]
      : [];

  return {
    player,
    references: refs
      .map((r) => ({
        sourceId: clean(r?.source_id ?? r?.sourceId),
        scope: clean(r?.scope),
        idType: clean(r?.id_type ?? r?.idType),
      }))
      .filter((r) => r.sourceId),
  };
}

function resolveExactProfileIdentity(references, directory) {
  const directGsis = [...new Set(
    references
      .map((r) => r.sourceId)
      .filter((id) => /^00-\d{7}$/.test(id) && directory.gsisIds.has(id)),
  )];

  const externalCandidates = [];

  for (const ref of references) {
    if (!ref.sourceId || /^00-\d{7}$/.test(ref.sourceId)) continue;
    const key = ref.sourceId.toLowerCase();

    for (const namespace of EXTERNAL_NAMESPACES) {
      const gsisId = directory.indexes[namespace].get(key);
      if (gsisId) {
        externalCandidates.push({
          sourceId: ref.sourceId,
          namespace,
          gsisId,
          scope: ref.scope,
          idType: ref.idType,
        });
      }
    }
  }

  const externalGsis = [...new Set(externalCandidates.map((x) => x.gsisId))];

  if (directGsis.length > 1 || externalGsis.length > 1) {
    return {
      status: "CONFLICT",
      canonicalPlayerId: null,
      directGsis,
      externalCandidates,
    };
  }

  const direct = directGsis[0] ?? null;
  const external = externalGsis[0] ?? null;

  if (direct && external && direct !== external) {
    return {
      status: "CONFLICT",
      canonicalPlayerId: null,
      directGsis,
      externalCandidates,
    };
  }

  const canonicalPlayerId = direct ?? external ?? null;

  return {
    status: canonicalPlayerId ? "RESOLVED" : "UNRESOLVED",
    canonicalPlayerId,
    directGsis,
    externalCandidates,
  };
}

function makeProfileClient({
  apiKey,
  accessLevel,
  minRequestIntervalMs,
  max429Retries,
}) {
  if (!apiKey) throw new Error("SPORTRADAR_NFL_API_KEY is required.");

  const root =
    `https://api.sportradar.com/nfl/official/${accessLevel}/v7/en`;
  let lastStartedAt = 0;

  async function fetchProfile(providerPlayerId) {
    const wait = Math.max(
      0,
      minRequestIntervalMs - (Date.now() - lastStartedAt),
    );
    if (wait) await sleep(wait);

    const url = `${root}/players/${providerPlayerId}/profile.json`;

    for (let attempt = 0; attempt <= max429Retries; attempt += 1) {
      lastStartedAt = Date.now();

      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
        },
      });

      if (response.status !== 429) {
        if (!response.ok) {
          throw new Error(`SPORTRADAR_PROFILE_HTTP_${response.status}`);
        }
        return { url, payload: await response.json() };
      }

      if (attempt >= max429Retries) {
        throw new Error("SPORTRADAR_PROFILE_RATE_LIMIT_EXHAUSTED");
      }

      const retryAfter = Number(response.headers?.get?.("retry-after"));
      const delay = Number.isFinite(retryAfter)
        ? Math.max(minRequestIntervalMs, retryAfter * 1000)
        : Math.max(2500, minRequestIntervalMs * (attempt + 2));

      console.error(
        `[2C.3h profile] HTTP 429; bounded retry ${attempt + 1}/${max429Retries} after ${delay}ms.`,
      );

      await sleep(delay);
    }

    throw new Error("SPORTRADAR_PROFILE_FETCH_EXHAUSTED");
  }

  return { fetchProfile };
}

function loadLocalEvidenceFiles(baseDir) {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
          continue;
        }
        walk(full);
      } else if (
        /\.(csv|json|jsonl|ndjson)$/i.test(entry.name)
      ) {
        files.push(full);
      }
    }
  }

  walk(path.join(baseDir, "data", "calibration", "historical", "v1"));
  return files;
}

function scanExactLocalEvidence({
  unresolved,
  evidenceFiles,
}) {
  const providerIds = new Set(
    [...unresolved.keys()].filter(Boolean).map((x) => x.toLowerCase()),
  );

  const results = new Map();

  for (const providerId of providerIds) {
    results.set(providerId, []);
  }

  for (const file of evidenceFiles) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lower = content.toLowerCase();

    for (const providerId of providerIds) {
      if (!lower.includes(providerId)) continue;

      results.get(providerId).push({
        file,
        exactProviderIdPresent: true,
      });
    }
  }

  return results;
}

const season = Number(arg("--season", "2025"));
const startWeek = Number(arg("--start-week", "1"));
const endWeek = Number(arg("--end-week", "18"));
const gameType = String(arg("--game-type", "REG")).toUpperCase();
const rawDir = path.resolve(
  arg("--raw-dir", "data/calibration/historical/v1/raw"),
);
const playersFile = path.resolve(
  arg(
    "--players-file",
    "data/calibration/historical/v1/raw/players/players.csv",
  ),
);
const sampleLimit = Number(arg("--sample-limit", "150"));
const checkpointFile = path.resolve(arg("--checkpoint-file", "data/calibration/historical/v1/audits/2c3h1-profile-checkpoint.json"));
const resumeProfiles = !process.argv.includes("--no-resume-profiles");
const retryFetchErrors = process.argv.includes("--retry-fetch-errors");
const maxProfilesThisRunRaw = Number(arg("--max-profiles-this-run", "0"));
const maxProfilesThisRun = Number.isFinite(maxProfilesThisRunRaw) && maxProfilesThisRunRaw > 0 ? maxProfilesThisRunRaw : Infinity;

function loadCheckpoint(file) {
  if (!resumeProfiles || !fs.existsSync(file)) return { profiles: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" && parsed.profiles ? parsed : { profiles: {} };
  } catch (error) {
    throw new Error(`2C.3h.1 checkpoint is unreadable: ${error?.message || error}`);
  }
}

function saveCheckpoint(file, checkpoint) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(checkpoint, null, 2) + "\n", "utf8");
  fs.renameSync(temp, file);
}

const acquisitionCacheDir = path.resolve(
  arg(
    "--acquisition-cache-dir",
    "data/calibration/historical/v1/audits/2c3h1-acquisition-cache",
  ),
);
const resumeAcquisition = !process.argv.includes("--no-resume-acquisition");

function acquisitionCacheFile({ season, gameType, week }) {
  return path.join(
    acquisitionCacheDir,
    `${season}-${String(gameType).toUpperCase()}-week-${String(week).padStart(2, "0")}.json`,
  );
}

function loadAcquisitionCache(file) {
  if (!resumeAcquisition || !fs.existsSync(file)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));

    if (
      !parsed ||
      parsed.contractVersion !==
        "FIE-NFL-SPORTRADAR-WEEKLY-ACQUISITION-CHECKPOINT-2C3H1-1.1.0" ||
      !parsed.injuryPayload ||
      !parsed.schedulePayload
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveAcquisitionCache(file, acquired, scope) {
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const payload = {
    contractVersion:
      "FIE-NFL-SPORTRADAR-WEEKLY-ACQUISITION-CHECKPOINT-2C3H1-1.1.0",
    scope,
    cachedAt: new Date().toISOString(),
    injuryUrl: acquired.injuryUrl ?? null,
    scheduleUrl: acquired.scheduleUrl ?? null,
    injuryPayload: acquired.injuryPayload,
    schedulePayload: acquired.schedulePayload,
  };

  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(payload) + "\\n", "utf8");
  fs.renameSync(temp, file);
}

const accessLevel = process.env.SPORTRADAR_NFL_ACCESS_LEVEL || "trial";
const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (season !== 2025) {
  throw new Error("2C.3h audit is scoped to season 2025 only.");
}

const source = loadCrosswalk(rawDir);
const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk(source.rows);
const canonicalDirectory = loadCanonicalDirectory(playersFile);
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
let acquisitionApiFetchesThisRun = 0;
let acquisitionCacheHits = 0;
let acquisitionCacheWrites = 0;
const acquisitionFailedWeeks = [];
const acquisitionCompletedWeeks = [];

const unresolved = new Map();

for (let week = startWeek; week <= endWeek; week += 1) {
  const cacheFile = acquisitionCacheFile({ season, gameType, week });
  let acquired = loadAcquisitionCache(cacheFile);

  if (acquired) {
    acquisitionCacheHits += 1;
    console.error(
      `[2C.3h.1 acquisition] week ${week}/${endWeek} CACHE_HIT`,
    );
  } else {
    console.error(
      `[2C.3h.1 acquisition] week ${week}/${endWeek} API_FETCH`,
    );
    acquisitionApiFetchesThisRun += 1;

    try {
      acquired = await acquisition.acquireWeek({
        season,
        week,
        gameType,
      });

      saveAcquisitionCache(
        cacheFile,
        acquired,
        { season, week, gameType },
      );
      acquisitionCacheWrites += 1;
    } catch (error) {
      acquisitionFailedWeeks.push({
        week,
        error: String(error?.message || error),
      });

      console.error(
        `[2C.3h.1 acquisition] week ${week}/${endWeek} INCOMPLETE: ${String(error?.message || error)}`,
      );
      continue;
    }
  }

  acquisitionCompletedWeeks.push(week);

  const { map: kickoffMap } =
    buildNFLHistoricalSportradarKickoffMap(acquired.schedulePayload);

  const evidenceRecords = adaptSportradarWeeklyInjuriesPayload(
    acquired.injuryPayload,
    {
      season,
      week,
      gameType,
      sourceUrl: acquired.injuryUrl,
    },
  );

  for (const evidence of evidenceRecords) {
    sourceRecordCount += 1;

    const team =
      normalizeNFLHistoricalProviderTeamCode(evidence?.team);
    const kickoff = team ? kickoffMap.get(team) ?? null : null;
    const modifiedAt = clean(evidence?.provenance?.modifiedAt);

    const temporal =
      classifyNFLHistoricalSportradarTemporalEvidence(modifiedAt, kickoff);

    if (
      temporal !==
      NFL_HISTORICAL_SPORTRADAR_TEMPORAL_CLASSIFICATIONS
        .SAFE_PRIOR_CALENDAR_DATE
    ) {
      temporalRejectedRecordCount += 1;
      continue;
    }

    safeRecordCount += 1;

    const providerPlayerId =
      clean(evidence?.provenance?.providerPlayerId)?.toLowerCase() ??
      null;

    const identity =
      resolveNFLHistoricalSportradarPlayerIdentity(
        providerPlayerId,
        crosswalk,
      );

    if (identity.status === "RESOLVED") {
      baseResolvedSafeRecordCount += 1;
      continue;
    }

    if (!providerPlayerId) continue;

    let item = unresolved.get(providerPlayerId);

    if (!item) {
      item = {
        providerPlayerId,
        playerName: clean(evidence?.player?.playerName),
        position: clean(evidence?.player?.position),
        safeAppearances: 0,
        teams: new Set(),
        firstWeek: week,
        lastWeek: week,
        profileStatus: null,
        profileName: null,
        profileReferences: [],
        profileResolvedGsisId: null,
        localExactEvidence: [],
      };
      unresolved.set(providerPlayerId, item);
    }

    item.safeAppearances += 1;
    if (team) item.teams.add(team);
    item.firstWeek = Math.min(item.firstWeek, week);
    item.lastWeek = Math.max(item.lastWeek, week);
  }
}

const expectedWeekCount = endWeek - startWeek + 1;
const acquisitionComplete =
  acquisitionCompletedWeeks.length === expectedWeekCount &&
  acquisitionFailedWeeks.length === 0;

const unresolvedTargets = [...unresolved.values()].sort(
  (a, b) =>
    b.safeAppearances - a.safeAppearances ||
    String(a.playerName).localeCompare(String(b.playerName)),
);

let profileResolvedSafeRecords = 0;
let profileResolvedPlayers = 0;
let profileUnresolvedPlayers = 0;
let profileConflictPlayers = 0;
let profileErrors = 0;
let profileFetchesAttemptedThisRun = 0;
let profileCheckpointHits = 0;
const checkpoint = loadCheckpoint(checkpointFile);

function applyProfileResult(item, result) {
  item.profileName = result.profileName ?? null;
  item.profileReferences = Array.isArray(result.profileReferences) ? result.profileReferences : [];
  item.profileStatus = result.profileStatus ?? "NOT_AUDITED";
  item.profileResolvedGsisId = result.profileResolvedGsisId ?? null;
  if (result.profileError) item.profileError = result.profileError;

  if (item.profileStatus === "RESOLVED") {
    profileResolvedPlayers += 1;
    profileResolvedSafeRecords += item.safeAppearances;
  } else if (item.profileStatus === "CONFLICT") {
    profileConflictPlayers += 1;
  } else if (item.profileStatus === "UNRESOLVED") {
    profileUnresolvedPlayers += 1;
  } else if (item.profileStatus === "PROFILE_FETCH_ERROR") {
    profileErrors += 1;
  }
}

if (acquisitionComplete) {
for (let i = 0; i < unresolvedTargets.length; i += 1) {
  const item = unresolvedTargets[i];

  const cached = checkpoint.profiles[item.providerPlayerId] ?? null;
  const cachedUsable = cached && (!retryFetchErrors || cached.profileStatus !== "PROFILE_FETCH_ERROR");

  if (cachedUsable) {
    profileCheckpointHits += 1;
    applyProfileResult(item, cached);
    continue;
  }

  if (profileFetchesAttemptedThisRun >= maxProfilesThisRun) {
    item.profileStatus = "NOT_AUDITED";
    continue;
  }

  console.error(
    `[2C.3h.1 profile provenance] ${i + 1}/${unresolvedTargets.length} (API attempt ${profileFetchesAttemptedThisRun + 1})`,
  );

  profileFetchesAttemptedThisRun += 1;
  let result;

  try {
    const { payload } = await profileClient.fetchProfile(item.providerPlayerId);
    const { player, references } = extractProfileReferences(payload);
    const exact = resolveExactProfileIdentity(references, canonicalDirectory);

    result = {
      profileName: clean(player?.name),
      profileReferences: references,
      profileStatus: exact.status,
      profileResolvedGsisId: exact.canonicalPlayerId,
      auditedAt: new Date().toISOString(),
    };
  } catch (error) {
    result = {
      profileName: null,
      profileReferences: [],
      profileStatus: "PROFILE_FETCH_ERROR",
      profileResolvedGsisId: null,
      profileError: String(error?.message || error),
      auditedAt: new Date().toISOString(),
    };
  }

  checkpoint.contractVersion = "FIE-NFL-2025-SPORTRADAR-RESIDUAL-PROFILE-CHECKPOINT-2C3H1-1.0.0";
  checkpoint.scope = { season, gameType, startWeek, endWeek };
  checkpoint.profiles[item.providerPlayerId] = result;
  saveCheckpoint(checkpointFile, checkpoint);
  applyProfileResult(item, result);
}
}

const auditedResidualItems = unresolvedTargets.filter(
  (item) => item.profileStatus === "UNRESOLVED" || item.profileStatus === "CONFLICT",
);
const unknownProfileItems = unresolvedTargets.filter(
  (item) => item.profileStatus === "PROFILE_FETCH_ERROR" || item.profileStatus === "NOT_AUDITED" || !item.profileStatus,
);
const residualItems = [...auditedResidualItems, ...unknownProfileItems];

const residualSafeRecordCount = residualItems.reduce(
  (sum, item) => sum + item.safeAppearances,
  0,
);

const evidenceFiles = loadLocalEvidenceFiles(process.cwd());
const localEvidence = scanExactLocalEvidence({
  unresolved: new Map(
    residualItems.map((item) => [item.providerPlayerId, item]),
  ),
  evidenceFiles,
});

for (const item of residualItems) {
  item.localExactEvidence =
    localEvidence.get(item.providerPlayerId) ?? [];
}

const canonicalRequiredFor95 = Math.ceil(sourceRecordCount * 0.95);
const combinedResolvedSafeRecords =
  baseResolvedSafeRecordCount + profileResolvedSafeRecords;
const remainingFor95 = Math.max(
  0,
  canonicalRequiredFor95 - combinedResolvedSafeRecords,
);

const residualWithLocalProviderIdEvidence = residualItems.filter(
  (x) => x.localExactEvidence.length > 0,
);

const residualWithoutLocalProviderIdEvidence = residualItems.filter(
  (x) => x.localExactEvidence.length === 0,
);

const byPosition = {};
const byTeam = {};
const byAppearanceBucket = {
  "10+": 0,
  "7-9": 0,
  "4-6": 0,
  "1-3": 0,
};

for (const item of residualItems) {
  const pos = item.position ?? "UNKNOWN";
  byPosition[pos] = (byPosition[pos] ?? 0) + item.safeAppearances;

  for (const team of item.teams) {
    byTeam[team] = (byTeam[team] ?? 0) + item.safeAppearances;
  }

  if (item.safeAppearances >= 10) byAppearanceBucket["10+"] += 1;
  else if (item.safeAppearances >= 7) byAppearanceBucket["7-9"] += 1;
  else if (item.safeAppearances >= 4) byAppearanceBucket["4-6"] += 1;
  else byAppearanceBucket["1-3"] += 1;
}

const residualSamples = residualItems
  .slice(0, Number.isFinite(sampleLimit) ? sampleLimit : 150)
  .map((item) => ({
    providerPlayerId: item.providerPlayerId,
    playerName: item.playerName,
    profileName: item.profileName,
    position: item.position,
    teams: [...item.teams].sort(),
    firstWeek: item.firstWeek,
    lastWeek: item.lastWeek,
    safeAppearances: item.safeAppearances,
    profileStatus: item.profileStatus,
    profileResolvedGsisId: item.profileResolvedGsisId,
    profileReferences: item.profileReferences,
    localExactEvidence: item.localExactEvidence,
  }));

const conclusivelyAuditedPlayers = profileResolvedPlayers + profileUnresolvedPlayers + profileConflictPlayers;
const profileAuditCompletenessRate = unresolvedTargets.length
  ? conclusivelyAuditedPlayers / unresolvedTargets.length
  : 1;
const unknownSafeRecordCount = unknownProfileItems.reduce((sum, item) => sum + item.safeAppearances, 0);

let decision;

if (!acquisitionComplete) {
  decision = "RESIDUAL_ACQUISITION_INCOMPLETE_REQUIRES_RESUME";
} else if (unknownProfileItems.length > 0) {
  decision = "RESIDUAL_PROFILE_AUDIT_INCOMPLETE_REQUIRES_RESUME";
} else if (profileConflictPlayers > 0) {
  decision = "RESIDUAL_IDENTITY_GAP_CONTAINS_PROFILE_IDENTITY_CONFLICTS_REQUIRES_REVIEW";
} else if (combinedResolvedSafeRecords >= canonicalRequiredFor95) {
  decision = "COMBINED_EXACT_IDENTITY_ALREADY_SUFFICIENT_FOR_95_PERCENT";
} else if (residualWithLocalProviderIdEvidence.length > 0) {
  decision = "RESIDUAL_GAP_HAS_LOCAL_EXACT_PROVIDER_ID_EVIDENCE_REQUIRES_TARGETED_BRIDGE_AUDIT";
} else {
  decision = "RESIDUAL_GAP_HAS_NO_ADDITIONAL_LOCAL_EXACT_PROVIDER_ID_EVIDENCE";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-2025-SPORTRADAR-RESIDUAL-IDENTITY-GAP-PROVENANCE-AUDIT-2C3H1-1.1.0",
  sprint: "2C.3h.1",
  mode: "READ_ONLY",
  scope: {
    season,
    gameType,
    startWeek,
    endWeek,
  },
  acquisitionCheckpoint: {
    enabled: resumeAcquisition,
    directory: acquisitionCacheDir,
    complete: acquisitionComplete,
    expectedWeekCount,
    completedWeeks: acquisitionCompletedWeeks,
    failedWeeks: acquisitionFailedWeeks,
    apiFetchesThisRun: acquisitionApiFetchesThisRun,
    cacheHits: acquisitionCacheHits,
    cacheWrites: acquisitionCacheWrites,
  },
  totals: {
    sourceRecordCount,
    safeRecordCount,
    temporalRejectedRecordCount,
    baseResolvedSafeRecordCount,
    profileResolvedPlayers,
    profileResolvedSafeRecords,
    profileUnresolvedPlayers,
    profileConflictPlayers,
    profileErrors,
    profileNotAuditedPlayers: unknownProfileItems.filter((x) => x.profileStatus === "NOT_AUDITED" || !x.profileStatus).length,
    conclusivelyAuditedPlayers,
    profileAuditCompletenessRate,
    unknownSafeRecordCount,
    profileFetchesAttemptedThisRun,
    profileCheckpointHits,
    combinedResolvedSafeRecords,
    canonicalRequiredFor95,
    remainingSafeExactRecordsNeededFor95Percent: remainingFor95,
    residualUniquePlayers: residualItems.length,
    residualSafeRecordCount,
  },
  checkpoint: {
    enabled: resumeProfiles,
    file: checkpointFile,
    retryFetchErrors,
    maxProfilesThisRun: Number.isFinite(maxProfilesThisRun) ? maxProfilesThisRun : null,
  },
  residualComposition: {
    byPosition,
    byTeam,
    byAppearanceBucket,
    residualWithLocalProviderIdEvidence:
      residualWithLocalProviderIdEvidence.length,
    residualWithoutLocalProviderIdEvidence:
      residualWithoutLocalProviderIdEvidence.length,
  },
  localEvidenceAudit: {
    scannedFiles: evidenceFiles.length,
    providerIdExactPresenceOnly: true,
    filesRoot:
      path.join(process.cwd(), "data", "calibration", "historical", "v1"),
  },
  samples: residualSamples,
  decision,
  safeguards: {
    exactProviderIdentityOnly: true,
    profileReferenceIdentityOnly: true,
    nameUsedForIdentityResolution: false,
    fuzzyMatchingUsed: false,
    teamPositionGuessUsed: false,
    localEvidenceMatchRequiresExactProviderId: true,
    acquisitionCachePersistenceOnly: true,
    profileCheckpointPersistenceOnly: true,
    auditCheckpointFilesMayBeWritten: true,
    canonicalRepositoryArtifactsMutated: false,
    databaseMutated: false,
    canonicalArtifactWritten: false,
    acquisitionFetchErrorTreatedAsMissingEvidence: true,
    incompleteAcquisitionCanProduceFinalIdentityDecision: false,
    profileFetchErrorTreatedAsUnresolved: false,
    incompleteProfileAuditCanProduceFinalIdentityDecision: false,
    qualificationThresholdChanged: false,
    treatmentControlRebuildPerformed: false,
    matchingPerformed: false,
    attRecomputed: false,
    calibrationPerformed: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemMutated: false,
  },
}, null, 2));
