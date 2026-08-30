import assert from "node:assert/strict";

import {
  NFL_AFFECTED_GAME_RESOLUTION_STATUS,
  resolveNFLAffectedGame,
} from "../gameDecisionSupport/refresh/NFLAffectedGameResolver.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

const AS_OF = "2026-09-10T12:00:00Z";

const balBuf = Object.freeze({
  gameId: 260901001,
  season: 2026,
  week: 1,
  gameType: "REG",
  awayTeam: "BAL",
  homeTeam: "BUF",
  kickoffAt: "2026-09-13T17:00:00Z",
});

const pitCle = Object.freeze({
  gameId: 260901002,
  season: 2026,
  week: 1,
  gameType: "REG",
  awayTeam: "PIT",
  homeTeam: "CLE",
  kickoffAt: "2026-09-13T20:25:00Z",
});

test("one-future-team-game-resolves", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [balBuf, pitCle],
    asOf: AS_OF,
  });
  assert.equal(result.status, NFL_AFFECTED_GAME_RESOLUTION_STATUS.RESOLVED);
  assert.equal(result.game.gameId, balBuf.gameId);
});

test("affected-team-absent-is-unresolved", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "KC",
    scheduleRecords: [balBuf, pitCle],
    asOf: AS_OF,
  });
  assert.equal(result.status, NFL_AFFECTED_GAME_RESOLUTION_STATUS.UNRESOLVED);
  assert.equal(result.game, null);
});

test("multiple-future-team-games-fail-ambiguous", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [
      balBuf,
      {
        gameId: 260902001,
        season: 2026,
        week: 2,
        awayTeam: "CLE",
        homeTeam: "BAL",
        kickoffAt: "2026-09-20T17:00:00Z",
      },
    ],
    asOf: AS_OF,
  });
  assert.equal(result.status, NFL_AFFECTED_GAME_RESOLUTION_STATUS.AMBIGUOUS);
  assert.equal(result.candidateCount, 2);
  assert.equal(result.game, null);
});

test("already-started-game-is-not-eligible", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [balBuf],
    asOf: "2026-09-13T17:00:01Z",
  });
  assert.equal(result.status, NFL_AFFECTED_GAME_RESOLUTION_STATUS.NOT_ELIGIBLE);
  assert.equal(result.game, null);
});

test("completed-game-is-not-eligible", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [{ ...balBuf, final: true }],
    asOf: "2026-09-13T16:00:00Z",
  });
  assert.equal(result.status, NFL_AFFECTED_GAME_RESOLUTION_STATUS.NOT_ELIGIBLE);
});

test("missing-schedule-fails-closed", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [],
    asOf: AS_OF,
  });
  assert.equal(
    result.status,
    NFL_AFFECTED_GAME_RESOLUTION_STATUS.SCHEDULE_UNAVAILABLE
  );
  assert.equal(result.game, null);
});

test("noncanonical-lowercase-team-fails-closed", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "bal",
    scheduleRecords: [balBuf],
    asOf: AS_OF,
  });
  assert.equal(result.status, NFL_AFFECTED_GAME_RESOLUTION_STATUS.INVALID_TEAM);
  assert.equal(result.game, null);
});

test("resolved-game-preserves-canonical-identity-and-kickoff", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [balBuf],
    asOf: AS_OF,
  });
  assert.deepEqual(result.game, {
    gameId: 260901001,
    season: 2026,
    week: 1,
    gameType: "REG",
    awayTeam: "BAL",
    homeTeam: "BUF",
    kickoff: "2026-09-13T17:00:00Z",
    kickoffAt: "2026-09-13T17:00:00Z",
  });
});

test("resolver-is-orchestration-only", () => {
  const result = resolveNFLAffectedGame({
    affectedTeam: "BAL",
    scheduleRecords: [balBuf],
    asOf: AS_OF,
  });
  assert.equal(result.governance.modelCalculationAuthorized, false);
  assert.equal(result.governance.probabilityCalculationAuthorized, false);
  assert.equal(result.governance.cacheMutationAuthorized, false);
  assert.equal(result.governance.orchestrationOnly, true);
  assert.equal("homeWinProbability" in result, false);
  assert.equal("awayWinProbability" in result, false);
  assert.equal("matchupEdge" in result, false);
});

const passed = tests.filter(result => result.passed).length;
const failed = tests.length - passed;

console.log(
  JSON.stringify(
    {
      suite: "NFL Affected Game Resolver Diagnostics",
      passed,
      failed,
      tests,
    },
    null,
    2
  )
);

if (failed > 0) process.exitCode = 1;
