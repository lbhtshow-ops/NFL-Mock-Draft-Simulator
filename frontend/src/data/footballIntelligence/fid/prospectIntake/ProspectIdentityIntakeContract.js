import {
  PROSPECT_IDENTITY_INTAKE_CONTRACT_NAME,
  PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION,
  PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION,
  PROSPECT_IDENTITY_CLAIM_TYPES,
  PROSPECT_IDENTITY_CLAIM_STATUSES,
  PROSPECT_IDENTITY_CONFLICT_TYPES,
  PROSPECT_IDENTITY_CONFLICT_STATUSES,
  PROSPECT_IDENTITY_CONFLICT_SEVERITIES,
  PROSPECT_IDENTITY_DUPLICATE_CONCERN_STATUSES,
  PROSPECT_IDENTITY_MATCH_REVIEW_STATUSES,
  PROSPECT_IDENTITY_REVIEW_OUTCOMES,
  PROSPECT_WATCHLIST_VERIFICATION_STATES,
  PROSPECT_WATCHLIST_LIFECYCLE_STATES,
} from "./prospectWatchlistConstants.js";

const PROHIBITED_EXTENSION_KEYS = new Set([
  "fuzzymatchfunction", "identityresolutionfunction", "mergefunction", "scraperfunction", "apiclient", "databaseclient",
  "repositoryoperation", "repositoryoperations", "hydration", "synchronization", "graphtraversal", "grade", "grades",
  "ranking", "rankings", "projection", "projections", "recommendation", "recommendations", "prediction", "predictions",
  "decision", "decisions", "simulatorready",
]);

const IDENTITY_KEYS = new Set([
  "contract", "contractVersion", "schemaVersion", "identityIntakeId", "intakeCandidateRef", "cycleRef", "submittedIdentity",
  "identityClaims", "identityConflicts", "duplicateConcerns", "proposedMatches", "identityReviews", "finalDeclaredOutcome",
  "proposedEntityRef", "proposedPersonProfileRef", "sourceRefs", "evidenceRefs", "reviewRefs", "blockerRefs", "workflowRefs",
  "verification", "provenance", "lifecycle", "revision", "workflowRevision", "notes", "extensions", "validation",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape() { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION, schemaVersion: PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION }; }
function add(validation, field, code, path, message) { if (!validation[field].some((entry) => entry.code === code && entry.path === path)) validation[field].push({ code, path, message }); validation.valid = validation.errors.length === 0; }
function error(validation, code, path, message) { add(validation, "errors", code, path, message); }
function warning(validation, code, path, message) { add(validation, "warnings", code, path, message); }
function finish(validation) { validation.valid = validation.errors.length === 0; return validation; }
function string(value, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty unresolved string or null.`); return null; } return value.trim(); }
function date(value, path, validation) { const result = string(value, path, validation); if (result && Number.isNaN(Date.parse(result))) { error(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; } return result; }
function integer(value, path, validation) { if (value == null) return null; if (!Number.isInteger(value) || value < 1) { error(validation, "INVALID_REVISION", path, `${path} must be a positive integer or null.`); return null; } return value; }
function enumValue(value, allowed, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (!Object.values(allowed).includes(value)) { error(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; } return value; }
function refs(value, path, validation) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array of unresolved strings.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const item = string(entry, `${path}[${index}]`, validation); if (!item) return; if (seen.has(item)) { warning(validation, "DUPLICATE_NORMALIZED_REFERENCE", path, `Duplicate unresolved reference removed: ${item}.`); return; } seen.add(item); result.push(item); }); return result; }
function strings(value, path, validation) { return refs(value, path, validation); }
function stringMap(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_STRING_MAP", path, `${path} must be an object of unresolved string values.`); return {}; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = string(entry, `${path}.${key}`, validation); return normalized == null ? [] : [[key, normalized]]; })); }
function verification(value, path, validation) { if (value == null) return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; if (!isObject(value)) { error(validation, "INVALID_VERIFICATION", path, `${path} must be an object or null.`); return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; } return { state: enumValue(value.state, PROSPECT_WATCHLIST_VERIFICATION_STATES, `${path}.state`, validation), reviewedBy: string(value.reviewedBy, `${path}.reviewedBy`, validation), reviewedAt: date(value.reviewedAt, `${path}.reviewedAt`, validation), notes: string(value.notes, `${path}.notes`, validation) }; }
function extensionValue(value, path, validation) { if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value; if (Array.isArray(value)) return value.map((entry, index) => extensionValue(entry, `${path}[${index}]`, validation)); if (!isObject(value)) { error(validation, "INVALID_EXTENSION_VALUE", path, `${path} contains an unsupported value.`); return null; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); if (PROHIBITED_EXTENSION_KEYS.has(normalized) || typeof entry === "function") { error(validation, "PROHIBITED_IDENTITY_EXTENSION", `${path}.${key}`, `${key} is outside Identity Intake ownership.`); return []; } return [[key, extensionValue(entry, `${path}.${key}`, validation)]]; })); }
function extensions(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_EXTENSIONS", path, `${path} must be an object or null.`); return {}; } return extensionValue(value, path, validation); }
function records(value, path, validation, factory, idKey) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_RECORD_COLLECTION", path, `${path} must be an array.`); return []; } const result = value.map((entry, index) => { const normalized = factory(entry); if (!normalized.validation.valid) error(validation, "INVALID_NESTED_RECORD", `${path}[${index}]`, `${path}[${index}] is invalid.`); return normalized; }); const ids = result.map((entry) => entry[idKey]).filter(Boolean); if (new Set(ids).size !== ids.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", path, `${path} contains duplicate ${idKey} values.`); return result; }

export function createProspectSubmittedIdentity(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_SUBMITTED_IDENTITY", "", "Submitted identity must be an object.");
  const result = {
    submittedName: string(value.submittedName, "submittedName", validation), aliases: strings(value.aliases, "aliases", validation),
    submittedSchool: string(value.submittedSchool, "submittedSchool", validation), submittedPosition: string(value.submittedPosition, "submittedPosition", validation),
    submittedClassYear: string(value.submittedClassYear, "submittedClassYear", validation), submittedRosterNumber: string(value.submittedRosterNumber, "submittedRosterNumber", validation),
    submittedDateOfBirth: date(value.submittedDateOfBirth, "submittedDateOfBirth", validation), providerIdentifiers: stringMap(value.providerIdentifiers, "providerIdentifiers", validation),
    submittedTeamRef: string(value.submittedTeamRef, "submittedTeamRef", validation), submittedOrganizationRef: string(value.submittedOrganizationRef, "submittedOrganizationRef", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectSubmittedIdentity(value) { return createProspectSubmittedIdentity(value).validation; }

export function createProspectIdentityClaim(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_IDENTITY_CLAIM", "", "Identity claim must be an object.");
  const result = {
    claimId: string(value.claimId, "claimId", validation, true), claimType: enumValue(value.claimType, PROSPECT_IDENTITY_CLAIM_TYPES, "claimType", validation, true),
    claimedValue: value.claimedValue == null ? null : extensionValue(value.claimedValue, "claimedValue", validation), normalizedDisplayValue: string(value.normalizedDisplayValue, "normalizedDisplayValue", validation),
    subjectScope: string(value.subjectScope, "subjectScope", validation), status: enumValue(value.status, PROSPECT_IDENTITY_CLAIM_STATUSES, "status", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewerRefs: refs(value.reviewerRefs, "reviewerRefs", validation),
    confidenceDeclaration: string(value.confidenceDeclaration, "confidenceDeclaration", validation), limitations: strings(value.limitations, "limitations", validation),
    notes: string(value.notes, "notes", validation), verification: verification(value.verification, "verification", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectIdentityClaim(value) { return createProspectIdentityClaim(value).validation; }

export function createProspectIdentityConflict(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_IDENTITY_CONFLICT", "", "Identity conflict must be an object.");
  const result = {
    conflictId: string(value.conflictId, "conflictId", validation, true), conflictType: enumValue(value.conflictType, PROSPECT_IDENTITY_CONFLICT_TYPES, "conflictType", validation, true),
    claimRefs: refs(value.claimRefs, "claimRefs", validation), candidateRefs: refs(value.candidateRefs, "candidateRefs", validation), description: string(value.description, "description", validation),
    status: enumValue(value.status, PROSPECT_IDENTITY_CONFLICT_STATUSES, "status", validation), severity: enumValue(value.severity, PROSPECT_IDENTITY_CONFLICT_SEVERITIES, "severity", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewRefs: refs(value.reviewRefs, "reviewRefs", validation),
    resolutionDeclaration: string(value.resolutionDeclaration, "resolutionDeclaration", validation), resolvedAt: date(value.resolvedAt, "resolvedAt", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectIdentityConflict(value) { return createProspectIdentityConflict(value).validation; }

export function createProspectDuplicateConcern(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_DUPLICATE_CONCERN", "", "Duplicate concern must be an object.");
  const result = {
    concernId: string(value.concernId, "concernId", validation, true), relatedCandidateRefs: refs(value.relatedCandidateRefs, "relatedCandidateRefs", validation),
    matchingFields: strings(value.matchingFields, "matchingFields", validation), differingFields: strings(value.differingFields, "differingFields", validation),
    evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewerRefs: refs(value.reviewerRefs, "reviewerRefs", validation),
    status: enumValue(value.status, PROSPECT_IDENTITY_DUPLICATE_CONCERN_STATUSES, "status", validation), resolutionDeclaration: string(value.resolutionDeclaration, "resolutionDeclaration", validation),
    notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectDuplicateConcern(value) { return createProspectDuplicateConcern(value).validation; }

export function createProspectProposedIdentityMatch(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROPOSED_MATCH", "", "Proposed identity match must be an object.");
  const result = {
    proposedMatchId: string(value.proposedMatchId, "proposedMatchId", validation, true), candidateRef: string(value.candidateRef, "candidateRef", validation),
    proposedEntityRef: string(value.proposedEntityRef, "proposedEntityRef", validation), proposedPersonProfileRef: string(value.proposedPersonProfileRef, "proposedPersonProfileRef", validation),
    matchBasis: strings(value.matchBasis, "matchBasis", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation),
    reviewerRef: string(value.reviewerRef, "reviewerRef", validation), reviewStatus: enumValue(value.reviewStatus, PROSPECT_IDENTITY_MATCH_REVIEW_STATUSES, "reviewStatus", validation),
    limitations: strings(value.limitations, "limitations", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectProposedIdentityMatch(value) { return createProspectProposedIdentityMatch(value).validation; }

export function createProspectIdentityReviewDecision(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_IDENTITY_REVIEW_DECISION", "", "Identity review decision must be an object.");
  const result = {
    reviewId: string(value.reviewId, "reviewId", validation, true), outcome: enumValue(value.outcome, PROSPECT_IDENTITY_REVIEW_OUTCOMES, "outcome", validation, true),
    reviewerRef: string(value.reviewerRef, "reviewerRef", validation), reviewedAt: date(value.reviewedAt, "reviewedAt", validation),
    claimRefs: refs(value.claimRefs, "claimRefs", validation), conflictRefs: refs(value.conflictRefs, "conflictRefs", validation), proposedMatchRefs: refs(value.proposedMatchRefs, "proposedMatchRefs", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation),
    rationale: string(value.rationale, "rationale", validation), limitations: strings(value.limitations, "limitations", validation), notes: string(value.notes, "notes", validation),
    verification: verification(value.verification, "verification", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectIdentityReviewDecision(value) { return createProspectIdentityReviewDecision(value).validation; }

function normalizeIdentityIntake(input) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROSPECT_IDENTITY_INTAKE", "", "Prospect Identity Intake must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_IDENTITY_INTAKE_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Identity Intake contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Identity Intake contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Identity Intake schema version does not match.");
  const unknownKeys = Object.keys(value).filter((key) => !IDENTITY_KEYS.has(key)); if (unknownKeys.length) error(validation, "UNSUPPORTED_IDENTITY_INTAKE_FIELD", unknownKeys[0], `${unknownKeys[0]} is not owned by Identity Intake.`);
  const identityIntakeId = string(value.identityIntakeId, "identityIntakeId", validation, true);
  const submittedIdentity = value.submittedIdentity == null ? null : (() => { const normalized = createProspectSubmittedIdentity(value.submittedIdentity); if (!normalized.validation.valid) error(validation, "INVALID_SUBMITTED_IDENTITY", "submittedIdentity", "submittedIdentity is invalid."); return normalized; })();
  const identityClaims = records(value.identityClaims, "identityClaims", validation, createProspectIdentityClaim, "claimId");
  const identityConflicts = records(value.identityConflicts, "identityConflicts", validation, createProspectIdentityConflict, "conflictId");
  const duplicateConcerns = records(value.duplicateConcerns, "duplicateConcerns", validation, createProspectDuplicateConcern, "concernId");
  const proposedMatches = records(value.proposedMatches, "proposedMatches", validation, createProspectProposedIdentityMatch, "proposedMatchId");
  const identityReviews = records(value.identityReviews, "identityReviews", validation, createProspectIdentityReviewDecision, "reviewId");
  const allIds = [...identityClaims.map((entry) => entry.claimId), ...identityConflicts.map((entry) => entry.conflictId), ...duplicateConcerns.map((entry) => entry.concernId), ...proposedMatches.map((entry) => entry.proposedMatchId), ...identityReviews.map((entry) => entry.reviewId)].filter(Boolean);
  if (new Set(allIds).size !== allIds.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", "", "Workflow-local identity record IDs must be unique across collections.");
  const lifecycleValue = value.lifecycle == null ? {} : value.lifecycle; if (!isObject(lifecycleValue)) error(validation, "INVALID_LIFECYCLE", "lifecycle", "lifecycle must be an object or null."); const lifecycleInput = isObject(lifecycleValue) ? lifecycleValue : {};
  const openedAt = date(lifecycleInput.openedAt, "lifecycle.openedAt", validation); const closedAt = date(lifecycleInput.closedAt, "lifecycle.closedAt", validation); if (openedAt && closedAt && Date.parse(openedAt) > Date.parse(closedAt)) error(validation, "INVALID_LIFECYCLE_DATE_ORDER", "lifecycle.closedAt", "closedAt cannot precede openedAt.");
  const replacesIdentityIntakeRef = string(lifecycleInput.replacesIdentityIntakeRef, "lifecycle.replacesIdentityIntakeRef", validation); const replacedByIdentityIntakeRef = string(lifecycleInput.replacedByIdentityIntakeRef, "lifecycle.replacedByIdentityIntakeRef", validation);
  if (identityIntakeId && (replacesIdentityIntakeRef === identityIntakeId || replacedByIdentityIntakeRef === identityIntakeId)) error(validation, "SELF_IDENTITY_INTAKE_REFERENCE", "lifecycle", "Identity Intake cannot replace itself.");
  if (replacesIdentityIntakeRef && replacedByIdentityIntakeRef && replacesIdentityIntakeRef === replacedByIdentityIntakeRef) error(validation, "CONFLICTING_REVISION_REFERENCES", "lifecycle", "Replacement references must differ.");
  const provenanceValue = value.provenance == null ? {} : value.provenance; if (!isObject(provenanceValue)) error(validation, "INVALID_PROVENANCE", "provenance", "provenance must be an object or null."); const provenanceInput = isObject(provenanceValue) ? provenanceValue : {};
  const result = {
    contract: PROSPECT_IDENTITY_INTAKE_CONTRACT_NAME, contractVersion: PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION, schemaVersion: PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION,
    identityIntakeId, intakeCandidateRef: string(value.intakeCandidateRef, "intakeCandidateRef", validation, true), cycleRef: string(value.cycleRef, "cycleRef", validation, true),
    submittedIdentity, identityClaims, identityConflicts, duplicateConcerns, proposedMatches, identityReviews,
    finalDeclaredOutcome: enumValue(value.finalDeclaredOutcome, PROSPECT_IDENTITY_REVIEW_OUTCOMES, "finalDeclaredOutcome", validation),
    proposedEntityRef: string(value.proposedEntityRef, "proposedEntityRef", validation), proposedPersonProfileRef: string(value.proposedPersonProfileRef, "proposedPersonProfileRef", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewRefs: refs(value.reviewRefs, "reviewRefs", validation),
    blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), workflowRefs: refs(value.workflowRefs, "workflowRefs", validation), verification: verification(value.verification, "verification", validation),
    provenance: { createdBy: string(provenanceInput.createdBy, "provenance.createdBy", validation), createdAt: date(provenanceInput.createdAt, "provenance.createdAt", validation), updatedBy: string(provenanceInput.updatedBy, "provenance.updatedBy", validation), updatedAt: date(provenanceInput.updatedAt, "provenance.updatedAt", validation) },
    lifecycle: { state: enumValue(lifecycleInput.state, PROSPECT_WATCHLIST_LIFECYCLE_STATES, "lifecycle.state", validation), openedAt, closedAt, archivedAt: date(lifecycleInput.archivedAt, "lifecycle.archivedAt", validation), replacesIdentityIntakeRef, replacedByIdentityIntakeRef },
    revision: integer(value.revision, "revision", validation), workflowRevision: integer(value.workflowRevision, "workflowRevision", validation),
    notes: string(value.notes, "notes", validation), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function createProspectIdentityIntake(input = {}) { return normalizeIdentityIntake(input); }
export function createUnavailableProspectIdentityIntake(input = {}) { const supplied = isObject(input) ? input : {}; const { reason, ...identityInput } = supplied; const result = normalizeIdentityIntake(identityInput); error(result.validation, "PROSPECT_IDENTITY_INTAKE_UNAVAILABLE", "", typeof reason === "string" && reason.trim() ? reason.trim() : "No usable Prospect Identity Intake is available."); return result; }
export function validateProspectIdentityIntake(value) { return normalizeIdentityIntake(value).validation; }
export function isProspectIdentityIntake(value) { return Boolean(isObject(value) && value.contract === PROSPECT_IDENTITY_INTAKE_CONTRACT_NAME && value.contractVersion === PROSPECT_IDENTITY_INTAKE_CONTRACT_VERSION && value.schemaVersion === PROSPECT_IDENTITY_INTAKE_SCHEMA_VERSION && validateProspectIdentityIntake(value).valid); }

export default Object.freeze({
  createProspectSubmittedIdentity, validateProspectSubmittedIdentity, createProspectIdentityClaim, validateProspectIdentityClaim,
  createProspectIdentityConflict, validateProspectIdentityConflict, createProspectDuplicateConcern, validateProspectDuplicateConcern,
  createProspectProposedIdentityMatch, validateProspectProposedIdentityMatch, createProspectIdentityReviewDecision,
  validateProspectIdentityReviewDecision, createProspectIdentityIntake, createUnavailableProspectIdentityIntake,
  validateProspectIdentityIntake, isProspectIdentityIntake,
});
