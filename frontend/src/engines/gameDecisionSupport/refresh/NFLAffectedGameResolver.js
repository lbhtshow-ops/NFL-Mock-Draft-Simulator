const clean = value => {
  const text = String(value ?? "").trim();
  return text || null;
};

const finiteInteger = value => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const firstClean = (...values) => {
  for (const value of values) {
    const normalized = clean(value);
    if (normalized) return normalized;
  }
  return null;
};

const timestamp = value => {
  const text = clean(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? Object.freeze({ text, ms: parsed }) : null;
};

const canonicalTeam = value => {
  const text = clean(value);
  if (!text || text !== text.toUpperCase()) return null;
  return /^[A-Z]{2,3}$/.test(text) ? text : null;
};

const completedStatus = value =>
  new Set(["FINAL", "CLOSED", "COMPLETE", "COMPLETED"]).has(
    String(value ?? "").trim().toUpperCase()
  );

export const NFL_AFFECTED_GAME_RESOLUTION_STATUS = Object.freeze({
  RESOLVED: "RESOLVED",
  INVALID_TEAM: "INVALID_TEAM",
  SCHEDULE_UNAVAILABLE: "SCHEDULE_UNAVAILABLE",
  UNRESOLVED: "UNRESOLVED",
  NOT_ELIGIBLE: "NOT_ELIGIBLE",
  AMBIGUOUS: "AMBIGUOUS",
});

export const NFL_AFFECTED_GAME_RESOLUTION_CONTRACT =
  "NFLAffectedGameResolution";
export const NFL_AFFECTED_GAME_RESOLUTION_VERSION = "1.0.0";

function normalizeScheduleGame(record = {}) {
  const gameId = finiteInteger(record.gameId ?? record.game_id ?? record.id);
  const season = finiteInteger(record.season);
  const week = finiteInteger(record.week);
  const gameType =
    firstClean(record.gameType, record.game_type, record.season_type)?.toUpperCase() ??
    null;
  const awayTeam = canonicalTeam(
    firstClean(record.awayTeam, record.away_team, record.away?.alias)
  );
  const homeTeam = canonicalTeam(
    firstClean(record.homeTeam, record.home_team, record.home?.alias)
  );
  const kickoff = timestamp(
    firstClean(
      record.kickoff,
      record.kickoffAt,
      record.game_datetime,
      record.scheduled,
      record.scheduled_at,
      record.start_time
    )
  );
  const completed =
    record.completed === true ||
    record.final === true ||
    completedStatus(record.status);

  const valid =
    gameId !== null &&
    season !== null &&
    week !== null &&
    awayTeam !== null &&
    homeTeam !== null &&
    awayTeam !== homeTeam &&
    kickoff !== null;

  return Object.freeze({
    valid,
    game: Object.freeze({
      gameId,
      season,
      week,
      gameType,
      awayTeam,
      homeTeam,
      kickoff: kickoff?.text ?? null,
      kickoffAt: kickoff?.text ?? null,
    }),
    kickoffMs: kickoff?.ms ?? null,
    completed,
  });
}

export function resolveNFLAffectedGame({
  affectedTeam = null,
  scheduleRecords = [],
  asOf = null,
} = {}) {
  const team = canonicalTeam(affectedTeam);
  const asOfTimestamp = timestamp(asOf);

  const base = {
    contract: NFL_AFFECTED_GAME_RESOLUTION_CONTRACT,
    version: NFL_AFFECTED_GAME_RESOLUTION_VERSION,
    affectedTeam: team,
    asOf: asOfTimestamp?.text ?? null,
  };

  if (!team || !asOfTimestamp) {
    return Object.freeze({
      ...base,
      status: NFL_AFFECTED_GAME_RESOLUTION_STATUS.INVALID_TEAM,
      reason: !team ? "CANONICAL_TEAM_CODE_REQUIRED" : "VALID_AS_OF_REQUIRED",
      game: null,
      candidateCount: 0,
      matchingCount: 0,
      ineligibleCount: 0,
      governance: Object.freeze({
        modelCalculationAuthorized: false,
        probabilityCalculationAuthorized: false,
        cacheMutationAuthorized: false,
        orchestrationOnly: true,
      }),
    });
  }

  if (!Array.isArray(scheduleRecords) || scheduleRecords.length === 0) {
    return Object.freeze({
      ...base,
      status: NFL_AFFECTED_GAME_RESOLUTION_STATUS.SCHEDULE_UNAVAILABLE,
      reason: "SCHEDULE_EVIDENCE_UNAVAILABLE",
      game: null,
      candidateCount: 0,
      matchingCount: 0,
      ineligibleCount: 0,
      governance: Object.freeze({
        modelCalculationAuthorized: false,
        probabilityCalculationAuthorized: false,
        cacheMutationAuthorized: false,
        orchestrationOnly: true,
      }),
    });
  }

  const normalized = scheduleRecords.map(normalizeScheduleGame);
  const valid = normalized.filter(item => item.valid);
  const matching = valid.filter(
    item => item.game.homeTeam === team || item.game.awayTeam === team
  );
  const eligible = matching.filter(
    item => item.completed !== true && item.kickoffMs > asOfTimestamp.ms
  );
  const ineligibleCount = matching.length - eligible.length;

  const governance = Object.freeze({
    modelCalculationAuthorized: false,
    probabilityCalculationAuthorized: false,
    cacheMutationAuthorized: false,
    orchestrationOnly: true,
  });

  if (eligible.length === 1) {
    return Object.freeze({
      ...base,
      status: NFL_AFFECTED_GAME_RESOLUTION_STATUS.RESOLVED,
      reason: "ONE_ELIGIBLE_FUTURE_GAME",
      game: eligible[0].game,
      candidateCount: eligible.length,
      matchingCount: matching.length,
      ineligibleCount,
      governance,
    });
  }

  if (eligible.length > 1) {
    return Object.freeze({
      ...base,
      status: NFL_AFFECTED_GAME_RESOLUTION_STATUS.AMBIGUOUS,
      reason: "MULTIPLE_ELIGIBLE_FUTURE_GAMES",
      game: null,
      candidateCount: eligible.length,
      matchingCount: matching.length,
      ineligibleCount,
      governance,
    });
  }

  if (matching.length > 0) {
    return Object.freeze({
      ...base,
      status: NFL_AFFECTED_GAME_RESOLUTION_STATUS.NOT_ELIGIBLE,
      reason: "MATCHING_GAMES_ARE_NOT_PREGAME_ELIGIBLE",
      game: null,
      candidateCount: 0,
      matchingCount: matching.length,
      ineligibleCount,
      governance,
    });
  }

  return Object.freeze({
    ...base,
    status: NFL_AFFECTED_GAME_RESOLUTION_STATUS.UNRESOLVED,
    reason: "AFFECTED_TEAM_NOT_FOUND_IN_VALID_SCHEDULE_SCOPE",
    game: null,
    candidateCount: 0,
    matchingCount: 0,
    ineligibleCount: 0,
    governance,
  });
}

export default {
  NFL_AFFECTED_GAME_RESOLUTION_STATUS,
  NFL_AFFECTED_GAME_RESOLUTION_CONTRACT,
  NFL_AFFECTED_GAME_RESOLUTION_VERSION,
  resolveNFLAffectedGame,
};
