const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (!apiKey) {
  throw new Error("SPORTRADAR_NFL_API_KEY is not configured.");
}

const url =
  "https://api.sportradar.com/nfl/official/trial/v7/en/seasons/2026/REG/1/injuries.json";

const response = await fetch(url, {
  headers: {
    "x-api-key": apiKey,
    "accept": "application/json",
  },
});

const text = await response.text();

let payload = null;

try {
  payload = text ? JSON.parse(text) : null;
} catch {
  payload = null;
}

const keysOf = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

const arrayShape = (value) => ({
  isArray: Array.isArray(value),
  length: Array.isArray(value) ? value.length : null,
  firstItemKeys:
    Array.isArray(value) && value.length > 0
      ? keysOf(value[0])
      : [],
});

const result = {
  httpStatus: response.status,
  httpOk: response.ok,
  contentType: response.headers.get("content-type"),
  topLevelKeys: keysOf(payload),
  week: payload?.week ?? null,
  season: payload?.season ?? null,
  teams: arrayShape(payload?.teams),
  injuries: arrayShape(payload?.injuries),
  players: arrayShape(payload?.players),
  firstTeamKeys:
    Array.isArray(payload?.teams) && payload.teams.length > 0
      ? keysOf(payload.teams[0])
      : [],
  firstTeamPlayers:
    Array.isArray(payload?.teams) && payload.teams.length > 0
      ? arrayShape(payload.teams[0]?.players)
      : null,
  firstTeamInjuries:
    Array.isArray(payload?.teams) && payload.teams.length > 0
      ? arrayShape(payload.teams[0]?.injuries)
      : null,
  responseBodyLength: text.length,
};

console.log(JSON.stringify(result, null, 2));
