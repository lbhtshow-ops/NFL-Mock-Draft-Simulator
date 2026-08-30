import {
  createNFLHistoricalDecisionRecord,
} from "../../data/footballIntelligence/nfl/decisionSupport/NFLHistoricalDecisionRecordContract.js";

import {
  buildNFLHistoricalDecisionDataset,
} from "../gameDecisionSupport/NFLHistoricalDecisionDatasetBuilder.js";

import {
  brierScore,
  logLoss,
  marginMeanAbsoluteError,
  calibrationBins,
} from "../gameDecisionSupport/NFLDecisionCalibrationMetrics.js";

import {
  splitNFLHistoricalDataset,
} from "../gameDecisionSupport/NFLHistoricalHoldoutPolicy.js";

import {
  evaluateNFLDecisionModel,
} from "../gameDecisionSupport/NFLDecisionModelEvaluationHarness.js";

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

const games = [
  {
    gameId: "2023_02_A_B",
    season: 2023,
    week: 2,
    gameType: "REG",
    awayTeam: "A",
    homeTeam: "B",
    awayScore: 17,
    homeScore: 24,
    completed: true,
  },
  {
    gameId: "2024_01_C_D",
    season: 2024,
    week: 1,
    gameType: "REG",
    awayTeam: "C",
    homeTeam: "D",
    awayScore: 27,
    homeScore: 20,
    completed: true,
  },
  {
    gameId: "2024_03_E_F",
    season: 2024,
    week: 3,
    gameType: "REG",
    awayTeam: "E",
    homeTeam: "F",
    awayScore: 10,
    homeScore: 13,
    completed: true,
  },
];

const snapshots = [
  {
    gameId: "2023_02_A_B",
    season: 2023,
    week: 2,
    awayTeam: "A",
    homeTeam: "B",
    snapshotThroughWeek: 1,
    matchupEdge: 8,
    evidenceQuality: 0.8,
  },
  {
    gameId: "2024_01_C_D",
    season: 2024,
    week: 1,
    awayTeam: "C",
    homeTeam: "D",
    snapshotThroughWeek: null,
    matchupEdge: -4,
    evidenceQuality: 0.65,
  },
  {
    gameId: "2024_03_E_F",
    season: 2024,
    week: 3,
    awayTeam: "E",
    homeTeam: "F",
    snapshotThroughWeek: 3,
    matchupEdge: 3,
    evidenceQuality: 0.9,
  },
];

check("record-rejects-same-week-snapshot", () => {
  let rejected = false;

  try {
    createNFLHistoricalDecisionRecord({
      game: games[0],
      pregame: {
        snapshotThroughWeek: 2,
      },
      outcome: {
        awayScore: 17,
        homeScore: 24,
      },
    });
  } catch {
    rejected = true;
  }

  assert(
    rejected,
    "Same-week snapshot should be rejected as leakage."
  );
});

const dataset =
  buildNFLHistoricalDecisionDataset({
    scheduleGames: games,
    pregameSnapshots: snapshots,
  });

check("dataset-rejects-temporal-leakage", () => {
  assert(
    dataset.records.length === 2,
    "Expected two valid historical records."
  );

  assert(
    dataset.summary.temporalLeakageRejected === 1,
    "Expected one leakage rejection."
  );
});

check("week-one-allows-prior-only-snapshot", () => {
  const record =
    dataset.records.find(
      (item) =>
        item.game.week === 1
    );

  assert(
    Boolean(record),
    "Week 1 prior-only snapshot should be accepted."
  );
});

check("brier-and-logloss-are-computed", () => {
  const samples = [
    {
      probability: 0.8,
      outcome: 1,
    },
    {
      probability: 0.25,
      outcome: 0,
    },
  ];

  assert(
    Math.abs(
      brierScore(samples) - 0.05125
    ) < 0.000001,
    "Brier score incorrect."
  );

  assert(
    logLoss(samples) > 0,
    "Log loss should be positive."
  );
});

check("margin-mae-is-computed", () => {
  const mae =
    marginMeanAbsoluteError([
      {
        predictedMargin: 7,
        observedMargin: 4,
      },
      {
        predictedMargin: -2,
        observedMargin: -6,
      },
    ]);

  assert(
    Math.abs(mae - 3.5) <
      0.000001,
    "Margin MAE incorrect."
  );
});

check("calibration-bins-retain-sample-count", () => {
  const samples = [
    {
      probability: 0.12,
      outcome: 0,
    },
    {
      probability: 0.82,
      outcome: 1,
    },
    {
      probability: 0.88,
      outcome: 1,
    },
  ];

  const bins =
    calibrationBins(
      samples,
      10
    );

  assert(
    bins.reduce(
      (sum, bin) =>
        sum + bin.samples,
      0
    ) === 3,
    "Calibration bins lost samples."
  );
});

check("season-holdout-is-separated", () => {
  const split =
    splitNFLHistoricalDataset({
      records: dataset.records,
      validationSeasons: [2023],
      testSeasons: [2024],
    });

  assert(
    split.validation.length === 1,
    "Validation season not isolated."
  );

  assert(
    split.test.length === 1,
    "Test season not isolated."
  );
});

check("evaluation-harness-remains-research-only", () => {
  const evaluation =
    evaluateNFLDecisionModel({
      historicalRecords:
        dataset.records,
      modelName:
        "DIAGNOSTIC_CANDIDATE",
      modelVersion: "0.0.1",
      predict: (record) => ({
        homeWinProbability:
          record.pregame.matchupEdge >= 0
            ? 0.65
            : 0.35,
        expectedHomeMargin:
          record.pregame.matchupEdge /
          2,
      }),
    });

  assert(
    evaluation.promoted === false,
    "Diagnostic model must not auto-promote."
  );

  assert(
    evaluation.promotionState ===
      "RESEARCH_ONLY",
    "Evaluation state must remain RESEARCH_ONLY."
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
        "NFL Historical Decision Dataset & Calibration Foundation V1 Diagnostics",
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
