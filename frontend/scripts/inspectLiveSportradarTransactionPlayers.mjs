const apiKey = process.env.SPORTRADAR_NFL_API_KEY;

if (!apiKey) {
  throw new Error("SPORTRADAR_NFL_API_KEY is not configured.");
}

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date());

const get = type => parts.find(p => p.type === type)?.value;

const year = get("year");
const month = get("month");
const day = get("day");

const url =
  `https://api.sportradar.com/nfl/official/trial/v7/en/league/${year}/${month}/${day}/transactions.json`;

const response = await fetch(url, {
  headers: {
    "x-api-key": apiKey,
    "accept": "application/json",
  },
});

const payload = await response.json();

const players = Array.isArray(payload?.players)
  ? payload.players
  : [];

const keysOf = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

const first = players[0] ?? null;

const arrayFields = first
  ? Object.entries(first)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => ({
        field: key,
        length: value.length,
        firstItemKeys:
          value.length && typeof value[0] === "object"
            ? Object.keys(value[0])
            : [],
      }))
  : [];

console.log(JSON.stringify({
  httpStatus: response.status,
  httpOk: response.ok,
  requestedLeagueDate: `${year}-${month}-${day}`,
  startTime: payload?.start_time ?? null,
  endTime: payload?.end_time ?? null,
  playerCount: players.length,
  firstPlayerKeys: first ? keysOf(first) : [],
  firstPlayer: first
    ? {
        id: first.id ?? null,
        name: first.name ?? null,
        firstName: first.first_name ?? null,
        lastName: first.last_name ?? null,
        position: first.position ?? null,
        status: first.status ?? null,
      }
    : null,
  firstPlayerArrayFields: arrayFields,
}, null, 2));
