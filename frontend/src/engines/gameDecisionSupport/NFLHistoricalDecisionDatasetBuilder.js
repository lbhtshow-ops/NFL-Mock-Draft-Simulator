import {
  createNFLHistoricalDecisionRecord,
} from "../../data/footballIntelligence/nfl/decisionSupport/NFLHistoricalDecisionRecordContract.js";

export const NFL_HISTORICAL_DECISION_SUPPORTED_GAME_TYPES =
  Object.freeze([
    "REG",
    "WC",
    "DIV",
    "CON",
    "SB",
    // Retained for compatibility with any source that uses a generic postseason code.
    "POST",
  ]);

function featureKey({
  gameId,
  season,
  week,
  awayTeam,
  homeTeam,
}) {
  return (
    gameId ||
    [
      season,
      week,
      awayTeam,
      homeTeam,
    ].join("|")
  );
}

function validSnapshot(snapshot, gameWeek) {
  if (!snapshot) return false;

  const throughWeek =
    snapshot.snapshotThroughWeek;

  if (
    throughWeek === null ||
    throughWeek === undefined
  ) {
    return Number(gameWeek) === 1;
  }

  return (
    Number.isInteger(
      Number(throughWeek)
    ) &&
    Number(throughWeek) <
      Number(gameWeek)
  );
}

export function buildNFLHistoricalDecisionDataset({
  scheduleGames = [],
  pregameSnapshots = [],
  completedOnly = true,
  gameTypes =
    NFL_HISTORICAL_DECISION_SUPPORTED_GAME_TYPES,
  generatedAt = null,
} = {}) {
  const normalizedGameTypes =
    new Set(
      (Array.isArray(gameTypes)
        ? gameTypes
        : []
      ).map(
        (value) =>
          String(value).toUpperCase()
      )
    );

  const snapshots =
    new Map(
      pregameSnapshots.map(
        (snapshot) => [
          featureKey(snapshot),
          snapshot,
        ]
      )
    );

  const records = [];
  const exclusions = [];
  const unsupportedGameTypes = [];

  for (const game of scheduleGames) {
    const gameType =
      String(
        game.gameType || "REG"
      ).toUpperCase();

    if (
      !normalizedGameTypes.has(
        gameType
      )
    ) {
      unsupportedGameTypes.push({
        gameId:
          game.gameId ||
          featureKey(game),
        gameType,
      });

      continue;
    }

    if (
      completedOnly &&
      !game.completed
    ) {
      continue;
    }

    const key =
      featureKey(game);

    const snapshot =
      snapshots.get(key);

    if (!snapshot) {
      exclusions.push({
        gameId:
          game.gameId || key,
        reason:
          "MISSING_PREGAME_SNAPSHOT",
      });
      continue;
    }

    if (
      !validSnapshot(
        snapshot,
        game.week
      )
    ) {
      exclusions.push({
        gameId:
          game.gameId || key,
        reason:
          "TEMPORAL_LEAKAGE_OR_INVALID_SNAPSHOT",
        snapshotThroughWeek:
          snapshot.snapshotThroughWeek ??
          null,
        gameWeek:
          game.week,
      });
      continue;
    }

    try {
      records.push(
        createNFLHistoricalDecisionRecord({
          game,
          pregame:
            snapshot,
          outcome: {
            awayScore:
              game.awayScore,
            homeScore:
              game.homeScore,
          },
          provenance: {
            scheduleSource:
              "nflverse-schedules",
            featureSource:
              "LBHT-FIE-pregame-snapshot",
            generatedAt,
          },
        })
      );
    } catch (error) {
      exclusions.push({
        gameId:
          game.gameId || key,
        reason:
          "CONTRACT_REJECTED",
        detail:
          error.message,
      });
    }
  }

  return {
    contract:
      "NFLHistoricalDecisionDataset",
    version:
      "NFL-HISTORICAL-DECISION-DATASET-1.0.1",

    records,
    exclusions,

    summary: {
      records:
        records.length,
      exclusions:
        exclusions.length,
      missingPregameSnapshots:
        exclusions.filter(
          (item) =>
            item.reason ===
            "MISSING_PREGAME_SNAPSHOT"
        ).length,
      temporalLeakageRejected:
        exclusions.filter(
          (item) =>
            item.reason ===
            "TEMPORAL_LEAKAGE_OR_INVALID_SNAPSHOT"
        ).length,
      contractRejected:
        exclusions.filter(
          (item) =>
            item.reason ===
            "CONTRACT_REJECTED"
        ).length,
      unsupportedGameTypes:
        unsupportedGameTypes.length,
      unsupportedGameTypeBreakdown:
        unsupportedGameTypes.reduce(
          (summary, item) => {
            summary[item.gameType] =
              (summary[item.gameType] || 0) + 1;
            return summary;
          },
          {}
        ),
    },
  };
}

export default {
  NFL_HISTORICAL_DECISION_SUPPORTED_GAME_TYPES,
  buildNFLHistoricalDecisionDataset,
};
