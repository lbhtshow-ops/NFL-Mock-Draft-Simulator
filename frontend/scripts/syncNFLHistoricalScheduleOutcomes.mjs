import fs from "fs";
import path from "path";
import zlib from "zlib";

const startSeason =
  Number(process.argv[2] || 2018);
const endSeason =
  Number(
    process.argv[3] ||
    new Date().getFullYear() - 1
  );

if (
  !Number.isInteger(startSeason) ||
  !Number.isInteger(endSeason) ||
  startSeason > endSeason
) {
  throw new Error(
    "Usage: node syncNFLHistoricalScheduleOutcomes.mjs <startSeason> <endSeason>"
  );
}

const candidates = [
  "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv",
  "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv.gz",
];

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLScheduleOutcomesSource.js"
);

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const char = line[index];

    if (char === `"`) {
      const next = line[index + 1];

      if (quoted && next === `"`) {
        current += `"`;
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (
      char === "," &&
      !quoted
    ) {
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
  const lines =
    text
      .split(/\r?\n/)
      .filter(Boolean);

  if (!lines.length) return [];

  const headers =
    parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values =
      parseCSVLine(line);

    return headers.reduce(
      (row, header, index) => {
        row[header] =
          values[index] ?? null;
        return row;
      },
      {}
    );
  });
}

async function download() {
  for (const url of candidates) {
    console.log(`Trying ${url}`);

    const response =
      await fetch(url);

    if (!response.ok) {
      continue;
    }

    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    return {
      url,
      text:
        url.endsWith(".gz")
          ? zlib
              .gunzipSync(buffer)
              .toString("utf8")
          : buffer.toString("utf8"),
    };
  }

  throw new Error(
    "Unable to download nflverse schedules release."
  );
}

const {
  adaptNFLScheduleOutcomeRows,
} = await import(
  "../src/data/footballIntelligence/nfl/decisionSupport/NFLScheduleOutcomeAdapter.js"
);

const downloaded =
  await download();

const rows =
  adaptNFLScheduleOutcomeRows(
    parseCSV(downloaded.text)
  )
    .filter(
      (game) =>
        game.season >= startSeason &&
        game.season <= endSeason
    )
    .filter(
      (game) =>
        game.completed
    );

const fileText =
  `export const generatedNFLScheduleOutcomesSource = ${JSON.stringify(
    rows,
    null,
    2
  )};\n\nexport default generatedNFLScheduleOutcomesSource;\n`;

fs.mkdirSync(
  path.dirname(outputPath),
  { recursive: true }
);

fs.writeFileSync(
  outputPath,
  fileText,
  "utf8"
);

console.log(
  `Wrote ${rows.length} completed NFL schedule/outcome records from ${startSeason}-${endSeason}.`
);
console.log(outputPath);
