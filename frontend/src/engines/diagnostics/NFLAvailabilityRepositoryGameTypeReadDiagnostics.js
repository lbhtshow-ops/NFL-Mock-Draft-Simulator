import assert from "node:assert/strict";
import researchRepository from "../../data/researchRepository/index.js";
import {
  createNFLAvailabilityResearchRepositoryService,
} from "../../data/footballIntelligence/nfl/availability/research/NFLAvailabilityResearchRepositoryService.js";

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

const reads = [];
function adapterWith(records = new Map()) {
  const success = (request, record) => ({
    status: "SUCCESS",
    record,
    requestId: request?.requestId || null,
  });
  const notFound = request => ({
    status: "NOT_FOUND",
    record: null,
    requestId: request?.requestId || null,
  });
  const adapter = {
    create: async request => success(request, request.record),
    read: async request => {
      reads.push({ recordType: request.recordType, recordId: request.recordId });
      const key = `${request.recordType}:${request.recordId}`;
      return records.has(key) ? success(request, records.get(key)) : notFound(request);
    },
    update: async request => success(request, request.record),
    upsert: async request => success(request, request.record),
    list: async () => ({ status: "SUCCESS", records: [] }),
    exists: async () => ({ status: "SUCCESS", metadata: { exists: false } }),
    archive: async request => success(request, null),
    delete: async request => success(request, null),
  };
  assert.equal(researchRepository.isPersistenceAdapter(adapter), true);
  return adapter;
}

const types = researchRepository.PERSISTENCE_RECORD_TYPES;
const canonicalId = "evidence:nfl-multisignal-availability:2026:pre:1:bal";
const sessionId = "research-session:nfl-multisignal-availability:2026:pre:1";
const sourceId = "research-source:nfl-multisignal-availability";
const observationId = "observation:nfl-multisignal-availability:2026:pre:1:test";

const records = new Map([
  [`${types.EVIDENCE_ARTIFACT}:${canonicalId}`, {
    evidenceId: canonicalId,
    sessionRef: sessionId,
    sourceRefs: [sourceId],
    recordedObservationRefs: [observationId],
  }],
  [`${types.RESEARCH_SOURCE}:${sourceId}`, { sourceId }],
  [`${types.RECORDED_OBSERVATION}:${observationId}`, { observationId }],
  [`${types.RESEARCH_SESSION}:${sessionId}`, { sessionId }],
]);

reads.length = 0;
const canonicalService = createNFLAvailabilityResearchRepositoryService({
  adapter: adapterWith(records),
});
const canonical = await canonicalService.readTeamWeek({
  season: 2026,
  week: 1,
  gameType: "PRE",
  team: "BAL",
});

await check("readTeamWeek uses game-type-specific canonical multi-signal evidence id first", async () => {
  assert.equal(reads[0].recordId, canonicalId);
});

await check("canonical multi-signal read reports canonical identity mode", async () => {
  assert.equal(canonical.status, "SUCCESS");
  assert.equal(canonical.identityMode, "CANONICAL_MULTI_SIGNAL");
});

await check("canonical read returns source observations artifact and session", async () => {
  assert.equal(canonical.artifact.evidenceId, canonicalId);
  assert.equal(canonical.source.sourceId, sourceId);
  assert.equal(canonical.observations.length, 1);
  assert.equal(canonical.session.sessionId, sessionId);
});

const legacyId = "evidence:nfl-availability:2026:1:bal";
const legacyRecords = new Map([
  [`${types.EVIDENCE_ARTIFACT}:${legacyId}`, {
    evidenceId: legacyId,
    sessionRef: null,
    sourceRefs: [],
    recordedObservationRefs: [],
  }],
]);

reads.length = 0;
const legacyService = createNFLAvailabilityResearchRepositoryService({
  adapter: adapterWith(legacyRecords),
});
const legacy = await legacyService.readTeamWeek({
  season: 2026,
  week: 1,
  gameType: "PRE",
  team: "BAL",
});

await check("legacy evidence remains available only after canonical id misses", async () => {
  assert.equal(reads[0].recordId, canonicalId);
  assert.equal(reads[1].recordId, legacyId);
  assert.equal(legacy.status, "SUCCESS");
  assert.equal(legacy.identityMode, "LEGACY_FALLBACK");
});

await check("PRE and REG canonical identities stay isolated", async () => {
  reads.length = 0;
  const service = createNFLAvailabilityResearchRepositoryService({
    adapter: adapterWith(new Map()),
  });
  await service.readTeamWeek({ season: 2026, week: 1, gameType: "REG", team: "BAL" });
  assert.equal(
    reads[0].recordId,
    "evidence:nfl-multisignal-availability:2026:reg:1:bal"
  );
});

console.log(`NFLAvailabilityRepositoryGameTypeReadDiagnostics: ${passed}/${passed} passed`);
