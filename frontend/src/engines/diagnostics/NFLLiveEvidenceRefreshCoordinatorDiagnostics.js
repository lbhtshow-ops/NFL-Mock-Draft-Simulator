import assert from "node:assert/strict";
import {
  coordinateNFLLiveEvidenceRefresh,
} from "../gameDecisionSupport/refresh/NFLLiveEvidenceRefreshCoordinator.js";

const tests = [];
const test = async (name, fn) => {
  try { await fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
};

const asOf = "2026-09-10T12:00:00Z";
const schedule = [{
  gameId: 260913001,
  season: 2026,
  week: 1,
  gameType: "REG",
  awayTeam: "BAL",
  homeTeam: "BUF",
  kickoff: "2026-09-13T17:00:00Z",
  completed: false,
}];
const previousQB = [{
  playerId: "bal-qb",
  playerName: "BAL QB",
  position: "QB",
  reportStatus: "QUESTIONABLE",
  rosterStatus: "ACTIVE",
  depthPosition: "QB",
  depthRank: 1,
  starter: true,
  snapshotId: "snap-a",
}];
const currentQBOut = [{
  ...previousQB[0],
  reportStatus: "OUT",
  snapshotId: "snap-b",
}];

function dependencies() {
  const calls = [];
  return {
    calls,
    availabilityRuntime: {
      invalidateTeamAvailability(args) { calls.push({ type: "invalidate", args }); return { status: "INVALIDATED" }; },
      async loadForMatchup(args) { calls.push({ type: "load", args }); return { status: "READY", teams: args.teams }; },
    },
    async buildMatchup(args) { calls.push({ type: "matchup", args }); return { contract: "MATCHUP", edge: -5 }; },
    async getDecision(args) { calls.push({ type: "decision", args }); return { favorite: "BUF", homeWinProbability: 0.58, awayWinProbability: 0.42 }; },
  };
}

const dep = dependencies();
const success = await coordinateNFLLiveEvidenceRefresh({
  affectedTeam: "BAL",
  previousPlayers: previousQB,
  currentPlayers: currentQBOut,
  scheduleRecords: schedule,
  asOf,
  provenance: { adapter: "DIAGNOSTIC", repositoryVersion: "1.0.0" },
  availabilityRuntime: dep.availabilityRuntime,
  buildMatchup: dep.buildMatchup,
  getDecision: dep.getDecision,
  now: () => "2026-09-10T12:01:00Z",
});

const sameDep = dependencies();
const noChanges = await coordinateNFLLiveEvidenceRefresh({
  affectedTeam: "BAL",
  previousPlayers: previousQB,
  currentPlayers: previousQB,
  scheduleRecords: schedule,
  asOf,
  availabilityRuntime: sameDep.availabilityRuntime,
  buildMatchup: sameDep.buildMatchup,
  getDecision: sameDep.getDecision,
});

const lowDep = dependencies();
const lowChange = await coordinateNFLLiveEvidenceRefresh({
  affectedTeam: "BAL",
  previousPlayers: [{ playerId: "p2", playerName: "Old Name", position: "WR" }],
  currentPlayers: [{ playerId: "p2", playerName: "New Name", position: "WR" }],
  scheduleRecords: schedule,
  asOf,
  availabilityRuntime: lowDep.availabilityRuntime,
  buildMatchup: lowDep.buildMatchup,
  getDecision: lowDep.getDecision,
});

await test("qb-status-change-is-emitted", () => assert.equal(success.diff.changes[0].change.changeType, "CHANGED"));
await test("qb-status-change-is-critical", () => assert.equal(success.results[0].orchestration.materiality.level, "CRITICAL"));
await test("refresh-requirement-is-created", () => assert.equal(success.summary.refreshRequirements, 1));
await test("canonical-refresh-executes", () => assert.equal(success.results[0].execution.status, "EXECUTED"));
await test("targeted-cache-invalidation-occurs-first", () => assert.equal(dep.calls[0].type, "invalidate"));
await test("affected-team-cache-is-targeted", () => assert.equal(dep.calls[0].args.team, "BAL"));
await test("matchup-load-covers-both-teams", () => assert.deepEqual(dep.calls[1].args.teams, ["BAL", "BUF"]));
await test("canonical-matchup-precedes-decision", () => assert.deepEqual(dep.calls.map(call => call.type), ["invalidate", "load", "matchup", "decision"]));
await test("unchanged-evidence-does-not-call-executor", () => {
  assert.equal(noChanges.status, "NO_CHANGES");
  assert.equal(sameDep.calls.length, 0);
});
await test("low-nonmaterial-change-does-not-execute", () => {
  assert.equal(lowChange.results[0].orchestration.status, "NO_REFRESH_REQUIRED");
  assert.equal(lowChange.results[0].execution, null);
  assert.equal(lowDep.calls.length, 0);
});
await test("coordinator-does-not-own-model-or-probability-mutation", () => {
  assert.equal(success.governance.modelMutationAuthorized, false);
  assert.equal(success.governance.probabilityMutationAuthorized, false);
});
await test("le3-executor-remains-canonical-execution-boundary", () => {
  assert.equal(success.results[0].execution.governance.executionBoundary, "LE_3_GOVERNED_REFRESH_EXECUTOR");
});

const passed = tests.filter(test => test.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({ suite: "NFL Live Evidence Refresh Coordinator Diagnostics", passed, failed, tests }, null, 2));
if (failed) process.exitCode = 1;
