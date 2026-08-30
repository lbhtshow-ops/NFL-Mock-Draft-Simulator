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

const timestamp = value => {
  const text = clean(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed)
    ? Object.freeze({ text, ms: parsed })
    : null;
};

const firstClean = (...values) => {
  for (const value of values) {
    const normalized = clean(value);
    if (normalized) return normalized;
  }
  return null;
};

export const NFL_CANONICAL_GAME_IDENTITY_RESOLUTION_CONTRACT =
  "NFLCanonicalGameIdentityResolution";
export const NFL_CANONICAL_GAME_IDENTITY_RESOLUTION_VERSION = "1.0.0";

export const NFL_CANONICAL_GAME_IDENTITY_STATUS = Object.freeze({
  RESOLVED: "RESOLVED",
  INVALID_PROVIDER_GAME: "INVALID_PROVIDER_GAME",
  CANONICAL_SCHEDULE_UNAVAILABLE: "CANONICAL_SCHEDULE_UNAVAILABLE",
  UNRESOLVED: "UNRESOLVED",
  AMBIGUOUS: "AMBIGUOUS",
});

export const NFL_CANONICAL_GAME_IDENTITY_KICKOFF_TOLERANCE_MS =
  15 * 60 * 1000;

function normalizeProviderGame(providerGame = {}) {
  const provider = clean(
    providerGame.provider ??
      providerGame.source ??
      providerGame.provenance?.provider ??
      providerGame.provenance?.source
  )?.toUpperCase() ?? null;

  const providerGameId = firstClean(
    providerGame.providerGameId,
    providerGame.provider_game_id,
    providerGame.externalGameId,
    providerGame.external_game_id,
    providerGame.id
  );

  const season = finiteInteger(providerGame.season);
  const week = finiteInteger(providerGame.week);
  const awayTeam = canonicalTeam(
    firstClean(
      providerGame.awayTeam,
      providerGame.away_team,
      providerGame.away?.alias
    )
  );
  const homeTeam = canonicalTeam(
    firstClean(
      providerGame.homeTeam,
      providerGame.home_team,
      providerGame.home?.alias
    )
  );
  const kickoff = timestamp(
    firstClean(
      providerGame.kickoff,
      providerGame.kickoffAt,
      providerGame.scheduled,
      providerGame.scheduled_at,
      providerGame.start_time
    )
  );

  const valid =
    provider !== null &&
    providerGameId !== null &&
    season !== null &&
    week !== null &&
    awayTeam !== null &&
    homeTeam !== null &&
    awayTeam !== homeTeam;

  return Object.freeze({
    valid,
    providerIdentity: Object.freeze({
      provider,
      providerGameId,
    }),
    footballIdentity: Object.freeze({
      season,
      week,
      awayTeam,
      homeTeam,
      kickoff: kickoff?.text ?? null,
    }),
    kickoffMs: kickoff?.ms ?? null,
  });
}

function normalizeCanonicalGame(record = {}) {
  const gameId = finiteInteger(record.gameId ?? record.game_id ?? record.id);
  const season = finiteInteger(record.season);
  const week = finiteInteger(record.week);
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

  const valid =
    gameId !== null &&
    season !== null &&
    week !== null &&
    awayTeam !== null &&
    homeTeam !== null &&
    awayTeam !== homeTeam;

  return Object.freeze({
    valid,
    game: Object.freeze({
      gameId,
      season,
      week,
      awayTeam,
      homeTeam,
      kickoff: kickoff?.text ?? null,
    }),
    kickoffMs: kickoff?.ms ?? null,
  });
}

export function resolveNFLCanonicalGameIdentity({
  providerGame = {},
  canonicalScheduleRecords = [],
  kickoffToleranceMs = NFL_CANONICAL_GAME_IDENTITY_KICKOFF_TOLERANCE_MS,
} = {}) {
  const provider = normalizeProviderGame(providerGame);
  const tolerance = Number(kickoffToleranceMs);
  const normalizedTolerance =
    Number.isFinite(tolerance) && tolerance >= 0
      ? tolerance
      : NFL_CANONICAL_GAME_IDENTITY_KICKOFF_TOLERANCE_MS;

  const governance = Object.freeze({
    providerSpecificIdentityAuthorized: false,
    canonicalGameIdSynthesisAuthorized: false,
    modelCalculationAuthorized: false,
    probabilityCalculationAuthorized: false,
    cacheMutationAuthorized: false,
    resolutionOnly: true,
  });

  const base = {
    contract: NFL_CANONICAL_GAME_IDENTITY_RESOLUTION_CONTRACT,
    version: NFL_CANONICAL_GAME_IDENTITY_RESOLUTION_VERSION,
    providerIdentity: provider.providerIdentity,
    footballIdentity: provider.footballIdentity,
    governance,
  };

  if (!provider.valid) {
    return Object.freeze({
      ...base,
      status: NFL_CANONICAL_GAME_IDENTITY_STATUS.INVALID_PROVIDER_GAME,
      reason: "VALID_PROVIDER_FOOTBALL_IDENTITY_REQUIRED",
      canonicalGame: null,
      candidateCount: 0,
      kickoffCorroborated: false,
    });
  }

  if (
    !Array.isArray(canonicalScheduleRecords) ||
    canonicalScheduleRecords.length === 0
  ) {
    return Object.freeze({
      ...base,
      status:
        NFL_CANONICAL_GAME_IDENTITY_STATUS.CANONICAL_SCHEDULE_UNAVAILABLE,
      reason: "CANONICAL_SCHEDULE_EVIDENCE_UNAVAILABLE",
      canonicalGame: null,
      candidateCount: 0,
      kickoffCorroborated: false,
    });
  }

  const validCanonical = canonicalScheduleRecords
    .map(normalizeCanonicalGame)
    .filter(item => item.valid);

  const footballMatches = validCanonical.filter(
    item =>
      item.game.season === provider.footballIdentity.season &&
      item.game.week === provider.footballIdentity.week &&
      item.game.awayTeam === provider.footballIdentity.awayTeam &&
      item.game.homeTeam === provider.footballIdentity.homeTeam
  );

  if (footballMatches.length === 0) {
    return Object.freeze({
      ...base,
      status: NFL_CANONICAL_GAME_IDENTITY_STATUS.UNRESOLVED,
      reason: "CANONICAL_FOOTBALL_IDENTITY_NOT_FOUND",
      canonicalGame: null,
      candidateCount: 0,
      kickoffCorroborated: false,
    });
  }

  const kickoffEligible = footballMatches.filter(item => {
    if (provider.kickoffMs === null || item.kickoffMs === null) return true;
    return Math.abs(item.kickoffMs - provider.kickoffMs) <= normalizedTolerance;
  });

  if (kickoffEligible.length === 0) {
    return Object.freeze({
      ...base,
      status: NFL_CANONICAL_GAME_IDENTITY_STATUS.UNRESOLVED,
      reason: "KICKOFF_CORROBORATION_FAILED",
      canonicalGame: null,
      candidateCount: footballMatches.length,
      kickoffCorroborated: false,
    });
  }

  if (kickoffEligible.length > 1) {
    return Object.freeze({
      ...base,
      status: NFL_CANONICAL_GAME_IDENTITY_STATUS.AMBIGUOUS,
      reason: "MULTIPLE_CANONICAL_GAMES_MATCH_PROVIDER_IDENTITY",
      canonicalGame: null,
      candidateCount: kickoffEligible.length,
      kickoffCorroborated: false,
    });
  }

  const resolved = kickoffEligible[0];
  const kickoffCorroborated =
    provider.kickoffMs !== null &&
    resolved.kickoffMs !== null &&
    Math.abs(resolved.kickoffMs - provider.kickoffMs) <= normalizedTolerance;

  return Object.freeze({
    ...base,
    status: NFL_CANONICAL_GAME_IDENTITY_STATUS.RESOLVED,
    reason: "ONE_CANONICAL_GAME_MATCH",
    canonicalGame: resolved.game,
    candidateCount: 1,
    kickoffCorroborated,
  });
}

export default {
  NFL_CANONICAL_GAME_IDENTITY_RESOLUTION_CONTRACT,
  NFL_CANONICAL_GAME_IDENTITY_RESOLUTION_VERSION,
  NFL_CANONICAL_GAME_IDENTITY_STATUS,
  NFL_CANONICAL_GAME_IDENTITY_KICKOFF_TOLERANCE_MS,
  resolveNFLCanonicalGameIdentity,
};
