const DEFAULT_ACCESS_LEVEL = "trial";
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 1300;
const DEFAULT_MAX_429_RETRIES = 2;
const DEFAULT_BACKOFF_MS = Object.freeze([2500, 5000]);
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const NFL_HISTORICAL_SPORTRADAR_ACQUISITION_CONTRACT =
  "FIE-NFL-HISTORICAL-SPORTRADAR-ACQUISITION-2C3-1.0.0";

export function buildNFLHistoricalSportradarUrls({
  season,
  week,
  gameType = "REG",
  accessLevel = DEFAULT_ACCESS_LEVEL,
  root = null,
} = {}) {
  const normalizedSeason = Number(season);
  const normalizedWeek = Number(week);
  if (!Number.isInteger(normalizedSeason) || !Number.isInteger(normalizedWeek)) {
    throw new Error("Historical Sportradar acquisition requires integer season and week.");
  }
  const normalizedGameType = String(gameType || "REG").toUpperCase();
  const base =
    root ||
    `https://api.sportradar.com/nfl/official/${accessLevel}/v7/en`;
  return Object.freeze({
    injuryUrl: `${base}/seasons/${normalizedSeason}/${normalizedGameType}/${normalizedWeek}/injuries.json`,
    scheduleUrl: `${base}/games/${normalizedSeason}/${normalizedGameType}/${normalizedWeek}/schedule.json`,
  });
}

export function createNFLHistoricalSportradarAcquisitionClient({
  apiKey = typeof process !== "undefined" ? process.env?.SPORTRADAR_NFL_API_KEY : null,
  accessLevel =
    (typeof process !== "undefined" ? process.env?.SPORTRADAR_NFL_ACCESS_LEVEL : null) ||
    DEFAULT_ACCESS_LEVEL,
  fetchImpl = globalThis.fetch,
  minRequestIntervalMs = DEFAULT_MIN_REQUEST_INTERVAL_MS,
  max429Retries = DEFAULT_MAX_429_RETRIES,
  backoffMs = DEFAULT_BACKOFF_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  root = null,
  log = (message) => console.error(message),
} = {}) {
  if (!apiKey) throw new Error("SPORTRADAR_NFL_API_KEY is required.");
  if (typeof fetchImpl !== "function") throw new Error("FETCH_UNAVAILABLE");

  let lastRequestStartedAt = 0;

  async function fetchJson(url) {
    const wait = Math.max(
      0,
      Number(minRequestIntervalMs) - (Date.now() - lastRequestStartedAt)
    );
    if (wait) await sleep(wait);

    for (let attempt = 0; attempt <= max429Retries; attempt++) {
      lastRequestStartedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
      let response;
      try {
        response = await fetchImpl(url, {
          headers: { accept: "application/json", "x-api-key": apiKey },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.status !== 429) {
        if (!response.ok) throw new Error(`SPORTRADAR_HTTP_${response.status}:${url}`);
        return response.json();
      }

      if (attempt >= max429Retries) {
        throw new Error(`SPORTRADAR_RATE_LIMIT_EXHAUSTED:HTTP_429:${url}`);
      }
      const retryAfterSeconds = Number(response.headers?.get?.("retry-after"));
      const configuredBackoff = backoffMs[attempt] ?? backoffMs.at(-1) ?? 5000;
      const delay = Number.isFinite(retryAfterSeconds)
        ? Math.max(minRequestIntervalMs, retryAfterSeconds * 1000)
        : configuredBackoff;
      log(
        `Sportradar HTTP 429; bounded retry ${attempt + 1}/${max429Retries} after ${delay}ms.`
      );
      await sleep(delay);
    }
    throw new Error(`SPORTRADAR_FETCH_EXHAUSTED:${url}`);
  }

  async function acquireWeek({ season, week, gameType = "REG" } = {}) {
    const urls = buildNFLHistoricalSportradarUrls({
      season,
      week,
      gameType,
      accessLevel,
      root,
    });
    const injuryPayload = await fetchJson(urls.injuryUrl);
    const schedulePayload = await fetchJson(urls.scheduleUrl);
    return Object.freeze({
      contractVersion: NFL_HISTORICAL_SPORTRADAR_ACQUISITION_CONTRACT,
      season: Number(season),
      week: Number(week),
      gameType: String(gameType || "REG").toUpperCase(),
      injuryPayload,
      schedulePayload,
      injuryUrl: urls.injuryUrl,
      scheduleUrl: urls.scheduleUrl,
      sourcePersisted: false,
      databaseMutated: false,
    });
  }

  return Object.freeze({
    contractVersion: NFL_HISTORICAL_SPORTRADAR_ACQUISITION_CONTRACT,
    accessLevel,
    acquireWeek,
  });
}

export const NFL_HISTORICAL_SPORTRADAR_ACQUISITION_DEFAULTS = Object.freeze({
  minRequestIntervalMs: DEFAULT_MIN_REQUEST_INTERVAL_MS,
  max429Retries: DEFAULT_MAX_429_RETRIES,
  backoffMs: DEFAULT_BACKOFF_MS,
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
});
