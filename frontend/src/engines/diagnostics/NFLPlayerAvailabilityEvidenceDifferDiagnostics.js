import assert from "node:assert/strict";
import {
  diffNFLPlayerAvailabilityEvidence,
} from "../playerAvailability/repository/NFLPlayerAvailabilityEvidenceDiffer.js";

const tests = [];
const test = (name, fn) => {
  try { fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
};

const base = {
  playerId: "player-1",
  playerName: "Test Quarterback",
  position: "QB",
  reportStatus: "QUESTIONABLE",
  practiceStatus: "LIMITED",
  rosterStatus: "ACTIVE",
  depthPosition: "QB",
  depthRank: 1,
  starter: true,
  snapshotId: "snap-a",
};

const run = (previousPlayers, currentPlayers, options = {}) =>
  diffNFLPlayerAvailabilityEvidence({
    previousPlayers,
    currentPlayers,
    detectedAt: "2026-09-10T12:00:00Z",
    provenance: { adapter: "DIAGNOSTIC", repositoryVersion: "1.0.0" },
    ...options,
  });

const added = run([], [{ ...base, snapshotId: "snap-b" }]);
const removed = run([base], []);
const changed = run([base], [{ ...base, reportStatus: "OUT", snapshotId: "snap-b" }]);
const unchanged = run([base], [{ ...base }]);
const role = run([base], [{ ...base, depthRank: 2, starter: false, snapshotId: "snap-b" }]);

test("added-player-emits-added", () => assert.equal(added.changes[0].change.changeType, "ADDED"));
test("removed-player-emits-removed", () => assert.equal(removed.changes[0].change.changeType, "REMOVED"));
test("status-change-emits-changed", () => assert.equal(changed.changes[0].change.changeType, "CHANGED"));
test("status-change-names-exact-field", () => assert.deepEqual(changed.changes[0].change.changedFields, ["reportStatus"]));
test("unchanged-player-emits-nothing-by-default", () => assert.equal(unchanged.changes.length, 0));
test("role-change-captures-depth-and-starter", () => {
  assert.deepEqual(role.changes[0].change.changedFields.sort(), ["depthRank", "starter"].sort());
});
test("previous-current-status-context-is-produced", () => {
  assert.equal(changed.changes[0].context.previousStatus, "QUESTIONABLE");
  assert.equal(changed.changes[0].context.currentStatus, "OUT");
});
test("starter-context-is-produced", () => assert.equal(changed.changes[0].context.starter, true));
test("provenance-is-preserved", () => assert.equal(changed.changes[0].change.provenance.adapter, "DIAGNOSTIC"));
test("diff-remains-nonmutating", () => {
  assert.equal(changed.governance.persistenceMutationAuthorized, false);
  assert.equal(changed.governance.modelMutationAuthorized, false);
  assert.equal(changed.governance.probabilityMutationAuthorized, false);
});

const passed = tests.filter(test => test.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({ suite: "NFL Player Availability Evidence Differ Diagnostics", passed, failed, tests }, null, 2));
if (failed) process.exitCode = 1;
