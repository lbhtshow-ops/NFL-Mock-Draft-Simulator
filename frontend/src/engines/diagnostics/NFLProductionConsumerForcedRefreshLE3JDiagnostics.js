import assert from "node:assert/strict";

import {
  createFieDecisionApiHandler,
} from "../../../services/fieDecisionApi/handler.mjs";

import {
  createFieDecisionProductionComposition,
} from "../../../services/fieDecisionApi/productionComposition.mjs";

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

const requestGame = {
  gameId: 34,
  season: 2026,
  week: 1,
  awayTeam: "BAL",
  homeTeam: "IND",
  kickoff: "2026-09-13T17:00:00.000Z",
};

const canonicalDecision = {
  contract: "NFLGameDecisionOutput",
  favorite: "IND",
  homeWinProbability: 0.53,
  awayWinProbability: 0.47,
  expectedHomeMargin: 1.2,
  confidence: 0.6,
  confidenceBand: "MEDIUM",
  generatedAt: "2026-08-27T12:00:00.000Z",
  model: { id: "NFL-GAME-DECISION-MODEL-V1.0.0", version: "1.0.0", status: "PRODUCTION" },
  decisionInfluence: { playerImpact: { applied: false } },
};

await check("handler forwards forceRefresh true to production matchup boundary", async () => {
  let observed = null;
  const handler = createFieDecisionApiHandler({
    buildMatchup: async input => {
      observed = input;
      return { keyAdvantages: [], limitations: [] };
    },
    getDecision: async () => canonicalDecision,
    now: () => "2026-08-27T12:00:00.000Z",
  });

  const response = await handler({
    method: "POST",
    path: "/v1/nfl/game-decisions",
    body: {
      contract: "LBHTPickemFIEDecisionRequest",
      version: "1.0.0",
      forceRefresh: true,
      games: [requestGame],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(observed.forceRefresh, true);
});

await check("handler defaults forceRefresh to false", async () => {
  let observed = null;
  const handler = createFieDecisionApiHandler({
    buildMatchup: async input => {
      observed = input;
      return { keyAdvantages: [], limitations: [] };
    },
    getDecision: async () => canonicalDecision,
  });

  await handler({
    method: "POST",
    path: "/v1/nfl/game-decisions",
    body: {
      contract: "LBHTPickemFIEDecisionRequest",
      version: "1.0.0",
      games: [requestGame],
    },
  });

  assert.equal(observed.forceRefresh, false);
});

await check("forced refresh invalidates both teams before repository availability load", async () => {
  const order = [];
  const runtime = {
    invalidateTeamAvailability({ team }) {
      order.push(`invalidate:${team}`);
      return { status: "INVALIDATED", invalidated: true };
    },
    async loadForMatchup({ teams }) {
      order.push(`load:${teams.join(",")}`);
      return { status: "READY", teams: [] };
    },
  };

  const composition = createFieDecisionProductionComposition({
    availabilityRuntime: runtime,
    normalizeTeam: value => value,
    buildMatchupIntelligence: async () => {
      order.push("build");
      return { status: "MATCHUP" };
    },
    getDecision: async () => canonicalDecision,
  });

  await composition.buildMatchup({
    ...requestGame,
    availabilityWeek: 1,
    gameType: "REG",
    forceRefresh: true,
  });

  assert.deepEqual(order, [
    "invalidate:BAL",
    "invalidate:IND",
    "load:BAL,IND",
    "build",
  ]);
});

await check("normal request preserves cache-enabled load path without invalidation", async () => {
  const order = [];
  const runtime = {
    invalidateTeamAvailability() {
      order.push("invalidate");
      return { status: "INVALIDATED" };
    },
    async loadForMatchup() {
      order.push("load");
      return { status: "READY", teams: [] };
    },
  };

  const composition = createFieDecisionProductionComposition({
    availabilityRuntime: runtime,
    normalizeTeam: value => value,
    buildMatchupIntelligence: async () => {
      order.push("build");
      return {};
    },
    getDecision: async () => canonicalDecision,
  });

  await composition.buildMatchup({
    ...requestGame,
    availabilityWeek: 1,
    gameType: "REG",
  });

  assert.deepEqual(order, ["load", "build"]);
});

await check("forced refresh fails closed when availability invalidation is unsupported", async () => {
  const composition = createFieDecisionProductionComposition({
    availabilityRuntime: {
      async loadForMatchup() {
        throw new Error("must not load");
      },
    },
    normalizeTeam: value => value,
    buildMatchupIntelligence: async () => ({}),
    getDecision: async () => canonicalDecision,
  });

  await assert.rejects(
    composition.buildMatchup({
      ...requestGame,
      forceRefresh: true,
    }),
    /FIE_FORCED_REFRESH_UNSUPPORTED/
  );
});

await check("forced refresh fails closed when canonical availability runtime is unavailable", async () => {
  let loadCalls = 0;
  const composition = createFieDecisionProductionComposition({
    availabilityRuntime: {
      invalidateTeamAvailability() {
        return { status: "NOT_CONFIGURED", invalidated: false };
      },
      async loadForMatchup() {
        loadCalls += 1;
        return { status: "NOT_CONFIGURED", teams: [] };
      },
    },
    normalizeTeam: value => value,
    buildMatchupIntelligence: async () => ({}),
    getDecision: async () => canonicalDecision,
  });

  await assert.rejects(
    composition.buildMatchup({
      ...requestGame,
      forceRefresh: true,
    }),
    /FIE_FORCED_REFRESH_UNAVAILABLE/
  );
  assert.equal(loadCalls, 0);
});

await check("forced refresh does not authorize model or probability mutation", async () => {
  const composition = createFieDecisionProductionComposition({
    availabilityRuntime: {
      invalidateTeamAvailability() {
        return { status: "NOT_CACHED", invalidated: false };
      },
      async loadForMatchup() {
        return { status: "READY", teams: [] };
      },
    },
    normalizeTeam: value => value,
    buildMatchupIntelligence: async () => ({}),
    getDecision: async () => canonicalDecision,
  });

  assert.equal(composition.governance.modelMutationAuthorized, false);
  assert.equal(composition.governance.probabilityMutationAuthorized, false);
  assert.equal(composition.governance.forcedRefreshInvalidatesAvailabilityCache, true);
});

console.log(`NFLProductionConsumerForcedRefreshLE3JDiagnostics: ${passed}/${passed} passed`);
