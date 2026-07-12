import fs from "fs";
import path from "path";

const season = process.argv[2] || "2025";

const snapCountsUrl = `https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_${season}.csv`;

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/rosters/sources/generatedNFLVerseSnapCountsSource.json"
);

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === `"`) {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCSV(csvText) {
  const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
  const headers = parseCSVLine(headerLine);

  return rows.map((row) => {
    const values = parseCSVLine(row);

    return headers.reduce((record, header, index) => {
      record[header] = values[index] || null;
      return record;
    }, {});
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function mapSnapRow(row) {
  return {
    player_id: row.pfr_player_id || row.player_id || row.gsis_id || null,
    player_name: row.player || row.player_name || row.player_display_name || null,
    team: row.team || null,
    position: row.position || null,
    season: toNumber(row.season),
    week: toNumber(row.week),

    offense_snaps: toNumber(row.offense_snaps),
    offense_pct: toNumber(row.offense_pct),

    defense_snaps: toNumber(row.defense_snaps),
    defense_pct: toNumber(row.defense_pct),

    st_snaps: toNumber(row.st_snaps),
    st_pct: toNumber(row.st_pct),
  };
}

async function syncSnapCounts() {
  console.log(`Downloading nflverse snap counts for ${season}...`);
  console.log(snapCountsUrl);

  const response = await fetch(snapCountsUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download snap counts: ${response.status} ${response.statusText}`
    );
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  const mappedRows = rows
    .map(mapSnapRow)
    .filter((row) => row.player_id || row.player_name);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(mappedRows, null, 2), "utf8");

  console.log(`Done. Wrote ${mappedRows.length} snap-count rows to:`);
  console.log(outputPath);
}

syncSnapCounts().catch((error) => {
  console.error(error);
  process.exit(1);
});