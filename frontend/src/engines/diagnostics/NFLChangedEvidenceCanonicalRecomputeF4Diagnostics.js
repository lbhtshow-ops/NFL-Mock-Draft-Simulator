import assert from "node:assert/strict";

import {
  coordinateNFLLiveEvidenceRefresh,
} from "../gameDecisionSupport/refresh/NFLLiveEvidenceRefreshCoordinator.js";

import {
  buildNFLMatchupIntelligenceProfile,
} from "../../data/footballIntelligence/services/NFLMatchupIntelligenceService.js";

import {
  getNFLGameDecision,
} from "../gameDecisionSupport/canonical/NFLGameDecisionService.js";

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

const previousPlayers = [{
  playerId: "f4-qb",
  playerName: "F4 QB",
  position: "QB",
  starter: true,
  depthRank: 1,
  availabilityStatus: "AVAILABLE",
  snapshotId: "before",
  effectiveAt: "2026-09-01T12:00:00.000Z",
}];

const currentPlayers = [{
  ...previousPlayers[0],
  availabilityStatus: "OUT",
  reportStatus: "OUT",
  snapshotId: "after",
}];

const scheduleRecords = [{
  gameId: 1001,
  season: 2026,
  week: 1,
  gameType: "REG",
  awayTeam: "BAL",
  homeTeam: "BUF",
  kickoff: "2026-09-10T20:00:00.000Z",
  status: "SCHEDULED",
}];

const order = [];
const availabilityRuntime = {
  invalidateTeamAvailability(input) {
    order.push("invalidate");
    return { status: "INVALIDATED", invalidated: true, input };
  },
  async loadForMatchup(input) {
    order.push("load");
    return { status: "READY", teams: input.teams.map(team => ({ team, status: "READY" })) };
  },
};

let buildCalls = 0;
let decisionCalls = 0;

const result = await coordinateNFLLiveEvidenceRefresh({
  affectedTeam: "BAL",
  previousPlayers,
  currentPlayers,
  scheduleRecords,
  asOf: "2026-09-01T12:00:00.000Z",
  availabilityRuntime,
  buildMatchup: async input => {
    buildCalls += 1;
    return buildNFLMatchupIntelligenceProfile(input);
  },
  getDecision: async input => {
    decisionCalls += 1;
    return getNFLGameDecision(input);
  },
  now: () => "2026-09-01T12:00:00.000Z",
});

const entry = result.results[0];
const execution = entry.execution;

await check("starting QB AVAILABLE to OUT emits one material change", async () => {
  assert.equal(result.summary.changes, 1);
});

await check("starting QB status change is CRITICAL", async () => {
  assert.equal(entry.orchestration.materiality.level, "CRITICAL");
});

await check("starting QB change creates one refresh requirement", async () => {
  assert.equal(result.summary.refreshRequirements, 1);
});

await check("affected future canonical game resolves", async () => {
  assert.equal(entry.orchestration.gameResolution.status, "RESOLVED");
  assert.equal(entry.orchestration.gameResolution.game.gameId, 1001);
});

await check("targeted invalidation occurs before matchup availability load", async () => {
  assert.deepEqual(order, ["invalidate", "load"]);
});

await check("canonical matchup builder executes exactly once", async () => {
  assert.equal(buildCalls, 1);
  assert(execution.matchup);
});

await check("canonical decision service executes exactly once", async () => {
  assert.equal(decisionCalls, 1);
  assert.equal(execution.decision.contract, "NFLGameDecisionOutput");
});

await check("refresh execution completes", async () => {
  assert.equal(execution.status, "EXECUTED");
  assert.equal(result.summary.executed, 1);
});

await check("execution retains trigger provenance", async () => {
  assert.equal(execution.provenance.triggerTeam, "BAL");
  assert.equal(execution.provenance.playerId, "f4-qb");
});

await check("refresh path cannot author model or probability mutation", async () => {
  assert.equal(execution.governance.modelMutationAuthorized, false);
  assert.equal(execution.governance.probabilityMutationAuthorized, false);
});

console.log(`NFLChangedEvidenceCanonicalRecomputeF4Diagnostics: ${passed}/${passed} passed`);
