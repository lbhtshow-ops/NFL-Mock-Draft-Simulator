const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (!apiKey) {
  throw new Error("SPORTRADAR_NFL_API_KEY is not configured.");
}

const headers = {
  "x-api-key": apiKey,
  "accept": "application/json",
};

const keysOf = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

// ----------------------------------------------------
// 1. Resolve Baltimore's canonical Sportradar team ID
// ----------------------------------------------------

const teamsUrl =
  "https://api.sportradar.com/nfl/official/trial/v7/en/league/teams.json";

const teamsResponse = await fetch(teamsUrl, { headers });
const teamsText = await teamsResponse.text();

let teamsPayload = null;

try {
  teamsPayload = teamsText ? JSON.parse(teamsText) : null;
} catch {
  teamsPayload = null;
}

if (!teamsResponse.ok) {
  console.log(JSON.stringify({
    stage: "TEAM_ID_LOOKUP",
    httpStatus: teamsResponse.status,
    httpOk: teamsResponse.ok,
    topLevelKeys: keysOf(teamsPayload),
    responseBodyLength: teamsText.length,
  }, null, 2));

  process.exit(1);
}

const teams = Array.isArray(teamsPayload?.teams)
  ? teamsPayload.teams
  : [];

const ravens = teams.find(team => team?.alias === "BAL");

if (!ravens?.id) {
  console.log(JSON.stringify({
    stage: "TEAM_ID_LOOKUP",
    httpStatus: teamsResponse.status,
    teamCount: teams.length,
    ravensFound: false,
    aliases: teams.map(team => team?.alias).filter(Boolean),
  }, null, 2));

  process.exit(1);
}

// ----------------------------------------------------
// 2. Request Baltimore's complete live roster
// ----------------------------------------------------

const rosterUrl =
  `https://api.sportradar.com/nfl/official/trial/v7/en/teams/${ravens.id}/full_roster.json`;

const rosterResponse = await fetch(rosterUrl, { headers });
const rosterText = await rosterResponse.text();

let rosterPayload = null;

try {
  rosterPayload = rosterText ? JSON.parse(rosterText) : null;
} catch {
  rosterPayload = null;
}

const players = Array.isArray(rosterPayload?.players)
  ? rosterPayload.players
  : [];

const first = players[0] ?? null;

const statusCounts = {};

for (const player of players) {
  const status = player?.status ?? "NULL";

  statusCounts[status] =
    (statusCounts[status] ?? 0) + 1;
}

console.log(JSON.stringify({
  stage: "TEAM_ROSTER_LIVE_VALIDATION",

  teamLookup: {
    httpStatus: teamsResponse.status,
    teamCount: teams.length,
    ravensFound: true,
    ravens: {
      id: ravens.id,
      alias: ravens.alias ?? null,
      market: ravens.market ?? null,
      name: ravens.name ?? null,
      srId: ravens.sr_id ?? null,
    },
  },

  rosterRequest: {
    httpStatus: rosterResponse.status,
    httpOk: rosterResponse.ok,
    responseBodyLength: rosterText.length,
  },

  roster: {
    topLevelKeys: keysOf(rosterPayload),

    team: {
      id: rosterPayload?.id ?? null,
      alias: rosterPayload?.alias ?? null,
      market: rosterPayload?.market ?? null,
      name: rosterPayload?.name ?? null,
      srId: rosterPayload?.sr_id ?? null,
    },

    playerCount: players.length,

    statusCounts,

    firstPlayerKeys:
      first ? keysOf(first) : [],

    firstPlayer:
      first
        ? {
            id: first.id ?? null,
            srId: first.sr_id ?? null,
            name:
              first.name ??
              first.full_name ??
              null,
            firstName: first.first_name ?? null,
            lastName: first.last_name ?? null,
            position: first.position ?? null,
            jersey: first.jersey ?? null,
            status: first.status ?? null,
            experience: first.experience ?? null,
          }
        : null,
  },
}, null, 2));
