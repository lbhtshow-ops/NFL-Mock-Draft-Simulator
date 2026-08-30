import {
  aggregateNFLVersePlayByPlay,
} from "../../data/footballIntelligence/nfl/performance/NFLVersePlayByPlayTeamPerformanceAdapter.js";

import {
  aggregateNFLAdvancedMatchupEvidence,
} from "../../data/footballIntelligence/nfl/matchup/NFLAdvancedMatchupPbpAdapter.js";

import {
  evaluateNFLMatchupIntelligence,
} from "../matchupIntelligence/NFLMatchupIntelligenceEngine.js";

import {
  createNFLHistoricalPregameSnapshot,
} from "../../data/footballIntelligence/nfl/decisionSupport/NFLHistoricalPregameSnapshotContract.js";

import {
  buildHistoricalReplayTeamStrength,
} from "./NFLHistoricalReplayTeamStrength.js";

function latestByTeam(
  records = []
) {
  return new Map(
    records.map(
      (record) => [
        record.team ||
        record.teamAbbreviation,
        record,
      ]
    )
  );
}

export function buildNFLHistoricalPregameSnapshot({
  game,
  seasonRows = [],
  priorSeasonRows = [],
  generatedAt = null,
} = {}) {
  if (!game) {
    throw new Error(
      "Historical replay requires a game."
    );
  }

  const season =
    Number(game.season);
  const week =
    Number(game.week);

  const throughWeek =
    week === 1
      ? null
      : week - 1;

  const currentPerformance =
    week === 1
      ? []
      : aggregateNFLVersePlayByPlay({
          rows: seasonRows,
          season,
          throughWeek,
          phaseScope: "REGULAR",
          generatedAt,
        });

  const currentAdvanced =
    week === 1
      ? []
      : aggregateNFLAdvancedMatchupEvidence({
          rows: seasonRows,
          season,
          throughWeek,
          phaseScope: "REGULAR",
          generatedAt,
        });

  const priorPerformance =
    aggregateNFLVersePlayByPlay({
      rows: priorSeasonRows,
      season: season - 1,
      throughWeek: null,
      phaseScope: "ALL",
      generatedAt,
    });

  const priorAdvanced =
    aggregateNFLAdvancedMatchupEvidence({
      rows: priorSeasonRows,
      season: season - 1,
      throughWeek: null,
      phaseScope: "ALL",
      generatedAt,
    });

  const home =
    buildHistoricalReplayTeamStrength({
      team: game.homeTeam,
      currentRecords:
        currentPerformance,
      priorRecords:
        priorPerformance,
    });

  const away =
    buildHistoricalReplayTeamStrength({
      team: game.awayTeam,
      currentRecords:
        currentPerformance,
      priorRecords:
        priorPerformance,
    });

  const currentAdvancedByTeam =
    latestByTeam(
      currentAdvanced
    );

  const priorAdvancedByTeam =
    latestByTeam(
      priorAdvanced
    );

  home.advancedMatchupEvidence =
    currentAdvancedByTeam.get(
      game.homeTeam
    ) ||
    priorAdvancedByTeam.get(
      game.homeTeam
    ) ||
    null;

  away.advancedMatchupEvidence =
    currentAdvancedByTeam.get(
      game.awayTeam
    ) ||
    priorAdvancedByTeam.get(
      game.awayTeam
    ) ||
    null;

  const matchup =
    evaluateNFLMatchupIntelligence({
      gameId: game.gameId,
      season,
      week,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      awayIntelligence: away,
      homeIntelligence: home,

      context: {
        homeField: true,
        homeRestDays:
          game.homeRest,
        awayRestDays:
          game.awayRest,
      },
    });

  return createNFLHistoricalPregameSnapshot({
    game,
    snapshotThroughWeek:
      throughWeek,

    matchup: {
      matchupEdge:
        matchup.matchupEdge,
      evidenceQuality:
        matchup.evidenceQuality,
      dimensions:
        matchup.dimensions,
      context:
        matchup.context,
      state:
        matchup.state,
      sourceVersion:
        matchup.version,
    },

    evidence: {
      away,
      home,
    },

    provenance: {
      pbpSeason:
        season,
      priorSeason:
        season - 1,
      generatedAt,
      replayVersion:
        "NFL-HISTORICAL-PREGAME-REPLAY-1.0.0",
    },
  });
}

export function buildNFLHistoricalPregameSnapshots({
  games = [],
  rowsBySeason = new Map(),
  generatedAt = null,
} = {}) {
  const snapshots = [];
  const exclusions = [];

  for (const game of games) {
    const seasonRows =
      rowsBySeason.get(
        Number(game.season)
      ) || [];

    const priorRows =
      rowsBySeason.get(
        Number(game.season) - 1
      ) || [];

    if (!priorRows.length) {
      exclusions.push({
        gameId:
          game.gameId || null,
        reason:
          "MISSING_PRIOR_SEASON_PBP",
        season:
          game.season,
      });
      continue;
    }

    try {
      snapshots.push(
        buildNFLHistoricalPregameSnapshot({
          game,
          seasonRows,
          priorSeasonRows:
            priorRows,
          generatedAt,
        })
      );
    } catch (error) {
      exclusions.push({
        gameId:
          game.gameId || null,
        reason:
          "REPLAY_FAILED",
        detail:
          error.message,
      });
    }
  }

  return {
    contract:
      "NFLHistoricalPregameReplay",
    version:
      "NFL-HISTORICAL-PREGAME-REPLAY-1.0.0",

    snapshots,
    exclusions,

    summary: {
      snapshots:
        snapshots.length,
      exclusions:
        exclusions.length,
    },
  };
}

export default {
  buildNFLHistoricalPregameSnapshot,
  buildNFLHistoricalPregameSnapshots,
};
