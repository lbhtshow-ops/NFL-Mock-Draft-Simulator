const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (!apiKey) {
  throw new Error("SPORTRADAR_NFL_API_KEY is not configured.");
}

const url =
  "https://api.sportradar.com/nfl/official/trial/v7/en/seasons/2026/PRE/1/depth_charts.json";

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

const keysOf = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

const teams = Array.isArray(payload?.teams)
  ? payload.teams
  : [];

const ravens = teams.find(team =>
  team?.alias === "BAL" ||
  team?.id === "ebd87119-b331-4469-9ea6-d51fe3ce2f1c"
) ?? null;

const arrayFields = ravens
  ? Object.entries(ravens)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => ({
        field: key,
        length: value.length,
        firstItemKeys:
          value.length &&
          value[0] &&
          typeof value[0] === "object"
            ? Object.keys(value[0])
            : [],
      }))
  : [];

console.log(JSON.stringify({
  stage: "WEEKLY_DEPTH_CHART_LIVE_VALIDATION",

  request: {
    season: 2026,
    seasonType: "PRE",
    week: 1,
    httpStatus: response.status,
    httpOk: response.ok,
    responseBodyLength: text.length,
  },

  payload: {
    topLevelKeys: keysOf(payload),
    season: payload?.season ?? null,
    week: payload?.week ?? null,
    teamCount: teams.length,
  },

  ravens: ravens
    ? {
        found: true,
        id: ravens.id ?? null,
        alias: ravens.alias ?? null,
        market: ravens.market ?? null,
        name: ravens.name ?? null,
        keys: keysOf(ravens),
        arrayFields,
      }
    : {
        found: false,
      },

}, null, 2));
