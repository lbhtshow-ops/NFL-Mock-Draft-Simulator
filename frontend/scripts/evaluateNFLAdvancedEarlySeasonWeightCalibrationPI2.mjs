import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

import {
  predictNFLCandidate,
} from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";

import {
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS,
  resolveNFLAdvancedEarlySeasonWeightMultiplierPI2,
} from "../src/engines/matchupIntelligence/research/NFLAdvancedEarlySeasonWeightPolicyPI2.js";

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
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLAdvancedEarlySeasonWeightCalibrationPI2.json"
);

const REPORT_CONTRACT =
  "NFLAdvancedEarlySeasonWeightCalibrationPI2";

const REPORT_VERSION = "1.0.0";

const ADVANCED_DIMENSIONS = new Set([
  "protectionPressure",
  "explosivePlay",
  "redZone",
]);

const WEIGHTS = Object.freeze({
  overallStrength: 0.30,
  passMatchup: 0.14,
  rushMatchup: 0.08,
  protectionPressure: 0.10,
  explosivePlay: 0.08,
  redZone: 0.06,
  recentForm: 0.07,
  specialTeams: 0.04,
  quarterback: 0.06,
  availability: 0.03,
  weatherStyle: 0.01,
  homeField: 0.02,
  rest: 0.01,
});

const WINDOWS = Object.freeze([
  { id: "WEEK_1", maxWeek: 1 },
  { id: "WEEKS_1_2", maxWeek: 2 },
  { id: "WEEKS_1_4", maxWeek: 4 },
  { id: "WEEKS_1_6", maxWeek: 6 },
  { id: "FULL_SEASON", maxWeek: 99 },
]);

const POLICY_IDS = Object.freeze([
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE,
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.MATURITY_ALIGNED,
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.WEEK_RAMP,
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.EARLY_25,
]);

const PRIMARY_CANDIDATE =
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.MATURITY_ALIGNED;

const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);

function gameKey(game = {}) {
  return String(game?.gameId || "").trim();
}

function outcome(record = {}) {
  const home = Number(record?.outcome?.homeScore);
  const away = Number(record?.outcome?.awayScore);

  if (
    !Number.isFinite(home) ||
    !Number.isFinite(away) ||
    home === away
  ) {
    return null;
  }

  return {
    homeWin: home > away ? 1 : 0,
    margin: home - away,
  };
}

function weightedAverage(parts = []) {
  const valid = parts.filter(
    (part) =>
      finite(part?.value) &&
      finite(part?.weight) &&
      part.weight > 0
  );

  if (!valid.length) return null;

  const totalWeight = valid.reduce(
    (sum, part) => sum + part.weight,
    0
  );

  return valid.reduce(
    (sum, part) =>
      sum + part.value * part.weight,
    0
  ) / totalWeight;
}

function recomputeMatchupEdge(snapshot, policyId) {
  const multiplier =
    resolveNFLAdvancedEarlySeasonWeightMultiplierPI2({
      snapshot,
      policyId,
    });

  const dimensions = snapshot?.matchup?.dimensions || {};
  const context = snapshot?.matchup?.context || {};

  const parts = Object.entries(WEIGHTS).map(
    ([key, baseWeight]) => {
      const value =
        key === "homeField" || key === "rest"
          ? context[key]
          : dimensions[key];

      return {
        key,
        value,
        weight:
          baseWeight *
          (
            ADVANCED_DIMENSIONS.has(key)
              ? multiplier
              : 1
          ),
      };
    }
  );

  return {
    matchupEdge: weightedAverage(parts),
    advancedWeightMultiplier: multiplier,
  };
}

function buildPredictionRecord(
  historicalRecord,
  snapshot,
  policyId
) {
  const recomputed =
    recomputeMatchupEdge(snapshot, policyId);

  return {
    record: {
      ...historicalRecord,
      pregame: {
        ...(historicalRecord.pregame || {}),
        matchupEdge: recomputed.matchupEdge,
        evidenceQuality:
          snapshot?.matchup?.evidenceQuality ?? null,
      },
    },
    advancedWeightMultiplier:
      recomputed.advancedWeightMultiplier,
  };
}

function metric(rows = []) {
  if (!rows.length) {
    return {
      sampleSize: 0,
      winnerAccuracy: null,
      brierScore: null,
      logLoss: null,
      marginMAE: null,
    };
  }

  let correct = 0;
  let brier = 0;
  let logLoss = 0;
  let marginError = 0;

  for (const row of rows) {
    const probability = Math.min(
      1 - 1e-15,
      Math.max(
        1e-15,
        row.prediction.homeWinProbability
      )
    );

    correct +=
      (probability >= 0.5 ? 1 : 0) ===
      row.outcome.homeWin
        ? 1
        : 0;

    brier +=
      (probability - row.outcome.homeWin) ** 2;

    logLoss += -(
      row.outcome.homeWin * Math.log(probability) +
      (1 - row.outcome.homeWin) *
        Math.log(1 - probability)
    );

    marginError += Math.abs(
      row.prediction.expectedHomeMargin -
      row.outcome.margin
    );
  }

  return {
    sampleSize: rows.length,
    winnerAccuracy: correct / rows.length,
    brierScore: brier / rows.length,
    logLoss: logLoss / rows.length,
    marginMAE: marginError / rows.length,
  };
}

function difference(candidate, baseline) {
  return {
    accuracyGain:
      candidate.winnerAccuracy -
      baseline.winnerAccuracy,
    brierGain:
      baseline.brierScore -
      candidate.brierScore,
    logLossGain:
      baseline.logLoss -
      candidate.logLoss,
    marginMAEGain:
      baseline.marginMAE -
      candidate.marginMAE,
  };
}

function favoriteFlipSummary(
  baselineRows,
  candidateRows
) {
  let favoriteFlips = 0;
  let correctedMisses = 0;
  let introducedMisses = 0;

  for (
    let index = 0;
    index < baselineRows.length;
    index += 1
  ) {
    const baseline = baselineRows[index];
    const candidate = candidateRows[index];

    const baselineWinner =
      baseline.prediction.homeWinProbability >= 0.5
        ? 1
        : 0;

    const candidateWinner =
      candidate.prediction.homeWinProbability >= 0.5
        ? 1
        : 0;

    if (baselineWinner === candidateWinner) {
      continue;
    }

    favoriteFlips += 1;

    if (
      baselineWinner !== baseline.outcome.homeWin &&
      candidateWinner === candidate.outcome.homeWin
    ) {
      correctedMisses += 1;
    }

    if (
      baselineWinner === baseline.outcome.homeWin &&
      candidateWinner !== candidate.outcome.homeWin
    ) {
      introducedMisses += 1;
    }
  }

  return {
    favoriteFlips,
    correctedMisses,
    introducedMisses,
    netCorrectedFavoriteFlips:
      correctedMisses - introducedMisses,
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

if (!snapshots.length || !records.length) {
  throw new Error(
    "PI.2 calibration requires historical snapshots and decision records."
  );
}

if (!modelConfig.modelId || !modelConfig.parameters) {
  throw new Error(
    "Canonical Decision Model configuration is unavailable."
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
    historicalRecord:
      recordsByGameId.get(gameKey(snapshot.game)) || null,
  }))
  .filter(
    ({ historicalRecord }) =>
      historicalRecord &&
      outcome(historicalRecord)
  );

const rowsByPolicy = new Map(
  POLICY_IDS.map((policyId) => [policyId, []])
);

const parity = {
  compared: 0,
  maxAbsoluteMatchupEdgeDifference: 0,
  mismatchesOverTolerance: 0,
  tolerance: 1e-9,
};

for (const item of comparable) {
  const {
    snapshot,
    historicalRecord,
  } = item;

  for (const policyId of POLICY_IDS) {
    const prepared =
      buildPredictionRecord(
        historicalRecord,
        snapshot,
        policyId
      );

    const prediction =
      predictNFLCandidate(
        modelConfig.modelId,
        prepared.record,
        modelConfig.parameters
      );

    rowsByPolicy
      .get(policyId)
      .push({
        gameId: gameKey(snapshot.game),
        season: Number(snapshot.game.season),
        week: Number(snapshot.game.week),
        outcome: outcome(historicalRecord),
        prediction,
        advancedWeightMultiplier:
          prepared.advancedWeightMultiplier,
      });

    if (
      policyId ===
      NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE
    ) {
      const stored =
        Number(snapshot?.matchup?.matchupEdge);

      const recomputed =
        Number(prepared.record.pregame.matchupEdge);

      const delta =
        Number.isFinite(stored) &&
        Number.isFinite(recomputed)
          ? Math.abs(stored - recomputed)
          : 0;

      parity.compared += 1;

      parity.maxAbsoluteMatchupEdgeDifference =
        Math.max(
          parity.maxAbsoluteMatchupEdgeDifference,
          delta
        );

      if (delta > parity.tolerance) {
        parity.mismatchesOverTolerance += 1;
      }
    }
  }
}

if (parity.mismatchesOverTolerance) {
  throw new Error(
    `PI2_BASELINE_PARITY_FAILED: ${parity.mismatchesOverTolerance} historical records exceeded tolerance ${parity.tolerance}.`
  );
}

const baselineRows = rowsByPolicy.get(
  NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE
);

const policyReports = POLICY_IDS.map((policyId) => {
  const rows = rowsByPolicy.get(policyId);

  const windows = WINDOWS.map((window) => {
    const candidateWindow =
      rows.filter(
        (row) =>
          row.week <= window.maxWeek
      );

    const baselineWindow =
      baselineRows.filter(
        (row) =>
          row.week <= window.maxWeek
      );

    const candidateMetric =
      metric(candidateWindow);

    const baselineMetric =
      metric(baselineWindow);

    return {
      window: window.id,
      ...candidateMetric,
      gainsAgainstBaseline:
        difference(
          candidateMetric,
          baselineMetric
        ),
      ...(policyId ===
      NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE
        ? {
            favoriteFlips: 0,
            correctedMisses: 0,
            introducedMisses: 0,
            netCorrectedFavoriteFlips: 0,
          }
        : favoriteFlipSummary(
            baselineWindow,
            candidateWindow
          )),
    };
  });

  const seasons = [
    ...new Set(
      rows.map((row) => row.season)
    ),
  ].sort((a, b) => a - b);

  const bySeason = seasons.map((season) => {
    const candidateSeason =
      rows.filter(
        (row) => row.season === season
      );

    const baselineSeason =
      baselineRows.filter(
        (row) => row.season === season
      );

    const candidateMetric =
      metric(candidateSeason);

    const baselineMetric =
      metric(baselineSeason);

    return {
      season,
      ...candidateMetric,
      gainsAgainstBaseline:
        difference(
          candidateMetric,
          baselineMetric
        ),
    };
  });

  return {
    policyId,
    windows,
    bySeason,
  };
});

const baselineReport =
  policyReports.find(
    (report) =>
      report.policyId ===
      NFL_ADVANCED_EARLY_SEASON_POLICY_IDS.BASELINE
  );

const primaryReport =
  policyReports.find(
    (report) =>
      report.policyId === PRIMARY_CANDIDATE
  );

function window(report, id) {
  return report.windows.find(
    (entry) => entry.window === id
  );
}

const week1 =
  window(primaryReport, "WEEK_1");

const weeks14 =
  window(primaryReport, "WEEKS_1_4");

const full =
  window(primaryReport, "FULL_SEASON");

const seasonRows =
  primaryReport.bySeason;

const seasonBrierWinRate =
  seasonRows.filter(
    (row) =>
      row.gainsAgainstBaseline.brierGain > 0
  ).length /
  seasonRows.length;

const seasonLogLossWinRate =
  seasonRows.filter(
    (row) =>
      row.gainsAgainstBaseline.logLossGain > 0
  ).length /
  seasonRows.length;

const seasonMarginWinRate =
  seasonRows.filter(
    (row) =>
      row.gainsAgainstBaseline.marginMAEGain > 0
  ).length /
  seasonRows.length;

const checks = [
  {
    id: "baseline-parity",
    passed:
      parity.mismatchesOverTolerance === 0,
  },
  {
    id: "week1-winner-accuracy-not-worse",
    passed:
      week1.gainsAgainstBaseline.accuracyGain >=
      -1e-12,
  },
  {
    id: "weeks1-4-winner-accuracy-not-materially-worse",
    passed:
      weeks14.gainsAgainstBaseline.accuracyGain >=
      -0.005,
  },
  {
    id: "weeks1-4-brier-improves",
    passed:
      weeks14.gainsAgainstBaseline.brierGain > 0,
  },
  {
    id: "weeks1-4-logloss-improves",
    passed:
      weeks14.gainsAgainstBaseline.logLossGain > 0,
  },
  {
    id: "weeks1-4-margin-mae-improves",
    passed:
      weeks14.gainsAgainstBaseline.marginMAEGain > 0,
  },
  {
    id: "full-season-winner-accuracy-not-worse",
    passed:
      full.gainsAgainstBaseline.accuracyGain >=
      -1e-12,
  },
  {
    id: "full-season-brier-improves",
    passed:
      full.gainsAgainstBaseline.brierGain > 0,
  },
  {
    id: "full-season-logloss-improves",
    passed:
      full.gainsAgainstBaseline.logLossGain > 0,
  },
  {
    id: "full-season-margin-mae-improves",
    passed:
      full.gainsAgainstBaseline.marginMAEGain > 0,
  },
  {
    id: "season-brier-consistency",
    passed:
      seasonBrierWinRate >= 0.70,
  },
  {
    id: "season-logloss-consistency",
    passed:
      seasonLogLossWinRate >= 0.70,
  },
  {
    id: "season-margin-consistency",
    passed:
      seasonMarginWinRate >= 0.70,
  },
];

const failedChecks =
  checks
    .filter((check) => !check.passed)
    .map((check) => check.id);

const gateStatus =
  failedChecks.length
    ? "HOLD_RESEARCH_ONLY"
    : "PROMOTION_ELIGIBLE_RESEARCH_ONLY";

const report = {
  contract: REPORT_CONTRACT,
  version: REPORT_VERSION,
  status: "RESEARCH_ONLY",
  generatedAt: new Date().toISOString(),

  productionAuthorityGranted: false,
  automaticPromotion: false,

  canonicalModel: {
    modelId: modelConfig.modelId,
    modelVersion: modelConfig.modelVersion,
    parameters: modelConfig.parameters,
  },

  records: {
    historicalSnapshots: snapshots.length,
    historicalDecisionRecords: records.length,
    comparable: comparable.length,
  },

  baselineParity: parity,

  primaryCandidate: {
    policyId: PRIMARY_CANDIDATE,
    rationale:
      "Preserve full prior-season Week 1 advanced contribution, then scale current-season advanced Matchup Edge contribution by the existing canonical Team Strength maturity reliability. This is research-only and does not alter production Matchup weights.",
  },

  policyReports,

  promotionGate: {
    status: gateStatus,
    authoritative: false,
    automaticPromotion: false,
    checks,
    failedChecks,
    seasonalConsistency: {
      seasons: seasonRows.length,
      brierWinRate:
        seasonBrierWinRate,
      logLossWinRate:
        seasonLogLossWinRate,
      marginMAEWinRate:
        seasonMarginWinRate,
    },
    note:
      "Eligibility is evidence for a future governed production implementation. It does not grant production authority.",
  },

  safeguards: {
    decisionModelParametersChanged: false,
    baseMatchupWeightsChanged: false,
    playerImpactActivated: false,
    teamStrengthMutated: false,
    databaseMutation: false,
    runtimeProductionBehaviorChanged: false,
  },
};

fs.mkdirSync(
  path.dirname(OUTPUT),
  { recursive: true }
);

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log(
  `PI.2 advanced early-season weight calibration: ${comparable.length} comparable historical games`
);

console.log(
  `Baseline parity: ${parity.mismatchesOverTolerance} mismatches over tolerance ${parity.tolerance}`
);

for (const policy of policyReports) {
  console.log(`\n${policy.policyId}`);

  for (const entry of policy.windows) {
    const gains =
      entry.gainsAgainstBaseline;

    console.log(
      `${entry.window}: n=${entry.sampleSize} accuracy=${(entry.winnerAccuracy * 100).toFixed(2)}% brier=${entry.brierScore.toFixed(4)} logloss=${entry.logLoss.toFixed(4)} marginMAE=${entry.marginMAE.toFixed(3)} | gains accuracy=${(gains.accuracyGain * 100).toFixed(2)}pp brier=${gains.brierGain.toFixed(5)} logloss=${gains.logLossGain.toFixed(5)} marginMAE=${gains.marginMAEGain.toFixed(4)} flips=${entry.favoriteFlips}`
    );
  }
}

console.log(
  `\nPrimary candidate: ${PRIMARY_CANDIDATE}`
);

console.log(
  `PI.2 promotion gate: ${gateStatus}`
);

for (const check of checks) {
  console.log(
    `${check.passed ? "PASS" : "FAIL"} — ${check.id}`
  );
}

console.log(
  `\nWrote RESEARCH_ONLY PI.2 calibration report to:\n${OUTPUT}`
);
