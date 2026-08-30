import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

import {
  evaluateNFLMatchupIntelligence,
} from "../src/engines/matchupIntelligence/NFLMatchupIntelligenceEngine.js";

import {
  predictNFLCandidate,
} from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";

const SNAPSHOT_SOURCE = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js"
);

const DECISION_SOURCE = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js"
);

const MODEL_SOURCE = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js"
);

const OUTPUT = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLAdvancedEarlySeasonAblationPI2.json"
);

const REPORT_CONTRACT = "NFLAdvancedEarlySeasonAblationPI2";
const REPORT_VERSION = "1.0.0";

const WINDOWS = Object.freeze([
  { id: "WEEK_1", minWeek: 1, maxWeek: 1 },
  { id: "WEEKS_1_2", minWeek: 1, maxWeek: 2 },
  { id: "WEEKS_1_4", minWeek: 1, maxWeek: 4 },
  { id: "WEEKS_1_6", minWeek: 1, maxWeek: 6 },
  { id: "FULL_SEASON", minWeek: 1, maxWeek: 99 },
]);

const VARIANTS = Object.freeze([
  {
    id: "BASELINE_RECOMPUTED",
    description:
      "Recompute the historical snapshot with its original advanced evidence unchanged.",
  },
  {
    id: "CURRENT_ONLY_ADVANCED",
    description:
      "Remove only advanced evidence whose evidence season is prior to the game season.",
  },
  {
    id: "NO_ADVANCED_WEEK_1",
    description:
      "Remove all advanced evidence for Week 1 only.",
  },
  {
    id: "NO_ADVANCED_WEEKS_1_4",
    description:
      "Remove all advanced evidence for Weeks 1-4.",
  },
]);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function gameKey(game = {}) {
  return String(game.gameId || "").trim();
}

function outcome(record = {}) {
  const home = number(record?.outcome?.homeScore);
  const away = number(record?.outcome?.awayScore);

  if (home === null || away === null || home === away) {
    return null;
  }

  return {
    homeScore: home,
    awayScore: away,
    margin: home - away,
    homeWin: home > away ? 1 : 0,
  };
}

function advancedSeason(teamEvidence = {}) {
  return number(
    teamEvidence?.advancedMatchupEvidence?.season
  );
}

function removePriorSeasonAdvanced(teamEvidence, gameSeason) {
  const copy = clone(teamEvidence || {});
  const evidenceSeason = advancedSeason(copy);

  if (
    evidenceSeason !== null &&
    evidenceSeason < Number(gameSeason)
  ) {
    copy.advancedMatchupEvidence = null;
  }

  return copy;
}

function withoutAdvanced(teamEvidence) {
  const copy = clone(teamEvidence || {});
  copy.advancedMatchupEvidence = null;
  return copy;
}

function variantEvidence(snapshot, variantId) {
  const game = snapshot.game || {};
  const week = Number(game.week);
  const season = Number(game.season);

  let home = clone(snapshot?.evidence?.home || {});
  let away = clone(snapshot?.evidence?.away || {});

  if (variantId === "CURRENT_ONLY_ADVANCED") {
    home = removePriorSeasonAdvanced(home, season);
    away = removePriorSeasonAdvanced(away, season);
  }

  if (variantId === "NO_ADVANCED_WEEK_1" && week === 1) {
    home = withoutAdvanced(home);
    away = withoutAdvanced(away);
  }

  if (
    variantId === "NO_ADVANCED_WEEKS_1_4" &&
    week >= 1 &&
    week <= 4
  ) {
    home = withoutAdvanced(home);
    away = withoutAdvanced(away);
  }

  return { home, away };
}

function recomputeMatchup(snapshot, variantId) {
  const game = snapshot.game || {};
  const { home, away } = variantEvidence(
    snapshot,
    variantId
  );

  return evaluateNFLMatchupIntelligence({
    gameId: game.gameId || null,
    season: Number(game.season),
    week: Number(game.week),
    awayTeam: game.awayTeam,
    homeTeam: game.homeTeam,
    awayIntelligence: away,
    homeIntelligence: home,
    context: {
      homeField: true,
      homeRestDays: number(game.homeRest),
      awayRestDays: number(game.awayRest),
    },
  });
}

function decisionRecord(record, matchup) {
  return {
    ...record,
    pregame: {
      ...(record.pregame || {}),
      matchupEdge: matchup.matchupEdge,
      evidenceQuality: matchup.evidenceQuality,
      dimensions: matchup.dimensions,
      context: matchup.context,
      sourceVersion: matchup.version,
    },
  };
}

function predictionFor(record, modelConfig) {
  return predictNFLCandidate(
    modelConfig.modelId,
    record,
    modelConfig.parameters
  );
}

function metricAccumulator() {
  return {
    sampleSize: 0,
    correct: 0,
    brier: 0,
    logLoss: 0,
    marginAbsoluteError: 0,
  };
}

function addMetric(acc, prediction, result) {
  if (!result) return;

  const p = Math.min(
    1 - 1e-15,
    Math.max(1e-15, prediction.homeWinProbability)
  );

  acc.sampleSize += 1;
  acc.correct +=
    (p >= 0.5 ? 1 : 0) === result.homeWin ? 1 : 0;
  acc.brier += (p - result.homeWin) ** 2;
  acc.logLoss += -(
    result.homeWin * Math.log(p) +
    (1 - result.homeWin) * Math.log(1 - p)
  );
  acc.marginAbsoluteError += Math.abs(
    prediction.expectedHomeMargin - result.margin
  );
}

function finishMetric(acc) {
  if (!acc.sampleSize) {
    return {
      sampleSize: 0,
      winnerAccuracy: null,
      brierScore: null,
      logLoss: null,
      marginMAE: null,
    };
  }

  return {
    sampleSize: acc.sampleSize,
    winnerAccuracy: acc.correct / acc.sampleSize,
    brierScore: acc.brier / acc.sampleSize,
    logLoss: acc.logLoss / acc.sampleSize,
    marginMAE:
      acc.marginAbsoluteError / acc.sampleSize,
  };
}

function withinWindow(record, window) {
  const week = Number(record?.game?.week);
  return week >= window.minWeek && week <= window.maxWeek;
}

function comparePredictions(
  baselinePrediction,
  candidatePrediction,
  result
) {
  const baselineWinner =
    baselinePrediction.homeWinProbability >= 0.5 ? 1 : 0;
  const candidateWinner =
    candidatePrediction.homeWinProbability >= 0.5 ? 1 : 0;

  const flip = baselineWinner !== candidateWinner;

  return {
    flip,
    correctedMiss:
      flip &&
      baselineWinner !== result.homeWin &&
      candidateWinner === result.homeWin,
    introducedMiss:
      flip &&
      baselineWinner === result.homeWin &&
      candidateWinner !== result.homeWin,
  };
}

const snapshotsModule = await import(
  `${pathToFileURL(SNAPSHOT_SOURCE).href}?t=${Date.now()}`
);
const recordsModule = await import(
  `${pathToFileURL(DECISION_SOURCE).href}?t=${Date.now()}`
);
const modelModule = await import(
  `${pathToFileURL(MODEL_SOURCE).href}?t=${Date.now()}`
);

const snapshots = snapshotsModule.default || [];
const records = recordsModule.default || [];
const modelConfig = modelModule.default || {};

if (!snapshots.length) {
  throw new Error(
    "Historical pregame snapshot source is empty."
  );
}

if (!records.length) {
  throw new Error(
    "Historical decision dataset is empty."
  );
}

if (!modelConfig.modelId || !modelConfig.parameters) {
  throw new Error(
    "Canonical game-decision model configuration is unavailable."
  );
}

const recordsByGameId = new Map(
  records.map((record) => [
    gameKey(record.game),
    record,
  ])
);

const comparable = snapshots
  .map((snapshot) => ({
    snapshot,
    record: recordsByGameId.get(
      gameKey(snapshot.game)
    ),
  }))
  .filter(
    ({ record }) => record && outcome(record)
  );

if (!comparable.length) {
  throw new Error(
    "No comparable historical snapshot/decision records were found."
  );
}

const parity = {
  compared: 0,
  matchupEdgeMaxAbsoluteDifference: 0,
  evidenceQualityMaxAbsoluteDifference: 0,
  mismatchesOverTolerance: 0,
  tolerance: 1e-9,
};

const resultsByVariant = new Map(
  VARIANTS.map((variant) => [variant.id, []])
);

for (const { snapshot, record } of comparable) {
  const baselineMatchup = recomputeMatchup(
    snapshot,
    "BASELINE_RECOMPUTED"
  );

  const storedEdge = number(
    snapshot?.matchup?.matchupEdge
  );
  const storedQuality = number(
    snapshot?.matchup?.evidenceQuality
  );

  const edgeDiff =
    storedEdge === null ||
    !finite(baselineMatchup.matchupEdge)
      ? 0
      : Math.abs(
          storedEdge - baselineMatchup.matchupEdge
        );

  const qualityDiff =
    storedQuality === null ||
    !finite(baselineMatchup.evidenceQuality)
      ? 0
      : Math.abs(
          storedQuality - baselineMatchup.evidenceQuality
        );

  parity.compared += 1;
  parity.matchupEdgeMaxAbsoluteDifference = Math.max(
    parity.matchupEdgeMaxAbsoluteDifference,
    edgeDiff
  );
  parity.evidenceQualityMaxAbsoluteDifference = Math.max(
    parity.evidenceQualityMaxAbsoluteDifference,
    qualityDiff
  );

  if (
    edgeDiff > parity.tolerance ||
    qualityDiff > parity.tolerance
  ) {
    parity.mismatchesOverTolerance += 1;
  }

  for (const variant of VARIANTS) {
    const matchup =
      variant.id === "BASELINE_RECOMPUTED"
        ? baselineMatchup
        : recomputeMatchup(snapshot, variant.id);

    const candidateRecord = decisionRecord(
      record,
      matchup
    );

    const prediction = predictionFor(
      candidateRecord,
      modelConfig
    );

    resultsByVariant.get(variant.id).push({
      record: candidateRecord,
      prediction,
      result: outcome(record),
      advancedSource: {
        homeSeason: advancedSeason(
          snapshot?.evidence?.home
        ),
        awaySeason: advancedSeason(
          snapshot?.evidence?.away
        ),
      },
    });
  }
}

if (parity.mismatchesOverTolerance) {
  throw new Error(
    `BASELINE_RECOMPUTATION_PARITY_FAILED: ${parity.mismatchesOverTolerance} records exceeded tolerance ${parity.tolerance}. Refuse to evaluate PI.2 ablation against a non-parity baseline.`
  );
}

const baselineRows = resultsByVariant.get(
  "BASELINE_RECOMPUTED"
);

const reports = VARIANTS.map((variant) => {
  const rows = resultsByVariant.get(variant.id);

  const windows = WINDOWS.map((window) => {
    const metric = metricAccumulator();
    let favoriteFlips = 0;
    let correctedMisses = 0;
    let introducedMisses = 0;
    let priorSeasonAdvancedGames = 0;

    rows.forEach((row, index) => {
      if (!withinWindow(row.record, window)) {
        return;
      }

      addMetric(
        metric,
        row.prediction,
        row.result
      );

      if (
        row.advancedSource.homeSeason !== null &&
        row.advancedSource.awaySeason !== null &&
        (
          row.advancedSource.homeSeason <
            Number(row.record.game.season) ||
          row.advancedSource.awaySeason <
            Number(row.record.game.season)
        )
      ) {
        priorSeasonAdvancedGames += 1;
      }

      if (variant.id !== "BASELINE_RECOMPUTED") {
        const baseline = baselineRows[index];

        const comparison = comparePredictions(
          baseline.prediction,
          row.prediction,
          row.result
        );

        favoriteFlips += comparison.flip ? 1 : 0;
        correctedMisses +=
          comparison.correctedMiss ? 1 : 0;
        introducedMisses +=
          comparison.introducedMiss ? 1 : 0;
      }
    });

    return {
      window: window.id,
      ...finishMetric(metric),
      priorSeasonAdvancedGames,
      favoriteFlips,
      correctedMisses,
      introducedMisses,
      netCorrectedFavoriteFlips:
        correctedMisses - introducedMisses,
    };
  });

  const bySeason = [
    ...new Set(
      rows.map((row) =>
        Number(row.record.game.season)
      )
    ),
  ]
    .sort((a, b) => a - b)
    .map((season) => {
      const metric = metricAccumulator();

      rows.forEach((row) => {
        if (
          Number(row.record.game.season) === season
        ) {
          addMetric(
            metric,
            row.prediction,
            row.result
          );
        }
      });

      return {
        season,
        ...finishMetric(metric),
      };
    });

  return {
    variantId: variant.id,
    description: variant.description,
    windows,
    bySeason,
  };
});

const report = {
  contract: REPORT_CONTRACT,
  version: REPORT_VERSION,
  status: "RESEARCH_ONLY",
  productionAuthorityGranted: false,
  automaticPromotion: false,
  generatedAt: new Date().toISOString(),
  canonicalModel: {
    modelId: modelConfig.modelId,
    modelVersion: modelConfig.modelVersion,
    parameters: modelConfig.parameters,
  },
  records: {
    historicalDecisionRecords: records.length,
    historicalSnapshots: snapshots.length,
    comparable: comparable.length,
  },
  baselineParity: parity,
  methodology: {
    baseline:
      "Existing historical replay evidence is recomputed through the current canonical Matchup Intelligence engine.",
    currentOnly:
      "CURRENT_ONLY_ADVANCED removes only team advanced evidence whose evidence.season is less than game.season.",
    week1Ablation:
      "NO_ADVANCED_WEEK_1 removes advanced evidence in Week 1, where the existing historical replay uses prior-season advanced evidence because no current-season sample exists.",
    earlyAblation:
      "NO_ADVANCED_WEEKS_1_4 removes all advanced evidence in Weeks 1-4 to measure total early-season advanced contribution.",
    protectionPressure:
      "No special promotion assumption is made for protectionPressure; the experiment evaluates the canonical dimensions as generated.",
    note:
      "This experiment changes research replay inputs only. It does not change production Matchup weights, Team Strength, Decision Model parameters, or runtime evidence.",
  },
  variants: reports,
};

fs.mkdirSync(path.dirname(OUTPUT), {
  recursive: true,
});

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log(
  `PI.2 advanced early-season ablation: ${comparable.length} comparable historical games`
);
console.log(
  `Baseline parity: ${parity.mismatchesOverTolerance} mismatches over tolerance ${parity.tolerance}`
);

for (const variant of reports) {
  console.log(`\n${variant.variantId}`);

  for (const window of variant.windows) {
    const accuracy =
      window.winnerAccuracy === null
        ? "n/a"
        : `${(window.winnerAccuracy * 100).toFixed(2)}%`;

    const brier =
      window.brierScore === null
        ? "n/a"
        : window.brierScore.toFixed(4);

    const logLoss =
      window.logLoss === null
        ? "n/a"
        : window.logLoss.toFixed(4);

    const mae =
      window.marginMAE === null
        ? "n/a"
        : window.marginMAE.toFixed(3);

    console.log(
      `${window.window}: n=${window.sampleSize} accuracy=${accuracy} brier=${brier} logloss=${logLoss} marginMAE=${mae} priorFallbackGames=${window.priorSeasonAdvancedGames} flips=${window.favoriteFlips} corrected=${window.correctedMisses} introduced=${window.introducedMisses}`
    );
  }
}

console.log(
  `\nWrote RESEARCH_ONLY PI.2 report to:\n${OUTPUT}`
);
