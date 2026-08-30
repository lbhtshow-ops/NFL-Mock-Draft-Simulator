import fs from "fs";
import path from "path";
import zlib from "zlib";

const season =
  Number(
    process.argv[2] ||
    new Date().getFullYear()
  );

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/availability/sources/generatedNFLPlayerAvailabilitySource.js"
);

const candidates = [
  `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${season}.csv`,
  `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${season}.csv.gz`,
];

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const char = line[index];

    if (char === `"`) {
      const next = line[index + 1];

      if (
        insideQuotes &&
        next === `"`
      ) {
        current += `"`;
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
      }
    } else if (
      char === "," &&
      !insideQuotes
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
        (record, header, index) => {
          record[header] =
            values[index] ?? null;
          return record;
        },
        {}
      );
    });
}

async function download() {
  for (const url of candidates) {
    console.log(`Trying ${url}`);

    const response = await fetch(url);

    if (!response.ok) continue;

    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    const text =
      url.endsWith(".gz")
        ? zlib.gunzipSync(buffer)
            .toString("utf8")
        : buffer.toString("utf8");

    return { url, text };
  }

  throw new Error(
    `nflverse injury-report data is unavailable for ${season}. No canonical availability source was changed.`
  );
}

const {
  adaptNFLVerseInjuryRows,
} = await import(
  "../src/data/footballIntelligence/nfl/availability/NFLVerseInjuryReportAdapter.js"
);

const downloaded =
  await download();

const rows =
  parseCSV(downloaded.text);

const evidence =
  adaptNFLVerseInjuryRows(
    rows,
    {
      sourceUrl:
        downloaded.url,
    }
  );

const fileText =
  `export const generatedNFLPlayerAvailabilitySource = ${JSON.stringify(
    evidence,
    null,
    2
  )};\n\nexport default generatedNFLPlayerAvailabilitySource;\n`;

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
  `Synced ${evidence.length} ${season} NFL player availability evidence records.`
);
console.log(outputPath);
