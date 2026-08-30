import fs from "node:fs";

const file =
  "./data/calibration/historical/v1/historical-availability-impact-baseline-residuals-v1.jsonl";

const rows = fs.readFileSync(file, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const finite = v =>
  v !== null &&
  v !== undefined &&
  v !== "" &&
  Number.isFinite(Number(v));

const num = v => Number(v);

function mean(values) {
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

function pearson(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;

  const mx = mean(xs);
  const my = mean(ys);

  let numerator = 0;
  let dx2 = 0;
  let dy2 = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;

    numerator += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denominator = Math.sqrt(dx2 * dy2);
  return denominator ? numerator / denominator : null;
}

function summarize(group) {
  const usable = group.filter(
    r =>
      finite(r?.availability?.expectedReplacementDelta) &&
      finite(r?.residual?.gamePerformanceResidual)
  );

  const x = usable.map(r =>
    num(r.availability.expectedReplacementDelta)
  );

  const y = usable.map(r =>
    num(r.residual.gamePerformanceResidual)
  );

  return {
    records: group.length,
    usable: usable.length,
    meanExpectedReplacementDelta: mean(x),
    meanGamePerformanceResidual: mean(y),
    correlation: pearson(x, y)
  };
}

function grouped(rows, keyFn) {
  const groups = new Map();

  for (const row of rows) {
    const key = keyFn(row) ?? "UNKNOWN";

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([key, values]) => [key, summarize(values)])
  );
}

const usable = rows.filter(
  r =>
    finite(r?.availability?.expectedReplacementDelta) &&
    finite(r?.residual?.gamePerformanceResidual)
);

const absResiduals = usable
  .map(r => Math.abs(num(r.residual.gamePerformanceResidual)))
  .sort((a, b) => a - b);

function percentile(values, p) {
  if (!values.length) return null;

  const index = (values.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return values[lower];

  return (
    values[lower] +
    (values[upper] - values[lower]) * (index - lower)
  );
}

const p95AbsResidual = percentile(absResiduals, 0.95);

const trimmed = usable.filter(
  r =>
    Math.abs(num(r.residual.gamePerformanceResidual)) <=
    p95AbsResidual
);

const overall = summarize(rows);
const trimmedSummary = summarize(trimmed);

const bySeason = grouped(
  usable,
  r => r?.identity?.season
);

const byPosition = grouped(
  usable,
  r => r?.identity?.position
);

const byTeam = grouped(
  usable,
  r => r?.identity?.team
);

const gameKeys = new Map();

for (const row of usable) {
  const season = row?.identity?.season;
  const week = row?.identity?.week;

  const home =
    row?.historicalDecision?.homeTeam ??
    row?.game?.homeTeam ??
    null;

  const away =
    row?.historicalDecision?.awayTeam ??
    row?.game?.awayTeam ??
    null;

  const key =
    season != null &&
    week != null &&
    home &&
    away
      ? `${season}:${week}:${away}@${home}`
      : null;

  if (!key) continue;

  gameKeys.set(
    key,
    (gameKeys.get(key) ?? 0) + 1
  );
}

const repeatedGames =
  [...gameKeys.values()].filter(count => count > 1);

const output = {
  sprint: "2.18.10",
  mode: "READ_ONLY_CAUSAL_SIGNAL_AUDIT",

  overall,

  outlierSensitivity: {
    p95AbsoluteResidual: p95AbsResidual,
    retainedRecords: trimmed.length,
    removedRecords: usable.length - trimmed.length,
    trimmedCorrelation: trimmedSummary.correlation,
    trimmedMeanResidual:
      trimmedSummary.meanGamePerformanceResidual
  },

  bySeason,
  byPosition,

  repeatedGameStructure: {
    identifiedGames: gameKeys.size,
    gamesWithMultipleAvailabilityObservations:
      repeatedGames.length,
    maximumObservationsInSingleGame:
      repeatedGames.length
        ? Math.max(...repeatedGames)
        : 1
  },

  teamCorrelationRange: (() => {
    const values = Object.values(byTeam)
      .filter(x => x.usable >= 5 && finite(x.correlation))
      .map(x => x.correlation);

    return {
      teamsWithAtLeastFiveObservations: values.length,
      minimumCorrelation:
        values.length ? Math.min(...values) : null,
      maximumCorrelation:
        values.length ? Math.max(...values) : null
    };
  })(),

  governance: {
    gamePerformanceResidualIsObservedPlayerImpact: false,
    causalTargetDefined: false,
    learnedWeightsAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    pickemMutationAuthorized: false
  }
};

console.log(JSON.stringify(output, null, 2));

