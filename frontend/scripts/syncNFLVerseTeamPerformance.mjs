import fs from "fs";
import path from "path";
import zlib from "zlib";

const season = Number(process.argv[2] || new Date().getFullYear());
const throughWeekArg = process.argv[3];
const throughWeek =
  throughWeekArg == null ? null : Number(throughWeekArg);

const phaseScopeArg =
  String(process.argv[4] || "ALL").toUpperCase();

const phaseScope =
  ["REGULAR", "POSTSEASON", "ALL"].includes(
    phaseScopeArg
  )
    ? phaseScopeArg
    : "ALL";

const candidates = [
  `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv.gz`,
  `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv`,
];

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/performance/sources/generatedNFLTeamPerformanceSource.js"
);

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === `"`) {
      const next = line[index + 1];

      if (insideQuotes && next === `"`) {
        current += `"`;
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
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

    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? null;
      return record;
    }, {});
  });
}

async function downloadPbp() {
  for (const url of candidates) {
    console.log(`Trying ${url}`);

    const response = await fetch(url);

    if (!response.ok) continue;

    const buffer = Buffer.from(await response.arrayBuffer());

    const text = url.endsWith(".gz")
      ? zlib.gunzipSync(buffer).toString("utf8")
      : buffer.toString("utf8");

    return { url, text };
  }

  throw new Error(
    `Unable to download nflverse play-by-play for ${season}.`
  );
}

const { aggregateNFLVersePlayByPlay } =
  await import(
    "../src/data/footballIntelligence/nfl/performance/NFLVersePlayByPlayTeamPerformanceAdapter.js"
  );

const downloaded = await downloadPbp();
const rows = parseCSV(downloaded.text);

const evidence = aggregateNFLVersePlayByPlay({
  rows,
  season,
  throughWeek,
  phaseScope,
  sourceUrl: downloaded.url,
  generatedAt: new Date().toISOString(),
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

let existing = [];
if (fs.existsSync(outputPath)) {
  try {
    const existingUrl = new URL(`file://${outputPath.replaceAll("\\", "/")}?t=${Date.now()}`);
    const existingModule = await import(existingUrl.href);
    existing = Array.isArray(existingModule.default) ? existingModule.default : [];
  } catch (error) { console.warn(`Existing generated evidence could not be loaded; rebuilding source: ${error.message}`); }
}
const retained = existing.filter((record) => !(Number(record?.season) === season && String(record?.phaseScope || "ALL") === phaseScope));
const merged = [...retained, ...evidence].sort((a,b)=>a.season!==b.season?a.season-b.season:a.teamAbbreviation.localeCompare(b.teamAbbreviation));
const fileText = `export const generatedNFLTeamPerformanceSource = ${JSON.stringify(merged,null,2)};\n\nexport default generatedNFLTeamPerformanceSource;\n`;
fs.writeFileSync(outputPath,fileText,"utf8");
console.log(`Synced ${evidence.length} ${season} ${phaseScope} NFL Team Performance Evidence records.`);
console.log(`Generated source now contains ${merged.length} total records.`);
console.log(outputPath);
