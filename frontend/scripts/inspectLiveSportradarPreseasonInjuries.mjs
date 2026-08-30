const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (!apiKey) {
  throw new Error("SPORTRADAR_NFL_API_KEY is not configured.");
}

const url =
  "https://api.sportradar.com/nfl/official/trial/v7/en/seasons/2026/PRE/1/injuries.json";

const response = await fetch(url, {
  headers: {
    "x-api-key": apiKey,
    "accept": "application/json",
  },
});

const payload = await response.json();

const teams = Array.isArray(payload?.teams) ? payload.teams : [];

console.log(JSON.stringify({
  httpStatus: response.status,
  httpOk: response.ok,
  season: payload?.season ?? null,
  week: payload?.week ?? null,
  teamCount: teams.length,
  teamAliases: teams.map(team => team.alias).filter(Boolean),
  firstTeamKeys: teams.length ? Object.keys(teams[0]) : [],
  firstTeamAlias: teams[0]?.alias ?? null,
  firstTeamPlayerCount:
    Array.isArray(teams[0]?.players) ? teams[0].players.length : null,
  firstPlayerKeys:
    Array.isArray(teams[0]?.players) && teams[0].players.length
      ? Object.keys(teams[0].players[0])
      : [],
}, null, 2));
