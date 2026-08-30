import fs from "node:fs";
import path from "node:path";

import {
  evaluateHistoricalCanonicalNFLPlayer,
} from "../src/engines/teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalCanonicalPlayerEvaluationService.js";

const args = process.argv.slice(2);
const value = (flag, fallback = null) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const bundlesPath = path.resolve(
  value(
    "--bundles",
    "./data/calibration/historical/v1/historical-player-evaluation-bundles-v1.jsonl"
  )
);
const snapsPath = path.resolve(
  value(
    "--snaps",
    "./data/calibration/historical/v1/historical-snap-counts-resolved.jsonl"
  )
);
const observationsPath = path.resolve(
  value(
    "--observations",
    "./data/calibration/historical/v1/observations.jsonl"
  )
);
const outputPath = path.resolve(
  value(
    "--output",
    "./data/calibration/historical/v1/historical-player-caliber-snapshots-v1.jsonl"
  )
);
const reportPath = path.resolve(
  value(
    "--report",
    "./data/calibration/historical/v1/historical-player-caliber-snapshots-v1-report.json"
  )
);
const residualsPath = path.resolve(
  value(
    "--residuals",
    "./data/calibration/historical/v1/historical-player-caliber-snapshot-residuals-v1.jsonl"
  )
);

function loadJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function field(row, keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return null;
}

const bundles = loadJsonl(bundlesPath);
const snaps = loadJsonl(snapsPath);
const observations = loadJsonl(observationsPath);

const gameIndex = new Map();
for (const row of observations) {
  const season = Number(field(row, ["season"]));
  const week = Number(field(row, ["week"]));
  const team = String(field(row, ["team", "teamAbbreviation"]) || "").toUpperCase();
  const gameId = field(row, ["gameId", "game_id", "gameRef"]);
  if (!Number.isInteger(season) || !Number.isInteger(week) || !team || !gameId) continue;
  const key = `${season}:${week}:${team}`;
  if (!gameIndex.has(key)) gameIndex.set(key, new Set());
  gameIndex.get(key).add(String(gameId));
}

const snapIndex = new Map();
for (const row of snaps) {
  const playerId = field(row, ["playerId", "player_id", "gsis_id", "canonicalPlayerId"]);
  const season = Number(field(row, ["season"]));
  if (!playerId || !Number.isInteger(season)) continue;
  const key = `${playerId}:${season}`;
  if (!snapIndex.has(key)) snapIndex.set(key, []);
  snapIndex.get(key).push(row);
}

const snapshots = [];
const residuals = [];
const unavailableReasons = {};
const byPosition = {};

for (const bundle of bundles) {
  const gameIds = [
    ...(gameIndex.get(
      `${Number(bundle.season)}:${Number(bundle.week)}:${String(bundle.team || "").toUpperCase()}`
    ) || []),
  ];
  const gameId = gameIds.length === 1 ? gameIds[0] : null;
  const supplementalSnapRows =
    snapIndex.get(`${bundle.playerId}:${bundle.season}`) || [];

  const evaluated = evaluateHistoricalCanonicalNFLPlayer({
    bundle,
    supplementalSnapRows,
    gameId,
  });

  if (
    evaluated?.status === "AVAILABLE" &&
    evaluated?.snapshotValidation?.valid === true &&
    evaluated?.snapshot?.status === "AVAILABLE"
  ) {
    const snapshot = {
      ...evaluated.snapshot,
      temporallySafe: true,
    };
    snapshots.push(snapshot);

    const position = snapshot?.position || bundle?.position || "UNKNOWN";
    byPosition[position] = (byPosition[position] || 0) + 1;
    continue;
  }

  const reason =
    evaluated?.reason ||
    evaluated?.canonicalCaliber?.reason ||
    evaluated?.snapshotValidation?.errors?.join("|") ||
    "UNKNOWN";

  unavailableReasons[reason] = (unavailableReasons[reason] || 0) + 1;

  residuals.push({
    contractVersion:
      "FIE-NFL-HISTORICAL-PLAYER-CALIBER-SNAPSHOT-RESIDUAL-1.0.0",
    season: bundle?.season ?? null,
    week: bundle?.week ?? null,
    team: bundle?.team ?? null,
    playerId: bundle?.playerId ?? null,
    position: bundle?.position ?? null,
    gameId,
    status: evaluated?.status ?? "UNAVAILABLE",
    reason,
    canonicalCaliberAvailable:
      evaluated?.canonicalCaliber?.available === true,
    canonicalCaliber:
      evaluated?.canonicalCaliber?.caliberGrade ?? null,
    canonicalReadiness:
      evaluated?.canonicalCaliber?.readiness ?? null,
    snapshotErrors:
      evaluated?.snapshotValidation?.errors || [],
  });
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  snapshots.map((row) => JSON.stringify(row)).join("\n") +
    (snapshots.length ? "\n" : ""),
  "utf8"
);

fs.writeFileSync(
  residualsPath,
  residuals.map((row) => JSON.stringify(row)).join("\n") +
    (residuals.length ? "\n" : ""),
  "utf8"
);

const report = {
  contractVersion:
    "FIE-NFL-HISTORICAL-PLAYER-CALIBER-SNAPSHOT-MATERIALIZATION-REPORT-1.0.0",
  sprint: "2.18.7",
  targetCount: bundles.length,
  snapshotWrittenCount: snapshots.length,
  residualCount: residuals.length,
  coverageRate:
    bundles.length > 0 ? snapshots.length / bundles.length : 0,
  byPosition,
  unavailableReasons,
  outputPath,
  residualsPath,
  safeguards: {
    currentRatingBackfillUsed: false,
    targetWeekEvidenceUsed: false,
    futureEvidenceUsed: false,
    currentRecognitionUsed: false,
    syntheticCaliberUsed: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
    sourceDatasetMutated: false,
  },
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify(report, null, 2));
