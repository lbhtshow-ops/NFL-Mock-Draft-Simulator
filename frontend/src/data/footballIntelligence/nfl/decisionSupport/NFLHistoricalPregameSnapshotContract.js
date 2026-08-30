export const NFL_HISTORICAL_PREGAME_SNAPSHOT_CONTRACT =
  "NFLHistoricalPregameSnapshot";

export const NFL_HISTORICAL_PREGAME_SNAPSHOT_VERSION =
  "NFL-HISTORICAL-PREGAME-SNAPSHOT-1.0.0";

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

export function createNFLHistoricalPregameSnapshot({
  game = {},
  snapshotThroughWeek = null,
  matchup = {},
  evidence = {},
  provenance = {},
} = {}) {
  const season = integerOrNull(game.season);
  const week = integerOrNull(game.week);
  const awayTeam =
    stringOrNull(game.awayTeam)?.toUpperCase() || null;
  const homeTeam =
    stringOrNull(game.homeTeam)?.toUpperCase() || null;

  if (!season || !week || !awayTeam || !homeTeam) {
    throw new Error(
      "Historical Pregame Snapshot requires season, week, awayTeam, and homeTeam."
    );
  }

  const normalizedThroughWeek =
    snapshotThroughWeek === null ||
    snapshotThroughWeek === undefined
      ? null
      : integerOrNull(snapshotThroughWeek);

  if (
    normalizedThroughWeek !== null &&
    normalizedThroughWeek >= week
  ) {
    throw new Error(
      "Historical Pregame Snapshot violates temporal integrity."
    );
  }

  if (
    week > 1 &&
    normalizedThroughWeek === null
  ) {
    throw new Error(
      "Week > 1 requires a previous-week replay boundary."
    );
  }

  return {
    contract:
      NFL_HISTORICAL_PREGAME_SNAPSHOT_CONTRACT,
    version:
      NFL_HISTORICAL_PREGAME_SNAPSHOT_VERSION,

    game: {
      gameId: stringOrNull(game.gameId),
      season,
      week,
      gameType:
        stringOrNull(game.gameType)?.toUpperCase() || "REG",
      gameday: stringOrNull(game.gameday),
      awayTeam,
      homeTeam,
      awayRest: finiteOrNull(game.awayRest),
      homeRest: finiteOrNull(game.homeRest),
    },

    snapshotThroughWeek:
      normalizedThroughWeek,

    matchup: {
      matchupEdge:
        finiteOrNull(matchup.matchupEdge),
      evidenceQuality:
        finiteOrNull(matchup.evidenceQuality),
      dimensions:
        matchup.dimensions &&
        typeof matchup.dimensions === "object"
          ? matchup.dimensions
          : {},
      context:
        matchup.context &&
        typeof matchup.context === "object"
          ? matchup.context
          : {},
      state:
        stringOrNull(matchup.state),
      sourceVersion:
        stringOrNull(matchup.sourceVersion),
    },

    evidence: {
      away:
        evidence.away &&
        typeof evidence.away === "object"
          ? evidence.away
          : null,
      home:
        evidence.home &&
        typeof evidence.home === "object"
          ? evidence.home
          : null,
    },

    provenance: {
      pbpSeason:
        integerOrNull(provenance.pbpSeason),
      priorSeason:
        integerOrNull(provenance.priorSeason),
      generatedAt:
        stringOrNull(provenance.generatedAt),
      replayVersion:
        stringOrNull(provenance.replayVersion),
    },
  };
}

export function isNFLHistoricalPregameSnapshot(value) {
  return Boolean(
    value &&
      value.contract ===
        NFL_HISTORICAL_PREGAME_SNAPSHOT_CONTRACT &&
      value.version ===
        NFL_HISTORICAL_PREGAME_SNAPSHOT_VERSION &&
      value.game &&
      Number.isInteger(value.game.season) &&
      Number.isInteger(value.game.week)
  );
}

export default {
  NFL_HISTORICAL_PREGAME_SNAPSHOT_CONTRACT,
  NFL_HISTORICAL_PREGAME_SNAPSHOT_VERSION,
  createNFLHistoricalPregameSnapshot,
  isNFLHistoricalPregameSnapshot,
};
