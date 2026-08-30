import {
  adaptSportradarWeeklyDepthChartsPayload
} from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLDepthChartAdapter.js";

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

const signals = adaptSportradarWeeklyDepthChartsPayload(payload, {
  season: 2026,
  week: 1,
  gameType: "PRE",
  sourceUrl: url,
});

const ravens = signals.filter(signal => signal.team === "BAL");

const ravensQbs = ravens.filter(signal =>
  String(
    signal?.player?.position ??
    signal?.role?.depthPosition ??
    ""
  ).toUpperCase() === "QB"
);

console.log(JSON.stringify({
  httpStatus: response.status,
  totalSignals: signals.length,
  ravensSignals: ravens.length,
  ravensQBSignals: ravensQbs.length,

  quarterbacks: ravensQbs.map(signal => ({
    playerId: signal?.player?.playerId ?? null,
    playerName: signal?.player?.playerName ?? null,
    position: signal?.player?.position ?? null,

    depthPosition: signal?.role?.depthPosition ?? null,
    depthRank: signal?.role?.depthRank ?? null,
    starter: signal?.role?.starter ?? null,

    providerTeamId: signal?.player?.providerTeamId ?? null,
    providerPlayerId: signal?.player?.providerPlayerId ?? null,

    authority: signal?.authority ?? null,
    signalClass: signal?.signalClass ?? null,

    source: signal?.provenance?.source ?? null,
  })),
}, null, 2));
