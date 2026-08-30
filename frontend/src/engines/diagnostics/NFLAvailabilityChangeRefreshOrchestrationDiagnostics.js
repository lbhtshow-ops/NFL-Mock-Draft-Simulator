import assert from "node:assert/strict";

import {
  NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS,
  orchestrateNFLAvailabilityChangeRefresh,
} from "../gameDecisionSupport/refresh/NFLAvailabilityChangeRefreshOrchestrator.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

const asOf = "2026-09-01T12:00:00Z";

const balBuf = {
  gameId: 6201,
  season: 2026,
  week: 1,
  gameType: "REG",
  awayTeam: "BAL",
  homeTeam: "BUF",
  kickoffAt: "2026-09-13T20:25:00Z",
  status: "SCHEDULED",
};

const futureBalTwo = {
  gameId: 6202,
  season: 2026,
  week: 2,
  gameType: "REG",
  awayTeam: "CLE",
  homeTeam: "BAL",
  kickoffAt: "2026-09-20T17:00:00Z",
  status: "SCHEDULED",
};

const startedBal = {
  ...balBuf,
  gameId: 6203,
  kickoffAt: "2026-08-30T17:00:00Z",
};

const qbOutChange = {
  changeType: "CHANGED",
  changedFields: ["status"],
  previousSnapshotId: "bal-qb-before",
  currentSnapshotId: "bal-qb-after",
  detectedAt: "2026-09-01T12:01:00Z",
};

const qbContext = {
  team: "BAL",
  playerId: "bal-starting-qb",
  position: "QB",
  starter: true,
  previousStatus: "QUESTIONABLE",
  currentStatus: "OUT",
  evidenceEffectiveAt: "2026-09-01T12:00:30Z",
};

const unchanged = {
  changeType: "UNCHANGED",
  changedFields: [],
  detectedAt: "2026-09-01T12:01:00Z",
};

const lowChange = {
  changeType: "CHANGED",
  changedFields: ["sourceNote"],
  detectedAt: "2026-09-01T12:01:00Z",
};

const run = input =>
  orchestrateNFLAvailabilityChangeRefresh({
    affectedTeam: "BAL",
    asOf,
    ...input,
  });

test("starting-qb-out-resolves-and-creates-critical-refresh", () => {
  const result = run({
    change: qbOutChange,
    context: qbContext,
    scheduleRecords: [balBuf],
  });
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.REFRESH_REQUIREMENT_CREATED
  );
  assert.equal(result.materiality.level, "CRITICAL");
  assert.equal(result.gameResolution.status, "RESOLVED");
  assert.equal(result.refreshRequirement.refresh.required, true);
});

test("resolved-refresh-preserves-game-identity", () => {
  const result = run({
    change: qbOutChange,
    context: qbContext,
    scheduleRecords: [balBuf],
  });
  assert.deepEqual(result.refreshRequirement.game, {
    gameId: 6201,
    season: 2026,
    week: 1,
    awayTeam: "BAL",
    homeTeam: "BUF",
    kickoff: "2026-09-13T20:25:00Z",
  });
});

test("unchanged-evidence-does-not-resolve-or-refresh", () => {
  const result = run({
    change: unchanged,
    context: qbContext,
    scheduleRecords: [balBuf],
  });
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.NO_REFRESH_REQUIRED
  );
  assert.equal(result.gameResolution, null);
  assert.equal(result.refreshRequirement.refresh.required, false);
});

test("low-nonmaterial-change-does-not-refresh", () => {
  const result = run({
    change: lowChange,
    context: { ...qbContext, starter: false, position: "WR" },
    scheduleRecords: [balBuf],
  });
  assert.equal(result.materiality.level, "LOW");
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.NO_REFRESH_REQUIRED
  );
  assert.equal(result.refreshRequirement.refresh.required, false);
});

test("missing-team-game-blocks-refresh", () => {
  const result = run({
    change: qbOutChange,
    context: qbContext,
    scheduleRecords: [
      {
        gameId: 7001,
        season: 2026,
        week: 1,
        awayTeam: "CAR",
        homeTeam: "ATL",
        kickoffAt: "2026-09-13T17:00:00Z",
      },
    ],
  });
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.BLOCKED_GAME_RESOLUTION
  );
  assert.equal(result.gameResolution.status, "UNRESOLVED");
  assert.equal(result.refreshRequirement, null);
});

test("ambiguous-schedule-blocks-refresh", () => {
  const result = run({
    change: qbOutChange,
    context: qbContext,
    scheduleRecords: [balBuf, futureBalTwo],
  });
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.BLOCKED_GAME_RESOLUTION
  );
  assert.equal(result.gameResolution.status, "AMBIGUOUS");
  assert.equal(result.refreshRequirement, null);
});

test("already-started-game-blocks-refresh", () => {
  const result = run({
    change: qbOutChange,
    context: qbContext,
    scheduleRecords: [startedBal],
  });
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.BLOCKED_GAME_RESOLUTION
  );
  assert.equal(result.gameResolution.status, "NOT_ELIGIBLE");
  assert.equal(result.refreshRequirement, null);
});

test("invalid-noncanonical-team-fails-closed", () => {
  const result = orchestrateNFLAvailabilityChangeRefresh({
    change: qbOutChange,
    context: qbContext,
    affectedTeam: "bal",
    scheduleRecords: [balBuf],
    asOf,
  });
  assert.equal(
    result.status,
    NFL_AVAILABILITY_REFRESH_ORCHESTRATION_STATUS.INVALID_INPUT
  );
  assert.equal(result.refreshRequirement, null);
});

test("refresh-orchestration-remains-nonmutating", () => {
  const result = run({
    change: qbOutChange,
    context: qbContext,
    scheduleRecords: [balBuf],
  });
  assert.deepEqual(result.governance, {
    recomputeAuthorized: false,
    cacheMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    modelMutationAuthorized: false,
    scheduleMutationAuthorized: false,
    orchestrationOnly: true,
  });
  assert.equal(result.refreshRequirement.governance.recomputeAuthorized, false);
  assert.equal(result.refreshRequirement.governance.cacheMutationAuthorized, false);
  assert.equal(
    result.refreshRequirement.governance.probabilityMutationAuthorized,
    false
  );
  assert.equal(result.refreshRequirement.governance.modelMutationAuthorized, false);
});

const passed = tests.filter(item => item.passed).length;
const failed = tests.length - passed;

console.log(
  JSON.stringify(
    {
      suite: "NFL Availability Change Refresh Orchestration Diagnostics",
      passed,
      failed,
      tests,
    },
    null,
    2
  )
);

if (failed) process.exitCode = 1;
