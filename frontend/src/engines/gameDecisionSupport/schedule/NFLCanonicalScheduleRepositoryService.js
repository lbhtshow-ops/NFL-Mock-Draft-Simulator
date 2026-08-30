import {
  validateNFLCanonicalSchedule,
} from "./NFLCanonicalScheduleContract.js";

export const NFL_CANONICAL_SCHEDULE_REPOSITORY_CONTRACT =
  "NFLCanonicalScheduleRepository";
export const NFL_CANONICAL_SCHEDULE_REPOSITORY_VERSION = "1.0.0";

function requirePool(pool) {
  if (!pool || typeof pool.query !== "function") {
    throw new Error("A PostgreSQL-compatible pool is required.");
  }
}

function rowToGame(row = {}) {
  return {
    gameId: row.game_id,
    season: row.season,
    week: row.week,
    gameType: row.game_type,
    awayTeam: row.away_team,
    homeTeam: row.home_team,
    kickoff: row.kickoff,
    status: row.status,
  };
}

export function createNFLCanonicalScheduleRepositoryService({ pool } = {}) {
  requirePool(pool);

  async function readWeek({ season, week, gameType = "REG" } = {}) {
    const s = Number(season);
    const w = Number(week);
    const gt = String(gameType ?? "REG").trim().toUpperCase();

    if (!Number.isInteger(s)) throw new Error("Valid season is required.");
    if (!Number.isInteger(w) || w < 1 || w > 22) {
      throw new Error("Valid week is required.");
    }

    const result = await pool.query(
      `select game_id, season, week, game_type, away_team, home_team,
              kickoff, status
         from public.nfl_canonical_games
        where season = $1
          and week = $2
          and game_type = $3
        order by kickoff asc, game_id asc`,
      [s, w, gt]
    );

    const validation = validateNFLCanonicalSchedule(
      (result.rows || []).map(rowToGame)
    );

    return Object.freeze({
      contract: NFL_CANONICAL_SCHEDULE_REPOSITORY_CONTRACT,
      version: NFL_CANONICAL_SCHEDULE_REPOSITORY_VERSION,
      season: s,
      week: w,
      gameType: gt,
      status: validation.valid ? "SUCCESS" : "INVALID_SCHEDULE",
      records: validation.games,
      validation,
      governance: Object.freeze({
        providerSpecificDependencyAuthorized: false,
        pickemRuntimeDependencyAuthorized: false,
        modelCalculationAuthorized: false,
        probabilityCalculationAuthorized: false,
        readOnly: true,
      }),
    });
  }

  return Object.freeze({ readWeek });
}

export default {
  NFL_CANONICAL_SCHEDULE_REPOSITORY_CONTRACT,
  NFL_CANONICAL_SCHEDULE_REPOSITORY_VERSION,
  createNFLCanonicalScheduleRepositoryService,
};
