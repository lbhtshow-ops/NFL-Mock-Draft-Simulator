import {
  createNFLHistoricalDecisionRecord,
} from "../../data/footballIntelligence/nfl/decisionSupport/NFLHistoricalDecisionRecordContract.js";

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

  if (throughWeek === null || throughWeek === undefined) {
    // Week 1 can legitimately be prior-only with no current-season week.
    return Number(gameWeek) === 1;
  }

  return (
    Number.isInteger(Number(throughWeek)) &&
    Number(throughWeek) < Number(gameWeek)
  );
}

export function buildNFLHistoricalDecisionDataset({
  scheduleGames = [],
  pregameSnapshots = [],
  completedOnly = true,
  gameTypes = ["REG", "POST"],
  generatedAt = null,
} = {}) {
  const snapshots = new Map(
    pregameSnapshots.map((snapshot) => [
      featureKey(snapshot),
      snapshot,
    ])
  );

  const records = [];
  const exclusions = [];

  for (const game of scheduleGames) {
    if (
      !gameTypes.includes(
        String(game.gameType || "REG").toUpperCase()
      )
    ) {
      continue;
    }

    if (completedOnly && !game.completed) {
      continue;
    }

    const key = featureKey(game);
    const snapshot = snapshots.get(key);

    if (!snapshot) {
      exclusions.push({
        gameId: game.gameId || key,
        reason: "MISSING_PREGAME_SNAPSHOT",
      });
      continue;
    }

    if (!validSnapshot(snapshot, game.week)) {
      exclusions.push({
        gameId: game.gameId || key,
        reason: "TEMPORAL_LEAKAGE_OR_INVALID_SNAPSHOT",
        snapshotThroughWeek:
          snapshot.snapshotThroughWeek ?? null,
        gameWeek: game.week,
      });
      continue;
    }

    try {
      records.push(
        createNFLHistoricalDecisionRecord({
          game,
          pregame: snapshot,
          outcome: {
            awayScore: game.awayScore,
            homeScore: game.homeScore,
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
        gameId: game.gameId || key,
        reason: "CONTRACT_REJECTED",
        detail: error.message,
      });
    }
  }

  return {
    contract:
      "NFLHistoricalDecisionDataset",
    version:
      "NFL-HISTORICAL-DECISION-DATASET-1.0.0",

    records,
    exclusions,

    summary: {
      records: records.length,
      exclusions: exclusions.length,
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
    },
  };
}

export default {
  buildNFLHistoricalDecisionDataset,
};
