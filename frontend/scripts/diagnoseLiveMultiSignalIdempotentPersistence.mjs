import assert from "node:assert/strict";
import researchRepository from "../src/data/researchRepository/index.js";
import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";
import { createNFLMultiSignalAvailabilityResearchBundle } from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";
import { createNFLAvailabilityResearchRepositoryService } from "../src/data/footballIntelligence/nfl/availability/research/NFLAvailabilityResearchRepositoryService.js";

const tests = [];
const test = async (name, fn) => {
  try { await fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
};

function createMemoryAdapter() {
  const stores = new Map();
  const writes = [];
  const recordId = (type, record) => ({
    RESEARCH_SOURCE: record?.sourceId,
    RESEARCH_SESSION: record?.sessionId,
    RECORDED_OBSERVATION: record?.observationId,
    ANALYTICAL_OBSERVATION: record?.analysisId,
    EVIDENCE_ARTIFACT: record?.evidenceId,
  })[type];
  const storeFor = (type) => {
    if (!stores.has(type)) stores.set(type, new Map());
    return stores.get(type);
  };
  const success = (request, record = null) => ({ status: "SUCCESS", record, requestId: request?.requestId || null });
  const notFound = (request) => ({ status: "NOT_FOUND", record: null, requestId: request?.requestId || null });
  const adapter = {
    create: async (request) => adapter.upsert(request),
    read: async (request) => {
      const value = storeFor(request.recordType).get(request.recordId);
      return value ? success(request, structuredClone(value)) : notFound(request);
    },
    update: async (request) => adapter.upsert(request),
    upsert: async (request) => {
      const id = recordId(request.recordType, request.record);
      storeFor(request.recordType).set(id, structuredClone(request.record));
      writes.push({ recordType: request.recordType, recordId: id });
      return success(request, structuredClone(request.record));
    },
    list: async (request) => ({ status: "SUCCESS", records: [...storeFor(request.recordType).values()].map(structuredClone) }),
    exists: async (request) => ({ status: "SUCCESS", metadata: { exists: storeFor(request.recordType).has(request.recordId) } }),
    archive: async (request) => success(request, null),
    delete: async (request) => success(request, null),
    get writes() { return writes; },
    count(type) { return storeFor(type).size; },
  };
  return adapter;
}

function signal({ rosterStatus = "ACT", observedAt = "2026-08-14T12:00:00Z" } = {}) {
  return createNFLAvailabilitySignal({
    signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS,
    authority: NFL_AVAILABILITY_AUTHORITY.ROSTER,
    season: 2026,
    week: 1,
    gameType: "PRE",
    team: "BAL",
    playerId: "player-1",
    playerName: "Player One",
    position: "QB",
    rosterStatus,
    observedAt,
    source: "sportradar-test",
    sourceUrl: "https://example.test/roster",
  });
}

const adapter = createMemoryAdapter();
assert.equal(researchRepository.isPersistenceAdapter(adapter), true);
const service = createNFLAvailabilityResearchRepositoryService({ adapter });
const firstBundle = createNFLMultiSignalAvailabilityResearchBundle([signal()], { checkedAt: "2026-08-14T12:01:00Z" });
const first = await service.persistBundle(firstBundle);
const firstWriteCount = adapter.writes.length;
const secondBundle = createNFLMultiSignalAvailabilityResearchBundle([signal({ observedAt: "2026-08-14T12:05:00Z" })], { checkedAt: "2026-08-14T12:06:00Z" });
const second = await service.persistBundle(secondBundle);
const secondNewWrites = adapter.writes.length - firstWriteCount;
const changedBundle = createNFLMultiSignalAvailabilityResearchBundle([signal({ rosterStatus: "IR", observedAt: "2026-08-14T12:10:00Z" })], { checkedAt: "2026-08-14T12:11:00Z" });
const beforeChangedWrites = adapter.writes.length;
const changed = await service.persistBundle(changedBundle);
const changedNewWrites = adapter.writes.length - beforeChangedWrites;

await test("first-persist-writes-one-observation", () => assert.equal(first.observationWrites, 1));
await test("first-persist-writes-one-artifact", () => assert.equal(first.artifactWrites, 1));
await test("first-persist-writes-one-session", () => assert.equal(first.sessionWrites, 1));
await test("identical-rerun-zero-observation-writes", () => assert.equal(second.observationWrites, 0));
await test("identical-rerun-zero-artifact-writes", () => assert.equal(second.artifactWrites, 0));
await test("identical-rerun-zero-session-writes", () => assert.equal(second.sessionWrites, 0));
await test("identical-rerun-artifact-unchanged", () => assert.equal(second.unchangedArtifacts, 1));
await test("identical-rerun-session-unchanged", () => assert.equal(second.unchangedSessions, 1));
await test("identical-rerun-team-status-unchanged", () => assert.equal(second.teamResults[0]?.status, "UNCHANGED"));
await test("identical-rerun-source-unchanged", () => assert.equal(second.sourceUnchanged, true));
await test("identical-rerun-performs-no-upserts", () => assert.equal(secondNewWrites, 0));
await test("changed-content-writes-only-new-observation", () => assert.equal(changed.observationWrites, 1));
await test("changed-content-updates-artifact", () => assert.equal(changed.artifactWrites, 1));
await test("changed-content-updates-session", () => assert.equal(changed.sessionWrites, 1));
await test("changed-content-preserves-prior-observation", () => assert.equal(adapter.count("RECORDED_OBSERVATION"), 2));
await test("changed-content-does-not-rewrite-source", () => assert.equal(changed.sourceUnchanged, true));
await test("changed-content-write-count-is-three", () => assert.equal(changedNewWrites, 3));
await test("service-preserves-success-status", () => assert.equal(second.status, "SUCCESS"));

const passed = tests.filter((entry) => entry.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({
  suite: "Live Multi-Signal Idempotent Persistence V1 Diagnostics",
  passed,
  failed,
  tests,
  samples: {
    first: { observationWrites: first.observationWrites, artifactWrites: first.artifactWrites, sessionWrites: first.sessionWrites },
    identical: { observationWrites: second.observationWrites, artifactWrites: second.artifactWrites, sessionWrites: second.sessionWrites, unchangedArtifacts: second.unchangedArtifacts, unchangedSessions: second.unchangedSessions, teamStatus: second.teamResults[0]?.status },
    changed: { observationWrites: changed.observationWrites, artifactWrites: changed.artifactWrites, sessionWrites: changed.sessionWrites },
  },
}, null, 2));
if (failed) process.exitCode = 1;
