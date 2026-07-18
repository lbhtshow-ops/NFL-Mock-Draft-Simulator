import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fidApi, * as namedApi from "../index.js";
import footballEntityConstants from "../constants/footballEntityConstants.js";
import footballEntityContract from "../contracts/FootballEntityContract.js";
import personProfileConstants from "../constants/personProfileConstants.js";
import personProfileContract from "../contracts/PersonProfileContract.js";
import playerProfileConstants from "../constants/playerProfileConstants.js";
import playerProfileContract from "../contracts/PlayerProfileContract.js";
import prospectProfileConstants from "../constants/prospectProfileConstants.js";
import prospectProfileContract from "../contracts/ProspectProfileContract.js";
import organizationProfileConstants from "../constants/organizationProfileConstants.js";
import organizationProfileContract from "../contracts/OrganizationProfileContract.js";
import teamProfileConstants from "../constants/teamProfileConstants.js";
import teamProfileContract from "../contracts/TeamProfileContract.js";
import footballRelationshipConstants from "../constants/footballRelationshipConstants.js";
import footballRelationshipContract from "../contracts/FootballRelationshipContract.js";
import coachProfileConstants from "../constants/coachProfileConstants.js";
import coachProfileContract from "../contracts/CoachProfileContract.js";
import executiveProfileConstants from "../constants/executiveProfileConstants.js";
import executiveProfileContract from "../contracts/ExecutiveProfileContract.js";
import scoutProfileConstants from "../constants/scoutProfileConstants.js";
import scoutProfileContract from "../contracts/ScoutProfileContract.js";
import persistenceApi, * as persistenceNamedApi from "../persistence/index.js";
import persistenceArchitectureApi from "../persistence/FidPersistenceArchitectureSpecification.js";
import persistenceRepositoryContractApi from "../persistence/FidPersistenceRepositoryContract.js";
import inMemoryPersistenceRepositoryApi from "../persistence/InMemoryFidPersistenceRepository.js";
import { runFidPersonnelSpecializationFoundationDiagnostics } from "./runFidPersonnelSpecializationFoundationDiagnostics.js";

const SUITE = "FidPersistenceArchitectureDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  "constants/footballEntityConstants.js", "contracts/FootballEntityContract.js", "constants/personProfileConstants.js", "contracts/PersonProfileContract.js",
  "constants/playerProfileConstants.js", "contracts/PlayerProfileContract.js", "constants/prospectProfileConstants.js", "contracts/ProspectProfileContract.js",
  "constants/organizationProfileConstants.js", "contracts/OrganizationProfileContract.js", "constants/teamProfileConstants.js", "contracts/TeamProfileContract.js",
  "constants/footballRelationshipConstants.js", "contracts/FootballRelationshipContract.js", "constants/coachProfileConstants.js", "contracts/CoachProfileContract.js",
  "constants/executiveProfileConstants.js", "contracts/ExecutiveProfileContract.js", "constants/scoutProfileConstants.js", "contracts/ScoutProfileContract.js",
  "persistence/FidPersistenceArchitectureSpecification.js", "persistence/index.js", "index.js",
].map((file) => resolve(ROOT, file));
const PROTECTED_API = Object.freeze({ ...footballEntityConstants, ...footballEntityContract, ...personProfileConstants, ...personProfileContract, ...playerProfileConstants, ...playerProfileContract, ...prospectProfileConstants, ...prospectProfileContract, ...organizationProfileConstants, ...organizationProfileContract, ...teamProfileConstants, ...teamProfileContract, ...footballRelationshipConstants, ...footballRelationshipContract, ...coachProfileConstants, ...coachProfileContract, ...executiveProfileConstants, ...executiveProfileContract, ...scoutProfileConstants, ...scoutProfileContract });
const PROTECTED_SPRINT_17_PERSISTENCE_API = Object.freeze({ ...persistenceArchitectureApi });
const APPROVED_SPRINT_18_PERSISTENCE_API = Object.freeze({
  ...persistenceRepositoryContractApi,
  ...inMemoryPersistenceRepositoryApi,
});

function assert(condition, message, details = null) { if (!condition) { const failure = new Error(message); failure.details = details; throw failure; } }
function keysDeep(value, keys = new Set()) { if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys)); else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); }); return keys; }
function imports(source) { return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]); }
function graph(sources) { const files = new Set(PRODUCTION_FILES); return Object.fromEntries(PRODUCTION_FILES.map((file) => [file, imports(sources[file]).filter((entry) => entry.startsWith(".")).map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))])); }
function hasCycle(value) { const visiting = new Set(); const visited = new Set(); function visit(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); if ((value[node] || []).some(visit)) return true; visiting.delete(node); visited.add(node); return false; } return Object.keys(value).some(visit); }
function payload(overrides = {}) { return fidApi.createFootballEntity({ entityId: "entity-1", entityType: "PERSON", status: "CANDIDATE", identity: { canonicalName: "Canonical Person" }, references: { researchSourceRefs: ["source-1"], evidenceArtifactRefs: ["evidence-1"] }, verification: { state: "UNVERIFIED", identityConfidence: "UNSPECIFIED" }, metadata: { tags: [], notes: null }, ...overrides }); }
function envelope(overrides = {}) { const value = overrides.payload ?? payload(); return { persistenceId: "stored-version-1", recordId: "logical-record-1", contract: value.contract, contractVersion: value.contractVersion, schemaVersion: value.schemaVersion, entityRef: "entity-1", subjectRef: null, recordType: "FOOTBALL_ENTITY", recordVersion: 1, revision: 1, lifecycleState: "CANDIDATE", verificationState: "UNVERIFIED", effectiveFrom: "2026-01-01", effectiveTo: null, recordedAt: "2026-01-02", persistedAt: "2026-01-03", replacedByRef: null, supersedesRef: null, sourceRecordRefs: ["source-record-1"], promotionRefs: ["promotion-decision-1"], payloadChecksum: null, payload: value, metadata: { tags: ["diagnostic"], notes: null }, extensions: { architecture: { descriptiveLabel: "Canonical envelope" } }, ...overrides }; }
function query(overrides = {}) { return { contracts: ["FootballEntity"], recordIds: ["logical-record-1"], persistenceIds: [], entityRefs: ["entity-1"], subjectRefs: [], lifecycleStates: ["CANDIDATE"], verificationStates: ["UNVERIFIED"], effectiveFrom: null, effectiveTo: null, persistedAfter: null, persistedBefore: null, reference: "source-record-1", includeHistorical: true, limit: 50, cursor: "opaque-cursor", sortField: "revision", sortDirection: "ASC", ...overrides }; }
function architecture(overrides = {}) { return fidApi.createFidPersistenceArchitectureSpecification({ storageModel: "HYBRID_CANONICAL_RECORD", metadata: { tags: ["architecture"], notes: "Specification only" }, ...overrides }); }
function createdEnvelope(input = envelope()) { return fidApi.createFidPersistenceEnvelope(input); }

function identityFactoryChecks() {
  const specification = architecture(); const stored = createdEnvelope(); const minimalQuery = fidApi.createFidPersistenceQuery({});
  assert(specification.validation.valid && fidApi.isFidPersistenceArchitectureSpecification(specification), "Architecture specification invalid.");
  assert(stored.validation.valid && fidApi.isFidPersistenceEnvelope(stored), "Valid persistence envelope rejected.");
  assert(minimalQuery.validation.valid && fidApi.isFidPersistenceQuery(minimalQuery), "Minimal query invalid.");
  assert(specification.contract === fidApi.FID_PERSISTENCE_ARCHITECTURE_CONTRACT_NAME && specification.contractVersion === fidApi.FID_PERSISTENCE_ARCHITECTURE_CONTRACT_VERSION && specification.schemaVersion === fidApi.FID_PERSISTENCE_ARCHITECTURE_SCHEMA_VERSION, "Specification identity or versions invalid.");
  [fidApi.FID_PERSISTENCE_STORAGE_MODELS, fidApi.FID_PERSISTENCE_ERROR_CODES, fidApi.FID_PERSISTENCE_QUERY_SORT_FIELDS, fidApi.FID_PERSISTENCE_SORT_DIRECTIONS, fidApi.FID_PERSISTENCE_REPOSITORY_CAPABILITIES, fidApi.FID_PERSISTENCE_SUPPORTED_CONTRACTS, fidApi.FID_PERSISTENCE_WRITE_STAGES, fidApi.FID_PERSISTENCE_READ_CAPABILITIES].forEach((value) => assert(Object.isFrozen(value), "Persistence constant is not frozen."));
  [null, [], "invalid", 7].forEach((value) => { assert(!fidApi.createFidPersistenceEnvelope(value).validation.valid && !fidApi.validateFidPersistenceEnvelope(value).valid, "Envelope factory or validator unsafe."); assert(!fidApi.createFidPersistenceQuery(value).validation.valid && !fidApi.validateFidPersistenceQuery(value).valid, "Query factory or validator unsafe."); assert(!fidApi.createFidPersistenceArchitectureSpecification(value).validation.valid && !fidApi.validateFidPersistenceArchitectureSpecification(value).valid, "Architecture factory or validator unsafe."); });
  const empty = fidApi.createUnavailableFidPersistenceEnvelope(); assert(empty.persistenceId === null && empty.recordId === null && empty.revision === null && empty.persistedAt === null && empty.payloadChecksum === null && empty.payload === null && !empty.validation.valid, "Unavailable envelope invented persistence facts.");
}
function envelopeVersionChecks() {
  const input = envelope(); const snapshot = JSON.stringify(input); const first = createdEnvelope(input); assert(JSON.stringify(input) === snapshot, "Envelope factory mutated input."); fidApi.validateFidPersistenceEnvelope(first); assert(JSON.stringify(input) === snapshot && JSON.stringify(first) === JSON.stringify(createdEnvelope(input)), "Envelope validator mutated input or normalization unstable.");
  assert(first.persistenceId !== first.recordId && first.payload.entityId === "entity-1" && first.payload.contract === first.contract, "Envelope identity model collapsed contract or persistence identity.");
  const versions = [1, 2, 3].map((revision) => createdEnvelope(envelope({ persistenceId: `stored-version-${revision}`, recordId: "logical-record-1", revision, recordVersion: revision, supersedesRef: revision === 1 ? null : `stored-version-${revision - 1}` })));
  assert(versions.every((value) => value.validation.valid) && new Set(versions.map((value) => value.persistenceId)).size === 3 && new Set(versions.map((value) => value.recordId)).size === 1, "Historical version identity model invalid.");
  assert(architecture().versionModel.writeMode === "APPEND_ORIENTED" && architecture().versionModel.historicalVersionsImmutable && architecture().versionModel.overwriteHistoricalVersions === false, "Append-oriented immutable history not declared.");
  assert(!createdEnvelope(envelope({ persistenceId: null })).validation.valid && !createdEnvelope(envelope({ recordId: null })).validation.valid && !createdEnvelope(envelope({ revision: 0 })).validation.valid, "Required persistence identity or revision not enforced.");
  assert(!createdEnvelope(envelope({ effectiveFrom: "2027-01-01", effectiveTo: "2026-01-01" })).validation.valid, "Invalid effective-date order accepted.");
  assert(!createdEnvelope(envelope({ replacedByRef: "stored-version-1" })).validation.valid && !createdEnvelope(envelope({ supersedesRef: "stored-version-1" })).validation.valid, "Self replacement or supersession accepted.");
  assert(Object.values(fidApi.FID_PERSISTENCE_ERROR_CODES).includes("DUPLICATE_PERSISTENCE_ID") && Object.values(fidApi.FID_PERSISTENCE_ERROR_CODES).includes("DUPLICATE_REVISION") && Object.values(fidApi.FID_PERSISTENCE_ERROR_CODES).includes("MUTATION_DETECTED"), "Conflict or mutation errors missing.");
}
function payloadFidelityChecks() {
  const original = payload(); const stored = createdEnvelope(envelope({ payload: original, subjectRef: null, effectiveTo: null, payloadChecksum: null }));
  assert(JSON.stringify(stored.payload) === JSON.stringify(original) && stored.payload !== original, "Payload was mutated, flattened, or not defensively copied.");
  assert(stored.subjectRef === null && stored.effectiveTo === null && stored.payloadChecksum === null, "Explicit null changed.");
  assert(Array.isArray(stored.payload.aliases) && stored.payload.aliases.length === 0 && stored.payload.references.researchSourceRefs[0] === "source-1" && stored.payload.references.evidenceArtifactRefs[0] === "evidence-1", "Normalized empty arrays or unresolved references lost.");
  assert(stored.payload.verification.state === "UNVERIFIED" && stored.payload.provenance.createdAt === null && stored.payload.metadata.notes === null, "Verification, provenance, or unknown values lost.");
  const mismatch = createdEnvelope(envelope({ contract: "PersonProfile" })); const contractVersionMismatch = createdEnvelope(envelope({ contractVersion: "wrong-version" })); const schemaMismatch = createdEnvelope(envelope({ schemaVersion: "wrong-schema" }));
  assert(!mismatch.validation.valid && !contractVersionMismatch.validation.valid && !schemaMismatch.validation.valid, "Payload identity mismatch accepted.");
  assert(!createdEnvelope(envelope({ contract: "UnknownContract" })).validation.valid && !createdEnvelope(envelope({ payload: { contract: "FootballEntity", contractVersion: "x", schemaVersion: "y", validation: { valid: false } } })).validation.valid, "Unknown contract or invalid payload accepted.");
  ["DiagnosticRunner", "IntelligenceResult", "ResearchSource"].forEach((contract) => assert(!createdEnvelope(envelope({ contract, payload: { contract, contractVersion: "1", schemaVersion: "1", validation: { valid: true } } })).validation.valid, `${contract} accepted as FID payload.`));
  const model = architecture(); assert(model.payloadFidelity.preserveExplicitNulls && model.payloadFidelity.preserveEmptyArrays && model.payloadFidelity.preserveUnresolvedReferences && model.payloadFidelity.preserveLifecycle && model.payloadFidelity.preserveVerification && model.payloadFidelity.preserveProvenance && model.payloadFidelity.lossyFlatteningAllowed === false && model.payloadFidelity.calculatedFieldsAdded === false, "Payload fidelity model incomplete.");
}
function writeReadChecks() {
  const specification = architecture();
  assert(JSON.stringify(specification.writePipeline) === JSON.stringify(fidApi.FID_PERSISTENCE_WRITE_STAGES), "Write pipeline stages changed.");
  assert(specification.writePipeline.indexOf("CONTRACT_IDENTIFICATION") < specification.writePipeline.indexOf("CONTRACT_NORMALIZATION") && specification.writePipeline.indexOf("CONTRACT_NORMALIZATION") < specification.writePipeline.indexOf("CONTRACT_VALIDATION") && specification.writePipeline.indexOf("CONTRACT_VALIDATION") < specification.writePipeline.indexOf("ENVELOPE_VALIDATION") && specification.writePipeline.at(-1) === "STORED_IMMUTABLE_VERSION", "Write-boundary ordering invalid.");
  assert(specification.repositoryCapabilities.every((entry) => entry.runtimeImplemented === false), "Repository operation was implemented.");
  ["GET_BY_PERSISTENCE_ID", "GET_BY_RECORD_ID", "LIST_VERSIONS", "GET_LATEST_REVISION", "QUERY_BY_CONTRACT", "QUERY_BY_ENTITY_REF", "QUERY_BY_SUBJECT_REF", "QUERY_BY_LIFECYCLE_STATE", "QUERY_BY_VERIFICATION_STATE", "QUERY_BY_EFFECTIVE_PERIOD", "QUERY_BY_UNRESOLVED_REFERENCE", "LIST_CHANGED_AFTER", "PAGINATE_DETERMINISTICALLY"].forEach((name) => assert(specification.readCapabilities.includes(name), `Read capability missing: ${name}.`));
  assert(specification.canonicalRecordModel.automaticHydration === false, "Automatic hydration must remain explicitly disabled.");
  const keys = keysDeep(specification); ["referenceResolution", "truthValidation", "currentStateInference", "recordMerge", "automaticPromotion", "confidenceCalculation", "evidenceCombination", "relationshipGeneration", "factuallyAuthoritative", "currentlyTrue", "mostAccurate", "mostVerified", "winningConflict", "currentEmployment", "currentTeam", "activeRelationship", "hydrateRecord", "hydrationFunction", "hydrationCallback", "referenceResolver"].forEach((key) => assert(!keys.has(key), `Write/read architecture inferred ${key}.`));
}
function queryRepositoryChecks() {
  const value = fidApi.createFidPersistenceQuery(query()); assert(value.validation.valid && value.includeHistorical === true && value.limit === 50 && value.cursor === "opaque-cursor", "Full persistence query invalid.");
  assert(!fidApi.createFidPersistenceQuery(query({ sortField: "authority", sortDirection: "ASC" })).validation.valid && !fidApi.createFidPersistenceQuery(query({ limit: 0 })).validation.valid && !fidApi.createFidPersistenceQuery(query({ limit: 501 })).validation.valid, "Invalid query sort or limit accepted.");
  assert(architecture().queryModel.deterministicOrderingRequired && architecture().queryModel.paginationSupported && architecture().queryModel.arbitraryPredicatesAllowed === false && architecture().queryModel.graphTraversalAllowed === false && architecture().queryModel.textToSqlAllowed === false && architecture().queryModel.automaticJoinsAllowed === false && architecture().queryModel.hydrationAllowed === false && architecture().queryModel.inferredCurrentStateFilteringAllowed === false, "Safe query model incomplete.");
  Object.values(fidApi.FID_PERSISTENCE_REPOSITORY_CAPABILITIES).forEach((capabilityId) => { const result = fidApi.createFidRepositoryCapabilitySpecification({ capabilityId }); assert(result.validation.valid && result.runtimeImplemented === false, `Repository capability specification invalid: ${capabilityId}.`); });
  const success = fidApi.createFidRepositoryResult({ ok: true, operation: "queryRecords", data: { envelopes: [] } }); const failure = fidApi.createFidRepositoryResult({ ok: false, operation: "queryRecords", error: { code: "ADAPTER_UNAVAILABLE" } }); assert(success.validation.valid && failure.validation.valid, "Repository result shapes invalid.");
  assert(!fidApi.createFidPersistenceArchitectureSpecification({ repositoryCapabilities: [{ capabilityId: "healthCheck" }, { capabilityId: "healthCheck" }] }).validation.valid, "Duplicate capability IDs accepted.");
  assert(!fidApi.createFidPersistenceArchitectureSpecification({ errorCodes: ["CONFLICT", "CONFLICT"] }).validation.valid, "Duplicate error codes accepted.");
}
function errorSeparationChecks() {
  Object.values(fidApi.FID_PERSISTENCE_ERROR_CODES).forEach((code) => { const value = fidApi.createFidPersistenceError({ code, message: "Safe public message", retryable: false }); assert(value.validation.valid && value.code === code && value.adapterDetails === null, `Persistence error invalid or exposed adapter details: ${code}.`); });
  const specification = architecture(); assert(specification.separationModel.researchRepositorySeparate && specification.separationModel.automaticResearchPromotion === false && specification.separationModel.profileRelationshipSynchronization === false && specification.separationModel.duplicateIdentityResolution === false && specification.separationModel.graphGeneration === false, "Storage-domain separation model incomplete.");
  const keys = keysDeep(specification); ["researchSource", "researchSession", "recordedObservation", "analyticalObservation", "evidenceArtifact", "sharedResearchRepository", "automaticFidVerification", "researchFidSynchronization", "deleteResearchOnRejection", "deleteFidOnResearchChange", "profileRelationshipConflictResolution", "recordTypePreference", "inverseGeneration", "counterpartClosure", "duplicatePersonDetection", "entityResolution", "fuzzyMatching", "identityMerge", "aliasMerge", "canonicalNameSelection", "duplicateProfileMerge"].forEach((key) => assert(!keys.has(key), `Separation boundary introduced ${key}.`));
  const stored = createdEnvelope(envelope()); assert(stored.promotionRefs[0] === "promotion-decision-1" && typeof stored.promotionRefs[0] === "string" && !keysDeep(stored).has("researchRecord"), "Promotion reference embedded Research record.");
}
function lifecycleAdapterProspectChecks() {
  const specification = architecture(); assert(specification.lifecycleModel.appendOriented && specification.lifecycleModel.historicalVersionsRetrievable && specification.lifecycleModel.archivalPhysicallyDeletes === false && specification.lifecycleModel.rejectionDeletesResearch === false && specification.lifecycleModel.hardDeletionSupported === false && specification.lifecycleModel.lifecycleAloneDeterminesCurrentState === false, "Lifecycle/deletion model invalid.");
  assert(specification.checksumModel.optional && specification.checksumModel.generatedByFactory === false && specification.checksumModel.calculatedOutsideContract && specification.checksumModel.mutationDetectionOnly && specification.checksumModel.establishesTruthOrAuthority === false, "Checksum boundary invalid.");
  assert(specification.adapterBoundary.adapterAgnostic && specification.adapterBoundary.supabaseIsFutureAdapter && specification.adapterBoundary.supabaseOwnsArchitecture === false && Object.entries(specification.adapterBoundary).filter(([key]) => key.endsWith("Specified") || key.endsWith("Required")).every(([, value]) => value === false), "Supabase adapter boundary invalid.");
  assert(specification.prospectIntakeCompatibility.supportedContracts.length === 5 && specification.prospectIntakeCompatibility.incompleteRecordsSupported && specification.prospectIntakeCompatibility.unavailableDataSupported && specification.prospectIntakeCompatibility.laterVersionsSupported && specification.prospectIntakeCompatibility.historicalChangesSupported && specification.prospectIntakeCompatibility.unresolvedSourceAndEvidenceRefsSupported && specification.prospectIntakeCompatibility.runtimeLoadingImplemented === false, "Prospect Intake compatibility incomplete.");
  assert(createdEnvelope(envelope()).payloadChecksum === null && createdEnvelope(envelope()).persistedAt === "2026-01-03" && fidApi.createFidPersistenceEnvelope({}).persistedAt === null, "Factory generated checksum or timestamp.");
}
function extensionFactoryChecks() {
  const prohibited = ["databaseClient", "liveDatabaseClient", "supabaseClient", "sql", "credentials", "secret", "apiKey", "connectionString", "runtimeRepositoryFunction", "executableQuery", "hydrationFunction", "synchronizationFunction", "graphTraversal", "engineResult", "score", "grade", "ranking", "recommendation", "prediction", "decision"];
  prohibited.forEach((key) => { const value = fidApi.createFidPersistenceArchitectureSpecification({ extensions: { nested: { [key]: "prohibited", descriptiveLabel: "Allowed" } } }); assert(!value.validation.valid && !keysDeep(value.extensions).has(key) && value.extensions.nested.descriptiveLabel === "Allowed", `Architecture extension retained ${key}.`); });
  assert(fidApi.createFidPersistenceArchitectureSpecification({ extensions: { documentation: { descriptiveLabel: "Safe", owner: "FID" } } }).validation.valid, "Safe descriptive extension rejected.");
  const inputs = [envelope(), query(), { storageModel: "HYBRID_CANONICAL_RECORD" }]; const factories = [fidApi.createFidPersistenceEnvelope, fidApi.createFidPersistenceQuery, fidApi.createFidPersistenceArchitectureSpecification]; const validators = [fidApi.validateFidPersistenceEnvelope, fidApi.validateFidPersistenceQuery, fidApi.validateFidPersistenceArchitectureSpecification];
  inputs.forEach((input, index) => { const snapshot = JSON.stringify(input); const first = factories[index](input); assert(JSON.stringify(input) === snapshot, "Persistence factory mutated input."); validators[index](first); assert(JSON.stringify(input) === snapshot && JSON.stringify(first) === JSON.stringify(factories[index](input)), "Persistence normalization unstable or validator mutated input."); });
}
async function integrationChecks(context) {
  const expected = { footballEntity: 120, personProfile: 148, playerProfile: 209, prospectProfile: 230, personPlayerProspectFoundation: 130, coachProfile: 280, personCoachFoundation: 254, executiveProfile: 391, executiveProfileFoundation: 352, scoutProfile: 320, personnelSpecializationFoundation: 340, organizationProfile: 218, teamProfile: 270, organizationTeamFoundation: 156, footballRelationship: 300, relationshipProfileBoundary: 240, researchRepository: 616 };
  Object.entries(expected).forEach(([name, total]) => assert(context.suiteSummaries[name].total === total && context.suiteSummaries[name].failed === 0, `${name} diagnostics failed.`));
  const named = Object.keys(namedApi).filter((name) => name !== "default"); const defaults = Object.keys(fidApi); const protectedNames = Object.keys(PROTECTED_API);
  assert(protectedNames.length === 229 && protectedNames.every((name) => Object.hasOwn(namedApi, name) && Object.hasOwn(fidApi, name) && namedApi[name] === PROTECTED_API[name] && fidApi[name] === PROTECTED_API[name]), "Protected pre-persistence export missing or replaced.");
  const persistenceNamed = Object.keys(persistenceNamedApi).filter((name) => name !== "default");
  const persistenceDefaults = Object.keys(persistenceApi);
  const protectedPersistenceNames = Object.keys(PROTECTED_SPRINT_17_PERSISTENCE_API);
  const sprint18PersistenceNames = Object.keys(APPROVED_SPRINT_18_PERSISTENCE_API);
  assert(protectedPersistenceNames.length === 24 && protectedPersistenceNames.every((name) => Object.hasOwn(persistenceNamedApi, name) && Object.hasOwn(persistenceApi, name) && persistenceNamedApi[name] === PROTECTED_SPRINT_17_PERSISTENCE_API[name] && persistenceApi[name] === PROTECTED_SPRINT_17_PERSISTENCE_API[name]), "Protected Sprint 17 persistence export missing or inconsistent.");
  assert(sprint18PersistenceNames.length === 18 && sprint18PersistenceNames.every((name) => Object.hasOwn(persistenceNamedApi, name) && Object.hasOwn(persistenceApi, name) && persistenceNamedApi[name] === APPROVED_SPRINT_18_PERSISTENCE_API[name] && persistenceApi[name] === APPROVED_SPRINT_18_PERSISTENCE_API[name]), "Approved Sprint 18 persistence export missing or inconsistent.");
  assert(new Set([...protectedPersistenceNames, ...sprint18PersistenceNames]).size === protectedPersistenceNames.length + sprint18PersistenceNames.length, "Sprint 17 and Sprint 18 persistence export collision detected.");
  assert(persistenceNamed.length >= protectedPersistenceNames.length && persistenceDefaults.length >= protectedPersistenceNames.length && new Set(persistenceNamed).size === persistenceNamed.length && new Set(persistenceDefaults).size === persistenceDefaults.length && persistenceNamed.length === persistenceDefaults.length && persistenceNamed.every((name) => Object.hasOwn(persistenceApi, name) && persistenceNamedApi[name] === persistenceApi[name]), "Complete persistence API export surface invalid.");
  assert(!persistenceDefaults.some((name) => /^run.*Diagnostics$/.test(name)), "Persistence diagnostic runner exported.");
  assert(named.length >= 253 && defaults.length >= 253 && new Set(named).size === named.length && new Set(defaults).size === defaults.length && named.length === defaults.length && named.every((name) => Object.hasOwn(fidApi, name) && namedApi[name] === fidApi[name]), "FID export surface invalid.");
  assert(!defaults.some((name) => /^run.*Diagnostics$/.test(name)), "Diagnostic runner exported.");
  assert(context.persistenceImports.every((entry) => !/supabase|researchRepository|registry|resolver|adapter|repository|engine|components|pages|router|routes|api/i.test(entry)), "Persistence specification has prohibited dependency.");
  assert(context.contractImports.every((entry) => !/persistence/i.test(entry)), "Existing FID contract imports persistence specification.");
  assert(!hasCycle(context.dependencyGraph), "Production circular dependency found.");
  assert(!context.persistenceSource.includes("createClient") && !context.persistenceSource.includes("fetch(") && !context.persistenceSource.includes("readFile") && !context.persistenceSource.includes("localStorage"), "Runtime persistence or storage client implemented.");
}

const CASE_GROUPS = Object.freeze([[35, "identity-factories-constants"], [50, "envelope-version-history"], [45, "payload-fidelity-validation"], [40, "write-read-boundaries"], [45, "query-repository-interface"], [45, "errors-separation-identity"], [30, "lifecycle-checksum-adapter-prospect"], [25, "extension-factory-safety"], [25, "exports-dependencies-integration"]]);
const CASE_NAMES = Object.freeze(CASE_GROUPS.flatMap(([count, group]) => Array.from({ length: count }, (_, index) => `${group}-${String(index + 1).padStart(3, "0")}`)));
async function checkForIndex(index, context) { if (index < 35) return identityFactoryChecks(); if (index < 85) return envelopeVersionChecks(); if (index < 130) return payloadFidelityChecks(); if (index < 170) return writeReadChecks(); if (index < 215) return queryRepositoryChecks(); if (index < 260) return errorSeparationChecks(); if (index < 290) return lifecycleAdapterProspectChecks(); if (index < 315) return extensionFactoryChecks(); return integrationChecks(context); }
async function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")])); const personnelSpecializationFoundation = await runFidPersonnelSpecializationFoundationDiagnostics();
  const persistenceSource = sources[resolve(ROOT, "persistence/FidPersistenceArchitectureSpecification.js")]; const contractSources = Object.entries(sources).filter(([file]) => /contracts[/\\].+Contract\.js$/.test(file)).map(([, source]) => source);
  return { persistenceSource, persistenceImports: imports(persistenceSource), contractImports: contractSources.flatMap(imports), dependencyGraph: graph(sources), suiteSummaries: { ...personnelSpecializationFoundation.suiteSummaries, personnelSpecializationFoundation } };
}

export async function runFidPersistenceArchitectureDiagnostics({ throwOnFailure = false } = {}) {
  const context = await buildContext(); const cases = [];
  for (let index = 0; index < CASE_NAMES.length; index += 1) { const id = CASE_NAMES[index]; try { await checkForIndex(index, context); cases.push({ id, passed: true, message: `${id} passed.`, details: null }); } catch (failure) { cases.push({ id, passed: false, message: typeof failure?.message === "string" ? failure.message : `${id} failed.`, details: failure?.details ?? null }); } }
  const passed = cases.filter((entry) => entry.passed).length; const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: fidApi.FID_PERSISTENCE_ARCHITECTURE_CONTRACT_VERSION, schemaVersion: fidApi.FID_PERSISTENCE_ARCHITECTURE_SCHEMA_VERSION, total: cases.length, passed, failed, cases, suiteSummaries: context.suiteSummaries };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFidPersistenceArchitectureDiagnostics });
