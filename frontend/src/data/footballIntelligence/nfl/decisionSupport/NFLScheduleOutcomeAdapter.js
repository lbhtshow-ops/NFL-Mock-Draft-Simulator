function value(row, ...keys) {
  for (const key of keys) {
    if (
      row &&
      Object.prototype.hasOwnProperty.call(row, key) &&
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ""
    ) {
      return row[key];
    }
  }

  return null;
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function adaptNFLScheduleOutcomeRow(row) {
  const season = numeric(value(row, "season"));
  const week = numeric(value(row, "week"));
  const awayTeam = value(row, "away_team", "awayTeam");
  const homeTeam = value(row, "home_team", "homeTeam");
  const awayScore = numeric(value(row, "away_score", "awayScore"));
  const homeScore = numeric(value(row, "home_score", "homeScore"));

  if (
    !Number.isInteger(season) ||
    !Number.isInteger(week) ||
    !awayTeam ||
    !homeTeam
  ) {
    return null;
  }

  return {
    gameId: value(row, "game_id", "gameId"),
    season,
    week,
    gameType:
      value(row, "game_type", "gameType") || "REG",
    gameday:
      value(row, "gameday", "game_date", "date"),
    awayTeam: String(awayTeam).toUpperCase(),
    homeTeam: String(homeTeam).toUpperCase(),
    awayRest: numeric(value(row, "away_rest", "awayRest")),
    homeRest: numeric(value(row, "home_rest", "homeRest")),
    awayScore,
    homeScore,
    completed:
      awayScore !== null &&
      homeScore !== null,
  };
}

export function adaptNFLScheduleOutcomeRows(rows = []) {
  return rows
    .map(adaptNFLScheduleOutcomeRow)
    .filter(Boolean);
}

export default {
  adaptNFLScheduleOutcomeRow,
  adaptNFLScheduleOutcomeRows,
};
