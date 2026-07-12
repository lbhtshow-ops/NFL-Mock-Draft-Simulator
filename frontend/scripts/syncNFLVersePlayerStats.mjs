import fs from "fs";
import path from "path";

const requestedSeasons = process.argv.slice(2);
const seasons = requestedSeasons.length ? requestedSeasons : ["2026"];

const outputPath = path.resolve(
  "src/data/footballIntelligence/nfl/rosters/sources/generatedNFLVersePlayerStatsSource.json"
);

function getStatsUrls(season) {
  return [
    `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`,
    `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_reg_${season}.csv`,
  ];
}

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

function mapStatRow(row, fallbackSeason) {
  return {
    player_id: row.player_id || row.gsis_id || null,
    player_name: row.player_name || row.player_display_name || null,
    team: row.recent_team || row.team || row.posteam || null,
    position: row.position || null,
    season: toNumber(row.season) || toNumber(fallbackSeason),
    week: toNumber(row.week),

    completions: toNumber(row.completions),
    attempts: toNumber(row.attempts),
    passing_yards: toNumber(row.passing_yards),
    passing_tds: toNumber(row.passing_tds),
    interceptions: toNumber(row.interceptions),
    sacks: toNumber(row.sacks),
    sack_yards: toNumber(row.sack_yards),
    passing_air_yards: toNumber(row.passing_air_yards),
    passing_yards_after_catch: toNumber(row.passing_yards_after_catch),
    passing_first_downs: toNumber(row.passing_first_downs),
    passing_epa: toNumber(row.passing_epa),

    carries: toNumber(row.carries),
    rushing_yards: toNumber(row.rushing_yards),
    rushing_tds: toNumber(row.rushing_tds),
    rushing_first_downs: toNumber(row.rushing_first_downs),
    rushing_epa: toNumber(row.rushing_epa),

    targets: toNumber(row.targets),
    receptions: toNumber(row.receptions),
    receiving_yards: toNumber(row.receiving_yards),
    receiving_tds: toNumber(row.receiving_tds),

    fumbles: toNumber(row.fumbles),
    fumbles_lost: toNumber(row.fumbles_lost),

    def_sacks: toNumber(row.def_sacks),
    sacks_defense: toNumber(row.sacks_defense),
    tackles: toNumber(row.tackles),
    interceptions_defense: toNumber(row.def_interceptions),

    fantasy_points: toNumber(row.fantasy_points),
  };
}

async function downloadSeasonStats(season) {
  console.log(`Downloading nflverse player stats for ${season}...`);

  let response = null;
  let workingUrl = null;

  for (const url of getStatsUrls(season)) {
    console.log(url);

    const candidateResponse = await fetch(url);

    if (candidateResponse.ok) {
      response = candidateResponse;
      workingUrl = url;
      break;
    }
  }

  if (!response) {
    throw new Error(`Failed to download player stats for ${season}.`);
  }

  console.log(`Using player stats source for ${season}: ${workingUrl}`);

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  return rows
    .map((row) => mapStatRow(row, season))
    .filter((row) => row.player_id);
}

async function syncPlayerStats() {
  console.log("Requested nflverse seasons:", seasons.join(", "));

  const allRows = [];

  for (const season of seasons) {
    const seasonRows = await downloadSeasonStats(season);
    allRows.push(...seasonRows);

    console.log(
      `Season ${season}: added ${seasonRows.length} player stat rows.`
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(allRows, null, 2), "utf8");

  console.log(`Done. Wrote ${allRows.length} total player stat rows to:`);
  console.log(outputPath);
}

syncPlayerStats().catch((error) => {
  console.error(error);
  process.exit(1);
});