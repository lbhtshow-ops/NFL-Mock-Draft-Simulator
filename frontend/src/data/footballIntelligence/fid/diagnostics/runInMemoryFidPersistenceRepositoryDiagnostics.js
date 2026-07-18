import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedFidApi from "../index.js";
import persistenceApi, * as namedPersistenceApi from "../persistence/index.js";
import repositoryContractApi from "../persistence/FidPersistenceRepositoryContract.js";
import inMemoryRepositoryApi from "../persistence/InMemoryFidPersistenceRepository.js";

const SUITE = "InMemoryFidPersistenceRepositoryDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY_SOURCE = readFileSync(resolve(ROOT, "persistence/InMemoryFidPersistenceRepository.js"), "utf8");
const REPOSITORY_CONTRACT_SOURCE = readFileSync(resolve(ROOT, "persistence/FidPersistenceRepositoryContract.js"), "utf8");
const PERSISTENCE_INDEX_SOURCE = readFileSync(resolve(ROOT, "persistence/index.js"), "utf8");
const FID_INDEX_SOURCE = readFileSync(resolve(ROOT, "index.js"), "utf8");
const CONTRACT_FILES = [
  "FootballEntityContract.js", "PersonProfileContract.js", "PlayerProfileContract.js",
  "ProspectProfileContract.js", "FootballRelationshipContract.js",
];
const CONTRACT_SOURCES = CONTRACT_FILES.map((file) => readFileSync(resolve(ROOT, "contracts", file), "utf8"));
const GROUPS = Object.freeze([
  "repository-contract", "construction-isolation", "first-write", "duplicate-atomicity",
  "revision-ordering", "result-isolation", "nested-fidelity", "exact-latest-history",
  "approved-query-filters", "historical-query", "deterministic-ordering", "cursor-pagination",
  "reference-querying", "existence-health-clear", "structured-errors", "runtime-boundaries",
  "generic-contract-fixtures", "prospect-intake-history", "unknown-null-extension-safety",
  "exports-dependencies",
]);
const CASE_NAMES = Object.freeze(GROUPS.flatMap((group) => Array.from(
  { length: 20 },
  (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`
)));

function assert(condition, message, details = null) {
  if (!condition) {
    const failure = new Error(message);
    failure.details = details;
    throw failure;
  }
}

function imports(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function errorCode(result) {
  return result?.error?.code ?? null;
}

function entityPayload(suffix = "1", overrides = {}) {
  return fidApi.createFootballEntity({
    entityId: `entity-${suffix}`,
    entityType: "PERSON",
    status: "CANDIDATE",
    identity: { canonicalName: `Prospect ${suffix}` },
    references: {
      researchSourceRefs: [`research-source-${suffix}`],
      evidenceArtifactRefs: [`evidence-${suffix}`],
    },
    verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" },
    metadata: { tags: [], notes: null },
    ...overrides,
  });
}

function personPayload(suffix = "1", overrides = {}) {
  return fidApi.createPersonProfile({
    profileId: `person-profile-${suffix}`,
    entityRef: `entity-${suffix}`,
    status: "CANDIDATE",
    personState: "UNKNOWN",
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" },
    ...overrides,
  });
}

function playerPayload(suffix = "1", overrides = {}) {
  return fidApi.createPlayerProfile({
    profileId: `player-profile-${suffix}`,
    entityRef: `entity-${suffix}`,
    personProfileRef: `person-profile-${suffix}`,
    status: "CANDIDATE",
    participationState: "UNKNOWN",
    playingIdentity: { competitionLevel: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" },
    ...overrides,
  });
}

function prospectPayload(suffix = "1", overrides = {}) {
  return fidApi.createProspectProfile({
    profileId: `prospect-profile-${suffix}`,
    entityRef: `entity-${suffix}`,
    personProfileRef: `person-profile-${suffix}`,
    playerProfileRef: `player-profile-${suffix}`,
    prospectCycleRef: null,
    status: "CANDIDATE",
    cycle: { cycleType: "UNKNOWN", status: "UNKNOWN" },
    eligibility: { state: "UNKNOWN", basisType: "UNKNOWN" },
    declaration: { state: "UNKNOWN" },
    entry: { pathwayType: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" },
    ...overrides,
  });
}

function relationshipPayload(suffix = "1", overrides = {}) {
  return fidApi.createFootballRelationship({
    relationshipId: `relationship-${suffix}`,
    status: "CANDIDATE",
    category: "AFFILIATION",
    relationshipType: "ASSOCIATED_WITH",
    direction: "DIRECTED",
    source: { ref: `player-profile-${suffix}`, refType: "PLAYER_PROFILE" },
    target: { ref: `team-${suffix}`, refType: "TEAM_PROFILE" },
    qualifiers: { participationStatus: "UNKNOWN" },
    verification: { state: "UNVERIFIED", confidence: "UNSPECIFIED" },
    ...overrides,
  });
}

function envelope(payload = entityPayload(), overrides = {}) {
  const suffix = overrides.persistenceId ?? "version-1";
  return {
    persistenceId: suffix,
    recordId: overrides.recordId ?? "record-1",
    contract: payload.contract,
    contractVersion: payload.contractVersion,
    schemaVersion: payload.schemaVersion,
    entityRef: payload.entityRef ?? payload.entityId ?? null,
    subjectRef: null,
    recordType: payload.contract,
    recordVersion: 1,
    revision: 1,
    lifecycleState: "CANDIDATE",
    verificationState: "UNVERIFIED",
    effectiveFrom: "2027-01-01",
    effectiveTo: null,
    recordedAt: "2027-01-02",
    persistedAt: "2027-01-03",
    replacedByRef: null,
    supersedesRef: null,
    sourceRecordRefs: [],
    promotionRefs: [],
    payloadChecksum: null,
    payload,
    metadata: { tags: [], notes: null },
    extensions: {},
    ...overrides,
  };
}

function write(repository, payload, overrides) {
  return repository.createVersion(envelope(payload, overrides));
}

function writeEntityVersions(repository, suffix, count) {
  const results = [];
  for (let revision = 1; revision <= count; revision += 1) {
    results.push(write(repository, entityPayload(`${suffix}-${revision}`, {
      identity: { canonicalName: `Prospect ${suffix} revision ${revision}` },
    }), {
      persistenceId: `version-${suffix}-${revision}`,
      recordId: `record-${suffix}`,
      revision,
      recordVersion: revision,
      persistedAt: `2027-01-${String(revision).padStart(2, "0")}`,
    }));
  }
  return results;
}

function repositoryContractChecks() {
  const input = { metadata: { tags: ["diagnostic"], notes: null } };
  const snapshot = JSON.stringify(input);
  const first = fidApi.createFidPersistenceRepositoryContract(input);
  const second = fidApi.createFidPersistenceRepositoryContract(input);
  assert(first.validation.valid && fidApi.isFidPersistenceRepositoryContract(first), "Valid repository contract rejected.");
  assert(JSON.stringify(input) === snapshot && JSON.stringify(first) === JSON.stringify(second), "Repository contract normalization mutated input or is unstable.");
  assert(first.requiredOperations.every((operation) => operation !== "clear") && first.optionalAdapterOperations.includes("clear"), "clear crossed the adapter boundary.");
  assert(first.revisionPolicy.firstRevision === 1 && first.revisionPolicy.gapsAllowed === false && first.revisionPolicy.generatedByRepository === false, "Revision policy changed.");
  assert(Object.isFrozen(fidApi.FID_PERSISTENCE_REQUIRED_OPERATIONS) && Object.isFrozen(fidApi.FID_PERSISTENCE_REVISION_POLICY), "Repository constants are mutable.");
  const invalid = fidApi.createFidPersistenceRepositoryContract({ adapterType: "DATABASE" });
  assert(!invalid.validation.valid && invalid.adapterType === null, "Unknown adapter type accepted.");
  assert(!fidApi.createFidPersistenceRepositoryContract({ requiredOperations: ["clear"] }).validation.valid, "Adapter-only clear entered the general contract.");
  assert(!fidApi.validateFidPersistenceRepositoryContract(null).valid && !fidApi.isFidPersistenceRepositoryContract(null), "Repository contract guards accepted invalid input.");
}

function constructionIsolationChecks(variant) {
  const first = fidApi.createInMemoryFidPersistenceRepository({ label: `first-${variant}`, databaseClient: { active: true } });
  const second = fidApi.createInMemoryFidPersistenceRepository({ label: `second-${variant}` });
  assert(Object.isFrozen(first) && first !== second && first.createVersion !== second.createVersion, "Repository instances are not isolated frozen objects.");
  assert(fidApi.isInMemoryFidPersistenceRepository(first) && fidApi.isFidPersistenceRepository(first), "Repository type guard or general validator failed.");
  assert(!Object.hasOwn(first, "records") && !Object.hasOwn(first, "versions") && !Object.hasOwn(first, "indexes"), "Internal storage was exposed.");
  assert(first.adapterMetadata.label === `first-${variant}` && !Object.hasOwn(first.adapterMetadata, "databaseClient") && first.optionWarnings.length === 1, "Adapter options were not safely normalized.");
  assert(first.healthCheck().data.versionCount === 0 && second.healthCheck().data.versionCount === 0, "New repository was not empty.");
  assert(write(first, entityPayload(`isolation-${variant}`), { persistenceId: `isolation-${variant}`, recordId: `isolation-${variant}` }).ok, "Isolated write failed.");
  assert(first.healthCheck().data.versionCount === 1 && second.healthCheck().data.versionCount === 0, "State leaked between repository instances.");
}

function firstWriteChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const payload = entityPayload(`first-${variant}`);
  const invalid = write(repository, payload, { persistenceId: `first-invalid-${variant}`, recordId: `first-${variant}`, revision: 2 });
  assert(!invalid.ok && errorCode(invalid) === fidApi.FID_PERSISTENCE_ERROR_CODES.INVALID_REVISION, "First revision did not require 1.");
  assert(repository.healthCheck().data.versionCount === 0, "Rejected first write changed storage.");
  const missing = write(repository, payload, { persistenceId: `first-missing-${variant}`, recordId: `first-${variant}`, revision: undefined });
  assert(!missing.ok && repository.healthCheck().data.versionCount === 0, "Repository generated a missing revision.");
  const valid = write(repository, payload, { persistenceId: `first-valid-${variant}`, recordId: `first-${variant}`, revision: 1 });
  assert(valid.ok && valid.data.envelope.revision === 1 && repository.healthCheck().data.indexConsistent, "Valid first revision failed.");
}

function duplicateAtomicityChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const payload = entityPayload(`duplicate-${variant}`);
  assert(write(repository, payload, { persistenceId: `duplicate-${variant}-1`, recordId: `duplicate-${variant}`, revision: 1 }).ok, "Baseline duplicate fixture failed.");
  const duplicateId = write(repository, payload, { persistenceId: `duplicate-${variant}-1`, recordId: `other-${variant}`, revision: 1 });
  const duplicateRevision = write(repository, payload, { persistenceId: `duplicate-${variant}-other`, recordId: `duplicate-${variant}`, revision: 1 });
  assert(errorCode(duplicateId) === fidApi.FID_PERSISTENCE_ERROR_CODES.DUPLICATE_PERSISTENCE_ID, "Duplicate persistenceId was not rejected.");
  assert(errorCode(duplicateRevision) === fidApi.FID_PERSISTENCE_ERROR_CODES.DUPLICATE_REVISION, "Duplicate logical revision was not rejected.");
  const health = repository.healthCheck().data;
  assert(health.recordCount === 1 && health.versionCount === 1 && health.indexConsistent, "Failed duplicate write was not atomic.");
}

function revisionOrderingChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const payload = entityPayload(`ordering-${variant}`);
  assert(write(repository, payload, { persistenceId: `ordering-${variant}-1`, recordId: `ordering-${variant}`, revision: 1 }).ok, "Revision 1 failed.");
  const gap = write(repository, payload, { persistenceId: `ordering-${variant}-3`, recordId: `ordering-${variant}`, revision: 3 });
  assert(!gap.ok && errorCode(gap) === fidApi.FID_PERSISTENCE_ERROR_CODES.INVALID_REVISION, "Revision gap accepted.");
  assert(write(repository, payload, { persistenceId: `ordering-${variant}-2`, recordId: `ordering-${variant}`, revision: 2 }).ok, "Sequential revision 2 failed after rejected gap.");
  const outOfOrder = write(repository, payload, { persistenceId: `ordering-${variant}-old`, recordId: `ordering-${variant}`, revision: 1 });
  assert(!outOfOrder.ok && repository.healthCheck().data.versionCount === 2, "Out-of-order revision accepted or changed storage.");
}

function resultIsolationChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const candidate = envelope(entityPayload(`clone-${variant}`), {
    persistenceId: `clone-${variant}`,
    recordId: `clone-${variant}`,
    metadata: { tags: ["original"], notes: null },
  });
  const written = repository.createVersion(candidate);
  candidate.payload.identity.canonicalName = "mutated input";
  candidate.metadata.tags.push("mutated");
  written.data.envelope.payload.identity.canonicalName = "mutated write result";
  const read = repository.getByPersistenceId(`clone-${variant}`);
  assert(read.data.envelope.payload.identity.canonicalName === `Prospect clone-${variant}` && read.data.envelope.metadata.tags.length === 1, "Input or write-result mutation reached storage.");
  read.data.envelope.payload.identity.canonicalName = "mutated read";
  const queried = repository.queryRecords({ recordIds: [`clone-${variant}`] });
  queried.data.envelopes[0].metadata.tags.push("query mutation");
  const reread = repository.getByPersistenceId(`clone-${variant}`);
  assert(reread.data.envelope.payload.identity.canonicalName === `Prospect clone-${variant}` && reread.data.envelope.metadata.tags.length === 1, "Read or query result exposed stored references.");
}

function nestedFidelityChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const payload = entityPayload(`fidelity-${variant}`, { metadata: { tags: [], notes: null } });
  const candidate = envelope(payload, {
    persistenceId: `fidelity-${variant}`,
    recordId: `fidelity-${variant}`,
    effectiveTo: null,
    replacedByRef: null,
    supersedesRef: null,
    sourceRecordRefs: [],
    promotionRefs: [],
    payloadChecksum: null,
    metadata: { tags: [], notes: null },
    extensions: { nested: { label: "preserved", values: [], unknown: null } },
  });
  assert(repository.createVersion(candidate).ok, "Fidelity write failed.");
  const stored = repository.getByPersistenceId(`fidelity-${variant}`).data.envelope;
  assert(stored.effectiveTo === null && stored.payloadChecksum === null && stored.sourceRecordRefs.length === 0 && stored.metadata.tags.length === 0, "Explicit null or empty collection was not preserved.");
  assert(stored.extensions.nested.label === "preserved" && stored.extensions.nested.values.length === 0 && stored.extensions.nested.unknown === null, "Nested extension fidelity failed.");
  assert(stored.payload.references.researchSourceRefs[0] === `research-source-fidelity-${variant}`, "Nested payload reference changed.");
}

function exactLatestHistoryChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  assert(writeEntityVersions(repository, `history-${variant}`, 3).every((result) => result.ok), "Version history fixture failed.");
  const exact = repository.getByPersistenceId(`version-history-${variant}-2`);
  const latest = repository.getLatestByRecordId(`record-history-${variant}`);
  const ascending = repository.listVersions(`record-history-${variant}`);
  const descending = repository.listVersions(`record-history-${variant}`, { sortDirection: "DESC" });
  assert(exact.data.envelope.revision === 2 && latest.data.envelope.revision === 3 && latest.data.latestBy === "HIGHEST_STORED_REVISION", "Exact or latest read returned the wrong revision.");
  assert(ascending.data.envelopes.map((entry) => entry.revision).join(",") === "1,2,3" && descending.data.envelopes.map((entry) => entry.revision).join(",") === "3,2,1", "Version history ordering failed.");
  assert(errorCode(repository.getByPersistenceId("missing")) === fidApi.FID_PERSISTENCE_ERROR_CODES.VERSION_NOT_FOUND && errorCode(repository.getLatestByRecordId("missing")) === fidApi.FID_PERSISTENCE_ERROR_CODES.RECORD_NOT_FOUND, "Missing read error changed.");
}

function approvedQueryFilterChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const first = envelope(entityPayload(`filter-${variant}-a`), { persistenceId: `filter-${variant}-a`, recordId: `filter-${variant}-a`, entityRef: `entity-filter-${variant}-a`, subjectRef: `subject-${variant}`, lifecycleState: "CANDIDATE", verificationState: "UNVERIFIED", effectiveFrom: "2027-01-01", persistedAt: "2027-02-01" });
  const second = envelope(personPayload(`filter-${variant}-b`), { persistenceId: `filter-${variant}-b`, recordId: `filter-${variant}-b`, entityRef: `entity-filter-${variant}-b`, subjectRef: null, lifecycleState: "ACTIVE", verificationState: "VERIFIED", effectiveFrom: "2027-02-01", persistedAt: "2027-03-01" });
  assert(repository.createVersion(first).ok && repository.createVersion(second).ok, "Query fixtures failed.");
  const checks = [
    [{ contracts: ["PersonProfile"] }, `filter-${variant}-b`],
    [{ recordIds: [`filter-${variant}-a`] }, `filter-${variant}-a`],
    [{ persistenceIds: [`filter-${variant}-b`] }, `filter-${variant}-b`],
    [{ entityRefs: [`entity-filter-${variant}-a`] }, `filter-${variant}-a`],
    [{ subjectRefs: [`subject-${variant}`] }, `filter-${variant}-a`],
    [{ lifecycleStates: ["ACTIVE"] }, `filter-${variant}-b`],
    [{ verificationStates: ["VERIFIED"] }, `filter-${variant}-b`],
    [{ persistedAfter: "2027-03-01", persistedBefore: "2027-03-01" }, `filter-${variant}-b`],
  ];
  checks.forEach(([query, expected]) => {
    const result = repository.queryRecords(query);
    assert(result.ok && result.data.envelopes.length === 1 && result.data.envelopes[0].persistenceId === expected, "Approved query filter returned the wrong record.");
  });
  assert(errorCode(repository.queryRecords({ arbitrary: true })) === fidApi.FID_PERSISTENCE_ERROR_CODES.UNSUPPORTED_QUERY, "Unknown query field accepted.");
  assert(errorCode(repository.queryRecords({ callback: () => true })) === fidApi.FID_PERSISTENCE_ERROR_CODES.UNSUPPORTED_QUERY, "Executable query accepted.");
}

function historicalQueryChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  assert(writeEntityVersions(repository, `historical-${variant}`, 3).every((result) => result.ok), "Historical query fixture failed.");
  writeEntityVersions(repository, `historical-other-${variant}`, 2);
  const all = repository.queryRecords({ includeHistorical: true, sortField: "recordId", sortDirection: "ASC" });
  const latest = repository.queryRecords({ includeHistorical: false, sortField: "recordId", sortDirection: "ASC" });
  assert(all.data.envelopes.length === 5 && latest.data.envelopes.length === 2, "includeHistorical behavior changed.");
  assert(latest.data.envelopes.every((entry) => entry.revision === (entry.recordId.includes("other") ? 2 : 3)), "Latest-only query did not use highest stored revisions.");
  assert(latest.data.includeHistorical === false && all.data.includeHistorical === true, "Query result misstated historical mode.");
}

function deterministicOrderingChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  ["c", "a", "b"].forEach((suffix) => {
    assert(write(repository, entityPayload(`sort-${variant}-${suffix}`), { persistenceId: `sort-${variant}-${suffix}`, recordId: `sort-${variant}-${suffix}`, revision: 1, persistedAt: "2027-04-01" }).ok, "Sort fixture failed.");
  });
  const query = { sortField: "persistedAt", sortDirection: "ASC" };
  const first = repository.queryRecords(query);
  const second = repository.queryRecords(query);
  const ids = first.data.envelopes.map((entry) => entry.recordId);
  assert(JSON.stringify(first.data.envelopes) === JSON.stringify(second.data.envelopes), "Repeated query ordering was unstable.");
  assert(ids.join(",") === [`sort-${variant}-a`, `sort-${variant}-b`, `sort-${variant}-c`].join(","), "Deterministic recordId tie-breaker failed.");
  assert(first.data.ordering.tieBreakers.join(",") === "recordId,revision,persistenceId", "Ordering provenance changed.");
}

function cursorPaginationChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  ["a", "b", "c", "d", "e"].forEach((suffix) => {
    write(repository, entityPayload(`cursor-${variant}-${suffix}`), { persistenceId: `cursor-${variant}-${suffix}`, recordId: `cursor-${variant}-${suffix}` });
  });
  const query = { sortField: "recordId", sortDirection: "ASC", limit: 2 };
  const first = repository.queryRecords(query);
  const second = repository.queryRecords({ ...query, cursor: first.data.page.nextCursor });
  const third = repository.queryRecords({ ...query, cursor: second.data.page.nextCursor });
  const ids = [...first.data.envelopes, ...second.data.envelopes, ...third.data.envelopes].map((entry) => entry.persistenceId);
  assert(first.data.page.hasMore && second.data.page.hasMore && !third.data.page.hasMore && third.data.page.nextCursor === null, "Cursor page state is invalid.");
  assert(ids.length === 5 && new Set(ids).size === 5, "Cursor pages skipped or repeated records.");
  assert(errorCode(repository.queryRecords({ ...query, cursor: "malformed" })) === fidApi.FID_PERSISTENCE_ERROR_CODES.INVALID_CURSOR, "Malformed cursor accepted.");
  assert(errorCode(repository.queryRecords({ ...query, contracts: ["PersonProfile"], cursor: first.data.page.nextCursor })) === fidApi.FID_PERSISTENCE_ERROR_CODES.INVALID_CURSOR, "Cursor was reused with a different query.");
}

function referenceQueryChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const candidate = envelope(entityPayload(`reference-${variant}`), {
    persistenceId: `reference-${variant}`,
    recordId: `reference-${variant}`,
    sourceRecordRefs: [`source-record-${variant}`],
    promotionRefs: [`promotion-${variant}`],
    replacedByRef: `replacement-${variant}`,
    supersedesRef: `superseded-${variant}`,
  });
  assert(repository.createVersion(candidate).ok, "Reference fixture failed.");
  const references = [`source-record-${variant}`, `promotion-${variant}`, `replacement-${variant}`, `superseded-${variant}`, `research-source-reference-${variant}`, `evidence-reference-${variant}`];
  references.forEach((reference) => {
    const result = repository.queryRecords({ reference });
    assert(result.ok && result.data.envelopes.length === 1, `Reference query failed for ${reference}.`);
  });
  assert(repository.queryRecords({ reference: "unresolved-missing" }).data.envelopes.length === 0, "Missing unresolved reference invented a match.");
  assert(repository.queryRecords({ reference: `SOURCE-RECORD-${variant}` }).data.envelopes.length === 0, "Reference query was not exact.");
}

function existenceHealthClearChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  writeEntityVersions(repository, `health-${variant}`, 2);
  assert(repository.recordExists(`record-health-${variant}`).data.exists && !repository.recordExists("missing").data.exists, "recordExists failed.");
  assert(repository.persistenceIdExists(`version-health-${variant}-2`).data.exists && !repository.persistenceIdExists("missing").data.exists, "persistenceIdExists failed.");
  const health = repository.healthCheck();
  assert(health.ok && health.data.available && !health.data.durable && !health.data.crossProcessConcurrencyGuaranteed && health.data.indexConsistent && health.data.recordCount === 1 && health.data.versionCount === 2, "Local health check is invalid.");
  const cleared = repository.clear();
  assert(cleared.ok && cleared.data.adapterSpecific && cleared.data.clearedRecordCount === 1 && cleared.data.clearedVersionCount === 2, "Adapter-specific clear failed.");
  assert(repository.healthCheck().data.versionCount === 0 && repository.clear().data.clearedVersionCount === 0, "Clear did not isolate or reset instance state.");
  assert(!fidApi.FID_PERSISTENCE_REQUIRED_OPERATIONS.includes("clear"), "clear entered the required production-adapter capability set.");
}

function structuredErrorChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const invalidCalls = [
    repository.createVersion(null),
    repository.getByPersistenceId(null),
    repository.getLatestByRecordId(null),
    repository.listVersions(`missing-${variant}`),
    repository.queryRecords(null),
    repository.queryRecords({ persistedAfter: "2027-03-02", persistedBefore: "2027-03-01" }),
  ];
  invalidCalls.forEach((result) => assert(result.ok === false && result.data === null && result.error?.validation?.valid === true && result.validation.valid === true, "Ordinary invalid input did not return a structured repository failure."));
  const invalidRepository = fidApi.validateFidPersistenceRepository({ records: [] });
  assert(!invalidRepository.valid && invalidRepository.errors.length > 0 && !fidApi.isFidPersistenceRepository({}), "Repository validator accepted missing operations or exposed storage.");
  assert(repository.healthCheck().data.versionCount === 0, "Invalid operations mutated repository state.");
}

function runtimeBoundaryChecks() {
  const beforeFactory = REPOSITORY_SOURCE.slice(0, REPOSITORY_SOURCE.indexOf("export function createInMemoryFidPersistenceRepository"));
  const productionImports = [...imports(REPOSITORY_SOURCE), ...imports(REPOSITORY_CONTRACT_SOURCE)];
  assert(!/\bby(?:PersistenceId|RecordId)\s*=\s*new\s+Map\s*\(/.test(beforeFactory), "Module-global mutable repository storage found.");
  assert(/const\s+byPersistenceId\s*=\s*new\s+Map\s*\(\)/.test(REPOSITORY_SOURCE.slice(REPOSITORY_SOURCE.indexOf("export function createInMemoryFidPersistenceRepository"))) && /const\s+byRecordId\s*=\s*new\s+Map\s*\(\)/.test(REPOSITORY_SOURCE.slice(REPOSITORY_SOURCE.indexOf("export function createInMemoryFidPersistenceRepository"))), "Repository indexes are not closure-owned per instance.");
  assert(productionImports.every((entry) => !/researchRepository|supabase|database|storageClient|registry|resolver|engine|components|pages|router|routes/i.test(entry)), "Repository has a prohibited production dependency.");
  assert(!/\bfetch\s*\(|\bcreateClient\s*\(|\blocalStorage\s*\.|\bindexedDB\s*\./.test(REPOSITORY_SOURCE), "Network, database, or browser storage runtime found.");
  assert(!/export\s+const\s+\w*(?:singleton|repositoryInstance)/i.test(REPOSITORY_SOURCE), "Application repository singleton found.");
  assert(CONTRACT_SOURCES.every((source) => imports(source).every((entry) => !/persistence/i.test(entry))), "Factual contract imports persistence runtime.");
  assert(!/runInMemoryFidPersistenceRepositoryDiagnostics/.test(PERSISTENCE_INDEX_SOURCE) && !/runInMemoryFidPersistenceRepositoryDiagnostics/.test(FID_INDEX_SOURCE), "Diagnostic runner entered production exports.");
}

function genericContractFixtureChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const payloads = [entityPayload(`generic-${variant}`), personPayload(`generic-${variant}`), playerPayload(`generic-${variant}`), prospectPayload(`generic-${variant}`), relationshipPayload(`generic-${variant}`)];
  payloads.forEach((payload, index) => {
    assert(payload.validation.valid, `${payload.contract} generic payload is invalid.`);
    assert(write(repository, payload, { persistenceId: `generic-${variant}-${index}`, recordId: `generic-${variant}-${index}` }).ok, `${payload.contract} persistence write failed.`);
  });
  assert(repository.healthCheck().data.versionCount === 5, "Generic contract fixture count changed.");
  payloads.forEach((payload) => assert(repository.queryRecords({ contracts: [payload.contract] }).data.envelopes.length === 1, `${payload.contract} query failed.`));
}

function prospectIntakeHistoryChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const early = prospectPayload(`intake-${variant}`);
  const tracked = prospectPayload(`intake-${variant}`, { cycle: { cycleType: "DRAFT", status: "ELIGIBLE", classYear: 2027 } });
  const declared = prospectPayload(`intake-${variant}`, { cycle: { cycleType: "DRAFT", status: "DECLARED", classYear: 2027 }, declaration: { state: "DECLARED", declaredAt: "2027-01-10" } });
  [early, tracked, declared].forEach((payload, index) => assert(write(repository, payload, { persistenceId: `intake-${variant}-${index + 1}`, recordId: `intake-${variant}`, revision: index + 1, recordVersion: index + 1, persistedAt: `2027-02-0${index + 1}` }).ok, "Prospect intake revision failed."));
  const playerFirst = playerPayload(`movement-${variant}`, { positionHistory: [{ positionCode: "QB", assignmentType: "LISTED", status: "REPORTED", competitionLevel: "COLLEGE" }], teamAssignments: [{ assignmentId: "school-a", teamRef: "school-a", competitionLevel: "COLLEGE", status: "REPORTED" }] });
  const playerSecond = playerPayload(`movement-${variant}`, { positionHistory: [{ positionCode: "QB", assignmentType: "LISTED", status: "REPORTED", competitionLevel: "COLLEGE" }, { positionCode: "WR", assignmentType: "LISTED", status: "REPORTED", competitionLevel: "COLLEGE" }], teamAssignments: [{ assignmentId: "school-b", teamRef: "school-b", competitionLevel: "COLLEGE", status: "REPORTED" }] });
  assert(write(repository, playerFirst, { persistenceId: `movement-${variant}-1`, recordId: `movement-${variant}`, revision: 1 }).ok && write(repository, playerSecond, { persistenceId: `movement-${variant}-2`, recordId: `movement-${variant}`, revision: 2 }).ok, "School or position change history failed.");
  const history = repository.listVersions(`intake-${variant}`).data.envelopes;
  assert(history.length === 3 && history[0].payload.cycle.status === "UNKNOWN" && history[2].payload.declaration.state === "DECLARED", "Prospect cycle history was not preserved.");
  const movement = repository.listVersions(`movement-${variant}`).data.envelopes;
  assert(movement[0].payload.teamAssignments[0].teamRef === "school-a" && movement[1].payload.teamAssignments[0].teamRef === "school-b" && movement[1].payload.positionHistory.length === 2, "School or position changes were not preserved immutably.");
}

function unknownNullExtensionSafetyChecks(variant) {
  const repository = fidApi.createInMemoryFidPersistenceRepository();
  const payload = prospectPayload(`unknown-${variant}`);
  const candidate = envelope(payload, { persistenceId: `unknown-${variant}`, recordId: `unknown-${variant}`, persistedAt: null, payloadChecksum: null, sourceRecordRefs: [`unresolved-source-${variant}`], promotionRefs: [], extensions: { descriptive: { unknownValue: null, labels: [] } } });
  assert(repository.createVersion(candidate).ok, "Unknown/null extension fixture failed.");
  const stored = repository.getByPersistenceId(`unknown-${variant}`).data.envelope;
  assert(stored.persistedAt === null && stored.payloadChecksum === null && stored.extensions.descriptive.unknownValue === null && stored.extensions.descriptive.labels.length === 0, "Repository invented or lost unknown persistence facts.");
  assert(stored.payload.cycle.classYear === null && stored.payload.prospectCycleRef === null, "Incomplete early-watchlist fields were invented.");
  const unavailable = fidApi.createUnavailableFidPersistenceEnvelope({ reason: "Unavailable diagnostic fixture" });
  const rejected = repository.createVersion(unavailable);
  assert(!rejected.ok && repository.healthCheck().data.versionCount === 1, "Unavailable envelope was stored or altered existing state.");
}

function exportDependencyChecks() {
  const persistenceNamed = Object.keys(namedPersistenceApi).filter((name) => name !== "default");
  const persistenceDefaults = Object.keys(persistenceApi);
  const fidNamed = Object.keys(namedFidApi).filter((name) => name !== "default");
  const repositoryNames = Object.keys(repositoryContractApi);
  const inMemoryNames = Object.keys(inMemoryRepositoryApi);
  assert(repositoryNames.length === 13 && inMemoryNames.length === 5 && new Set([...repositoryNames, ...inMemoryNames]).size === 18, "Sprint 18 export identities changed or collided.");
  assert(persistenceNamed.length === persistenceDefaults.length && new Set(persistenceNamed).size === persistenceNamed.length && new Set(persistenceDefaults).size === persistenceDefaults.length && persistenceNamed.every((name) => namedPersistenceApi[name] === persistenceApi[name]), "Persistence named/default exports disagree or collide.");
  assert([...repositoryNames, ...inMemoryNames].every((name) => namedPersistenceApi[name] === persistenceApi[name] && namedFidApi[name] === fidApi[name] && fidApi[name] === persistenceApi[name]), "Sprint 18 export reference disagreement found.");
  assert(fidNamed.length === Object.keys(fidApi).length && fidNamed.every((name) => namedFidApi[name] === fidApi[name]), "FID named/default exports disagree.");
  assert(!Object.keys(fidApi).some((name) => /^run.*Diagnostics$/.test(name)) && !persistenceDefaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner entered production API.");
  assert(!imports(PERSISTENCE_INDEX_SOURCE).some((entry) => /diagnostics/i.test(entry)) && !imports(FID_INDEX_SOURCE).some((entry) => /diagnostics/i.test(entry)), "Production index imports diagnostics.");
}

const CHECKS = Object.freeze([
  repositoryContractChecks,
  constructionIsolationChecks,
  firstWriteChecks,
  duplicateAtomicityChecks,
  revisionOrderingChecks,
  resultIsolationChecks,
  nestedFidelityChecks,
  exactLatestHistoryChecks,
  approvedQueryFilterChecks,
  historicalQueryChecks,
  deterministicOrderingChecks,
  cursorPaginationChecks,
  referenceQueryChecks,
  existenceHealthClearChecks,
  structuredErrorChecks,
  runtimeBoundaryChecks,
  genericContractFixtureChecks,
  prospectIntakeHistoryChecks,
  unknownNullExtensionSafetyChecks,
  exportDependencyChecks,
]);

export function runInMemoryFidPersistenceRepositoryDiagnostics({ throwOnFailure = false } = {}) {
  const cases = [];
  CASE_NAMES.forEach((id, index) => {
    const groupIndex = Math.floor(index / 20);
    const variant = (index % 20) + 1;
    try {
      CHECKS[groupIndex](variant);
      cases.push({ id, passed: true, message: `${id} passed.`, details: null });
    } catch (failure) {
      cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null });
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: fidApi.FID_PERSISTENCE_REPOSITORY_CONTRACT_VERSION,
    schemaVersion: fidApi.FID_PERSISTENCE_REPOSITORY_SCHEMA_VERSION,
    repositoryVersion: fidApi.IN_MEMORY_FID_PERSISTENCE_REPOSITORY_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runInMemoryFidPersistenceRepositoryDiagnostics });
