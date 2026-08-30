import {
  buildNFLHistoricalPregameSnapshot,
  buildNFLHistoricalPregameSnapshots,
} from "../gameDecisionSupport/NFLHistoricalPregameReplayEngine.js";

import {
  assembleNFLHistoricalDecisionDataset,
} from "../gameDecisionSupport/NFLHistoricalReplayDatasetAssembler.js";

import {
  createNFLHistoricalReplayManifest,
} from "../gameDecisionSupport/NFLHistoricalReplayManifest.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tests = [];

function check(name, fn) {
  try {
    fn();
    tests.push({
      name,
      passed: true,
    });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.message,
    });
  }
}

function pbp({
  season,
  week,
  gameId,
  offense,
  defense,
  playType,
  epa,
  yards = 0,
}) {
  return {
    season,
    week,
    game_id: gameId,
    season_type: "REG",
    posteam: offense,
    defteam: defense,
    play_type: playType,
    epa: String(epa),
    success:
      epa > 0 ? "1" : "0",
    yards_gained:
      String(yards),
    qb_hit: "0",
    sack: "0",
    yardline_100: "50",
  };
}

const priorRows = [
  pbp({
    season: 2022,
    week: 1,
    gameId: "P1",
    offense: "BAL",
    defense: "CIN",
    playType: "pass",
    epa: 0.4,
    yards: 22,
  }),
  pbp({
    season: 2022,
    week: 1,
    gameId: "P1",
    offense: "CIN",
    defense: "BAL",
    playType: "pass",
    epa: -0.2,
    yards: 5,
  }),
];

const currentRows = [
  pbp({
    season: 2023,
    week: 1,
    gameId: "G1",
    offense: "BAL",
    defense: "CIN",
    playType: "pass",
    epa: 0.2,
    yards: 15,
  }),
  pbp({
    season: 2023,
    week: 1,
    gameId: "G1",
    offense: "CIN",
    defense: "BAL",
    playType: "pass",
    epa: -0.1,
    yards: 8,
  }),

  // This Week 2 row must never influence the Week 2 pregame snapshot.
  pbp({
    season: 2023,
    week: 2,
    gameId: "G2",
    offense: "BAL",
    defense: "CIN",
    playType: "pass",
    epa: 50,
    yards: 80,
  }),
];

const week2Game = {
  gameId: "2023_02_CIN_BAL",
  season: 2023,
  week: 2,
  gameType: "REG",
  awayTeam: "CIN",
  homeTeam: "BAL",
  awayRest: 7,
  homeRest: 7,
  awayScore: 17,
  homeScore: 24,
  completed: true,
};

check("week-two-snapshot-uses-week-one-boundary", () => {
  const snapshot =
    buildNFLHistoricalPregameSnapshot({
      game: week2Game,
      seasonRows: currentRows,
      priorSeasonRows: priorRows,
    });

  assert(
    snapshot.snapshotThroughWeek === 1,
    "Week 2 replay should freeze at Week 1."
  );
});

check("same-week-pbp-is-excluded", () => {
  const snapshot =
    buildNFLHistoricalPregameSnapshot({
      game: week2Game,
      seasonRows: currentRows,
      priorSeasonRows: priorRows,
    });

  const balCurrent =
    snapshot.evidence.home
      ?.replayEvidence?.current;

  assert(
    balCurrent?.throughWeek === 1,
    "Current evidence should be marked through Week 1."
  );

  assert(
    Math.abs(
      balCurrent?.offense?.epaPerPlay ?? 0
    ) < 5,
    "Week 2 future EPA leaked into pregame evidence."
  );
});

check("week-one-is-prior-only", () => {
  const snapshot =
    buildNFLHistoricalPregameSnapshot({
      game: {
        ...week2Game,
        gameId:
          "2023_01_CIN_BAL",
        week: 1,
      },
      seasonRows: currentRows,
      priorSeasonRows: priorRows,
    });

  assert(
    snapshot.snapshotThroughWeek === null,
    "Week 1 snapshot must be prior-only."
  );

  assert(
    snapshot.evidence.home.mode === "PRIOR_ONLY",
    "Week 1 team strength should use prior only."
  );
});

check("batch-replay-requires-prior-season", () => {
  const result =
    buildNFLHistoricalPregameSnapshots({
      games: [week2Game],
      rowsBySeason:
        new Map([
          [2023, currentRows],
        ]),
    });

  assert(
    result.snapshots.length === 0,
    "Replay should not fabricate missing prior evidence."
  );

  assert(
    result.exclusions[0]?.reason ===
      "MISSING_PRIOR_SEASON_PBP",
    "Expected missing-prior exclusion."
  );
});

check("batch-replay-builds-with-required-seasons", () => {
  const result =
    buildNFLHistoricalPregameSnapshots({
      games: [week2Game],
      rowsBySeason:
        new Map([
          [2022, priorRows],
          [2023, currentRows],
        ]),
    });

  assert(
    result.snapshots.length === 1,
    "Expected one replay snapshot."
  );
});

check("dataset-assembler-preserves-temporal-boundary", () => {
  const snapshot =
    buildNFLHistoricalPregameSnapshot({
      game: week2Game,
      seasonRows: currentRows,
      priorSeasonRows: priorRows,
    });

  const dataset =
    assembleNFLHistoricalDecisionDataset({
      scheduleGames: [week2Game],
      replaySnapshots: [snapshot],
    });

  assert(
    dataset.records.length === 1,
    "Expected one historical decision record."
  );

  assert(
    dataset.records[0]
      ?.pregame
      ?.snapshotThroughWeek === 1,
    "Historical decision record lost replay boundary."
  );
});

check("manifest-is-deterministic", () => {
  const snapshot =
    buildNFLHistoricalPregameSnapshot({
      game: week2Game,
      seasonRows: currentRows,
      priorSeasonRows: priorRows,
    });

  const first =
    createNFLHistoricalReplayManifest({
      startSeason: 2023,
      endSeason: 2023,
      games: [week2Game],
      snapshots: [snapshot],
      exclusions: [],
      generatedAt:
        "2026-08-11T00:00:00Z",
    });

  const second =
    createNFLHistoricalReplayManifest({
      startSeason: 2023,
      endSeason: 2023,
      games: [week2Game],
      snapshots: [snapshot],
      exclusions: [],
      generatedAt:
        "2026-08-11T00:00:00Z",
    });

  assert(
    first.hashes.snapshots ===
      second.hashes.snapshots,
    "Replay manifest hash must be deterministic."
  );
});

check("replay-does-not-claim-live-availability", () => {
  const snapshot =
    buildNFLHistoricalPregameSnapshot({
      game: week2Game,
      seasonRows: currentRows,
      priorSeasonRows: priorRows,
    });

  assert(
    snapshot.evidence.home
      ?.components?.availability === null,
    "Historical replay should not fabricate availability."
  );

  assert(
    snapshot.evidence.home
      ?.components?.quarterback === null,
    "Historical replay should not fabricate QB state."
  );
});

const failed =
  tests.filter(
    (test) => !test.passed
  );

console.log(
  JSON.stringify(
    {
      suite:
        "NFL Historical Pregame Feature Replay V1 Diagnostics",
      passed:
        tests.length - failed.length,
      failed:
        failed.length,
      tests,
    },
    null,
    2
  )
);

if (failed.length) {
  process.exitCode = 1;
}
