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

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? null;
      return row;
    }, {});
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
    if (!response.ok) continue;

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    const text = url.endsWith(".gz")
      ? zlib.gunzipSync(buffer).toString("utf8")
      : buffer.toString("utf8");

    return {
      url,
      rows: parseCSV(text),
    };
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

const scheduleGames = (scheduleModule.default || [])
  .filter(
    (game) =>
      Number(game.season) >= startSeason &&
      Number(game.season) <= endSeason &&
      game.completed
  );

if (!scheduleGames.length) {
  throw new Error(
    "No completed historical schedule games are available. Run the Sprint 5A schedule sync first."
  );
}

const rowsBySeason = new Map();

for (
  let season = startSeason - 1;
  season <= endSeason;
  season += 1
) {
  const downloaded = await downloadPbp(season);

  rowsBySeason.set(
    season,
    downloaded.rows
  );

  console.log(
    `Loaded ${downloaded.rows.length} PBP rows for ${season}.`
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

const replay =
  buildNFLHistoricalPregameSnapshots({
    games: scheduleGames,
    rowsBySeason,
    generatedAt,
  });

const dataset =
  assembleNFLHistoricalDecisionDataset({
    scheduleGames,
    replaySnapshots: replay.snapshots,
    generatedAt,
  });

const manifest =
  createNFLHistoricalReplayManifest({
    startSeason,
    endSeason,
    games: scheduleGames,
    snapshots: replay.snapshots,
    exclusions: replay.exclusions,
    generatedAt,
  });

fs.mkdirSync(
  path.dirname(snapshotOutputPath),
  { recursive: true }
);

fs.writeFileSync(
  snapshotOutputPath,
  `export const generatedNFLHistoricalPregameSnapshots = ${JSON.stringify(
    replay.snapshots,
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
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(
  `Historical replay produced ${replay.snapshots.length} pregame snapshots.`
);
console.log(
  `Historical decision dataset contains ${dataset.records.length} records.`
);
console.log(
  `Replay exclusions: ${replay.exclusions.length}.`
);
console.log(
  `Snapshot SHA-256: ${manifest.hashes.snapshots}`
);
