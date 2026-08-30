import fs from "fs";
import path from "path";
import zlib from "zlib";

const startSeason = Number(process.argv[2] || 2018);
const endSeason = Number(process.argv[3] || 2025);

if (
  !Number.isInteger(startSeason) ||
  !Number.isInteger(endSeason) ||
  startSeason > endSeason
) {
  throw new Error(
    "Usage: node buildNFLHistoricalPregameReplay.mjs <startSeason> <endSeason>"
  );
}

const scheduleSourcePath = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLScheduleOutcomesSource.js"
);

const snapshotOutputPath = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js"
);

const datasetOutputPath = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js"
);

const manifestOutputPath = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalReplayManifest.json"
);

// Keep only fields used by the FIE replay adapters.
// Loading all nflverse PBP columns across 9 seasons can exceed Node's heap.
const REQUIRED_PBP_FIELDS = new Set([
  "season",
  "week",
  "game_id",
  "season_type",
  "game_type",
  "posteam",
  "possession_team",
  "defteam",
  "defense_team",
  "play_type",
  "epa",
  "success",
  "no_play",
  "yards_gained",
  "qb_hit",
  "sack",
  "shotgun",
  "no_huddle",
  "yardline_100",
  "special",
  "special_teams_play",
]);

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === `"`) {
      const next = line[index + 1];

      if (quoted && next === `"`) {
        current += `"`;
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseProjectedCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);

  const selected = headers
    .map((header, index) => ({
      header,
      index,
    }))
    .filter(({ header }) =>
      REQUIRED_PBP_FIELDS.has(header)
    );

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};

    for (const { header, index } of selected) {
      row[header] = values[index] ?? null;
    }

    return row;
  });
}

async function downloadPbp(season) {
  const candidates = [
    `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv.gz`,
    `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv`,
  ];

  for (const url of candidates) {
    console.log(`Trying ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      continue;
    }

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    const text = url.endsWith(".gz")
      ? zlib.gunzipSync(buffer).toString("utf8")
      : buffer.toString("utf8");

    const rows = parseProjectedCSV(text);

    console.log(
      `Loaded ${rows.length} projected PBP rows for ${season}.`
    );

    return rows;
  }

  throw new Error(
    `Unable to download nflverse PBP for ${season}.`
  );
}

const scheduleModule = await import(
  new URL(
    `file://${scheduleSourcePath.replaceAll("\\", "/")}?t=${Date.now()}`
  ).href
);

const allScheduleGames = (scheduleModule.default || [])
  .filter(
    (game) =>
      Number(game.season) >= startSeason &&
      Number(game.season) <= endSeason &&
      game.completed
  );

if (!allScheduleGames.length) {
  throw new Error(
    "No completed historical schedule games are available. Run the Sprint 5A schedule sync first."
  );
}

const {
  buildNFLHistoricalPregameSnapshots,
} = await import(
  "../src/engines/gameDecisionSupport/NFLHistoricalPregameReplayEngine.js"
);

const {
  assembleNFLHistoricalDecisionDataset,
} = await import(
  "../src/engines/gameDecisionSupport/NFLHistoricalReplayDatasetAssembler.js"
);

const {
  createNFLHistoricalReplayManifest,
} = await import(
  "../src/engines/gameDecisionSupport/NFLHistoricalReplayManifest.js"
);

const generatedAt = new Date().toISOString();

const allSnapshots = [];
const allReplayExclusions = [];

// Memory-bounded season replay:
// retain only previous-season and current-season PBP at once.
let priorRows = await downloadPbp(startSeason - 1);

for (
  let season = startSeason;
  season <= endSeason;
  season += 1
) {
  const currentRows = await downloadPbp(season);

  const seasonGames = allScheduleGames
    .filter(
      (game) =>
        Number(game.season) === season
    );

  const rowsBySeason = new Map([
    [season - 1, priorRows],
    [season, currentRows],
  ]);

  console.log(
    `Replaying ${seasonGames.length} completed games for ${season}...`
  );

  const replay = buildNFLHistoricalPregameSnapshots({
    games: seasonGames,
    rowsBySeason,
    generatedAt,
  });

  allSnapshots.push(
    ...replay.snapshots
  );

  allReplayExclusions.push(
    ...replay.exclusions
  );

  console.log(
    `Season ${season}: ${replay.snapshots.length} snapshots, ${replay.exclusions.length} exclusions.`
  );

  // Current becomes prior for the next season.
  priorRows = currentRows;
}

const dataset =
  assembleNFLHistoricalDecisionDataset({
    scheduleGames: allScheduleGames,
    replaySnapshots: allSnapshots,
    generatedAt,
  });

const manifest =
  createNFLHistoricalReplayManifest({
    startSeason,
    endSeason,
    games: allScheduleGames,
    snapshots: allSnapshots,
    exclusions: allReplayExclusions,
    generatedAt,
  });

fs.mkdirSync(
  path.dirname(snapshotOutputPath),
  { recursive: true }
);

fs.writeFileSync(
  snapshotOutputPath,
  `export const generatedNFLHistoricalPregameSnapshots = ${JSON.stringify(
    allSnapshots,
    null,
    2
  )};\n\nexport default generatedNFLHistoricalPregameSnapshots;\n`,
  "utf8"
);

fs.writeFileSync(
  datasetOutputPath,
  `export const generatedNFLHistoricalDecisionDataset = ${JSON.stringify(
    dataset.records,
    null,
    2
  )};\n\nexport default generatedNFLHistoricalDecisionDataset;\n`,
  "utf8"
);

fs.writeFileSync(
  manifestOutputPath,
  JSON.stringify(
    manifest,
    null,
    2
  ),
  "utf8"
);

console.log(
  `Historical replay produced ${allSnapshots.length} pregame snapshots.`
);

console.log(
  `Historical decision dataset contains ${dataset.records.length} records.`
);

console.log(
  `Replay exclusions: ${allReplayExclusions.length}.`
);

console.log(
  `Snapshot SHA-256: ${manifest.hashes.snapshots}`
);
