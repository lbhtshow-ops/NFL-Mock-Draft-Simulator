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

const transactions = Array.isArray(payload?.transactions)
  ? payload.transactions
  : [];

const keysOf = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

console.log(JSON.stringify({
  httpStatus: response.status,
  httpOk: response.ok,
  requestedLeagueDate: `${year}-${month}-${day}`,
  startTime: payload?.start_time ?? null,
  endTime: payload?.end_time ?? null,
  topLevelKeys: keysOf(payload),
  transactionCount: transactions.length,
  firstTransactionKeys:
    transactions.length ? keysOf(transactions[0]) : [],
  firstTransaction:
    transactions.length
      ? {
          id: transactions[0]?.id ?? null,
          transactionCode: transactions[0]?.transaction_code ?? null,
          transactionType: transactions[0]?.transaction_type ?? null,
          description: transactions[0]?.desc ?? null,
          effectiveDate: transactions[0]?.effective_date ?? null,
          statusBefore: transactions[0]?.status_before ?? null,
          statusAfter: transactions[0]?.status_after ?? null,
          playerKeys: keysOf(transactions[0]?.player),
          fromTeamKeys: keysOf(transactions[0]?.from_team),
          toTeamKeys: keysOf(transactions[0]?.to_team),
        }
      : null,
}, null, 2));
