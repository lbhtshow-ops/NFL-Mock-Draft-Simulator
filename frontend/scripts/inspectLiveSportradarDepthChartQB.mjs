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

const payload = await response.json();

const teams = Array.isArray(payload?.teams) ? payload.teams : [];

const ravens = teams.find(team => team?.alias === "BAL");

if (!ravens) {
  throw new Error("BAL not found in live depth chart payload.");
}

const offense = Array.isArray(ravens.offense)
  ? ravens.offense
  : [];

const qbGroup = offense.find(group =>
  String(group?.position?.name ?? group?.position?.abbr ?? "")
    .toUpperCase()
    .includes("QB")
) ?? offense.find(group =>
  JSON.stringify(group?.position ?? {})
    .toUpperCase()
    .includes("QUARTERBACK")
);

const keysOf = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

const position = qbGroup?.position ?? null;

const arrayFields =
  position && typeof position === "object"
    ? Object.entries(position)
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
  httpStatus: response.status,
  ravensFound: true,
  offenseGroupCount: offense.length,
  qbGroupFound: Boolean(qbGroup),

  qbGroupKeys: qbGroup ? keysOf(qbGroup) : [],

  positionKeys: position ? keysOf(position) : [],

  positionSummary: position
    ? {
        id: position.id ?? null,
        name: position.name ?? null,
        abbr: position.abbr ?? null,
        desc: position.desc ?? null,
      }
    : null,

  positionArrayFields: arrayFields,

}, null, 2));
