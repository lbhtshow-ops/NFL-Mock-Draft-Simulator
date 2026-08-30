import {
  NFL_HISTORICAL_DECISION_SUPPORTED_GAME_TYPES,
  buildNFLHistoricalDecisionDataset,
} from "../gameDecisionSupport/NFLHistoricalDecisionDatasetBuilder.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

function game({
  id,
  type,
  week,
  home = "BAL",
  away = "CIN",
}) {
  return {
    gameId: id,
    season: 2025,
    week,
    gameType: type,
    awayTeam: away,
    homeTeam: home,
    awayScore: 20,
    homeScore: 27,
    completed: true,
  };
}

function snapshot(g) {
  return {
    gameId: g.gameId,
    season: g.season,
    week: g.week,
    awayTeam: g.awayTeam,
    homeTeam: g.homeTeam,
    snapshotThroughWeek:
      g.week === 1
        ? null
        : g.week - 1,
    matchupEdge: 3,
    evidenceQuality: 0.8,
  };
}

const supportedGames = [
  game({ id: "REG", type: "REG", week: 1 }),
  game({ id: "WC", type: "WC", week: 19 }),
  game({ id: "DIV", type: "DIV", week: 20 }),
  game({ id: "CON", type: "CON", week: 21 }),
  game({ id: "SB", type: "SB", week: 22 }),
  game({ id: "POST", type: "POST", week: 23 }),
];

check("supported-types-include-nflverse-playoff-codes", () => {
  for (const type of ["REG", "WC", "DIV", "CON", "SB"]) {
    assert(
      NFL_HISTORICAL_DECISION_SUPPORTED_GAME_TYPES.includes(type),
      `Missing supported game type ${type}.`
    );
  }
});

check("all-playoff-stages-are-retained", () => {
  const result =
    buildNFLHistoricalDecisionDataset({
      scheduleGames: supportedGames,
      pregameSnapshots:
        supportedGames.map(snapshot),
    });

  assert(
    result.records.length ===
      supportedGames.length,
    `Expected ${supportedGames.length} records; got ${result.records.length}.`
  );

  assert(
    result.summary.unsupportedGameTypes === 0,
    "Supported playoff types were incorrectly rejected."
  );
});

check("preseason-remains-excluded", () => {
  const preseason =
    game({
      id: "PRE",
      type: "PRE",
      week: 1,
    });

  const result =
    buildNFLHistoricalDecisionDataset({
      scheduleGames: [preseason],
      pregameSnapshots: [
        snapshot(preseason),
      ],
    });

  assert(
    result.records.length === 0,
    "Preseason should not enter historical decision dataset."
  );

  assert(
    result.summary.unsupportedGameTypes === 1,
    "Preseason exclusion should be counted."
  );
});

check("custom-game-type-policy-still-works", () => {
  const result =
    buildNFLHistoricalDecisionDataset({
      scheduleGames: supportedGames,
      pregameSnapshots:
        supportedGames.map(snapshot),
      gameTypes: ["REG"],
    });

  assert(
    result.records.length === 1,
    "Custom REG-only policy should retain exactly one record."
  );
});

check("temporal-leakage-protection-is-preserved", () => {
  const wc =
    game({
      id: "LEAK",
      type: "WC",
      week: 19,
    });

  const result =
    buildNFLHistoricalDecisionDataset({
      scheduleGames: [wc],
      pregameSnapshots: [{
        ...snapshot(wc),
        snapshotThroughWeek: 19,
      }],
    });

  assert(
    result.records.length === 0,
    "Leaky snapshot was incorrectly accepted."
  );

  assert(
    result.summary.temporalLeakageRejected === 1,
    "Leaky snapshot was not classified correctly."
  );
});

check("missing-snapshot-protection-is-preserved", () => {
  const sb =
    game({
      id: "NOSNAPSHOT",
      type: "SB",
      week: 22,
    });

  const result =
    buildNFLHistoricalDecisionDataset({
      scheduleGames: [sb],
      pregameSnapshots: [],
    });

  assert(
    result.summary.missingPregameSnapshots === 1,
    "Missing snapshot was not classified correctly."
  );
});

check("dataset-version-is-corrected", () => {
  const reg = supportedGames[0];

  const result =
    buildNFLHistoricalDecisionDataset({
      scheduleGames: [reg],
      pregameSnapshots: [snapshot(reg)],
    });

  assert(
    result.version ===
      "NFL-HISTORICAL-DECISION-DATASET-1.0.1",
    "Corrected dataset version was not emitted."
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
        "NFL Historical Decision Postseason Compatibility Correction Diagnostics",
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
