const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeProviderId = (value) => {
  const id = clean(value);
  return id ? id.toLowerCase() : null;
};

const canonicalGsisId = (record = {}) =>
  clean(record.gsis_id ?? record.gsisId ?? record.playerId);

const sportradarId = (record = {}) =>
  normalizeProviderId(
    record.sportradar_id ??
      record.sportradarId ??
      record.providerPlayerId ??
      record.player?.providerPlayerId
  );

export function buildNFLHistoricalSportradarGsisCrosswalk(records = []) {
  const candidates = new Map();

  for (const record of records) {
    const providerId = sportradarId(record);
    const gsisId = canonicalGsisId(record);
    if (!providerId || !gsisId) continue;

    if (!candidates.has(providerId)) candidates.set(providerId, new Set());
    candidates.get(providerId).add(gsisId);
  }

  const resolved = {};
  const conflicts = {};

  for (const [providerId, gsisIds] of candidates.entries()) {
    const unique = [...gsisIds].sort();
    if (unique.length === 1) resolved[providerId] = unique[0];
    else conflicts[providerId] = Object.freeze(unique);
  }

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-SPORTRADAR-GSIS-CROSSWALK-1.0.0",
    resolved: Object.freeze(resolved),
    conflicts: Object.freeze(conflicts),
    resolvedCount: Object.keys(resolved).length,
    conflictCount: Object.keys(conflicts).length,
  });
}

export function resolveNFLHistoricalSportradarPlayerIdentity(
  providerPlayerId,
  crosswalk
) {
  const providerId = normalizeProviderId(providerPlayerId);
  if (!providerId) {
    return Object.freeze({
      status: "UNRESOLVED",
      providerPlayerId: null,
      canonicalPlayerId: null,
      confidence: 0,
      reason: "MISSING_SPORTRADAR_PLAYER_ID",
    });
  }

  const conflicts = crosswalk?.conflicts ?? {};
  const conflictCandidates = conflicts[providerId];
  if (Array.isArray(conflictCandidates) && conflictCandidates.length > 1) {
    return Object.freeze({
      status: "CONFLICT",
      providerPlayerId: providerId,
      canonicalPlayerId: null,
      candidates: Object.freeze([...conflictCandidates]),
      confidence: 0,
      reason: "SPORTRADAR_ID_MAPS_TO_MULTIPLE_GSIS_IDS",
    });
  }

  const canonicalPlayerId = clean(crosswalk?.resolved?.[providerId]);
  if (!canonicalPlayerId) {
    return Object.freeze({
      status: "UNRESOLVED",
      providerPlayerId: providerId,
      canonicalPlayerId: null,
      confidence: 0,
      reason: "NO_EXACT_SPORTRADAR_TO_GSIS_MAPPING",
    });
  }

  return Object.freeze({
    status: "RESOLVED",
    providerPlayerId: providerId,
    canonicalPlayerId,
    confidence: 1,
    reason: "EXACT_NFLVERSE_WEEKLY_ROSTER_ID_CROSSWALK",
  });
}

export function normalizeNFLHistoricalProviderTeamCode(value) {
  const team = clean(value)?.toUpperCase() ?? null;
  if (!team) return null;
  if (team === "JAC") return "JAX";
  return team;
}
