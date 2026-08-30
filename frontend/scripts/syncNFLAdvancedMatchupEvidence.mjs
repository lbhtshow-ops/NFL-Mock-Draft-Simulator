import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pathToFileURL } from "url";

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

const phaseScopeArg =
  String(
    process.argv[4] || "ALL"
  ).toUpperCase();

const phaseScope =
  ["REGULAR", "POSTSEASON", "ALL"].includes(
    phaseScopeArg
  )
    ? phaseScopeArg
    : null;

if (!Number.isInteger(season)) {
  throw new Error(
    "season must be an integer."
  );
}

if (
  throughWeek !== null &&
  !Number.isInteger(throughWeek)
) {
  throw new Error(
    "throughWeek must be an integer or omitted."
  );
}

if (!phaseScope) {
  throw new Error(
    "phaseScope must be REGULAR, POSTSEASON, or ALL."
  );
}

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

async function loadExisting() {
  if (!fs.existsSync(outputPath)) {
    return [];
  }

  try {
    const moduleUrl =
      `${pathToFileURL(outputPath).href}?t=${Date.now()}`;

    const existingModule =
      await import(moduleUrl);

    if (!Array.isArray(existingModule.default)) {
      throw new Error(
        "default export is not an array"
      );
    }

    return existingModule.default;
  } catch (error) {
    throw new Error(
      `Existing generated advanced evidence could not be loaded. Refusing destructive rebuild: ${error.message}`
    );
  }
}

const {
  aggregateNFLAdvancedMatchupEvidence,
} = await import(
  "../src/data/footballIntelligence/nfl/matchup/NFLAdvancedMatchupPbpAdapter.js"
);

const existing = await loadExisting();

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

const retained =
  existing.filter(
    (record) =>
      !(
        Number(record?.season) === season &&
        String(
          record?.phaseScope || "ALL"
        ).toUpperCase() === phaseScope
      )
  );

const merged = [
  ...retained,
  ...evidence,
].sort((a, b) => {
  const seasonDifference =
    Number(a?.season) - Number(b?.season);

  if (seasonDifference) {
    return seasonDifference;
  }

  const phaseDifference =
    String(a?.phaseScope || "ALL").localeCompare(
      String(b?.phaseScope || "ALL")
    );

  if (phaseDifference) {
    return phaseDifference;
  }

  return String(a?.team || "").localeCompare(
    String(b?.team || "")
  );
});

const fileText =
  `export const generatedNFLAdvancedMatchupSource = ${JSON.stringify(
    merged,
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
  `Synced ${evidence.length} ${season} ${phaseScope} NFL Advanced Matchup Evidence records.`
);
console.log(
  `Preserved ${retained.length} records outside the replaced season/phase scope.`
);
console.log(
  `Generated source now contains ${merged.length} total records.`
);
console.log(outputPath);
