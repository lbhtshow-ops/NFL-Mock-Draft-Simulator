import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import footballEntityApi, * as namedApi from "../index.js";

const SUITE = "FootballEntityContractDiagnostics";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_FILES = [
  resolve(ROOT, "constants/footballEntityConstants.js"),
  resolve(ROOT, "contracts/FootballEntityContract.js"),
  resolve(ROOT, "index.js"),
];
const PUBLIC_EXPORTS = Object.freeze([
  "FOOTBALL_ENTITY_CONTRACT_NAME", "FOOTBALL_ENTITY_CONTRACT_VERSION", "FOOTBALL_ENTITY_SCHEMA_VERSION",
  "FOOTBALL_ENTITY_TYPES", "FOOTBALL_ENTITY_STATUSES", "FOOTBALL_ENTITY_VERIFICATION_STATES",
  "FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS", "FOOTBALL_ENTITY_ALIAS_TYPES",
  "FOOTBALL_ENTITY_EXTERNAL_IDENTIFIER_TYPES", "FOOTBALL_ENTITY_REFERENCE_TYPES",
  "createFootballEntity", "createUnavailableFootballEntity", "validateFootballEntity", "isFootballEntity",
  "isVerifiedFootballEntity", "isActiveFootballEntity", "isMergedFootballEntity",
  "isDisputedFootballEntity", "getFootballEntityCanonicalName",
]);

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function hasCode(value, code, field = "errors") {
  return (value?.validation?.[field] || value?.[field] || []).some((entry) => entry.code === code);
}

function base(overrides = {}) {
  return {
    entityId: "entity-1",
    entityType: footballEntityApi.FOOTBALL_ENTITY_TYPES.PERSON,
    status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.CANDIDATE,
    identity: { canonicalName: "Canonical Entity" },
    verification: {
      state: footballEntityApi.FOOTBALL_ENTITY_VERIFICATION_STATES.UNVERIFIED,
      identityConfidence: footballEntityApi.FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS.UNSPECIFIED,
    },
    ...overrides,
  };
}

function verified(overrides = {}) {
  return base({
    status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.ACTIVE,
    verification: {
      state: footballEntityApi.FOOTBALL_ENTITY_VERIFICATION_STATES.VERIFIED,
      identityConfidence: footballEntityApi.FOOTBALL_ENTITY_IDENTITY_CONFIDENCE_LEVELS.VERY_HIGH,
      verifiedBy: "reviewer-1",
      verifiedAt: "2026-07-14",
    },
    ...overrides,
  });
}

function created(input) {
  return footballEntityApi.createFootballEntity(input);
}

function withReference(field, value) {
  return created(base({ references: { [field]: value } }));
}

function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => {
    keys.add(key);
    keysDeep(entry, keys);
  });
  return keys;
}

function imports(source) {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function dependencyGraph(sources) {
  const files = new Set(PRODUCTION_FILES);
  return Object.fromEntries(PRODUCTION_FILES.map((file) => [file,
    imports(sources[file]).filter((entry) => entry.startsWith("."))
      .map((entry) => resolve(dirname(file), entry)).filter((entry) => files.has(entry))]));
}

function hasCycle(graph) {
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    if ((graph[node] || []).some(visit)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return Object.keys(graph).some(visit);
}

const CASES = [
  ["fully-valid-verified-entity", () => assert(footballEntityApi.isVerifiedFootballEntity(created(verified())), "Verified entity invalid.")],
  ["valid-minimal-candidate", () => assert(created(base()).validation.valid, "Minimal candidate invalid.")],
  ["valid-active-unverified-warning", () => { const value = created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.ACTIVE })); assert(value.validation.valid && hasCode(value, "ACTIVE_IDENTITY_UNVERIFIED", "warnings"), "Active warning missing."); }],
  ["valid-inactive", () => assert(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.INACTIVE })).validation.valid, "Inactive invalid.")],
  ["valid-historical", () => assert(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.HISTORICAL })).validation.valid, "Historical invalid.")],
  ["valid-merged", () => assert(footballEntityApi.isMergedFootballEntity(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.MERGED, versioning: { mergedIntoEntityRef: "entity-2" } }))), "Merged invalid.")],
  ["valid-retired", () => assert(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.RETIRED })).validation.valid, "Retired invalid.")],
  ["valid-restricted", () => assert(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.RESTRICTED })).validation.valid, "Restricted invalid.")],
  ["valid-rejected", () => assert(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.REJECTED })).validation.valid, "Rejected invalid.")],
  ["valid-archived", () => assert(created(base({ status: footballEntityApi.FOOTBALL_ENTITY_STATUSES.ARCHIVED, provenance: { updatedAt: "2026-07-14" } })).validation.valid, "Archived invalid.")],
  ["every-entity-type", () => assert(Object.values(footballEntityApi.FOOTBALL_ENTITY_TYPES).every((entityType) => created(base({ entityType })).validation.valid), "Recognized entity type rejected.")],
  ["unknown-entity-type", () => assert(hasCode(created(base({ entityType: "BAD" })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown entity type accepted.")],
  ["unknown-lifecycle-status", () => assert(hasCode(created(base({ status: "BAD" })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown status accepted.")],
  ["unknown-verification-state", () => assert(hasCode(created(base({ verification: { state: "BAD", identityConfidence: "HIGH" } })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown verification accepted.")],
  ["unknown-identity-confidence", () => assert(hasCode(created(base({ verification: { state: "UNVERIFIED", identityConfidence: "BAD" } })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown confidence accepted.")],
  ["unknown-alias-type", () => assert(hasCode(created(base({ aliases: [{ alias: "Name", aliasType: "BAD" }] })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown alias type accepted.")],
  ["unknown-external-id-type", () => assert(hasCode(created(base({ externalIdentifiers: [{ identifierType: "BAD", provider: "Provider", value: "1" }] })), "UNRECOGNIZED_ENUM_VALUE"), "Unknown identifier type accepted.")],
  ["missing-entity-id", () => assert(!created(base({ entityId: null })).validation.valid, "Missing ID accepted.")],
  ["entity-id-not-generated", () => assert(created(base({ entityId: null })).entityId === null, "ID generated.")],
  ["missing-canonical-name", () => assert(!created(base({ identity: {} })).validation.valid, "Missing canonical name accepted.")],
  ["canonical-name-not-inferred", () => { const value = created(base({ identity: { displayName: "Display" } })); assert(value.identity.canonicalName === null, "Canonical name inferred."); }],
  ["display-name-not-inferred", () => assert(created(base()).identity.displayName === null, "Display name inferred.")],
  ["entity-type-not-inferred", () => assert(created(base({ entityType: null })).entityType === null, "Entity type inferred.")],
  ["valid-alias", () => assert(created(base({ aliases: [{ alias: "Alternate", aliasType: footballEntityApi.FOOTBALL_ENTITY_ALIAS_TYPES.ALTERNATE_SPELLING }] })).validation.valid, "Valid alias rejected.")],
  ["multiple-alias-types-preserved", () => { const value = created(base({ aliases: [{ alias: "Name", aliasType: "FULL_NAME" }, { alias: "Name", aliasType: "DISPLAY_NAME" }] })); assert(value.aliases.length === 2, "Distinct alias types collapsed."); }],
  ["duplicate-alias-normalization", () => { const alias = { alias: "Name", aliasType: "FULL_NAME" }; const value = created(base({ aliases: [alias, { ...alias }] })); assert(value.aliases.length === 1 && hasCode(value, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Duplicate alias not normalized."); }],
  ["invalid-alias-structure", () => assert(!created(base({ aliases: ["Name"] })).validation.valid, "Invalid alias accepted.")],
  ["alias-missing-value", () => assert(!created(base({ aliases: [{ aliasType: "FULL_NAME" }] })).validation.valid, "Alias value not required.")],
  ["alias-unknown-type", () => assert(!created(base({ aliases: [{ alias: "Name", aliasType: "UNKNOWN_TYPE" }] })).validation.valid, "Alias type not required.")],
  ["alias-date-ordering", () => assert(hasCode(created(base({ aliases: [{ alias: "Old", aliasType: "FORMER_NAME", validFrom: "2026-02-01", validTo: "2025-02-01" }] })), "INVALID_DATE_ORDER"), "Alias date order accepted.")],
  ["alias-does-not-change-canonical", () => assert(created(base({ aliases: [{ alias: "Other", aliasType: "DISPLAY_NAME" }] })).identity.canonicalName === "Canonical Entity", "Alias changed canonical name.")],
  ["valid-external-identifier", () => assert(created(base({ externalIdentifiers: [{ identifierType: "OFFICIAL", provider: "Provider", value: "abc" }] })).validation.valid, "Valid external ID rejected.")],
  ["duplicate-external-id-normalization", () => { const identifier = { identifierType: "OFFICIAL", provider: "Provider", value: "abc" }; const value = created(base({ externalIdentifiers: [identifier, { ...identifier }] })); assert(value.externalIdentifiers.length === 1, "Duplicate external ID not normalized."); }],
  ["invalid-external-id-structure", () => assert(!created(base({ externalIdentifiers: [7] })).validation.valid, "Invalid external ID accepted.")],
  ["external-id-missing-provider", () => assert(!created(base({ externalIdentifiers: [{ identifierType: "OFFICIAL", value: "abc" }] })).validation.valid, "Provider not required.")],
  ["external-id-missing-value", () => assert(!created(base({ externalIdentifiers: [{ identifierType: "OFFICIAL", provider: "Provider" }] })).validation.valid, "Value not required.")],
  ["external-id-unknown-type", () => assert(!created(base({ externalIdentifiers: [{ identifierType: "BAD", provider: "Provider", value: "abc" }] })).validation.valid, "Identifier type not required.")],
  ["external-id-not-canonical-id", () => { const value = created(base({ externalIdentifiers: [{ identifierType: "OFFICIAL", provider: "Provider", value: "external" }] })); assert(value.entityId === "entity-1", "External ID replaced canonical ID."); }],
  ["external-id-no-network", () => { let calls = 0; const value = created(base({ externalIdentifiers: [{ identifierType: "OFFICIAL", provider: "https://invalid.example", value: "abc", contact: () => { calls += 1; } }] })); assert(value.validation.valid && calls === 0, "External provider contacted."); }],
  ["valid-references", () => assert(withReference("researchSourceRefs", ["source-1"]).validation.valid, "Valid references rejected.")],
  ["invalid-research-source-ref", () => assert(!withReference("researchSourceRefs", [{}]).validation.valid, "Invalid source ref accepted.")],
  ["invalid-research-session-ref", () => assert(!withReference("researchSessionRefs", [7]).validation.valid, "Invalid session ref accepted.")],
  ["invalid-recorded-observation-ref", () => assert(!withReference("recordedObservationRefs", [null]).validation.valid, "Invalid recorded ref accepted.")],
  ["invalid-analytical-observation-ref", () => assert(!withReference("analyticalObservationRefs", [{ id: "a" }]).validation.valid, "Invalid analytical ref accepted.")],
  ["invalid-evidence-artifact-ref", () => assert(!withReference("evidenceArtifactRefs", [""]).validation.valid, "Invalid evidence ref accepted.")],
  ["invalid-relationship-ref", () => assert(!withReference("relationshipRefs", [{ relationshipId: "r" }]).validation.valid, "Embedded relationship accepted.")],
  ["duplicate-reference-normalization", () => { const value = withReference("researchSourceRefs", ["a", "a", "b"]); assert(value.references.researchSourceRefs.join(",") === "a,b", "Duplicate references not normalized."); }],
  ["references-unresolved", () => assert(withReference("otherRefs", ["missing-external"]).references.otherRefs[0] === "missing-external", "Reference resolved.")],
  ["references-never-hydrated", () => assert(typeof withReference("relationshipRefs", ["relationship-1"]).references.relationshipRefs[0] === "string", "Reference hydrated.")],
  ["evidence-does-not-verify", () => { const value = withReference("evidenceArtifactRefs", ["evidence-1"]); assert(value.verification.state === "UNVERIFIED", "Evidence implied verification."); }],
  ["verification-does-not-verify-evidence", () => { const value = created(verified({ references: { evidenceArtifactRefs: ["unverified-evidence"] } })); assert(value.references.evidenceArtifactRefs[0] === "unverified-evidence", "Evidence verification inferred."); }],
  ["verified-requires-verifier", () => assert(hasCode(created(verified({ verification: { state: "VERIFIED", identityConfidence: "HIGH", verifiedAt: "2026-07-14" } })), "VERIFIER_REQUIRED"), "Verifier not required.")],
  ["verified-requires-date", () => assert(hasCode(created(verified({ verification: { state: "VERIFIED", identityConfidence: "HIGH", verifiedBy: "reviewer" } })), "VERIFICATION_DATE_REQUIRED"), "Date not required.")],
  ["verified-limitations-required", () => assert(hasCode(created(verified({ verification: { state: "VERIFIED_WITH_LIMITATIONS", identityConfidence: "HIGH", verifiedBy: "reviewer", verifiedAt: "2026-07-14" } })), "VERIFICATION_LIMITATION_REQUIRED"), "Limitation not required.")],
  ["disputed-context-required", () => assert(hasCode(created(base({ verification: { state: "DISPUTED", identityConfidence: "LOW" } })), "DISPUTE_CONTEXT_REQUIRED"), "Dispute context not required.")],
  ["rejected-verification-valid", () => assert(created(base({ verification: { state: "REJECTED", identityConfidence: "LOW" } })).validation.valid, "Rejected verification invalid.")],
  ["active-not-verified", () => { const value = created(base({ status: "ACTIVE" })); assert(footballEntityApi.isActiveFootballEntity(value) && !footballEntityApi.isVerifiedFootballEntity(value), "ACTIVE implied verified."); }],
  ["verified-not-active", () => { const value = created(verified({ status: "INACTIVE" })); assert(footballEntityApi.isVerifiedFootballEntity(value) && !footballEntityApi.isActiveFootballEntity(value), "Verification implied ACTIVE."); }],
  ["valid-provenance", () => assert(created(base({ provenance: { createdBy: "creator", createdAt: "2026-07-14", originSystem: "system" } })).validation.valid, "Valid provenance rejected.")],
  ["invalid-provenance", () => assert(!created(base({ provenance: [] })).validation.valid, "Invalid provenance accepted.")],
  ["dates-not-generated", () => { const value = created(base()); assert(value.provenance.createdAt === null && value.provenance.updatedAt === null && value.verification.verifiedAt === null, "Date generated."); }],
  ["valid-versioning", () => assert(created(base({ versioning: { entityVersion: "v1", supersedesEntityRef: "entity-old" } })).validation.valid, "Valid versioning rejected.")],
  ["entity-version-not-generated", () => assert(created(base()).versioning.entityVersion === null, "Version generated.")],
  ["entity-version-not-incremented", () => assert(created(base({ versioning: { entityVersion: 7 } })).versioning.entityVersion === 7, "Version incremented.")],
  ["supersedes-self-rejected", () => assert(hasCode(created(base({ versioning: { supersedesEntityRef: "entity-1" } })), "SELF_REFERENCE"), "Supersedes self accepted.")],
  ["superseded-by-self-rejected", () => assert(hasCode(created(base({ versioning: { supersededByEntityRef: "entity-1" } })), "SELF_REFERENCE"), "SupersededBy self accepted.")],
  ["merged-into-self-rejected", () => assert(hasCode(created(base({ versioning: { mergedIntoEntityRef: "entity-1" } })), "SELF_REFERENCE"), "MergedInto self accepted.")],
  ["same-supersedes-superseded-by-rejected", () => assert(hasCode(created(base({ versioning: { supersedesEntityRef: "entity-2", supersededByEntityRef: "entity-2" } })), "CONFLICTING_VERSION_REFERENCES"), "Conflicting version refs accepted.")],
  ["merged-requires-destination", () => assert(hasCode(created(base({ status: "MERGED" })), "MERGED_DESTINATION_REQUIRED"), "Merged destination not required.")],
  ["merged-remains-preserved", () => { const value = created(base({ status: "MERGED", versioning: { mergedIntoEntityRef: "entity-2" } })); assert(value.entityId === "entity-1" && value.status === "MERGED", "Merged record not preserved."); }],
  ["archived-requirement", () => assert(hasCode(created(base({ status: "ARCHIVED" })), "ARCHIVE_CONTEXT_REQUIRED"), "Archive context not required.")],
  ["lifecycle-not-inferred", () => assert(created(base()).status === "CANDIDATE", "Lifecycle transition inferred.")],
  ["valid-metadata", () => assert(created(base({ metadata: { tags: ["identity"], domains: ["football"], visibility: "internal", restrictions: "none" } })).validation.valid, "Valid metadata rejected.")],
  ["duplicate-tags-domains", () => { const value = created(base({ metadata: { tags: ["a", "a"], domains: ["b", "b"] } })); assert(value.metadata.tags.length === 1 && value.metadata.domains.length === 1, "Metadata duplicates retained."); }],
  ["visibility-not-inferred", () => assert(created(base()).metadata.visibility === null, "Visibility inferred.")],
  ["restrictions-not-inferred", () => assert(created(base()).metadata.restrictions === null, "Restrictions inferred.")],
  ["no-player-profile-fields", () => assert(!keysDeep(created(base())).has("playerProfile"), "Player profile field found.")],
  ["no-team-profile-fields", () => assert(!keysDeep(created(base())).has("teamProfile"), "Team profile field found.")],
  ["no-coach-profile-fields", () => assert(!keysDeep(created(base())).has("coachProfile"), "Coach profile field found.")],
  ["no-executive-profile-fields", () => assert(!keysDeep(created(base())).has("executiveProfile"), "Executive profile field found.")],
  ["no-statistics-fields", () => assert(!keysDeep(created(base())).has("statistics"), "Statistics field found.")],
  ["no-measurement-fields", () => assert(!keysDeep(created(base())).has("measurements"), "Measurements field found.")],
  ["no-trait-fields", () => assert(!keysDeep(created(base())).has("traits"), "Traits field found.")],
  ["no-component-fields", () => assert(!keysDeep(created(base())).has("components"), "Components field found.")],
  ["no-score-fields", () => assert(!keysDeep(created(base())).has("score"), "Score field found.")],
  ["no-grade-fields", () => assert(!keysDeep(created(base())).has("grade"), "Grade field found.")],
  ["no-ranking-fields", () => assert(!keysDeep(created(base())).has("ranking"), "Ranking field found.")],
  ["no-projection-fields", () => assert(!keysDeep(created(base())).has("projection"), "Projection field found.")],
  ["no-recommendation-fields", () => assert(!keysDeep(created(base())).has("recommendation"), "Recommendation field found.")],
  ["no-evaluation-result-fields", () => assert(!keysDeep(created(base())).has("evaluationResult"), "Evaluation result field found.")],
  ["no-embedded-research-source", () => assert(!withReference("researchSourceRefs", [{ sourceId: "s" }]).validation.valid, "Research Source embedded.")],
  ["no-embedded-research-session", () => assert(!withReference("researchSessionRefs", [{ sessionId: "s" }]).validation.valid, "Research Session embedded.")],
  ["no-embedded-recorded-observation", () => assert(!withReference("recordedObservationRefs", [{ observationId: "o" }]).validation.valid, "Recorded Observation embedded.")],
  ["no-embedded-analytical-observation", () => assert(!withReference("analyticalObservationRefs", [{ analysisId: "a" }]).validation.valid, "Analytical Observation embedded.")],
  ["no-embedded-evidence-artifact", () => assert(!withReference("evidenceArtifactRefs", [{ evidenceId: "e" }]).validation.valid, "Evidence Artifact embedded.")],
  ["no-embedded-relationship", () => assert(!withReference("relationshipRefs", [{ relationshipId: "r" }]).validation.valid, "Relationship embedded.")],
  ["factory-no-mutation", () => { const input = base({ aliases: [{ alias: "Name", aliasType: "FULL_NAME" }] }); const before = JSON.stringify(input); created(input); assert(JSON.stringify(input) === before, "Factory mutated input."); }],
  ["validator-no-mutation", () => { const input = created(base()); const before = JSON.stringify(input); footballEntityApi.validateFootballEntity(input); assert(JSON.stringify(input) === before, "Validator mutated input."); }],
  ["stable-normalization", () => assert(JSON.stringify(created(base())) === JSON.stringify(created(base())), "Normalization unstable.")],
  ["null-input-safe", () => assert(created(null).validation.valid === false, "Null input threw or passed.")],
  ["array-input-safe", () => assert(created([]).validation.valid === false, "Array input threw or passed.")],
  ["primitive-input-safe", () => assert(created(7).validation.valid === false, "Primitive input threw or passed.")],
  ["validation-shape", () => { const value = created(base()).validation; assert(["valid", "errors", "warnings", "checkedAt", "contractVersion", "schemaVersion"].every((key) => Object.hasOwn(value, key)), "Validation shape incomplete."); }],
  ["guards-return-booleans", () => { const value = created(base()); assert([footballEntityApi.isFootballEntity, footballEntityApi.isVerifiedFootballEntity, footballEntityApi.isActiveFootballEntity, footballEntityApi.isMergedFootballEntity, footballEntityApi.isDisputedFootballEntity].every((guard) => typeof guard(value) === "boolean"), "Guard result not boolean."); }],
  ["canonical-name-helper", () => assert(footballEntityApi.getFootballEntityCanonicalName(created(base())) === "Canonical Entity" && footballEntityApi.getFootballEntityCanonicalName({}) === null, "Canonical helper failed.")],
  ["unavailable-complete-shape", () => { const value = footballEntityApi.createUnavailableFootballEntity(); assert(["contract", "contractVersion", "schemaVersion", "entityId", "entityType", "status", "identity", "aliases", "externalIdentifiers", "references", "verification", "provenance", "versioning", "metadata", "validation"].every((key) => Object.hasOwn(value, key)), "Unavailable shape incomplete."); }],
  ["unavailable-preserves-identity", () => { const value = footballEntityApi.createUnavailableFootballEntity({ entityId: "e", entityType: "TEAM", identity: { canonicalName: "Name", displayName: "Display" }, reason: "Unavailable" }); assert(value.entityId === "e" && value.entityType === "TEAM" && value.identity.canonicalName === "Name" && value.identity.displayName === "Display" && value.metadata.notes === "Unavailable", "Unavailable identity not preserved."); }],
  ["unavailable-invents-nothing", () => { const value = footballEntityApi.createUnavailableFootballEntity(); assert(value.aliases.length === 0 && value.externalIdentifiers.length === 0 && Object.values(value.references).every((refs) => refs.length === 0) && value.provenance.createdAt === null && value.versioning.entityVersion === null, "Unavailable factory invented data."); }],
  ["public-named-exports", () => assert(PUBLIC_EXPORTS.every((name) => Object.hasOwn(namedApi, name)), "Named exports incomplete.")],
  ["default-export-surface", () => assert(PUBLIC_EXPORTS.every((name) => footballEntityApi[name] === namedApi[name]), "Default exports incomplete.")],
  ["no-export-collisions", () => {
    const named = Object.keys(namedApi).filter((name) => name !== "default");
    const defaults = Object.keys(footballEntityApi);
    const missing = PUBLIC_EXPORTS.filter(
      (name) => !Object.hasOwn(namedApi, name) || !Object.hasOwn(footballEntityApi, name)
    );
    const disagreements = PUBLIC_EXPORTS.filter(
      (name) => namedApi[name] !== footballEntityApi[name]
    );
    assert(
      named.length === new Set(named).size &&
        defaults.length === new Set(defaults).size &&
        PUBLIC_EXPORTS.length === new Set(PUBLIC_EXPORTS).size &&
        missing.length === 0 &&
        disagreements.length === 0,
      "Export collision, missing original export, or named/default disagreement found.",
      { missing, disagreements }
    );
  }],
  ["runner-excluded-production", () => assert(!Object.hasOwn(footballEntityApi, "runFootballEntityContractDiagnostics"), "Runner exported.")],
  ["no-research-repository-modification", ({ source }) => assert(!/researchRepository/i.test(source), "Research Repository coupled or modified.")],
  ["no-persistence-dependency", ({ contractSource, productionImports, source }) => {
    const approvedArchitectureImports = new Set([
      "./persistence/index.js",
      "../persistence/index.js",
      "./persistence/FidPersistenceArchitectureSpecification.js",
      "../persistence/FidPersistenceArchitectureSpecification.js",
      "./persistence/FidPersistenceRepositoryContract.js",
      "../persistence/FidPersistenceRepositoryContract.js",
      "./persistence/InMemoryFidPersistenceRepository.js",
      "../persistence/InMemoryFidPersistenceRepository.js",
    ]);
    const persistenceImports = productionImports.filter((entry) => /persistence/i.test(entry));
    const prohibitedRuntime = /(?:Supabase|Database|Sql|Network|FileSystem|BrowserStorage|LocalStorage|IndexedDb)FidPersistenceRepository|PersistenceService|PersistenceManager|PersistenceAdapter|SupabaseAdapter|DatabaseAdapter|StorageClient|DatabaseClient|createClient|sql\s+(?:runtime|migration)|migration\s+runtime|persistence\s+hydration|persistence\s+synchronization|runtime\s+persistence\s+integration|application\s+persistence\s+singleton/i;
    const prohibitedContractDependency = /FidPersistenceArchitectureSpecification|FidPersistenceRepositoryContract|InMemoryFidPersistenceRepository|persistence[/\\](?:index|repository|adapter|service|manager|client)|repository|adapter|supabase|\bsql\b|migrations?|storage\s+runtime|filesystem\s+storage|browser\s+storage|hydration|synchronization|registry|resolver|runtime\s+persistence\s+integration/i;
    assert(
      !prohibitedContractDependency.test(contractSource) &&
        persistenceImports.every((entry) => approvedArchitectureImports.has(entry)) &&
        !prohibitedRuntime.test(source),
      "Football Entity persistence boundary violated."
    );
  }],
  ["no-supabase-dependency", ({ source }) => assert(!/supabase/i.test(source), "Supabase dependency found.")],
  ["no-engine-dependency", ({ source }) => assert(!/engines/i.test(source), "Engine dependency found.")],
  ["no-ui-dependency", ({ source }) => assert(!/components|pages/i.test(source), "UI dependency found.")],
  ["no-routing-dependency", ({ source }) => assert(!/router|routes/i.test(source), "Routing dependency found.")],
  ["no-circular-production-dependency", ({ graph }) => assert(!hasCycle(graph), "Circular dependency found.")],
  ["production-build-integrity", () => assert(PUBLIC_EXPORTS.every((name) => footballEntityApi[name] != null) && footballEntityApi.isFootballEntity(created(base())), "Production module integrity failed.")],
];

function buildContext() {
  const sources = Object.fromEntries(PRODUCTION_FILES.map((file) => [file, readFileSync(file, "utf8")]));
  return {
    source: Object.values(sources).join("\n"),
    contractSource: sources[resolve(ROOT, "contracts/FootballEntityContract.js")],
    productionImports: Object.values(sources).flatMap(imports),
    graph: dependencyGraph(sources),
  };
}

export function runFootballEntityContractDiagnostics({ throwOnFailure = false } = {}) {
  const context = buildContext();
  const cases = CASES.map(([id, execute]) => {
    try {
      execute(context);
      return { id, passed: true, message: `${id} passed.`, details: null };
    } catch (error) {
      return { id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null };
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: footballEntityApi.FOOTBALL_ENTITY_CONTRACT_VERSION,
    schemaVersion: footballEntityApi.FOOTBALL_ENTITY_SCHEMA_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runFootballEntityContractDiagnostics });
