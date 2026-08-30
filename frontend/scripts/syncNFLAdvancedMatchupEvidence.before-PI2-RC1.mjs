import fs from "fs";
import path from "path";
import zlib from "zlib";

const season =
  Number(
    process.argv[2] ||
      new Date().getFullYear()
  );

const throughWeekArg =
  process.argv[3];

const throughWeek =
  throughWeekArg === undefined ||
  throughWeekArg === ""
    ? null
    : Number(throughWeekArg);

const phaseScope =
  String(
    process.argv[4] || "ALL"
  ).toUpperCase();

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/matchup/sources/generatedNFLAdvancedMatchupSource.js"
);

const candidates = [
  `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv.gz`,
  `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv`,
];

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
      const next =
        line[index + 1];

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

  return lines
    .slice(1)
    .map((line) => {
      const values =
        parseCSVLine(line);

      return headers.reduce(
        (
          row,
          header,
          index
        ) => {
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
    `Unable to download nflverse PBP for ${season}.`
  );
}

const {
  aggregateNFLAdvancedMatchupEvidence,
} = await import(
  "../src/data/footballIntelligence/nfl/matchup/NFLAdvancedMatchupPbpAdapter.js"
);

const downloaded =
  await download();

const evidence =
  aggregateNFLAdvancedMatchupEvidence({
    rows:
      parseCSV(downloaded.text),
    season,
    throughWeek,
    phaseScope,
    sourceUrl:
      downloaded.url,
    generatedAt:
      new Date().toISOString(),
  });

const fileText =
  `export const generatedNFLAdvancedMatchupSource = ${JSON.stringify(
    evidence,
    null,
    2
  )};\n\nexport default generatedNFLAdvancedMatchupSource;\n`;

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
  `Wrote ${evidence.length} NFL Advanced Matchup Evidence records.`
);
console.log(outputPath);
