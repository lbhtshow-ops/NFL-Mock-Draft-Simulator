import assert from "node:assert/strict";

import {
  persistNFLAvailabilityBundleWithLiveRefresh,
} from "../gameDecisionSupport/refresh/NFLLiveAvailabilityPersistenceRefreshBinding.js";

let passes = 0;
async function check(name, fn) {
  await fn();
  passes += 1;
  console.log(`PASS ${passes}: ${name}`);
}

function player(status, { id = "qb-1", starter = true, depthRank = 1 } = {}) {
  return {
    player: { playerId: id, playerName: "Test QB" },
    canonicalAvailabilityStatus: status,
    role: { starter, depthRank, depthPosition: "QB" },
    position: "QB",
  };
}

const state = {
  persisted: false,
  loadCalls: [],
  coordinateCalls: [],
};

const repositoryService = {
  async persistBundle() {
    state.persisted = true;
    return {
      status: "SUCCESS",
      teamResults: [
        { team: "BAL", status: "SUCCESS" },
        { team: "CAR", status: "UNCHANGED" },
      ],
      observationWrites: 1,
      artifactWrites: 1,
      sessionWrites: 1,
      unchangedArtifacts: 1,
      failures: [],
    };
  },
};

async function loadProjection({ team }) {
  state.loadCalls.push({ team, persisted: state.persisted });
  if (team === "BAL") {
    return {
      status: "READY",
      resolution: { players: [player(state.persisted ? "OUT" : "AVAILABLE")] },
    };
  }
  return {
    status: "READY",
    resolution: { players: [player("AVAILABLE", { id: "car-qb" })] },
  };
}

async function coordinateRefresh(args) {
  state.coordinateCalls.push(args);
  return {
    status: "COMPLETE",
    summary: { changes: 1, refreshRequirements: 1, executed: 1 },
  };
}

const result = await persistNFLAvailabilityBundleWithLiveRefresh({
  repositoryService,
  bundle: { contract: "TEST_BUNDLE" },
  season: 2026,
  week: 1,
  gameType: "REG",
  teams: ["BAL", "CAR"],
  scheduleRecords: [{ gameId: 1001 }],
  asOf: "2026-09-01T12:00:00.000Z",
  provenance: { source: "diagnostic" },
  loadProjection,
  coordinateRefresh,
});

await check("previous canonical projections are loaded before persistence", async () => {
  assert.deepEqual(state.loadCalls.slice(0, 2), [
    { team: "BAL", persisted: false },
    { team: "CAR", persisted: false },
  ]);
});

await check("only a changed SUCCESS team is projected again after persistence", async () => {
  assert.equal(state.loadCalls.length, 3);
  assert.deepEqual(state.loadCalls[2], { team: "BAL", persisted: true });
});

await check("UNCHANGED team bypasses refresh coordination", async () => {
  assert.equal(state.coordinateCalls.length, 1);
  assert.equal(state.coordinateCalls[0].affectedTeam, "BAL");
});

await check("coordinator receives canonical previous and current player arrays", async () => {
  const call = state.coordinateCalls[0];
  assert.equal(call.previousPlayers[0].canonicalAvailabilityStatus, "AVAILABLE");
  assert.equal(call.currentPlayers[0].canonicalAvailabilityStatus, "OUT");
});

await check("schedule, timestamp, and provenance cross the production binding boundary", async () => {
  const call = state.coordinateCalls[0];
  assert.deepEqual(call.scheduleRecords, [{ gameId: 1001 }]);
  assert.equal(call.asOf, "2026-09-01T12:00:00.000Z");
  assert.equal(call.provenance.source, "diagnostic");
  assert.equal(call.provenance.persistenceStatus, "SUCCESS");
});

await check("persistence result remains authoritative and unchanged", async () => {
  assert.equal(result.persistence.status, "SUCCESS");
  assert.equal(result.persistence.artifactWrites, 1);
  assert.equal(result.persistence.unchangedArtifacts, 1);
});

await check("binding reports refresh execution without owning model logic", async () => {
  assert.equal(result.summary.refreshProcessed, 1);
  assert.equal(result.summary.unchanged, 1);
  assert.equal(result.summary.refreshExecutions, 1);
  assert.equal(result.governance.modelMutationAuthorized, false);
  assert.equal(result.governance.pickemReasoningAuthorized, false);
});

await check("refresh failures do not convert persistence success into persistence failure", async () => {
  const failureState = { persisted: false };
  const failure = await persistNFLAvailabilityBundleWithLiveRefresh({
    repositoryService: {
      async persistBundle() {
        failureState.persisted = true;
        return { status: "SUCCESS", teamResults: [{ team: "BAL", status: "SUCCESS" }] };
      },
    },
    bundle: {},
    season: 2026,
    week: 1,
    teams: ["BAL"],
    loadProjection: async () => ({
      status: "READY",
      resolution: { players: [player(failureState.persisted ? "OUT" : "AVAILABLE")] },
    }),
    coordinateRefresh: async () => { throw new Error("synthetic downstream failure"); },
  });
  assert.equal(failure.persistence.status, "SUCCESS");
  assert.equal(failure.teamResults[0].status, "REFRESH_FAILED");
});

console.log(`NFLLiveAvailabilityPersistenceRefreshBindingDiagnostics: ${passes}/${passes} passed`);
