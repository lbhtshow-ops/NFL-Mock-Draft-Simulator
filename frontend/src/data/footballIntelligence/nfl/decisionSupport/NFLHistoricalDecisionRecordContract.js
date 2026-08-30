export const NFL_HISTORICAL_DECISION_RECORD_CONTRACT =
  "NFLHistoricalDecisionRecord";

export const NFL_HISTORICAL_DECISION_RECORD_VERSION =
  "NFL-HISTORICAL-DECISION-RECORD-1.0.0";

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

export function createNFLHistoricalDecisionRecord({
  game = {},
  pregame = {},
  outcome = {},
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
      "Historical Decision Record requires season, week, awayTeam, and homeTeam."
    );
  }

  const homeScore = finiteOrNull(outcome.homeScore);
  const awayScore = finiteOrNull(outcome.awayScore);
  const margin =
    homeScore !== null && awayScore !== null
      ? homeScore - awayScore
      : finiteOrNull(outcome.homeMargin);

  const snapshotThroughWeek =
    pregame.snapshotThroughWeek === null ||
    pregame.snapshotThroughWeek === undefined
      ? null
      : integerOrNull(pregame.snapshotThroughWeek);

  if (
    snapshotThroughWeek !== null &&
    snapshotThroughWeek >= week
  ) {
    throw new Error(
      "Pregame snapshot violates temporal integrity: snapshotThroughWeek must be less than game week."
    );
  }

  return {
    contract:
      NFL_HISTORICAL_DECISION_RECORD_CONTRACT,
    version:
      NFL_HISTORICAL_DECISION_RECORD_VERSION,

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

    pregame: {
      snapshotThroughWeek,
      matchupEdge:
        finiteOrNull(pregame.matchupEdge),
      evidenceQuality:
        finiteOrNull(pregame.evidenceQuality),
      dimensions:
        pregame.dimensions &&
        typeof pregame.dimensions === "object"
          ? pregame.dimensions
          : {},
      context:
        pregame.context &&
        typeof pregame.context === "object"
          ? pregame.context
          : {},
      sourceVersion:
        stringOrNull(pregame.sourceVersion),
    },

    outcome: {
      awayScore,
      homeScore,
      homeMargin: margin,
      homeWin:
        margin === null
          ? null
          : margin > 0
            ? 1
            : 0,
      tie:
        margin === null
          ? null
          : margin === 0,
    },

    provenance: {
      scheduleSource:
        stringOrNull(provenance.scheduleSource),
      scheduleSourceUrl:
        stringOrNull(provenance.scheduleSourceUrl),
      featureSource:
        stringOrNull(provenance.featureSource),
      generatedAt:
        stringOrNull(provenance.generatedAt),
    },
  };
}

export function isNFLHistoricalDecisionRecord(value) {
  return Boolean(
    value &&
      value.contract ===
        NFL_HISTORICAL_DECISION_RECORD_CONTRACT &&
      value.version ===
        NFL_HISTORICAL_DECISION_RECORD_VERSION &&
      value.game &&
      Number.isInteger(value.game.season) &&
      Number.isInteger(value.game.week)
  );
}

export default {
  NFL_HISTORICAL_DECISION_RECORD_CONTRACT,
  NFL_HISTORICAL_DECISION_RECORD_VERSION,
  createNFLHistoricalDecisionRecord,
  isNFLHistoricalDecisionRecord,
};
