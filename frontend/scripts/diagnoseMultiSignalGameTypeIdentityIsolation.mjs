import assert from "node:assert/strict";
import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";
import {
  createNFLMultiSignalAvailabilityResearchBundle,
  getNFLMultiSignalAvailabilityEvidenceId,
  getNFLMultiSignalAvailabilitySessionId,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";

const tests = [];
const test = (name, fn) => {
  try { fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
};

const makeSignal = (gameType, overrides = {}) => createNFLAvailabilitySignal({
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS,
  authority: NFL_AVAILABILITY_AUTHORITY.ROSTER,
  season: 2026,
  week: 1,
  gameType,
  team: "BAL",
  playerId: "player-1",
  playerName: "Player One",
  position: "QB",
  rosterStatus: "ACT",
  observedAt: "2026-08-14T04:00:00Z",
  source: "sportradar-test",
  sourceUrl: "https://example.test/roster",
  ...overrides,
});

const pre = createNFLMultiSignalAvailabilityResearchBundle([makeSignal("PRE")], { checkedAt: "2026-08-14T04:30:00Z" });
const reg = createNFLMultiSignalAvailabilityResearchBundle([makeSignal("REG")], { checkedAt: "2026-08-14T04:30:00Z" });

const preArtifact = pre.artifacts[0];
const regArtifact = reg.artifacts[0];
const preSession = pre.sessions[0];
const regSession = reg.sessions[0];
const preObservation = pre.observations[0];
const regObservation = reg.observations[0];

test("pre-session-id-includes-game-type", () => assert.equal(preSession.sessionId, "research-session:nfl-multisignal-availability:2026:pre:1"));
test("reg-session-id-includes-game-type", () => assert.equal(regSession.sessionId, "research-session:nfl-multisignal-availability:2026:reg:1"));
test("pre-reg-session-ids-distinct", () => assert.notEqual(preSession.sessionId, regSession.sessionId));
test("pre-evidence-id-includes-game-type", () => assert.equal(preArtifact.evidenceId, "evidence:nfl-multisignal-availability:2026:pre:1:bal"));
test("reg-evidence-id-includes-game-type", () => assert.equal(regArtifact.evidenceId, "evidence:nfl-multisignal-availability:2026:reg:1:bal"));
test("pre-reg-evidence-ids-distinct", () => assert.notEqual(preArtifact.evidenceId, regArtifact.evidenceId));
test("observation-id-explicitly-includes-game-type", () => assert.match(preObservation.observationId, /^observation:nfl-multisignal-availability:2026:pre:1:/));
test("pre-reg-observation-ids-distinct", () => assert.notEqual(preObservation.observationId, regObservation.observationId));
test("observation-session-ref-isolated", () => assert.equal(preObservation.sessionRef, preSession.sessionId));
test("artifact-session-ref-isolated", () => assert.equal(preArtifact.sessionRef, preSession.sessionId));
test("session-metadata-tags-game-type", () => assert.ok(preSession.metadata.tags.includes("game-type:PRE")));
test("artifact-classification-tags-game-type", () => assert.ok(preArtifact.classification.tags.includes("game-type:PRE")));
test("observation-metadata-tags-game-type", () => assert.ok(preObservation.metadata.tags.includes("game-type:PRE")));
test("id-helper-functions-preserve-isolation", () => {
  assert.notEqual(getNFLMultiSignalAvailabilitySessionId(2026, "PRE", 1), getNFLMultiSignalAvailabilitySessionId(2026, "REG", 1));
  assert.notEqual(getNFLMultiSignalAvailabilityEvidenceId(2026, "PRE", 1, "BAL"), getNFLMultiSignalAvailabilityEvidenceId(2026, "REG", 1, "BAL"));
});
test("missing-game-type-signals-fail-closed-from-bundle", () => {
  const withoutGameType = { ...makeSignal("PRE"), gameType: null };
  const bundle = createNFLMultiSignalAvailabilityResearchBundle([withoutGameType]);
  assert.equal(bundle.summary.signalCount, 0);
  assert.equal(bundle.artifacts.length, 0);
  assert.equal(bundle.sessions.length, 0);
});
test("same-scope-idempotency-preserved", () => {
  const a = createNFLMultiSignalAvailabilityResearchBundle([makeSignal("PRE")]);
  const b = createNFLMultiSignalAvailabilityResearchBundle([makeSignal("PRE", { observedAt: "2026-08-14T05:00:00Z" })]);
  assert.equal(a.observations[0].observationId, b.observations[0].observationId);
  assert.equal(a.artifacts[0].evidenceId, b.artifacts[0].evidenceId);
});

const passed = tests.filter(t => t.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({ suite: "Multi-Signal Game-Type Identity Isolation V1 Diagnostics", passed, failed, tests }, null, 2));
if (failed) process.exitCode = 1;
