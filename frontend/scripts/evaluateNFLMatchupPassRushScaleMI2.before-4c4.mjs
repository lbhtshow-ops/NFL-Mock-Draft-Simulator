import fs from "fs";
import path from "path";

import {
  generatedNFLHistoricalPregameSnapshots as snapshots
} from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js";

import {
  generatedNFLHistoricalDecisionDataset as records
} from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";

import generatedModel from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js";

import {
  evaluateNFLMatchupIntelligence
} from "../src/engines/matchupIntelligence/NFLMatchupIntelligenceEngine.js";

import {
  predictNFLCandidate
} from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";

const CONTRACT = "NFLMatchupPassRushScaleAblationMI2";
const VERSION = "FIE-MI2-PASS-RUSH-SCALE-ABLATION-1.0.0";

const OUTPUT = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLMatchupPassRushScaleAblationMI2.json"
);

const SCALES = Object.freeze([
  0.15,
  0.175,
  0.20,
  0.225,
  0.25
]);

const BASELINE_SCALE = 0.20;
const TOLERANCE = 1e-9;

const finite = value =>
  typeof value === "number" && Number.isFinite(value);

const number = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeEpaDifference(delta, scale) {
  if (!finite(delta) || !finite(scale) || scale <= 0) {
    return null;
  }

  return clamp((delta / scale) * 50, -50, 50);
}

function weightedAverage(entries = []) {
  const usable =
    entries.filter(
      entry =>
        finite(entry?.value) &&
        finite(entry?.weight) &&
        entry.weight > 0
    );

  if (!usable.length) return null;

  const numerator =
    usable.reduce(
      (sum, entry) =>
        sum + entry.value * entry.weight,
      0
    );

  const denominator =
    usable.reduce(
      (sum, entry) =>
        sum + entry.weight,
      0
    );

  return denominator > 0
    ? numerator / denominator
    : null;
}

function completeInteractionEvidence(row) {
  const h = row?.evidence?.home;
  const a = row?.evidence?.away;

  return [
    h?.performance?.offense?.passEpaPerPlay,
    a?.performance?.offense?.passEpaPerPlay,
    h?.performance?.defense?.passEpaPerPlay,
    a?.performance?.defense?.passEpaPerPlay,

    h?.performance?.offense?.rushEpaPerPlay,
    a?.performance?.offense?.rushEpaPerPlay,
    h?.performance?.defense?.rushEpaPerPlay,
    a?.performance?.defense?.rushEpaPerPlay,

    h?.advancedMatchupEvidence?.offense?.pressureAllowedRate,
    a?.advancedMatchupEvidence?.offense?.pressureAllowedRate,

    h?.advancedMatchupEvidence?.defense?.pressureGeneratedRate,
    a?.advancedMatchupEvidence?.defense?.pressureGeneratedRate,

    h?.advancedMatchupEvidence?.offense?.sackAllowedRate,
    a?.advancedMatchupEvidence?.offense?.sackAllowedRate,

    h?.advancedMatchupEvidence?.defense?.sackGeneratedRate,
    a?.advancedMatchupEvidence?.defense?.sackGeneratedRate,

    h?.advancedMatchupEvidence?.offense?.explosivePassRate,
    a?.advancedMatchupEvidence?.offense?.explosivePassRate,

    h?.advancedMatchupEvidence?.offense?.explosiveRushRate,
    a?.advancedMatchupEvidence?.offense?.explosiveRushRate,

    h?.advancedMatchupEvidence?.defense?.explosivePassAllowedRate,
    a?.advancedMatchupEvidence?.defense?.explosivePassAllowedRate,

    h?.advancedMatchupEvidence?.defense?.explosiveRushAllowedRate,
    a?.advancedMatchupEvidence?.defense?.explosiveRushAllowedRate,

    h?.advancedMatchupEvidence?.offense?.redZoneEpaPerPlay,
    a?.advancedMatchupEvidence?.offense?.redZoneEpaPerPlay,

    h?.advancedMatchupEvidence?.defense?.redZoneEpaAllowedPerPlay,
    a?.advancedMatchupEvidence?.defense?.redZoneEpaAllowedPerPlay,

    h?.advancedMatchupEvidence?.offense?.redZoneSuccessRate,
    a?.advancedMatchupEvidence?.offense?.redZoneSuccessRate,

    h?.advancedMatchupEvidence?.defense?.redZoneSuccessRateAllowed,
    a?.advancedMatchupEvidence?.defense?.redZoneSuccessRateAllowed
  ].every(finite);
}

function recomputeBaseline(snapshot) {
  const game = snapshot.game ?? {};

  return evaluateNFLMatchupIntelligence({
    gameId: game.gameId || null,
    season: Number(game.season),
    week: Number(game.week),
    awayTeam: game.awayTeam,
    homeTeam: game.homeTeam,

    awayIntelligence:
      structuredClone(snapshot?.evidence?.away || {}),

    homeIntelligence:
      structuredClone(snapshot?.evidence?.home || {}),

    context: {
      homeField: true,
      homeRestDays: number(game.homeRest),
      awayRestDays: number(game.awayRest)
    }
  });
}

function candidateMatchupEdge({
  baseline,
  passScale = BASELINE_SCALE,
  rushScale = BASELINE_SCALE
}) {
  const d = baseline.dimensions ?? {};
  const raw = d.raw ?? {};
  const context = baseline.context ?? {};

  const passDelta =
    finite(raw.homePassMatchup) &&
    finite(raw.awayPassMatchup)
      ? raw.homePassMatchup -
        raw.awayPassMatchup
      : null;

  const rushDelta =
    finite(raw.homeRushMatchup) &&
    finite(raw.awayRushMatchup)
      ? raw.homeRushMatchup -
        raw.awayRushMatchup
      : null;

  const passMatchup =
    normalizeEpaDifference(
      passDelta,
      passScale
    );

  const rushMatchup =
    normalizeEpaDifference(
      rushDelta,
      rushScale
    );

  /*
   * Production Matchup weights remain frozen.
   *
   * Advanced dimensions already contain whatever
   * maturity-aligned values the canonical baseline
   * produced. We are changing pass/rush only.
   */
  return weightedAverage([
    {
      value: d.overallStrength,
      weight: 0.30
    },
    {
      value: passMatchup,
      weight: 0.14
    },
    {
      value: d.protectionPressure,
      weight:
        finite(d.protectionPressure)
          ? 0.10
          : 0.10
    },
    {
      value: rushMatchup,
      weight: 0.08
    },
    {
      value: d.explosivePlay,
      weight:
        finite(d.explosivePlay)
          ? 0.08
          : 0.08
    },
    {
      value: d.redZone,
      weight:
        finite(d.redZone)
          ? 0.06
          : 0.06
    },
    {
      value: d.recentForm,
      weight: 0.07
    },
    {
      value: d.specialTeams,
      weight: 0.04
    },
    {
      value: d.quarterback,
      weight: 0.06
    },
    {
      value: d.availability,
      weight: 0.03
    },
    {
      value: d.weatherStyle,
      weight: 0.01
    },
    {
      value: context.homeField,
      weight: 0.02
    },
    {
      value: context.rest,
      weight: 0.01
    }
  ]);
}

function predictionFor({
  record,
  matchupEdge,
  evidenceQuality
}) {
  return predictNFLCandidate(
    generatedModel.modelId,
    {
      pregame: {
        ...(record?.pregame ?? {}),
        matchupEdge,
        evidenceQuality
      }
    },
    generatedModel.parameters
  );
}

function actualResult(record) {
  const result =
    record?.result ??
    record?.outcome ??
    null;

  if (!result) return null;

  const margin =
    number(
      result.margin ??
      result.homeMargin
    );

  const homeWin =
    typeof result.homeWin === "boolean"
      ? result.homeWin
      : margin !== null
        ? margin > 0
        : null;

  if (
    margin === null ||
    typeof homeWin !== "boolean"
  ) {
    return null;
  }

  return {
    margin,
    homeWin
  };
}

function metricAccumulator() {
  return {
    sampleSize: 0,
    correct: 0,
    brier: 0,
    logLoss: 0,
    marginAbsoluteError: 0
  };
}

function addMetric(acc, prediction, result) {
  if (!prediction || !result) return;

  const p =
    number(prediction.homeWinProbability);

  const margin =
    number(prediction.expectedHomeMargin);

  if (p === null || margin === null) return;

  const actual = result.homeWin ? 1 : 0;

  const clipped =
    Math.min(
      1 - 1e-15,
      Math.max(1e-15, p)
    );

  const predictedWinner =
    p >= 0.5 ? 1 : 0;

  acc.sampleSize += 1;

  acc.correct +=
    predictedWinner === actual
      ? 1
      : 0;

  acc.brier +=
    (p - actual) ** 2;

  acc.logLoss +=
    -(
      actual * Math.log(clipped) +
      (1 - actual) *
        Math.log(1 - clipped)
    );

  acc.marginAbsoluteError +=
    Math.abs(
      margin - result.margin
    );
}

function finishMetric(acc) {
  if (!acc.sampleSize) {
    return {
      sampleSize: 0,
      winnerAccuracy: null,
      brierScore: null,
      logLoss: null,
      marginMAE: null
    };
  }

  return {
    sampleSize: acc.sampleSize,
    winnerAccuracy:
      acc.correct / acc.sampleSize,
    brierScore:
      acc.brier / acc.sampleSize,
    logLoss:
      acc.logLoss / acc.sampleSize,
    marginMAE:
      acc.marginAbsoluteError /
      acc.sampleSize
  };
}

const recordByGameId =
  new Map(
    records.map(record => [
      record?.game?.gameId,
      record
    ])
  );

const cohort =
  snapshots
    .filter(completeInteractionEvidence)
    .map(snapshot => ({
      snapshot,
      record:
        recordByGameId.get(
          snapshot?.game?.gameId
        ) ?? null
    }))
    .filter(row => row.record);

if (cohort.length !== 2195) {
  throw new Error(
    `MI2_COHORT_MISMATCH expected=2195 actual=${cohort.length}`
  );
}

const baselineParity = {
  checked: 0,
  failures: 0,
  maxDifference: 0
};

const baselineRows = [];

for (const { snapshot, record } of cohort) {
  const baseline =
    recomputeBaseline(snapshot);

  const researchBaseline =
    candidateMatchupEdge({
      baseline,
      passScale: BASELINE_SCALE,
      rushScale: BASELINE_SCALE
    });

  const difference =
    Math.abs(
      researchBaseline -
      baseline.matchupEdge
    );

  baselineParity.checked += 1;
  baselineParity.maxDifference =
    Math.max(
      baselineParity.maxDifference,
      difference
    );

  if (difference > TOLERANCE) {
    baselineParity.failures += 1;
  }

  baselineRows.push({
    snapshot,
    record,
    baseline
  });
}

console.log(
  `Research baseline parity: ${baselineParity.failures} failures / ${baselineParity.checked}, maxDifference=${baselineParity.maxDifference}`
);

if (baselineParity.failures > 0) {
  throw new Error(
    `MI2_RESEARCH_BASELINE_PARITY_FAILED count=${baselineParity.failures}`
  );
}

const candidates = [
  {
    id: "BASELINE_020_020",
    passScale: 0.20,
    rushScale: 0.20
  },

  ...SCALES
    .filter(scale => scale !== BASELINE_SCALE)
    .map(scale => ({
      id:
        `PASS_${String(scale).replace(".", "")}_RUSH_020`,
      passScale: scale,
      rushScale: BASELINE_SCALE
    })),

  ...SCALES
    .filter(scale => scale !== BASELINE_SCALE)
    .map(scale => ({
      id:
        `PASS_020_RUSH_${String(scale).replace(".", "")}`,
      passScale: BASELINE_SCALE,
      rushScale: scale
    }))
];

const reports = [];

for (const candidate of candidates) {
  const metric =
    metricAccumulator();

  const bySeasonMap =
    new Map();

  let favoriteFlips = 0;
  let correctedMisses = 0;
  let introducedMisses = 0;

  for (const row of baselineRows) {
    const {
      snapshot,
      record,
      baseline
    } = row;

    const result =
      actualResult(record);

    if (!result) continue;

    const baselinePrediction =
      predictionFor({
        record,
        matchupEdge:
          baseline.matchupEdge,
        evidenceQuality:
          baseline.evidenceQuality
      });

    const candidateEdge =
      candidateMatchupEdge({
        baseline,
        passScale:
          candidate.passScale,
        rushScale:
          candidate.rushScale
      });

    const candidatePrediction =
      predictionFor({
        record,
        matchupEdge:
          candidateEdge,
        evidenceQuality:
          baseline.evidenceQuality
      });

    addMetric(
      metric,
      candidatePrediction,
      result
    );

    const season =
      Number(snapshot?.game?.season);

    if (!bySeasonMap.has(season)) {
      bySeasonMap.set(
        season,
        metricAccumulator()
      );
    }

    addMetric(
      bySeasonMap.get(season),
      candidatePrediction,
      result
    );

    const baselineWinner =
      baselinePrediction
        .homeWinProbability >= 0.5
        ? 1
        : 0;

    const candidateWinner =
      candidatePrediction
        .homeWinProbability >= 0.5
        ? 1
        : 0;

    const actualWinner =
      result.homeWin ? 1 : 0;

    if (baselineWinner !== candidateWinner) {
      favoriteFlips += 1;

      if (
        baselineWinner !== actualWinner &&
        candidateWinner === actualWinner
      ) {
        correctedMisses += 1;
      }

      if (
        baselineWinner === actualWinner &&
        candidateWinner !== actualWinner
      ) {
        introducedMisses += 1;
      }
    }
  }

  reports.push({
    ...candidate,
    fullSeason:
      finishMetric(metric),

    favoriteFlips,
    correctedMisses,
    introducedMisses,
    netCorrectedFavoriteFlips:
      correctedMisses -
      introducedMisses,

    bySeason:
      [...bySeasonMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(
          ([season, seasonMetric]) => ({
            season,
            ...finishMetric(
              seasonMetric
            )
          })
        )
  });
}

const baselineReport =
  reports.find(
    row =>
      row.id === "BASELINE_020_020"
  );

for (const report of reports) {
  const b =
    baselineReport.fullSeason;

  const c =
    report.fullSeason;

  report.deltaVsBaseline = {
    winnerAccuracy:
      c.winnerAccuracy -
      b.winnerAccuracy,

    brierScore:
      c.brierScore -
      b.brierScore,

    logLoss:
      c.logLoss -
      b.logLoss,

    marginMAE:
      c.marginMAE -
      b.marginMAE
  };
}

const output = {
  contract: CONTRACT,
  version: VERSION,

  status: "RESEARCH_ONLY",
  productionAuthorityGranted: false,
  automaticPromotion: false,

  generatedAt:
    new Date().toISOString(),

  cohort: {
    completeHistoricalGames:
      cohort.length,

    excludedHistoricalGames:
      snapshots.length -
      cohort.length,

    excludedPolicy:
      "Incomplete interaction evidence is excluded. The known OAK 2018-2019 historical identity/evidence cohort remains excluded."
  },

  canonicalBaseline: {
    passScale: BASELINE_SCALE,
    rushScale: BASELINE_SCALE,

    parityTolerance:
      TOLERANCE,

    parity:
      baselineParity
  },

  frozenProductionBoundaries: {
    canonicalDecisionModelChanged:
      false,

    productionMatchupEngineChanged:
      false,

    productionMatchupWeightsChanged:
      false,

    evidenceQualityChanged:
      false,

    playerImpactChanged:
      false,

    teamStrengthChanged:
      false,

    pickemChanged:
      false
  },

  candidates:
    reports
};

fs.mkdirSync(
  path.dirname(OUTPUT),
  { recursive: true }
);

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(
    output,
    null,
    2
  ),
  "utf8"
);

console.log("");
console.log("=== MI.2 PASS/RUSH SCALE RESULTS ===");

for (const row of reports) {
  const m = row.fullSeason;
  const d = row.deltaVsBaseline;

  console.log(
    [
      row.id,
      `n=${m.sampleSize}`,
      `acc=${(m.winnerAccuracy * 100).toFixed(2)}%`,
      `brier=${m.brierScore.toFixed(6)}`,
      `logloss=${m.logLoss.toFixed(6)}`,
      `mae=${m.marginMAE.toFixed(4)}`,
      `dAcc=${(d.winnerAccuracy * 100).toFixed(3)}pp`,
      `dBrier=${d.brierScore.toFixed(6)}`,
      `dLogLoss=${d.logLoss.toFixed(6)}`,
      `dMAE=${d.marginMAE.toFixed(4)}`,
      `flips=${row.favoriteFlips}`,
      `netCorrected=${row.netCorrectedFavoriteFlips}`
    ].join(" | ")
  );
}

console.log("");
console.log(
  `Wrote RESEARCH_ONLY MI.2 report:\n${OUTPUT}`
);
