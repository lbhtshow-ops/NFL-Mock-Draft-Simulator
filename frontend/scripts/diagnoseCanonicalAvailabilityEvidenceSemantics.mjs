import assert from "node:assert/strict";

import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";

import {
  NFL_AVAILABILITY_EVIDENCE_TYPES,
  NFL_AVAILABILITY_RESOLUTION_TYPES,
  resolveNFLMultiSignalAvailability,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLMultiSignalAvailabilityResolver.js";

const tests = [];

function test(name, fn) {
  try {
    fn();
    tests.push({ name, status: "PASS" });
  } catch (error) {
    tests.push({ name, status: "FAIL", error: error?.message || String(error) });
  }
}

const base = {
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  playerId: "00-0030001",
  playerName: "Player One",
  position: "QB",
  observedAt: "2026-09-10T12:00:00Z",
};

const officialOut = createNFLAvailabilitySignal({
  ...base,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT,
  authority: NFL_AVAILABILITY_AUTHORITY.OFFICIAL,
  source: "official-test",
  status: "OUT",
  practiceStatus: "DNP",
  injury: "KNEE",
});

const officialQuestionable = createNFLAvailabilitySignal({
  ...base,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT,
  authority: NFL_AVAILABILITY_AUTHORITY.OFFICIAL,
  source: "official-test",
  status: "QUESTIONABLE",
  practiceStatus: "LIMITED",
  injury: "ANKLE",
});

const gameday = createNFLAvailabilitySignal({
  ...base,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.GAMEDAY_INACTIVE,
  authority: NFL_AVAILABILITY_AUTHORITY.GAMEDAY,
  source: "gameday-test",
  status: "INACTIVE",
});

const roster = createNFLAvailabilitySignal({
  ...base,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS,
  authority: NFL_AVAILABILITY_AUTHORITY.ROSTER,
  source: "roster-test",
  rosterStatus: "ACT",
});

const transaction = createNFLAvailabilitySignal({
  ...base,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.TRANSACTION,
  authority: NFL_AVAILABILITY_AUTHORITY.TRANSACTION,
  source: "transaction-test",
  transactionType: "ACTIVATED",
  statusAfter: "ACT",
});

const depth = createNFLAvailabilitySignal({
  ...base,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART,
  authority: NFL_AVAILABILITY_AUTHORITY.ROLE,
  source: "depth-test",
  depthPosition: "QB",
  depthRank: 1,
});

const resolveOne = (signals) =>
  resolveNFLMultiSignalAvailability(signals).players[0];

test("official-out-is-direct-medical", () => {
  const player = resolveOne([roster, depth, officialOut]);
  assert.equal(player.resolutionType, NFL_AVAILABILITY_RESOLUTION_TYPES.OFFICIAL_DESIGNATION);
  assert.equal(player.availabilityEvidenceType, NFL_AVAILABILITY_EVIDENCE_TYPES.DIRECT_MEDICAL);
  assert.equal(player.directAvailabilityEvidence, true);
  assert.equal(player.inferredAvailabilityEvidence, false);
  assert.equal(player.medicalAvailabilityKnown, true);
});

test("official-questionable-preserves-uncertainty", () => {
  const player = resolveOne([roster, officialQuestionable]);
  assert.equal(player.canonicalAvailabilityStatus, "QUESTIONABLE");
  assert.equal(player.resolutionConfidence, "MODERATE");
});

test("gameday-inactive-is-direct-not-inferred", () => {
  const player = resolveOne([roster, gameday]);
  assert.equal(player.resolutionType, NFL_AVAILABILITY_RESOLUTION_TYPES.GAMEDAY_INACTIVE);
  assert.equal(player.availabilityEvidenceType, NFL_AVAILABILITY_EVIDENCE_TYPES.DIRECT_GAMEDAY);
  assert.equal(player.directAvailabilityEvidence, true);
  assert.equal(player.inferredAvailabilityEvidence, false);
  assert.equal(player.inferredAvailabilityOnly, false);
});

test("roster-only-is-structural-inference", () => {
  const player = resolveOne([roster]);
  assert.equal(player.resolutionType, NFL_AVAILABILITY_RESOLUTION_TYPES.ROSTER_INFERENCE);
  assert.equal(player.availabilityEvidenceType, NFL_AVAILABILITY_EVIDENCE_TYPES.STRUCTURAL);
  assert.equal(player.directAvailabilityEvidence, false);
  assert.equal(player.inferredAvailabilityEvidence, true);
  assert.equal(player.medicalAvailabilityKnown, false);
});

test("roster-plus-transaction-is-structural-inference", () => {
  const player = resolveOne([roster, transaction]);
  assert.equal(player.resolutionType, NFL_AVAILABILITY_RESOLUTION_TYPES.ROSTER_AND_TRANSACTION);
  assert.equal(player.inferredAvailabilityEvidence, true);
});

test("depth-only-is-role-not-availability", () => {
  const player = resolveOne([depth]);
  assert.equal(player.resolutionType, NFL_AVAILABILITY_RESOLUTION_TYPES.ROLE_ONLY);
  assert.equal(player.availabilityEvidenceType, NFL_AVAILABILITY_EVIDENCE_TYPES.ROLE);
  assert.equal(player.canonicalAvailabilityStatus, "UNKNOWN");
  assert.equal(player.directAvailabilityEvidence, false);
  assert.equal(player.inferredAvailabilityEvidence, false);
  assert.equal(player.medicalAvailabilityKnown, false);
});

test("official-authority-still-wins", () => {
  const player = resolveOne([depth, roster, officialOut]);
  assert.equal(player.evidence.selected.signalClass, NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT);
  assert.equal(player.canonicalAvailabilityStatus, "OUT");
});

test("legacy-official-confidence-unchanged", () => {
  assert.equal(resolveOne([officialOut]).availabilityConfidence, 0.98);
});
test("legacy-gameday-confidence-unchanged", () => {
  assert.equal(resolveOne([gameday]).availabilityConfidence, 0.95);
});
test("legacy-roster-transaction-confidence-unchanged", () => {
  assert.equal(resolveOne([roster, transaction]).availabilityConfidence, 0.92);
});
test("legacy-roster-confidence-unchanged", () => {
  assert.equal(resolveOne([roster]).availabilityConfidence, 0.86);
});
test("legacy-transaction-confidence-unchanged", () => {
  assert.equal(resolveOne([transaction]).availabilityConfidence, 0.8);
});
test("legacy-depth-confidence-unchanged", () => {
  assert.equal(resolveOne([depth]).availabilityConfidence, 0.6);
});

test("official-vs-active-roster-conflict-preserved", () => {
  const player = resolveOne([roster, officialOut]);
  assert.equal(player.conflict.hasConflict, true);
  assert.equal(player.conflict.codes.includes("OFFICIAL_DESIGNATION_VS_ACTIVE_ROSTER"), true);
});

test("outer-contract-remains-1-0-0", () => {
  const result = resolveNFLMultiSignalAvailability([roster]);
  assert.equal(result.contract, "NFLMultiSignalAvailabilityResolution");
  assert.equal(result.version, "1.0.0");
  assert.equal(result.semanticsVersion, "NFL-AVAILABILITY-SEMANTICS-1.0.0");
});

const passed = tests.filter((x) => x.status === "PASS").length;
const failed = tests.filter((x) => x.status === "FAIL").length;

console.log(JSON.stringify({
  suite: "Canonical Availability Evidence Semantics V1 Diagnostics",
  version: "1.0.0",
  passed,
  failed,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
