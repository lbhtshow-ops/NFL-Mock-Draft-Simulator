import assert from "node:assert/strict";

import {
  createPlayerAvailabilityEvidenceChange,
  PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES,
} from "../playerAvailability/repository/PlayerAvailabilityEvidenceChangeContract.js";

import {
  classifyNFLAvailabilityChangeRefreshMateriality,
  NFL_AVAILABILITY_REFRESH_MATERIALITY,
} from "../gameDecisionSupport/refresh/NFLAvailabilityChangeRefreshPolicy.js";

import {
  createNFLGameDecisionRefreshRequirement,
  NFL_GAME_DECISION_REFRESH_REASON_CODES,
} from "../gameDecisionSupport/refresh/NFLGameDecisionRefreshRequirementContract.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

const game = Object.freeze({
  gameId: 260901001,
  season: 2026,
  week: 1,
  awayTeam: "CLE",
  homeTeam: "BAL",
  kickoff: "2026-09-13T17:00:00Z",
});

const change = (overrides = {}) =>
  createPlayerAvailabilityEvidenceChange({
    playerId: "player-1",
    changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.CHANGED,
    previousSnapshotId: "snapshot-a",
    currentSnapshotId: "snapshot-b",
    detectedAt: "2026-09-13T14:00:00Z",
    changedFields: ["status"],
    ...overrides,
  });

test("unchanged-evidence-does-not-refresh", () => {
  const c = change({
    changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNCHANGED,
    changedFields: [],
  });
  const p = classifyNFLAvailabilityChangeRefreshMateriality(c, {
    position: "QB",
    starter: true,
    previousStatus: "QUESTIONABLE",
    currentStatus: "QUESTIONABLE",
  });
  assert.equal(p.level, NFL_AVAILABILITY_REFRESH_MATERIALITY.NONE);
  assert.equal(p.refreshRequired, false);
});

test("starting-qb-out-is-critical-refresh", () => {
  const p = classifyNFLAvailabilityChangeRefreshMateriality(change(), {
    position: "QB",
    starter: true,
    previousStatus: "QUESTIONABLE",
    currentStatus: "OUT",
  });
  assert.equal(p.level, NFL_AVAILABILITY_REFRESH_MATERIALITY.CRITICAL);
  assert.equal(p.refreshRequired, true);
  assert.equal(
    p.reasonCode,
    NFL_GAME_DECISION_REFRESH_REASON_CODES.STARTING_QB_AVAILABILITY_CHANGE
  );
});

test("starting-ol-out-is-high-refresh", () => {
  const p = classifyNFLAvailabilityChangeRefreshMateriality(change(), {
    position: "LT",
    starter: true,
    previousStatus: "QUESTIONABLE",
    currentStatus: "OUT",
  });
  assert.equal(p.level, NFL_AVAILABILITY_REFRESH_MATERIALITY.HIGH);
  assert.equal(p.refreshRequired, true);
});

test("depth-chart-change-is-medium-refresh", () => {
  const p = classifyNFLAvailabilityChangeRefreshMateriality(
    change({ changedFields: ["depthRole"] }),
    { position: "WR", starter: false }
  );
  assert.equal(p.level, NFL_AVAILABILITY_REFRESH_MATERIALITY.MEDIUM);
  assert.equal(p.refreshRequired, true);
});

test("non-material-change-does-not-refresh", () => {
  const p = classifyNFLAvailabilityChangeRefreshMateriality(
    change({ changedFields: ["providerNote"] }),
    { position: "WR", starter: false }
  );
  assert.equal(p.level, NFL_AVAILABILITY_REFRESH_MATERIALITY.LOW);
  assert.equal(p.refreshRequired, false);
});

test("unknown-nonempty-change-fails-safe-to-refresh", () => {
  const p = classifyNFLAvailabilityChangeRefreshMateriality(
    change({
      changeType: PLAYER_AVAILABILITY_EVIDENCE_CHANGE_TYPES.UNKNOWN,
      changedFields: ["providerUnknownField"],
    }),
    { position: "LB", starter: false }
  );
  assert.equal(p.level, NFL_AVAILABILITY_REFRESH_MATERIALITY.UNKNOWN);
  assert.equal(p.refreshRequired, true);
});

test("refresh-requirement-is-orchestration-only", () => {
  const p = classifyNFLAvailabilityChangeRefreshMateriality(change(), {
    position: "QB",
    starter: true,
    previousStatus: "QUESTIONABLE",
    currentStatus: "OUT",
  });

  const r = createNFLGameDecisionRefreshRequirement({
    game,
    trigger: {
      domain: "PLAYER_AVAILABILITY",
      team: "BAL",
      playerId: "player-1",
      changeType: "CHANGED",
      changedFields: ["status"],
      previousSnapshotId: "snapshot-a",
      currentSnapshotId: "snapshot-b",
      evidenceEffectiveAt: "2026-09-13T13:59:00Z",
    },
    materiality: p,
    refreshRequired: p.refreshRequired,
    reasonCode: p.reasonCode,
    detectedAt: "2026-09-13T14:00:00Z",
  });

  assert.equal(r.validation.valid, true);
  assert.equal(r.refresh.required, true);
  assert.equal(r.governance.recomputeAuthorized, false);
  assert.equal(r.governance.cacheMutationAuthorized, false);
  assert.equal(r.governance.probabilityMutationAuthorized, false);
  assert.equal(r.governance.modelMutationAuthorized, false);
  assert.equal(r.governance.orchestrationOnly, true);
});

test("affected-team-must-belong-to-game", () => {
  const r = createNFLGameDecisionRefreshRequirement({
    game,
    trigger: {
      domain: "PLAYER_AVAILABILITY",
      team: "KC",
      changeType: "CHANGED",
      changedFields: ["status"],
    },
    materiality: {
      level: "HIGH",
      starter: true,
      position: "QB",
    },
    refreshRequired: true,
    reasonCode:
      NFL_GAME_DECISION_REFRESH_REASON_CODES.STARTING_QB_AVAILABILITY_CHANGE,
  });

  assert.equal(r.validation.valid, false);
  assert(r.validation.errors.includes("TRIGGER_TEAM_NOT_IN_GAME"));
});

const passed = tests.filter(testResult => testResult.passed).length;
const failed = tests.length - passed;

console.log(
  JSON.stringify(
    {
      suite: "NFL Game Decision Refresh Requirement Diagnostics",
      passed,
      failed,
      tests,
    },
    null,
    2
  )
);

if (failed > 0) process.exitCode = 1;
