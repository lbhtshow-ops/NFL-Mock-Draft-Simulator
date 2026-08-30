import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const value = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const pairsPath = path.resolve(
  value(
    "--pairs",
    "./data/calibration/historical/v1/expected-replacement-identities-v1.jsonl"
  )
);
const snapshotsPath = path.resolve(
  value(
    "--snapshots",
    "./data/calibration/historical/v1/historical-player-caliber-snapshots-v1.jsonl"
  )
);

function load(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);
}

const mappings = load(pairsPath).filter((row) => row?.replacementPlayerId);
const snapshots = load(snapshotsPath).filter(
  (row) =>
    row?.status === "AVAILABLE" &&
    row?.temporallySafe === true &&
    typeof row?.caliber === "number"
);

const key = (row, playerId) =>
  `${Number(row.season)}:${Number(row.week)}:${String(row.team || "").toUpperCase()}:${playerId}`;

const index = new Map(
  snapshots.map((row) => [key(row, row.playerId), row])
);

const counts = {
  replacementPairs: mappings.length,
  playerCaliberAvailable: 0,
  replacementCaliberAvailable: 0,
  completePairs: 0,
  partialPairs: 0,
  unavailablePairs: 0,
};

const byPosition = {};
const missingSides = {};
const samples = [];

for (const mapping of mappings) {
  const player = index.get(key(mapping, mapping.unavailablePlayerId)) || null;
  const replacement =
    index.get(key(mapping, mapping.replacementPlayerId)) || null;

  const pc =
    typeof player?.caliber === "number" ? player.caliber : null;
  const rc =
    typeof replacement?.caliber === "number"
      ? replacement.caliber
      : null;

  if (pc !== null) counts.playerCaliberAvailable += 1;
  if (rc !== null) counts.replacementCaliberAvailable += 1;

  const position = mapping?.position || "UNKNOWN";
  if (!byPosition[position]) {
    byPosition[position] = {
      pairs: 0,
      complete: 0,
      partial: 0,
      unavailable: 0,
    };
  }
  byPosition[position].pairs += 1;

  let status;
  if (pc !== null && rc !== null) {
    counts.completePairs += 1;
    byPosition[position].complete += 1;
    status = "COMPLETE";
  } else if (pc !== null || rc !== null) {
    counts.partialPairs += 1;
    byPosition[position].partial += 1;
    status = "PARTIAL";
  } else {
    counts.unavailablePairs += 1;
    byPosition[position].unavailable += 1;
    status = "UNAVAILABLE";
  }

  const missing =
    pc === null && rc === null
      ? "BOTH"
      : pc === null
        ? "UNAVAILABLE_PLAYER"
        : rc === null
          ? "REPLACEMENT_PLAYER"
          : null;

  if (missing) {
    missingSides[missing] = (missingSides[missing] || 0) + 1;
  }

  if (samples.length < 10 && status === "COMPLETE") {
    samples.push({
      season: mapping.season,
      week: mapping.week,
      team: mapping.team,
      position,
      unavailablePlayerId: mapping.unavailablePlayerId,
      replacementPlayerId: mapping.replacementPlayerId,
      playerCaliber: pc,
      replacementCaliber: rc,
      expectedReplacementDelta: pc - rc,
      evidenceType: mapping.evidenceType,
    });
  }
}

const report = {
  audit:
    "HISTORICAL_STARTER_REPLACEMENT_CALIBER_PAIR_COVERAGE",
  mode: "READ_ONLY",
  counts,
  rates: {
    completePairRate:
      counts.replacementPairs
        ? counts.completePairs / counts.replacementPairs
        : 0,
    playerCaliberRate:
      counts.replacementPairs
        ? counts.playerCaliberAvailable / counts.replacementPairs
        : 0,
    replacementCaliberRate:
      counts.replacementPairs
        ? counts.replacementCaliberAvailable /
          counts.replacementPairs
        : 0,
  },
  missingSides,
  byPosition,
  firstComplete: samples,
  safeguards: {
    mappingsMutated: false,
    snapshotsMutated: false,
    caliberFabricated: false,
    replacementIdentityFabricated: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
  },
};

console.log(JSON.stringify(report, null, 2));
