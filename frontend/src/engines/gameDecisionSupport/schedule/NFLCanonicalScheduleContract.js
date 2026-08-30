const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const finiteInteger = value => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const canonicalTeam = value => {
  const text = clean(value);
  if (!text || text !== text.toUpperCase()) return null;
  return /^[A-Z]{2,3}$/.test(text) ? text : null;
};

const kickoff = value => {
  const text = clean(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
};

export const NFL_CANONICAL_SCHEDULE_GAME_CONTRACT =
  "NFLCanonicalScheduleGame";
export const NFL_CANONICAL_SCHEDULE_GAME_VERSION = "1.0.0";

export function normalizeNFLCanonicalScheduleGame(record = {}) {
  const gameId = finiteInteger(record.gameId ?? record.game_id ?? record.id);
  const season = finiteInteger(record.season);
  const week = finiteInteger(record.week);
  const gameType =
    clean(record.gameType ?? record.game_type ?? record.season_type)
      ?.toUpperCase() ?? "REG";
  const awayTeam = canonicalTeam(
    record.awayTeam ?? record.away_team ?? record.away?.alias
  );
  const homeTeam = canonicalTeam(
    record.homeTeam ?? record.home_team ?? record.home?.alias
  );
  const kickoffAt = kickoff(
    record.kickoff ??
      record.kickoffAt ??
      record.kickoff_at ??
      record.game_datetime ??
      record.scheduled
  );
  const status = clean(record.status)?.toUpperCase() ?? "SCHEDULED";

  const errors = [];
  if (gameId === null) errors.push("NUMERIC_GAME_ID_REQUIRED");
  if (season === null) errors.push("SEASON_REQUIRED");
  if (week === null || week < 1 || week > 22) errors.push("VALID_WEEK_REQUIRED");
  if (!awayTeam) errors.push("CANONICAL_AWAY_TEAM_REQUIRED");
  if (!homeTeam) errors.push("CANONICAL_HOME_TEAM_REQUIRED");
  if (awayTeam && homeTeam && awayTeam === homeTeam) {
    errors.push("DISTINCT_TEAMS_REQUIRED");
  }
  if (!kickoffAt) errors.push("VALID_KICKOFF_REQUIRED");

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    game: Object.freeze({
      contract: NFL_CANONICAL_SCHEDULE_GAME_CONTRACT,
      version: NFL_CANONICAL_SCHEDULE_GAME_VERSION,
      gameId,
      season,
      week,
      gameType,
      awayTeam,
      homeTeam,
      kickoff: kickoffAt,
      kickoffAt,
      status,
    }),
  });
}

export function validateNFLCanonicalSchedule(records = []) {
  const normalized = Array.isArray(records)
    ? records.map(normalizeNFLCanonicalScheduleGame)
    : [];
  const validGames = normalized.filter(item => item.valid).map(item => item.game);
  const invalid = normalized.filter(item => !item.valid);

  const ids = new Set();
  const footballKeys = new Set();
  const duplicateGameIds = [];
  const duplicateFootballIdentities = [];

  for (const game of validGames) {
    if (ids.has(game.gameId)) duplicateGameIds.push(game.gameId);
    ids.add(game.gameId);

    const key = `${game.season}:${game.week}:${game.awayTeam}:${game.homeTeam}`;
    if (footballKeys.has(key)) duplicateFootballIdentities.push(key);
    footballKeys.add(key);
  }

  return Object.freeze({
    valid:
      invalid.length === 0 &&
      duplicateGameIds.length === 0 &&
      duplicateFootballIdentities.length === 0,
    games: Object.freeze(validGames),
    invalid: Object.freeze(invalid),
    duplicateGameIds: Object.freeze(duplicateGameIds),
    duplicateFootballIdentities: Object.freeze(duplicateFootballIdentities),
  });
}

export default {
  NFL_CANONICAL_SCHEDULE_GAME_CONTRACT,
  NFL_CANONICAL_SCHEDULE_GAME_VERSION,
  normalizeNFLCanonicalScheduleGame,
  validateNFLCanonicalSchedule,
};
