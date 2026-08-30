import { CONTRACT_NAME, CONTRACT_VERSION, SCHEMA_VERSION, IDENTITY_CLASSIFICATION, LIFECYCLES, DRAFT_YEAR_STATUSES, MAX_REFS, MAX_EXTENSION_KEYS, MAX_EXTENSION_BYTES } from "./constants.js";

const REF_FIELDS = ["sourceRefs", "evidenceRefs", "eligibilityRefs", "declarationRefs", "supportingRecordRefs", "reviewRefs", "blockerRefs"];
const CANONICAL_FIELDS = new Set(["profileId", "entityRef", "playerProfileRef"]);
const SENSITIVE = /(password|secret|credential|token|apiKey|privateKey)/i;
const EXECUTABLE = /(function|callback|handler|script|executable|command)/i;
const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const freeze = (value, seen = new WeakSet()) => { if (!value || typeof value !== "object" || seen.has(value)) return value; seen.add(value); Object.values(value).forEach((item) => freeze(item, seen)); return Object.freeze(value); };
const entry = (code, path, message) => ({ code, path, message });

function inspectJson(value, path, errors, seen = new WeakSet()) {
  if (typeof value === "function") { errors.push(entry("EXECUTABLE_FIELD_PROHIBITED", path, "Executable values are prohibited.")); return; }
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) { errors.push(entry("CIRCULAR_VALUE_PROHIBITED", path, "Circular values are prohibited.")); return; }
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (SENSITIVE.test(key)) errors.push(entry("SENSITIVE_FIELD_PROHIBITED", childPath, "Sensitive fields are prohibited."));
    if (EXECUTABLE.test(key)) errors.push(entry("EXECUTABLE_FIELD_PROHIBITED", childPath, "Executable fields are prohibited."));
    inspectJson(child, childPath, errors, seen);
  }
  seen.delete(value);
}

function refs(value, field, errors) {
  if (!Array.isArray(value)) { errors.push(entry("INVALID_REFERENCE_ARRAY", field, `${field} must be an array.`)); return []; }
  if (value.length > MAX_REFS) errors.push(entry("REFERENCE_LIMIT_EXCEEDED", field, `${field} exceeds ${MAX_REFS} entries.`));
  const clean = value.map((item) => typeof item === "string" ? item.trim() : "");
  clean.forEach((item, index) => { if (!item) errors.push(entry("INVALID_REFERENCE", `${field}[${index}]`, "References must be non-empty strings.")); });
  if (new Set(clean).size !== clean.length) errors.push(entry("DUPLICATE_REFERENCE", field, `${field} contains duplicates.`));
  return clean.filter(Boolean);
}

export function createProspectProfilePreparationRecord(input = {}) {
  const errors = [];
  if (!isObject(input)) input = {};
  inspectJson(input, "", errors);
  for (const field of CANONICAL_FIELDS) if (Object.hasOwn(input, field)) errors.push(entry("CANONICAL_IDENTITY_PROHIBITED", field, `${field} cannot identify a preparation record.`));
  const required = (field) => { const value = typeof input[field] === "string" ? input[field].trim() : ""; if (!value) errors.push(entry("MISSING_REQUIRED_FIELD", field, `${field} is required.`)); return value || null; };
  if (Object.hasOwn(input, "contract") && input.contract !== CONTRACT_NAME) errors.push(entry("CONTRACT_MISMATCH", "contract", "Contract name does not match."));
  if (Object.hasOwn(input, "contractVersion") && input.contractVersion !== CONTRACT_VERSION) errors.push(entry("CONTRACT_VERSION_MISMATCH", "contractVersion", "Contract version does not match."));
  if (Object.hasOwn(input, "schemaVersion") && input.schemaVersion !== SCHEMA_VERSION) errors.push(entry("SCHEMA_VERSION_MISMATCH", "schemaVersion", "Schema version does not match."));
  const preparationRecordRef = required("preparationRecordRef");
  const intakeCandidateRef = required("intakeCandidateRef");
  if (preparationRecordRef && !preparationRecordRef.startsWith("preparation:")) errors.push(entry("INVALID_PREPARATION_IDENTITY", "preparationRecordRef", "Preparation identity must use the preparation: namespace and identifies this record, not a person."));
  if (input.identityClassification !== IDENTITY_CLASSIFICATION) errors.push(entry("INVALID_IDENTITY_CLASSIFICATION", "identityClassification", "Explicit non-canonical identity classification is required."));
  if (!Number.isInteger(input.expectedDraftYear) || input.expectedDraftYear < 1900 || input.expectedDraftYear > 2200) errors.push(entry("INVALID_DRAFT_YEAR", "expectedDraftYear", "Expected draft year must be a plausible integer."));
  if (!DRAFT_YEAR_STATUSES.includes(input.draftYearStatus)) errors.push(entry("INVALID_DRAFT_YEAR_STATUS", "draftYearStatus", "Draft-year status is invalid."));
  if (!LIFECYCLES.includes(input.lifecycle)) errors.push(entry("INVALID_LIFECYCLE", "lifecycle", "Preparation lifecycle is invalid."));
  const normalizedRefs = Object.fromEntries(REF_FIELDS.map((field) => [field, refs(input[field] ?? [], field, errors)]));
  const availability = { research: Boolean(input.availability?.research), intake: Boolean(input.availability?.intake), preparation: Boolean(input.availability?.preparation), review: Boolean(input.availability?.review), fixtureDraftRoom: Boolean(input.availability?.fixtureDraftRoom), fixtureDraftResultsReference: Boolean(input.availability?.fixtureDraftResultsReference), resolver: Boolean(input.availability?.resolver), simulator: Boolean(input.availability?.simulator), bigBoard: Boolean(input.availability?.bigBoard), liveDraftRoom: Boolean(input.availability?.liveDraftRoom), liveDraftResults: Boolean(input.availability?.liveDraftResults), persistence: Boolean(input.availability?.persistence) };
  for (const field of ["resolver", "simulator", "bigBoard", "liveDraftRoom", "liveDraftResults", "persistence"]) if (availability[field]) errors.push(entry("LIVE_AVAILABILITY_PROHIBITED", `availability.${field}`, "Preparation records cannot claim canonical/application availability."));
  const promotion = { readiness: input.promotion?.readiness ?? "DEFERRED", authorized: input.promotion?.authorized === true, decisionRef: input.promotion?.decisionRef ?? null };
  if (promotion.authorized) errors.push(entry("PROMOTION_AUTHORIZATION_PROHIBITED", "promotion.authorized", "This declaration cannot authorize promotion."));
  const persistence = { readiness: input.persistence?.readiness ?? "DEFERRED", authorized: input.persistence?.authorized === true };
  if (persistence.authorized || persistence.readiness === "READY") errors.push(entry("PERSISTENCE_CLAIM_PROHIBITED", "persistence", "Persistence is deferred and cannot be authorized here."));
  const mapping = { available: false, requiredCanonicalFields: ["profileId", "entityRef", "playerProfileRef"], predecessorField: "preparationRecordRef", requirements: ["VALIDATED_PREPARATION", "CANONICAL_IDENTITIES_ISSUED", "SUPPORTING_REFERENCES_RESOLVED", "CANONICAL_PROGRAM_RESOLVED_WHERE_REQUIRED", "PROMOTION_DECISION_APPROVED", "SEPARATE_AUTHORIZATION", "NO_PROMOTION_BLOCKERS"] };
  const extensions = isObject(input.extensions) ? input.extensions : {};
  let extensionBytes = Infinity;
  try { extensionBytes = JSON.stringify(extensions).length; } catch { /* circular input is already rejected by inspectJson */ }
  if (Object.keys(extensions).length > MAX_EXTENSION_KEYS || extensionBytes > MAX_EXTENSION_BYTES) errors.push(entry("EXTENSION_LIMIT_EXCEEDED", "extensions", "Extensions exceed bounded limits."));
  for (const field of [...CANONICAL_FIELDS, "identityClassification", "lifecycle", "promotion", "persistence", "availability"]) if (Object.hasOwn(extensions, field)) errors.push(entry("EXTENSION_OVERRIDE_PROHIBITED", `extensions.${field}`, "Extensions cannot override governed fields."));
  if (!isObject(input.provenance) || !String(input.provenance?.createdBy ?? "").trim() || !String(input.provenance?.createdAt ?? "").trim()) errors.push(entry("PROVENANCE_REQUIRED", "provenance", "createdBy and createdAt provenance are required."));
  const record = { contract: CONTRACT_NAME, contractVersion: CONTRACT_VERSION, schemaVersion: SCHEMA_VERSION, preparationRecordRef, identityClassification: IDENTITY_CLASSIFICATION, intakeCandidateRef, cohortRef: input.cohortRef ?? null, operationRef: input.operationRef ?? null, expectedDraftYear: input.expectedDraftYear ?? null, draftYearStatus: input.draftYearStatus ?? null, provisionalProgram: input.provisionalProgram ?? null, canonicalProgramResolutionRequired: input.canonicalProgramResolutionRequired !== false, ...normalizedRefs, assemblyCompleteness: input.assemblyCompleteness ?? "NOT_ASSESSED", lifecycle: input.lifecycle ?? null, promotion, persistence, availability, mapping, provenance: input.provenance ?? {}, notes: input.notes ?? null, extensions, validation: { valid: errors.length === 0, errors, warnings: [], contractVersion: CONTRACT_VERSION, schemaVersion: SCHEMA_VERSION } };
  return freeze(record);
}

export function validateProspectProfilePreparationRecord(value) { return createProspectProfilePreparationRecord(value).validation; }
export function isProspectProfilePreparationRecord(value) { return value?.contract === CONTRACT_NAME && validateProspectProfilePreparationRecord(value).valid; }
