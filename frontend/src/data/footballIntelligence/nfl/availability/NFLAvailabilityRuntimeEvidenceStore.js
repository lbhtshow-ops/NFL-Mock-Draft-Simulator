let runtimeRecordsByScope = new Map();
let runtimeStateByScope = new Map();

function scopeKey({ season, week, gameType = "REG", team } = {}) {
  const normalizedSeason = Number(season);
  const normalizedWeek = Number(week);
  const normalizedGameType = String(gameType || "REG").toUpperCase();
  const normalizedTeam = typeof team === "string" ? team.trim().toUpperCase() : null;

  if (!Number.isInteger(normalizedSeason) || !Number.isInteger(normalizedWeek) || !normalizedTeam) {
    return null;
  }

  return `${normalizedSeason}:${normalizedWeek}:${normalizedGameType}:${normalizedTeam}`;
}

export function replaceNFLAvailabilityRuntimeEvidenceForTeam(
  records = [],
  {
    season,
    week,
    gameType = "REG",
    team,
    source = "RESEARCH_REPOSITORY",
    loadedAt = new Date().toISOString(),
    freshness = "UNKNOWN",
  } = {}
) {
  const key = scopeKey({ season, week, gameType, team });
  if (!key) {
    throw new Error("Runtime availability evidence requires season, week, gameType, and team.");
  }

  const normalizedTeam = String(team).trim().toUpperCase();
  const valid = (Array.isArray(records) ? records : []).filter(
    (record) =>
      record &&
      record.season === Number(season) &&
      record.week === Number(week) &&
      String(record.gameType || "REG").toUpperCase() === String(gameType || "REG").toUpperCase() &&
      String(record.team || "").toUpperCase() === normalizedTeam
  );

  runtimeRecordsByScope.set(key, valid);
  runtimeStateByScope.set(key, {
    source,
    loadedAt,
    freshness,
    season: Number(season),
    week: Number(week),
    gameType: String(gameType || "REG").toUpperCase(),
    team: normalizedTeam,
    recordCount: valid.length,
  });

  return getNFLAvailabilityRuntimeEvidenceState({ season, week, gameType, team });
}

export function getNFLAvailabilityRuntimeEvidenceForTeam({
  season,
  week,
  gameType = "REG",
  team,
} = {}) {
  const key = scopeKey({ season, week, gameType, team });
  return key ? runtimeRecordsByScope.get(key) || [] : [];
}

export function getNFLAvailabilityRuntimeEvidenceState({
  season,
  week,
  gameType = "REG",
  team,
} = {}) {
  const key = scopeKey({ season, week, gameType, team });
  return key ? { ...(runtimeStateByScope.get(key) || {}) } : {};
}

export function clearNFLAvailabilityRuntimeEvidence() {
  runtimeRecordsByScope = new Map();
  runtimeStateByScope = new Map();
}

export default {
  replaceNFLAvailabilityRuntimeEvidenceForTeam,
  getNFLAvailabilityRuntimeEvidenceForTeam,
  getNFLAvailabilityRuntimeEvidenceState,
  clearNFLAvailabilityRuntimeEvidence,
};
