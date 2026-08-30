import assert from "node:assert/strict";
import researchRepository from "../src/data/researchRepository/index.js";
import {
  createNFLMultiSignalAvailabilityResearchSource,
  NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";

const tests = [];
const test = (name, fn) => {
  try { fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
};

const checkedAt = "2026-08-14T04:30:00Z";
const source = createNFLMultiSignalAvailabilityResearchSource({ checkedAt });
const sourceValidation = researchRepository.validateResearchSource(source, { checkedAt });
const request = researchRepository.createPersistenceRequest({
  requestId: "diagnostic-sportradar-source-upsert",
  operation: researchRepository.PERSISTENCE_OPERATION_TYPES.UPSERT,
  recordType: researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SOURCE,
  recordId: source.sourceId,
  record: source,
  write: {
    mode: researchRepository.PERSISTENCE_WRITE_MODES.REPLACE,
    preserveCreatedMetadata: true,
    validateBeforeWrite: true,
    notes: "Diagnostic only; no adapter execution.",
  },
  actor: { actorRef: "lbht-diagnostics", role: "DIAGNOSTIC" },
  context: { source: "diagnoseResearchSourceContractCorrection" },
  metadata: { tags: ["diagnostic", "sportradar", "research-source"] },
}, { checkedAt });

const requestValidation = researchRepository.validatePersistenceRequest(request, { checkedAt });

test("sportradar-research-source-contract-valid", () => assert.equal(sourceValidation.valid, true));
test("sportradar-source-id-preserved", () => assert.equal(source.sourceId, NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID));
test("sportradar-source-status-approved", () => assert.equal(source.status, researchRepository.RESEARCH_SOURCE_STATUSES.APPROVED));
test("sportradar-access-type-licensed", () => assert.equal(source.access.type, researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.LICENSED));
test("sportradar-access-requires-authentication", () => assert.equal(source.access.requiresAuthentication, true));
test("sportradar-raw-payload-storage-prohibited", () => assert.equal(source.usageRestrictions.rawContentStorageAllowed, false));
test("sportradar-redistribution-prohibited", () => assert.equal(source.usageRestrictions.redistributionAllowed, false));
test("sportradar-derived-facts-allowed", () => assert.equal(source.usageRestrictions.derivedFactsAllowed, true));
test("source-upsert-request-valid-before-adapter", () => assert.equal(requestValidation.valid, true));
test("source-upsert-validates-record-contract", () => assert.equal(request.write.validateBeforeWrite, true));
test("no-invalid-restricted-access-type", () => assert.notEqual(source.access.type, "RESTRICTED"));
test("no-persistence-execution-in-diagnostic", () => assert.ok(!JSON.stringify(request).includes("PostgresResearchRepositoryAdapter")));

console.log(JSON.stringify({
  suite: "Research Source Contract Correction V1 Diagnostics",
  passed: tests.filter(test => test.passed).length,
  failed: tests.filter(test => !test.passed).length,
  tests,
}, null, 2));

if (tests.some(test => !test.passed)) process.exitCode = 1;
