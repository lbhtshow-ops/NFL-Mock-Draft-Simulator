import {
  PROSPECT_WATCHLIST_CONTRACT_NAME,
  PROSPECT_WATCHLIST_CONTRACT_VERSION,
  PROSPECT_WATCHLIST_SCHEMA_VERSION,
  PROSPECT_WATCHLIST_TYPES,
  PROSPECT_WATCHLIST_STATUSES,
  PROSPECT_WATCHLIST_ENTRY_STATUSES,
  PROSPECT_WATCHLIST_PRIORITIES,
  PROSPECT_WATCHLIST_VERIFICATION_STATES,
  PROSPECT_WATCHLIST_LIFECYCLE_STATES,
} from "./prospectWatchlistConstants.js";

const PROHIBITED_EXTENSION_KEYS = new Set([
  "fuzzymatchfunction", "identityresolutionfunction", "mergefunction", "scraperfunction", "apiclient", "databaseclient",
  "repositoryoperation", "repositoryoperations", "hydration", "synchronization", "graphtraversal", "grade", "grades",
  "ranking", "rankings", "projection", "projections", "recommendation", "recommendations", "prediction", "predictions",
  "decision", "decisions", "simulatorready",
]);

const WATCHLIST_KEYS = new Set([
  "contract", "contractVersion", "schemaVersion", "watchlistId", "cycleRef", "label", "description", "watchlistType",
  "status", "revision", "candidateEntries", "sourceRefs", "evidenceRefs", "reviewRefs", "workflowRefs", "verification",
  "provenance", "lifecycle", "notes", "extensions", "validation",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape() { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: PROSPECT_WATCHLIST_CONTRACT_VERSION, schemaVersion: PROSPECT_WATCHLIST_SCHEMA_VERSION }; }
function add(validation, field, code, path, message) { if (!validation[field].some((entry) => entry.code === code && entry.path === path)) validation[field].push({ code, path, message }); validation.valid = validation.errors.length === 0; }
function error(validation, code, path, message) { add(validation, "errors", code, path, message); }
function warning(validation, code, path, message) { add(validation, "warnings", code, path, message); }
function finish(validation) { validation.valid = validation.errors.length === 0; return validation; }
function string(value, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty unresolved string or null.`); return null; } return value.trim(); }
function date(value, path, validation) { const result = string(value, path, validation); if (result && Number.isNaN(Date.parse(result))) { error(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; } return result; }
function integer(value, path, validation) { if (value == null) return null; if (!Number.isInteger(value) || value < 1) { error(validation, "INVALID_REVISION", path, `${path} must be a positive integer or null.`); return null; } return value; }
function enumValue(value, allowed, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (!Object.values(allowed).includes(value)) { error(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; } return value; }
function refs(value, path, validation) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array of unresolved strings.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const item = string(entry, `${path}[${index}]`, validation); if (!item) return; if (seen.has(item)) { warning(validation, "DUPLICATE_NORMALIZED_REFERENCE", path, `Duplicate unresolved reference removed: ${item}.`); return; } seen.add(item); result.push(item); }); return result; }
function stringMap(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_STRING_MAP", path, `${path} must be an object of unresolved string values.`); return {}; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = string(entry, `${path}.${key}`, validation); return normalized == null ? [] : [[key, normalized]]; })); }
function verification(value, path, validation) { if (value == null) return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; if (!isObject(value)) { error(validation, "INVALID_VERIFICATION", path, `${path} must be an object or null.`); return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; } return { state: enumValue(value.state, PROSPECT_WATCHLIST_VERIFICATION_STATES, `${path}.state`, validation), reviewedBy: string(value.reviewedBy, `${path}.reviewedBy`, validation), reviewedAt: date(value.reviewedAt, `${path}.reviewedAt`, validation), notes: string(value.notes, `${path}.notes`, validation) }; }
function extensionValue(value, path, validation) { if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value; if (Array.isArray(value)) return value.map((entry, index) => extensionValue(entry, `${path}[${index}]`, validation)); if (!isObject(value)) { error(validation, "INVALID_EXTENSION_VALUE", path, `${path} contains an unsupported value.`); return null; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); if (PROHIBITED_EXTENSION_KEYS.has(normalized) || typeof entry === "function") { error(validation, "PROHIBITED_WATCHLIST_EXTENSION", `${path}.${key}`, `${key} is outside Watchlist ownership.`); return []; } return [[key, extensionValue(entry, `${path}.${key}`, validation)]]; })); }
function extensions(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_EXTENSIONS", path, `${path} must be an object or null.`); return {}; } return extensionValue(value, path, validation); }

export function createProspectWatchlistEntry(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_WATCHLIST_ENTRY", "", "Watchlist entry must be an object.");
  const addedAt = date(value.addedAt, "addedAt", validation); const removedAt = date(value.removedAt, "removedAt", validation);
  if (addedAt && removedAt && Date.parse(addedAt) > Date.parse(removedAt)) error(validation, "INVALID_REMOVAL_DATE_ORDER", "removedAt", "removedAt cannot precede addedAt.");
  const result = {
    entryId: string(value.entryId, "entryId", validation, true), intakeCandidateRef: string(value.intakeCandidateRef, "intakeCandidateRef", validation),
    submittedLabel: string(value.submittedLabel, "submittedLabel", validation), submittedSchool: string(value.submittedSchool, "submittedSchool", validation),
    submittedPosition: string(value.submittedPosition, "submittedPosition", validation), submittedClassYear: string(value.submittedClassYear, "submittedClassYear", validation),
    submittedRosterNumber: string(value.submittedRosterNumber, "submittedRosterNumber", validation), providerIdentifiers: stringMap(value.providerIdentifiers, "providerIdentifiers", validation),
    discoveryOrigin: string(value.discoveryOrigin, "discoveryOrigin", validation), discoveryContext: value.discoveryContext == null ? {} : extensions(value.discoveryContext, "discoveryContext", validation),
    entryStatus: enumValue(value.entryStatus, PROSPECT_WATCHLIST_ENTRY_STATUSES, "entryStatus", validation),
    priority: enumValue(value.priority, PROSPECT_WATCHLIST_PRIORITIES, "priority", validation), revision: integer(value.revision, "revision", validation), addedAt, removedAt,
    removalReason: string(value.removalReason, "removalReason", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation),
    evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewRefs: refs(value.reviewRefs, "reviewRefs", validation),
    blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), notes: string(value.notes, "notes", validation),
    extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectWatchlistEntry(value) { return createProspectWatchlistEntry(value).validation; }

function normalizeWatchlist(input) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROSPECT_WATCHLIST", "", "Prospect Watchlist must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_WATCHLIST_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Watchlist contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_WATCHLIST_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Watchlist contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_WATCHLIST_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Watchlist schema version does not match.");
  const unknownKeys = Object.keys(value).filter((key) => !WATCHLIST_KEYS.has(key)); if (unknownKeys.length) error(validation, "UNSUPPORTED_WATCHLIST_FIELD", unknownKeys[0], `${unknownKeys[0]} is not owned by the Watchlist Contract.`);
  const watchlistId = string(value.watchlistId, "watchlistId", validation, true);
  const entriesInput = value.candidateEntries == null ? [] : value.candidateEntries; if (!Array.isArray(entriesInput)) error(validation, "INVALID_ENTRY_COLLECTION", "candidateEntries", "candidateEntries must be an array.");
  const candidateEntries = (Array.isArray(entriesInput) ? entriesInput : []).map((entry, index) => { const normalized = createProspectWatchlistEntry(entry); if (!normalized.validation.valid) error(validation, "INVALID_NESTED_ENTRY", `candidateEntries[${index}]`, `candidateEntries[${index}] is invalid.`); return normalized; });
  const entryIds = candidateEntries.map((entry) => entry.entryId).filter(Boolean); if (new Set(entryIds).size !== entryIds.length) error(validation, "DUPLICATE_LOCAL_ENTRY_ID", "candidateEntries", "candidateEntries contains duplicate entryId values.");
  const lifecycleValue = value.lifecycle == null ? {} : value.lifecycle; if (!isObject(lifecycleValue)) error(validation, "INVALID_LIFECYCLE", "lifecycle", "lifecycle must be an object or null."); const lifecycleInput = isObject(lifecycleValue) ? lifecycleValue : {};
  const createdAt = date(lifecycleInput.createdAt, "lifecycle.createdAt", validation); const closedAt = date(lifecycleInput.closedAt, "lifecycle.closedAt", validation); if (createdAt && closedAt && Date.parse(createdAt) > Date.parse(closedAt)) error(validation, "INVALID_LIFECYCLE_DATE_ORDER", "lifecycle.closedAt", "closedAt cannot precede createdAt.");
  const supersedesWatchlistRef = string(lifecycleInput.supersedesWatchlistRef, "lifecycle.supersedesWatchlistRef", validation); const supersededByWatchlistRef = string(lifecycleInput.supersededByWatchlistRef, "lifecycle.supersededByWatchlistRef", validation);
  if (watchlistId && (supersedesWatchlistRef === watchlistId || supersededByWatchlistRef === watchlistId)) error(validation, "SELF_WATCHLIST_REFERENCE", "lifecycle", "A watchlist cannot supersede itself.");
  if (supersedesWatchlistRef && supersededByWatchlistRef && supersedesWatchlistRef === supersededByWatchlistRef) error(validation, "CONFLICTING_REVISION_REFERENCES", "lifecycle", "Supersession references must differ.");
  const provenanceValue = value.provenance == null ? {} : value.provenance; if (!isObject(provenanceValue)) error(validation, "INVALID_PROVENANCE", "provenance", "provenance must be an object or null."); const provenanceInput = isObject(provenanceValue) ? provenanceValue : {};
  const result = {
    contract: PROSPECT_WATCHLIST_CONTRACT_NAME, contractVersion: PROSPECT_WATCHLIST_CONTRACT_VERSION, schemaVersion: PROSPECT_WATCHLIST_SCHEMA_VERSION,
    watchlistId, cycleRef: string(value.cycleRef, "cycleRef", validation, true), label: string(value.label, "label", validation),
    description: string(value.description, "description", validation), watchlistType: enumValue(value.watchlistType, PROSPECT_WATCHLIST_TYPES, "watchlistType", validation, true),
    status: enumValue(value.status, PROSPECT_WATCHLIST_STATUSES, "status", validation, true), revision: integer(value.revision, "revision", validation),
    candidateEntries, sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation),
    reviewRefs: refs(value.reviewRefs, "reviewRefs", validation), workflowRefs: refs(value.workflowRefs, "workflowRefs", validation),
    verification: verification(value.verification, "verification", validation), provenance: {
      createdBy: string(provenanceInput.createdBy, "provenance.createdBy", validation), createdAt: date(provenanceInput.createdAt, "provenance.createdAt", validation),
      updatedBy: string(provenanceInput.updatedBy, "provenance.updatedBy", validation), updatedAt: date(provenanceInput.updatedAt, "provenance.updatedAt", validation),
    }, lifecycle: { state: enumValue(lifecycleInput.state, PROSPECT_WATCHLIST_LIFECYCLE_STATES, "lifecycle.state", validation), createdAt, closedAt, archivedAt: date(lifecycleInput.archivedAt, "lifecycle.archivedAt", validation), supersedesWatchlistRef, supersededByWatchlistRef },
    notes: string(value.notes, "notes", validation), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function createProspectWatchlist(input = {}) { return normalizeWatchlist(input); }
export function createUnavailableProspectWatchlist(input = {}) { const supplied = isObject(input) ? input : {}; const { reason, ...watchlistInput } = supplied; const result = normalizeWatchlist(watchlistInput); error(result.validation, "PROSPECT_WATCHLIST_UNAVAILABLE", "", typeof reason === "string" && reason.trim() ? reason.trim() : "No usable Prospect Watchlist is available."); return result; }
export function validateProspectWatchlist(value) { return normalizeWatchlist(value).validation; }
export function isProspectWatchlist(value) { return Boolean(isObject(value) && value.contract === PROSPECT_WATCHLIST_CONTRACT_NAME && value.contractVersion === PROSPECT_WATCHLIST_CONTRACT_VERSION && value.schemaVersion === PROSPECT_WATCHLIST_SCHEMA_VERSION && validateProspectWatchlist(value).valid); }

export default Object.freeze({
  createProspectWatchlistEntry, validateProspectWatchlistEntry, createProspectWatchlist, createUnavailableProspectWatchlist,
  validateProspectWatchlist, isProspectWatchlist,
});
