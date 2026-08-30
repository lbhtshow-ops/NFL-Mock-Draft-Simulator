import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pathToFileURL } from "url";

import {
  predictNFLCandidate,
} from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";

const CONTRACT = "NFLPlayerImpactCanonicalDecisionAblationPI4";
const VERSION = "FIE-PI4-CANONICAL-DECISION-PLAYER-IMPACT-ABLATION-1.0.0";

const SEASONS = Object.freeze([2020, 2021, 2022, 2023, 2024]);
const EXPECTED_VARIANT = "VERY_HIGH_ONLY";
const EXPECTED_SCALE = 0.20;
const EXPECTED_HASH =
  "cae105f496626d4064bf76220406b5b62eb1442f9dcf39a3f0bfe319890810e4";

const IMPACT_ROOT = path.resolve(
  "data/calibration/historical/expansion-2020-2021/player-impact"
);

const SELECTED_PATH = path.join(
  IMPACT_ROOT,
  "player-impact-candidate-2d4-r3-selected-v1.json"
);

const CONFIRMATION_PATH = path.join(
  IMPACT_ROOT,
  "player-impact-fixed-candidate-confirmation-2d4-r4-v1.json"
);

const LEGACY_EFFECTS = path.resolve(
  "data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl"
);

const EXPANSION_EFFECTS = path.join(
  IMPACT_ROOT,
  "matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl"
);

const LEGACY_OBSERVATIONS = path.resolve(
  "data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl"
);

const EXPANSION_OBSERVATIONS = path.join(
  IMPACT_ROOT,
  "matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl"
);

const LEGACY_OUTCOMES = path.resolve(
  "data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl"
);

const EXPANSION_OUTCOMES = path.join(
  IMPACT_ROOT,
  "matched-att/historical-availability-matched-outcomes-2020-2021-v1.jsonl"
);

const DECISION_SOURCE = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js"
);

const MODEL_SOURCE = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCanonicalGameDecisionModelV1.js"
);

const OUTPUT = path.join(
  IMPACT_ROOT,
  "player-impact-canonical-decision-ablation-pi4-v1.json"
);

const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);

const mean = (values) => {
  const usable = values.filter(finite);
  return usable.length
    ? usable.reduce((a, b) => a + b, 0) / usable.length
    : null;
};

function percentile(values, p) {
  const usable = values.filter(finite).slice().sort((a, b) => a - b);
  if (!usable.length) return null;
  const index = (usable.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return usable[lo];
  return usable[lo] + (usable[hi] - usable[lo]) * (index - lo);
}

function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required JSON artifact: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonl(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required JSONL artifact: ${file}`);
  }
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function keyEffect(row) {
  const treated = row?.treated || {};
  return [
    treated.season,
    treated.week,
    treated.gameId,
    treated.team,
  ].join("|");
}

function keyObservation(row) {
  const identity = row?.identity || {};
  return [
    identity.season,
    identity.week,
    identity.gameId,
    identity.team,
  ].join("|");
}

function effectValue(row) {
  const value = row?.effect?.treatedMinusControlResidual;
  return finite(value) ? Number(value) : null;
}

function lossGap(observation) {
  const p = observation?.pregame || {};
  if (finite(p.playerCaliber) && finite(p.replacementCaliber)) {
    return Math.max(0, p.playerCaliber - p.replacementCaliber);
  }
  if (finite(p.expectedReplacementDelta)) {
    return Math.max(0, p.expectedReplacementDelta);
  }
  return null;
}

function severity(value) {
  if (!finite(value)) return "UNKNOWN";
  if (value >= 15) return "VERY_HIGH";
  if (value >= 8) return "HIGH";
  if (value >= 3) return "MODERATE";
  return "LOW";
}

function positionGroup(position) {
  const p = String(position || "UNKNOWN").toUpperCase();
  if (["C", "G", "OG", "T", "OT", "OL", "IOL"].includes(p)) return "OL";
  if (["CB", "S", "FS", "SS", "DB", "SAF"].includes(p)) return "SECONDARY";
  if (["DE", "DT", "NT", "DL", "EDGE"].includes(p)) return "DL_EDGE";
  if (["LB", "ILB", "OLB", "MLB"].includes(p)) return "LB";
  if (["RB", "HB", "FB"].includes(p)) return "RB";
  if (["K", "P", "LS", "ST"].includes(p)) return "SPECIALISTS";
  return p;
}

function features(observations) {
  const positions = [
    ...new Set(
      observations.map((o) =>
        positionGroup(o?.identity?.position)
      )
    ),
  ].sort();

  const gaps = observations
    .map(lossGap)
    .filter(finite);

  const qbPresent = positions.includes("QB");
  const count = observations.length;

  return {
    countBucket:
      count >= 3 ? "THREE_PLUS" : count === 2 ? "TWO" : "ONE",
    primaryPositionGroup:
      qbPresent ? "QB" : positions.length === 1 ? positions[0] : "MULTI",
    severityBucket: severity(gaps.length ? Math.max(...gaps) : null),
    qbPresent,
  };
}

function candidateKeys(feature, variant) {
  const p = feature.primaryPositionGroup;
  const s = feature.severityBucket;
  const c = feature.countBucket;

  if (variant === "R2_FULL") {
    return [
      ["EXACT", p, s, c],
      ["POSITION_SEVERITY", p, s],
      ["SEVERITY", s],
      ["POSITION", p],
      ["GLOBAL"],
    ];
  }
  if (variant === "NO_COUNT") {
    return [
      ["POSITION_SEVERITY", p, s],
      ["SEVERITY", s],
      ["POSITION", p],
      ["GLOBAL"],
    ];
  }
  if (variant === "SEVERITY_ONLY") {
    return [["SEVERITY", s], ["GLOBAL"]];
  }
  if (variant === "POSITION_ONLY") {
    return [["POSITION", p], ["GLOBAL"]];
  }
  if (variant === "HIGH_PLUS_ONLY") {
    return ["HIGH", "VERY_HIGH"].includes(s)
      ? [["SEVERITY", s], ["GLOBAL"]]
      : [["ZERO"]];
  }
  if (variant === "VERY_HIGH_ONLY") {
    return s === "VERY_HIGH"
      ? [["SEVERITY", "VERY_HIGH"], ["GLOBAL"]]
      : [["ZERO"]];
  }
  throw new Error(`Unknown candidate variant: ${variant}`);
}

const MIN_N = Object.freeze({
  EXACT: 12,
  POSITION_SEVERITY: 15,
  SEVERITY: 25,
  POSITION: 25,
  GLOBAL: 1,
});

function serializedKey(parts) {
  return JSON.stringify(parts);
}

function fit(train, variant) {
  const lookup = new Map();
  const effects = train.map((row) => row.effect).filter(finite);
  const lo = percentile(effects, 0.05);
  const hi = percentile(effects, 0.95);

  for (const row of train) {
    for (const key of candidateKeys(row.features, variant)) {
      if (key[0] === "ZERO") continue;
      const sk = serializedKey(key);
      if (!lookup.has(sk)) lookup.set(sk, []);
      lookup.get(sk).push(row.effect);
    }
  }

  return { lookup, lo, hi };
}

function predictImpact(row, fitted, variant) {
  for (const key of candidateKeys(row.features, variant)) {
    if (key[0] === "ZERO") {
      return { raw: 0, mode: "ZERO", trainingStratumN: 0 };
    }

    const values = fitted.lookup.get(serializedKey(key)) || [];
    if (values.length >= MIN_N[key[0]]) {
      const raw = mean(values);
      return {
        raw: Math.max(fitted.lo, Math.min(fitted.hi, raw)),
        mode: key[0],
        trainingStratumN: values.length,
      };
    }
  }

  return {
    raw: null,
    mode: "NONE",
    trainingStratumN: 0,
  };
}

function winnerCorrect(predictedMargin, actualMargin) {
  if (predictedMargin === 0 || actualMargin === 0) return null;
  return (predictedMargin > 0) === (actualMargin > 0);
}

function rowMetrics(records) {
  const usable = records.filter(
    (r) =>
      finite(r.baselineError) &&
      finite(r.candidateError)
  );

  const abs = (x) => Math.abs(x);
  const sq = (x) => x * x;

  const baselineWinner = usable
    .map((r) => r.baselineWinnerCorrect)
    .filter((v) => typeof v === "boolean");

  const candidateWinner = usable
    .map((r) => r.candidateWinnerCorrect)
    .filter((v) => typeof v === "boolean");

  return {
    rows: usable.length,
    baselineMAE: mean(usable.map((r) => abs(r.baselineError))),
    candidateMAE: mean(usable.map((r) => abs(r.candidateError))),
    baselineRMSE: Math.sqrt(mean(usable.map((r) => sq(r.baselineError)))),
    candidateRMSE: Math.sqrt(mean(usable.map((r) => sq(r.candidateError)))),
    baselineWinnerAccuracy:
      baselineWinner.filter(Boolean).length / baselineWinner.length,
    candidateWinnerAccuracy:
      candidateWinner.filter(Boolean).length / candidateWinner.length,
    baselineLargeErrors14Plus:
      usable.filter((r) => abs(r.baselineError) >= 14).length,
    candidateLargeErrors14Plus:
      usable.filter((r) => abs(r.candidateError) >= 14).length,
    favoriteFlips: usable.filter((r) => r.favoriteFlip).length,
    meanAppliedDelta: mean(usable.map((r) => r.appliedDelta)),
    meanAbsoluteAppliedDelta: mean(
      usable.map((r) => Math.abs(r.appliedDelta))
    ),
  };
}

function close(a, b, tolerance = 1e-9) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return (a === null || a === undefined) && (b === null || b === undefined);
  }
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}

function computeCandidateHash(selected) {
  // Python json.dumps(..., sort_keys=True, separators=(",",":")) equivalent
  const canonical = {
    metrics: selected.metrics,
    scale: selected.scale,
    variant: selected.variant,
  };

  const sortRecursively = (value) => {
    if (Array.isArray(value)) return value.map(sortRecursively);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, sortRecursively(value[key])])
      );
    }
    return value;
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(sortRecursively(canonical)))
    .digest("hex");
}

function gameMetric(rows) {
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
    const p = Math.min(
      1 - 1e-15,
      Math.max(1e-15, row.prediction.homeWinProbability)
    );

    const actualMargin =
      Number(row.record.outcome.homeScore) -
      Number(row.record.outcome.awayScore);

    const y = actualMargin > 0 ? 1 : 0;

    correct += (p >= 0.5 ? 1 : 0) === y ? 1 : 0;
    brier += (p - y) ** 2;
    logLoss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
    marginError += Math.abs(
      row.prediction.expectedHomeMargin - actualMargin
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

function gains(candidate, baseline) {
  return {
    accuracyGain:
      candidate.winnerAccuracy - baseline.winnerAccuracy,
    brierGain:
      baseline.brierScore - candidate.brierScore,
    logLossGain:
      baseline.logLoss - candidate.logLoss,
    marginMAEGain:
      baseline.marginMAE - candidate.marginMAE,
  };
}

const selectedArtifact = readJson(SELECTED_PATH);
const confirmationArtifact = readJson(CONFIRMATION_PATH);

const selected = selectedArtifact?.selected;

if (!selected) {
  throw new Error("PI4_SELECTED_CANDIDATE_MISSING");
}

if (
  selected.variant !== EXPECTED_VARIANT ||
  Number(selected.scale) !== EXPECTED_SCALE
) {
  throw new Error(
    `PI4_FROZEN_CANDIDATE_MISMATCH expected ${EXPECTED_VARIANT}/${EXPECTED_SCALE}, got ${selected.variant}/${selected.scale}`
  );
}

const confirmationHash =
  confirmationArtifact?.frozenCandidate?.candidateHash;

if (confirmationHash !== EXPECTED_HASH) {
  throw new Error(
    `PI4_CONFIRMATION_HASH_MISMATCH expected ${EXPECTED_HASH}, got ${confirmationHash}`
  );
}

const computedHash = computeCandidateHash(selected);

if (computedHash !== EXPECTED_HASH) {
  throw new Error(
    `PI4_SELECTED_HASH_MISMATCH expected ${EXPECTED_HASH}, got ${computedHash}`
  );
}

const effects = [
  ...readJsonl(LEGACY_EFFECTS),
  ...readJsonl(EXPANSION_EFFECTS),
];

const observations = [
  ...readJsonl(LEGACY_OBSERVATIONS),
  ...readJsonl(EXPANSION_OBSERVATIONS),
];

const outcomes = [
  ...readJsonl(LEGACY_OUTCOMES),
  ...readJsonl(EXPANSION_OUTCOMES),
];

const observationMap = new Map();

for (const observation of observations) {
  const key = keyObservation(observation);
  if (!observationMap.has(key)) observationMap.set(key, []);
  observationMap.get(key).push(observation);
}

const outcomeMap = new Map(
  outcomes
    .filter((row) => row?.pairId)
    .map((row) => [row.pairId, row])
);

const researchRows = [];

for (const effect of effects) {
  const effectNumber = effectValue(effect);
  const obs = observationMap.get(keyEffect(effect)) || [];
  const matchedOutcome = outcomeMap.get(effect?.pairId);

  if (!finite(effectNumber) || !obs.length || !matchedOutcome) continue;

  const treatedOutcome =
    matchedOutcome?.treated?.outcome || {};

  const baseline =
    treatedOutcome.expectedTeamMargin;
  const actual =
    treatedOutcome.actualTeamMargin;

  if (!finite(baseline) || !finite(actual)) continue;

  const treated = effect?.treated || {};

  researchRows.push({
    pairId: effect?.pairId,
    season: Number(treated.season),
    week: Number(treated.week),
    gameId: String(treated.gameId || ""),
    team: String(treated.team || "").toUpperCase(),
    effect: effectNumber,
    baselineExpectedTeamMargin: Number(baseline),
    actualTeamMargin: Number(actual),
    features: features(obs),
  });
}

if (researchRows.length !== 720) {
  throw new Error(
    `PI4_RESEARCH_CORPUS_NOT_720 got ${researchRows.length}`
  );
}

const predictions = [];

for (const holdout of SEASONS) {
  const train = researchRows.filter((row) => row.season !== holdout);
  const test = researchRows.filter((row) => row.season === holdout);
  const fitted = fit(train, selected.variant);

  for (const row of test) {
    const impact = predictImpact(row, fitted, selected.variant);
    if (!finite(impact.raw)) continue;

    const appliedDelta =
      impact.raw * Number(selected.scale);

    const candidateMargin =
      row.baselineExpectedTeamMargin + appliedDelta;

    predictions.push({
      ...row,
      rawCandidateImpact: impact.raw,
      scale: Number(selected.scale),
      appliedDelta,
      resolutionMode: impact.mode,
      trainingStratumN: impact.trainingStratumN,
      candidateExpectedTeamMargin: candidateMargin,
      baselineError:
        row.actualTeamMargin - row.baselineExpectedTeamMargin,
      candidateError:
        row.actualTeamMargin - candidateMargin,
      baselineWinnerCorrect:
        winnerCorrect(
          row.baselineExpectedTeamMargin,
          row.actualTeamMargin
        ),
      candidateWinnerCorrect:
        winnerCorrect(
          candidateMargin,
          row.actualTeamMargin
        ),
      favoriteFlip:
        (row.baselineExpectedTeamMargin > 0) !==
        (candidateMargin > 0),
    });
  }
}

if (predictions.length !== 720) {
  throw new Error(
    `PI4_FIXED_CANDIDATE_REPLAY_NOT_720 got ${predictions.length}`
  );
}

const replayMetrics = rowMetrics(predictions);
const referenceMetrics =
  confirmationArtifact?.confirmation?.replayMetrics || {};

const reconciliationKeys = [
  "rows",
  "baselineMAE",
  "candidateMAE",
  "baselineRMSE",
  "candidateRMSE",
  "baselineWinnerAccuracy",
  "candidateWinnerAccuracy",
  "baselineLargeErrors14Plus",
  "candidateLargeErrors14Plus",
  "favoriteFlips",
  "meanAppliedDelta",
  "meanAbsoluteAppliedDelta",
];

const rowMetricMismatches = {};

for (const key of reconciliationKeys) {
  if (!close(replayMetrics[key], referenceMetrics[key])) {
    rowMetricMismatches[key] = {
      replay: replayMetrics[key],
      reference: referenceMetrics[key],
    };
  }
}

if (Object.keys(rowMetricMismatches).length) {
  throw new Error(
    `PI4_R4_METRIC_REPRODUCTION_FAILED ${JSON.stringify(rowMetricMismatches)}`
  );
}

const decisionModule = await import(
  `${pathToFileURL(DECISION_SOURCE).href}?t=${Date.now()}`
);

const modelModule = await import(
  `${pathToFileURL(MODEL_SOURCE).href}?t=${Date.now()}`
);

const decisionRecords = decisionModule.default || [];
const modelConfig = modelModule.default || {};

if (
  modelConfig.modelId !== "QUALITY_WEIGHTED_MATCHUP" ||
  !modelConfig.parameters
) {
  throw new Error(
    "PI4_CANONICAL_MODEL_CONFIG_UNAVAILABLE_OR_UNEXPECTED"
  );
}

const edgeScale = Number(modelConfig.parameters.edgeScale);

if (!finite(edgeScale) || edgeScale === 0) {
  throw new Error("PI4_CANONICAL_EDGE_SCALE_INVALID");
}

const gameMap = new Map(
  decisionRecords.map((record) => [
    String(record?.game?.gameId || ""),
    record,
  ])
);

const rowBaselineParity = {
  compared: 0,
  mismatches: 0,
  maxAbsoluteDifference: 0,
  tolerance: 1e-9,
};

for (const row of predictions) {
  const record = gameMap.get(row.gameId);

  if (!record) {
    throw new Error(
      `PI4_DECISION_RECORD_MISSING ${row.gameId}`
    );
  }

  const baselinePrediction =
    predictNFLCandidate(
      modelConfig.modelId,
      record,
      modelConfig.parameters
    );

  const homeTeam =
    String(record?.game?.homeTeam || "").toUpperCase();
  const awayTeam =
    String(record?.game?.awayTeam || "").toUpperCase();

  let expectedTeamMargin;

  if (row.team === homeTeam) {
    expectedTeamMargin =
      baselinePrediction.expectedHomeMargin;
  } else if (row.team === awayTeam) {
    expectedTeamMargin =
      -baselinePrediction.expectedHomeMargin;
  } else {
    throw new Error(
      `PI4_TREATED_TEAM_NOT_IN_DECISION_GAME ${row.gameId} ${row.team}`
    );
  }

  const difference = Math.abs(
    expectedTeamMargin - row.baselineExpectedTeamMargin
  );

  rowBaselineParity.compared += 1;
  rowBaselineParity.maxAbsoluteDifference =
    Math.max(
      rowBaselineParity.maxAbsoluteDifference,
      difference
    );

  if (difference > rowBaselineParity.tolerance) {
    rowBaselineParity.mismatches += 1;
  }
}

if (rowBaselineParity.mismatches) {
  throw new Error(
    `PI4_CANONICAL_BASELINE_PARITY_FAILED ${JSON.stringify(rowBaselineParity)}`
  );
}

// Aggregate the frozen treated-team point-margin deltas to one canonical
// home-perspective delta per historical game. If both teams are treated in
// the same game, their deltas combine with opposite home/away signs.
const gameDeltaMap = new Map();

for (const row of predictions) {
  const record = gameMap.get(row.gameId);
  const homeTeam =
    String(record?.game?.homeTeam || "").toUpperCase();
  const sign = row.team === homeTeam ? 1 : -1;

  const existing =
    gameDeltaMap.get(row.gameId) || {
      homeMarginDelta: 0,
      sourceRows: 0,
      treatedTeams: new Set(),
    };

  existing.homeMarginDelta +=
    sign * row.appliedDelta;
  existing.sourceRows += 1;
  existing.treatedTeams.add(row.team);

  gameDeltaMap.set(row.gameId, existing);
}

const fullSeasonRecords = decisionRecords.filter(
  (record) =>
    SEASONS.includes(Number(record?.game?.season))
);

if (!fullSeasonRecords.length) {
  throw new Error("PI4_NO_CANONICAL_DECISION_RECORDS_IN_2020_2024");
}

const baselineRows = [];
const candidateRows = [];
const impactedGameDetails = [];

for (const record of fullSeasonRecords) {
  const baselinePrediction =
    predictNFLCandidate(
      modelConfig.modelId,
      record,
      modelConfig.parameters
    );

  baselineRows.push({
    record,
    prediction: baselinePrediction,
  });

  const gameId =
    String(record?.game?.gameId || "");

  const deltaInfo =
    gameDeltaMap.get(gameId);

  if (!deltaInfo) {
    candidateRows.push({
      record,
      prediction: baselinePrediction,
    });
    continue;
  }

  const quality =
    Number(record?.pregame?.evidenceQuality);

  const edge =
    Number(record?.pregame?.matchupEdge);

  if (
    !finite(quality) ||
    quality <= 0 ||
    !finite(edge)
  ) {
    throw new Error(
      `PI4_INVALID_CANONICAL_MATCHUP_INPUT ${gameId}`
    );
  }

  // Research-only inverse projection:
  // canonical margin = HFA + matchupEdge * evidenceQuality * edgeScale
  // Therefore a frozen point-margin delta is represented by:
  // edgeDelta = marginDelta / (evidenceQuality * edgeScale)
  const edgeDelta =
    deltaInfo.homeMarginDelta /
    (quality * edgeScale);

  const candidateRecord = {
    ...record,
    pregame: {
      ...(record.pregame || {}),
      matchupEdge: edge + edgeDelta,
    },
  };

  const candidatePrediction =
    predictNFLCandidate(
      modelConfig.modelId,
      candidateRecord,
      modelConfig.parameters
    );

  const realizedDelta =
    candidatePrediction.expectedHomeMargin -
    baselinePrediction.expectedHomeMargin;

  if (
    Math.abs(
      realizedDelta - deltaInfo.homeMarginDelta
    ) > 1e-9
  ) {
    throw new Error(
      `PI4_MARGIN_DELTA_PROJECTION_FAILED ${gameId}`
    );
  }

  candidateRows.push({
    record: candidateRecord,
    prediction: candidatePrediction,
  });

  impactedGameDetails.push({
    gameId,
    season: Number(record?.game?.season),
    week: Number(record?.game?.week),
    awayTeam: record?.game?.awayTeam,
    homeTeam: record?.game?.homeTeam,
    sourceRows: deltaInfo.sourceRows,
    treatedTeams: [...deltaInfo.treatedTeams].sort(),
    homeMarginDelta: deltaInfo.homeMarginDelta,
    matchupEdgeDelta: edgeDelta,
    baselineExpectedHomeMargin:
      baselinePrediction.expectedHomeMargin,
    candidateExpectedHomeMargin:
      candidatePrediction.expectedHomeMargin,
    baselineHomeWinProbability:
      baselinePrediction.homeWinProbability,
    candidateHomeWinProbability:
      candidatePrediction.homeWinProbability,
  });
}

const baselineMetric = gameMetric(baselineRows);
const candidateMetric = gameMetric(candidateRows);

let favoriteFlips = 0;
let correctedMisses = 0;
let introducedMisses = 0;

for (let i = 0; i < baselineRows.length; i += 1) {
  const baseline = baselineRows[i];
  const candidate = candidateRows[i];

  const actualMargin =
    Number(baseline.record.outcome.homeScore) -
    Number(baseline.record.outcome.awayScore);

  const actualWinner = actualMargin > 0 ? 1 : 0;
  const baselineWinner =
    baseline.prediction.homeWinProbability >= 0.5 ? 1 : 0;
  const candidateWinner =
    candidate.prediction.homeWinProbability >= 0.5 ? 1 : 0;

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

const bySeason = SEASONS.map((season) => {
  const base = baselineRows.filter(
    (row) => Number(row.record.game.season) === season
  );

  const candidate = candidateRows.filter(
    (row) => Number(row.record.game.season) === season
  );

  const b = gameMetric(base);
  const c = gameMetric(candidate);

  return {
    season,
    baseline: b,
    candidate: c,
    gains: gains(c, b),
    impactedGames:
      impactedGameDetails.filter(
        (row) => row.season === season
      ).length,
  };
});

const aggregateGains =
  gains(candidateMetric, baselineMetric);

const seasonalConsistency = {
  seasons: SEASONS.length,
  accuracyNonWorseWithin005:
    bySeason.filter(
      (row) =>
        row.gains.accuracyGain >= -0.005
    ).length,
  brierImproved:
    bySeason.filter(
      (row) => row.gains.brierGain > 0
    ).length,
  logLossImproved:
    bySeason.filter(
      (row) => row.gains.logLossGain > 0
    ).length,
  marginMAEImproved:
    bySeason.filter(
      (row) => row.gains.marginMAEGain > 0
    ).length,
};

const checks = [
  {
    id: "frozen-candidate-hash",
    passed: computedHash === EXPECTED_HASH,
  },
  {
    id: "r4-row-metric-reproduction",
    passed: Object.keys(rowMetricMismatches).length === 0,
  },
  {
    id: "canonical-row-baseline-parity",
    passed: rowBaselineParity.mismatches === 0,
  },
  {
    id: "aggregate-winner-accuracy-not-materially-worse",
    passed: aggregateGains.accuracyGain >= -0.005,
  },
  {
    id: "aggregate-brier-not-worse",
    passed: aggregateGains.brierGain >= 0,
  },
  {
    id: "aggregate-logloss-not-worse",
    passed: aggregateGains.logLossGain >= 0,
  },
  {
    id: "aggregate-margin-mae-improves",
    passed: aggregateGains.marginMAEGain > 0,
  },
  {
    id: "season-accuracy-stability",
    passed:
      seasonalConsistency.accuracyNonWorseWithin005 >= 4,
  },
  {
    id: "season-margin-mae-majority-improves",
    passed:
      seasonalConsistency.marginMAEImproved >= 3,
  },
];

const failedChecks =
  checks
    .filter((check) => !check.passed)
    .map((check) => check.id);

const gateStatus =
  failedChecks.length === 0
    ? "PI4_PLAYER_IMPACT_CANONICAL_DECISION_PROMOTION_ELIGIBLE_RESEARCH_ONLY"
    : "PI4_PLAYER_IMPACT_CANONICAL_DECISION_HOLD_RESEARCH_ONLY";

const report = {
  contract: CONTRACT,
  version: VERSION,
  sprint: "PI.4",
  mode: "RESEARCH_ONLY_CANONICAL_DECISION_ABLATION",
  status: "RESEARCH_ONLY",
  decision: gateStatus,

  frozenCandidate: {
    variant: selected.variant,
    scale: Number(selected.scale),
    candidateHash: computedHash,
    validationRows: predictions.length,
    validationSeasons: SEASONS,
  },

  canonicalDecisionModel: {
    modelId: modelConfig.modelId,
    modelVersion: modelConfig.modelVersion,
    parameters: modelConfig.parameters,
    productionConfigMutated: false,
  },

  rowReplay: {
    r4MetricReproduction: replayMetrics,
    rowMetricMismatches,
    canonicalBaselineParity: rowBaselineParity,
  },

  gameReplay: {
    fullDecisionGames2020Through2024:
      fullSeasonRecords.length,
    impactedUniqueGames: impactedGameDetails.length,
    frozenSourceRows: predictions.length,
    baseline: baselineMetric,
    candidate: candidateMetric,
    gainsAgainstBaseline: aggregateGains,
    favoriteFlips,
    correctedMisses,
    introducedMisses,
    netCorrectedFavoriteFlips:
      correctedMisses - introducedMisses,
    bySeason,
  },

  projectionMethod: {
    description:
      "The already-frozen VERY_HIGH_ONLY/0.20 treated-team point-margin delta is aggregated to a home-perspective game delta and inverse-projected into matchupEdge only inside this historical research replay so that the unchanged canonical QUALITY_WEIGHTED_MATCHUP model realizes exactly the frozen point-margin delta.",
    formula:
      "matchupEdgeDelta = homeMarginDelta / (evidenceQuality * canonicalEdgeScale)",
    candidateSearchPerformed: false,
    scaleRetuned: false,
    newPlayerImpactModelFit: false,
    productionTeamStrengthTransformationDefined: false,
  },

  promotionGate: {
    status: gateStatus,
    authoritative: false,
    productionAuthorityGranted: false,
    checks,
    failedChecks,
    seasonalConsistency,
  },

  safeguards: {
    canonicalShadowIntegrationMutated: false,
    productionTeamStrengthMutated: false,
    productionMatchupIntelligenceMutated: false,
    canonicalDecisionModelParametersMutated: false,
    playerImpactProductionAuthorized: false,
    databaseMutated: false,
    pickemMutated: false,
    candidateVariantChanged: false,
    candidateScaleChanged: false,
  },

  impactedGameDetails,
};

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(`PI.4 frozen candidate: ${selected.variant} / ${selected.scale}`);
console.log(`Candidate hash: ${computedHash}`);
console.log(`R4 row replay: ${predictions.length} rows`);
console.log(
  `Canonical row baseline parity: ${rowBaselineParity.mismatches} mismatches / ${rowBaselineParity.compared} rows`
);
console.log(
  `Canonical game replay: ${fullSeasonRecords.length} games, ${impactedGameDetails.length} impacted`
);
console.log("");
console.log(
  `BASELINE accuracy=${(baselineMetric.winnerAccuracy * 100).toFixed(2)}% brier=${baselineMetric.brierScore.toFixed(4)} logloss=${baselineMetric.logLoss.toFixed(4)} marginMAE=${baselineMetric.marginMAE.toFixed(3)}`
);
console.log(
  `CANDIDATE accuracy=${(candidateMetric.winnerAccuracy * 100).toFixed(2)}% brier=${candidateMetric.brierScore.toFixed(4)} logloss=${candidateMetric.logLoss.toFixed(4)} marginMAE=${candidateMetric.marginMAE.toFixed(3)}`
);
console.log(
  `GAINS accuracy=${(aggregateGains.accuracyGain * 100).toFixed(3)}pp brier=${aggregateGains.brierGain.toFixed(5)} logloss=${aggregateGains.logLossGain.toFixed(5)} marginMAE=${aggregateGains.marginMAEGain.toFixed(4)}`
);
console.log(
  `Favorite flips=${favoriteFlips} corrected=${correctedMisses} introduced=${introducedMisses}`
);
console.log("");
console.log(`PI.4 gate: ${gateStatus}`);

for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "FAIL"} — ${check.id}`);
}

console.log(`\nWrote report:\n${OUTPUT}`);
