import fs from "fs";
import path from "path";

const season = process.argv[2] || "2025";

const rosterUrl = `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${season}.csv`;

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/rosters/sources/generatedNFLVerseRosterSource.json"
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

function normalizeBoolean(value) {
  return (
    value === true ||
    value === "TRUE" ||
    value === "true" ||
    value === "1"
  );
}

function mapRosterRow(row) {
  return {
    player_id: row.player_id || row.gsis_id || row.espn_id,

    player_name:
      row.player_name ||
      row.full_name ||
      `${row.first_name || ""} ${row.last_name || ""}`.trim(),

    position: row.position,

    team: row.team || row.recent_team,

    age: row.age ? Number(row.age) : null,

    years_exp: row.years_exp
      ? Number(row.years_exp)
      : null,

    status: row.status || "Active",

rosterPhase: "trainingCamp",

depth_chart_position:
  row.depth_chart_position || row.position,

    depth_chart_rank: row.depth_chart_rank
      ? Number(row.depth_chart_rank)
      : null,

    starter: normalizeBoolean(row.starter),

    source: "nflverse roster csv",

    confidence: 0.75,

    lastUpdated: new Date()
      .toISOString()
      .slice(0, 10),
  };
}

async function syncRosters() {
  console.log(
    `Downloading nflverse roster data for ${season}...`
  );

  console.log(rosterUrl);

  const response = await fetch(rosterUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download roster data: ${response.status} ${response.statusText}`
    );
  }

  const csvText = await response.text();

  const rows = parseCSV(csvText);

  const mappedRows = rows
    .map(mapRosterRow)
    .filter((row) => row.team);

  fs.mkdirSync(
    path.dirname(outputPath),
    { recursive: true }
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(mappedRows, null, 2),
    "utf8"
  );

  console.log(
    `Done. Wrote ${mappedRows.length} roster rows to:`
  );

  console.log(outputPath);
}

syncRosters().catch((error) => {
  console.error(error);

  process.exit(1);
});