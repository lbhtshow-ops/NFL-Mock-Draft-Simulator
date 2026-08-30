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

function loadCrosswalk(rawDir) {
  const rows = [];
  const sourceFiles = [];

  for (const season of [2022, 2023, 2024, 2025]) {
    const file = path.join(rawDir, `roster_weekly_${season}.csv`);
    if (!fs.existsSync(file)) continue;

    const parsed = parseCsv(fs.readFileSync(file, "utf8"));
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
  if (!fs.existsSync(playersFile)) {
    throw new Error(`CANONICAL_PLAYER_DIRECTORY_MISSING:${playersFile}`);
  }

  const rows = parseCsv(fs.readFileSync(playersFile, "utf8"));
  const gsisIds = new Set();
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

    for (const namespace of EXTERNAL_NAMESPACES) {
      const value = clean(row[namespace]);
      if (!value) continue;

      const key = value.toLowerCase();
      const prior = indexes[namespace].get(key);

      if (!prior) {
        indexes[namespace].set(key, gsisId);
      } else if (prior !== gsisId) {
        collisions[namespace].add(key);
      }
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

function directGsisReferences(references) {
  return [...new Set(
    references
      .map((r) => r.sourceId)
      .filter((id) => /^00-\d{7}$/.test(id)),
  )].sort();
}

function exactExternalMatches(references, directory) {
  const matches = [];

  for (const ref of references) {
    if (!ref.sourceId || /^00-\d{7}$/.test(ref.sourceId)) continue;
    const key = ref.sourceId.toLowerCase();

    for (const namespace of EXTERNAL_NAMESPACES) {
      const gsisId = directory.indexes[namespace].get(key);
      if (!gsisId) continue;

      matches.push({
        sourceId: ref.sourceId,
        namespace,
        gsisId,
        scope: ref.scope,
        idType: ref.idType,
      });
    }
  }

  return matches;
}

function uniqueGsisFromExternal(matches) {
  return [...new Set(matches.map((m) => m.gsisId))].sort();
}

function classifyProfileIdentity({
  references,
  directory,
  expectedGsisId = null,
}) {
  const direct = directGsisReferences(references);
  const externalMatches = exactExternalMatches(references, directory);
  const externalIds = uniqueGsisFromExternal(externalMatches);

  if (direct.length > 1) {
    return {
      status: "MULTIPLE_DIRECT_GSIS_REFERENCES",
      canonicalPlayerId: null,
      directGsisReferences: direct,
      externalMatches,
    };
  }

  if (externalIds.length > 1) {
    return {
      status: "EXTERNAL_REFERENCE_CONFLICT",
      canonicalPlayerId: null,
      directGsisReferences: direct,
      externalMatches,
    };
  }

  const directId = direct[0] ?? null;
  const externalId = externalIds[0] ?? null;

  if (directId && !directory.gsisIds.has(directId)) {
    return {
      status: "DIRECT_GSIS_NOT_IN_CANONICAL_DIRECTORY",
      canonicalPlayerId: null,
      directGsisReferences: direct,
      externalMatches,
    };
  }

  if (directId && externalId && directId !== externalId) {
    return {
      status: "DIRECT_EXTERNAL_IDENTITY_CONFLICT",
      canonicalPlayerId: null,
      directGsisReferences: direct,
      externalMatches,
    };
  }

  const resolvedId = directId ?? externalId ?? null;

  if (!resolvedId) {
    return {
      status: "NO_EXACT_PROFILE_IDENTITY",
      canonicalPlayerId: null,
      directGsisReferences: direct,
      externalMatches,
    };
  }

  if (expectedGsisId && resolvedId !== expectedGsisId) {
    return {
      status: "CONFLICT_WITH_EXISTING_CROSSWALK",
      canonicalPlayerId: resolvedId,
      directGsisReferences: direct,
      externalMatches,
    };
  }

  return {
    status: directId
      ? "EXACT_DIRECT_GSIS_PROFILE_RECOVERY"
      : "EXACT_EXTERNAL_REFERENCE_RECOVERY",
    canonicalPlayerId: resolvedId,
    directGsisReferences: direct,
    externalMatches,
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

        return {
          url,
          payload: await response.json(),
        };
      }

      if (attempt >= max429Retries) {
        throw new Error("SPORTRADAR_PROFILE_RATE_LIMIT_EXHAUSTED");
      }

      const retryAfter = Number(response.headers?.get?.("retry-after"));
      const delay = Number.isFinite(retryAfter)
        ? Math.max(minRequestIntervalMs, retryAfter * 1000)
        : Math.max(2500, minRequestIntervalMs * (attempt + 2));

      console.error(
        `[2C.3g profile audit] HTTP 429; bounded retry ${attempt + 1}/${max429Retries} after ${delay}ms.`,
      );

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
const rawDir = path.resolve(
  arg("--raw-dir", "data/calibration/historical/v1/raw"),
);
const playersFile = path.resolve(
  arg(
    "--players-file",
    "data/calibration/historical/v1/raw/players/players.csv",
  ),
);
const validationSampleLimit = Number(arg("--validation-sample", "40"));
const profileSampleLimit = Number(arg("--profile-sample", "75"));
const accessLevel = process.env.SPORTRADAR_NFL_ACCESS_LEVEL || "trial";
const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (season !== 2025) {
  throw new Error("2C.3g audit is scoped to season 2025 only.");
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

const unresolved = new Map();
const resolvedSeen = new Map();

for (let week = startWeek; week <= endWeek; week += 1) {
  console.error(`[2C.3g acquisition] week ${week}/${endWeek}`);

  const acquired = await acquisition.acquireWeek({
    season,
    week,
    gameType,
  });

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
        safeAppearances: 0,
        teams: new Set(),
        firstWeek: week,
        lastWeek: week,
      };
      unresolved.set(providerPlayerId, item);
    }

    item.safeAppearances += 1;
    if (team) item.teams.add(team);
    item.firstWeek = Math.min(item.firstWeek, week);
    item.lastWeek = Math.max(item.lastWeek, week);
  }
}

const validationTargets = [...resolvedSeen.values()]
  .sort((a, b) =>
    a.providerPlayerId.localeCompare(b.providerPlayerId),
  )
  .slice(
    0,
    Number.isFinite(validationSampleLimit) &&
      validationSampleLimit > 0
      ? validationSampleLimit
      : 40,
  );

const validation = {
  attempted: 0,
  profileFetchSuccess: 0,
  exactAgreement: 0,
  noExactProfileIdentity: 0,
  conflictWithExistingCrosswalk: 0,
  profileIdentityConflict: 0,
  errors: 0,
  directGsisAgreementCount: 0,
  externalReferenceAgreementCount: 0,
  namespaceAgreementCounts: Object.fromEntries(
    EXTERNAL_NAMESPACES.map((ns) => [ns, 0]),
  ),
  samples: [],
};

for (let i = 0; i < validationTargets.length; i += 1) {
  const target = validationTargets[i];

  console.error(
    `[2C.3g validation] ${i + 1}/${validationTargets.length}`,
  );

  validation.attempted += 1;

  try {
    const { payload } =
      await profileClient.fetchProfile(target.providerPlayerId);

    validation.profileFetchSuccess += 1;

    const { player, references } =
      extractProfileReferences(payload);

    const classified = classifyProfileIdentity({
      references,
      directory: canonicalDirectory,
      expectedGsisId: target.expectedGsisId,
    });

    if (
      classified.status ===
      "EXACT_DIRECT_GSIS_PROFILE_RECOVERY"
    ) {
      validation.exactAgreement += 1;
      validation.directGsisAgreementCount += 1;
    } else if (
      classified.status ===
      "EXACT_EXTERNAL_REFERENCE_RECOVERY"
    ) {
      validation.exactAgreement += 1;
      validation.externalReferenceAgreementCount += 1;

      for (const match of classified.externalMatches) {
        validation.namespaceAgreementCounts[match.namespace] += 1;
      }
    } else if (
      classified.status === "NO_EXACT_PROFILE_IDENTITY"
    ) {
      validation.noExactProfileIdentity += 1;
    } else if (
      classified.status ===
      "CONFLICT_WITH_EXISTING_CROSSWALK"
    ) {
      validation.conflictWithExistingCrosswalk += 1;
    } else {
      validation.profileIdentityConflict += 1;
    }

    validation.samples.push({
      providerPlayerId: target.providerPlayerId,
      playerName: target.playerName,
      profileName: clean(player?.name),
      expectedGsisId: target.expectedGsisId,
      directGsisReferences: classified.directGsisReferences,
      externalMatches: classified.externalMatches,
      status: classified.status,
    });
  } catch (error) {
    validation.errors += 1;

    validation.samples.push({
      providerPlayerId: target.providerPlayerId,
      playerName: target.playerName,
      expectedGsisId: target.expectedGsisId,
      status: "PROFILE_FETCH_ERROR",
      error: String(error?.message || error),
    });
  }
}

const semanticsValidated =
  validation.conflictWithExistingCrosswalk === 0 &&
  validation.profileIdentityConflict === 0;

const unresolvedTargets = [...unresolved.values()].sort(
  (a, b) =>
    b.safeAppearances - a.safeAppearances ||
    String(a.playerName).localeCompare(String(b.playerName)),
);

// Preserve the existing 2C.3 qualification denominator: source records.
const requiredCanonicalFor95 = Math.ceil(sourceRecordCount * 0.95);
const neededFor95 = Math.max(
  0,
  requiredCanonicalFor95 - baseResolvedSafeRecordCount,
);

const recovery = {
  attemptedProfiles: 0,
  profileFetchSuccess: 0,
  directGsisRecoveredPlayers: 0,
  directGsisRecoveredSafeRecords: 0,
  externalRecoveredPlayers: 0,
  externalRecoveredSafeRecords: 0,
  totalExactRecoveredPlayers: 0,
  totalExactRecoveredSafeRecords: 0,
  noExactProfileIdentity: 0,
  profileIdentityConflict: 0,
  errors: 0,
  namespaceRecoveryCounts: Object.fromEntries(
    EXTERNAL_NAMESPACES.map((ns) => [ns, 0]),
  ),
  samples: [],
};

if (semanticsValidated) {
  for (let i = 0; i < unresolvedTargets.length; i += 1) {
    const item = unresolvedTargets[i];

    if (
      baseResolvedSafeRecordCount +
        recovery.totalExactRecoveredSafeRecords >=
      requiredCanonicalFor95
    ) {
      break;
    }

    console.error(
      `[2C.3g recovery] ${i + 1}/${unresolvedTargets.length} ` +
      `recovered=${recovery.totalExactRecoveredSafeRecords}/${neededFor95}`,
    );

    recovery.attemptedProfiles += 1;

    try {
      const { payload } =
        await profileClient.fetchProfile(item.providerPlayerId);

      recovery.profileFetchSuccess += 1;

      const { player, references } =
        extractProfileReferences(payload);

      const classified = classifyProfileIdentity({
        references,
        directory: canonicalDirectory,
      });

      if (
        classified.status ===
        "EXACT_DIRECT_GSIS_PROFILE_RECOVERY"
      ) {
        recovery.directGsisRecoveredPlayers += 1;
        recovery.directGsisRecoveredSafeRecords +=
          item.safeAppearances;
        recovery.totalExactRecoveredPlayers += 1;
        recovery.totalExactRecoveredSafeRecords +=
          item.safeAppearances;
      } else if (
        classified.status ===
        "EXACT_EXTERNAL_REFERENCE_RECOVERY"
      ) {
        recovery.externalRecoveredPlayers += 1;
        recovery.externalRecoveredSafeRecords +=
          item.safeAppearances;
        recovery.totalExactRecoveredPlayers += 1;
        recovery.totalExactRecoveredSafeRecords +=
          item.safeAppearances;

        for (const match of classified.externalMatches) {
          recovery.namespaceRecoveryCounts[match.namespace] += 1;
        }
      } else if (
        classified.status === "NO_EXACT_PROFILE_IDENTITY"
      ) {
        recovery.noExactProfileIdentity += 1;
      } else {
        recovery.profileIdentityConflict += 1;
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
          directGsisReferences:
            classified.directGsisReferences,
          externalMatches: classified.externalMatches,
          recoveredGsisId: classified.canonicalPlayerId,
          status: classified.status,
        });
      }
    } catch (error) {
      recovery.errors += 1;

      if (recovery.samples.length < profileSampleLimit) {
        recovery.samples.push({
          providerPlayerId: item.providerPlayerId,
          playerName: item.playerName,
          position: item.position,
          teams: [...item.teams].sort(),
          firstWeek: item.firstWeek,
          lastWeek: item.lastWeek,
          safeAppearances: item.safeAppearances,
          recoveredGsisId: null,
          status: "PROFILE_FETCH_ERROR",
          error: String(error?.message || error),
        });
      }
    }
  }
}

const projectedResolvedSafeRecords =
  baseResolvedSafeRecordCount +
  recovery.totalExactRecoveredSafeRecords;

const projectedCoverageRate =
  sourceRecordCount > 0
    ? projectedResolvedSafeRecords / sourceRecordCount
    : 0;

const remainingFor95 = Math.max(
  0,
  requiredCanonicalFor95 - projectedResolvedSafeRecords,
);

let decision;

if (!semanticsValidated) {
  decision = "PROFILE_IDENTITY_SEMANTICS_NOT_VALIDATED";
} else if (projectedCoverageRate >= 0.95) {
  decision =
    "COMBINED_EXACT_PROFILE_IDENTITY_RECOVERY_SUFFICIENT_FOR_95_PERCENT_REVIEW";
} else if (recovery.externalRecoveredPlayers > 0) {
  decision =
    "EXTERNAL_REFERENCE_RECOVERY_VALID_BUT_COMBINED_COVERAGE_BELOW_95_PERCENT";
} else {
  decision =
    "NO_MATERIAL_EXTERNAL_REFERENCE_RECOVERY_COMBINED_COVERAGE_BELOW_95_PERCENT";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-2025-SPORTRADAR-EXTERNAL-REFERENCE-NAMESPACE-AUDIT-1.0.2",
  sprint: "2C.3g",
  mode: "READ_ONLY",
  acquisitionContract:
    "createNFLHistoricalSportradarAcquisitionClient().acquireWeek()",
  dependencyMode:
    "SELF_CONTAINED_CSV_PARSER_NO_NEW_NPM_DEPENDENCY",
  scope: {
    season,
    gameType,
    startWeek,
    endWeek,
  },
  canonicalDirectory: {
    file: playersFile,
    rowCount: canonicalDirectory.rows.length,
    gsisCount: canonicalDirectory.gsisIds.size,
    candidateNamespaces: EXTERNAL_NAMESPACES,
    collisionCounts: canonicalDirectory.collisionCounts,
  },
  existingCrosswalk: {
    resolvedCount: crosswalk.resolvedCount,
    conflictCount: crosswalk.conflictCount,
    sourceFiles: source.sourceFiles,
  },
  totals: {
    sourceRecordCount,
    safeRecordCount,
    temporalRejectedRecordCount,
    baseResolvedSafeRecordCount,
    uniqueUnresolvedPlayers: unresolvedTargets.length,
    canonicalRecordsRequiredFor95Percent:
      requiredCanonicalFor95,
    additionalExactRecordsNeededFromBaseFor95Percent:
      neededFor95,
  },
  validation,
  recovery,
  projection: {
    projectedResolvedSafeRecords,
    projectedCoverageRate,
    thresholdReached: projectedCoverageRate >= 0.95,
    remainingSafeExactRecordsNeededFor95Percent:
      remainingFor95,
  },
  decision,
  safeguards: {
    exactProviderIdentityOnly: true,
    directGsisProfileReferenceAllowed: true,
    exactExternalReferenceAllowed: true,
    canonicalDirectoryMembershipRequired: true,
    nameUsedForIdentityResolution: false,
    fuzzyMatchingUsed: false,
    teamPositionGuessUsed: false,
    newNpmDependencyAdded: false,
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
}, null, 2));
