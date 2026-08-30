import {
  DRAFT_SELECTION_CONTRACT_NAME,
  DRAFT_SELECTION_CONTRACT_VERSION,
  DRAFT_SELECTION_SCHEMA_VERSION,
  DRAFT_SELECTION_TYPES,
  DRAFT_SELECTION_VERIFICATION_STATES,
  DRAFT_SELECTION_LIFECYCLE_STATES,
} from "./draftSelectionConstants.js";

const KEYS = new Set([
  "contract", "contractVersion", "schemaVersion", "selectionRef", "selectionRevision", "prospectRef",
  "selectingOrganizationRef", "draftCycleRef", "leagueRef", "round", "overallPick", "selectionType",
  "selectionDate", "effectiveAt", "sourceRefs", "evidenceArtifactRefs", "reviewRefs", "verification",
  "provenance", "lifecycle", "versioning", "limitations", "notes", "extensions", "validation",
]);
const PROHIBITED_EXTENSION_KEYS = new Set([
  "database", "persistence", "supabase", "runtime", "resolver", "ui", "simulator", "promotion", "fiis",
  "playergrade", "scoutinggrade", "projection", "ranking", "prediction", "recommendation", "eligibilitydecision",
]);
const NESTED_KEYS = Object.freeze({
  verification: new Set(["state", "reviewerRefs", "verifiedAt", "notes"]),
  provenance: new Set(["createdBy", "createdAt", "updatedBy", "updatedAt"]),
  lifecycle: new Set(["state", "effectiveFrom", "effectiveTo", "supersededAt", "archivedAt"]),
  versioning: new Set(["predecessorSelectionRef", "replacementSelectionRef", "requestId", "operationId", "batchId"]),
});

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape() { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: DRAFT_SELECTION_CONTRACT_VERSION, schemaVersion: DRAFT_SELECTION_SCHEMA_VERSION }; }
function add(v, field, code, path, message) { if (!v[field].some((item) => item.code === code && item.path === path)) v[field].push({ code, path, message }); v.valid = v.errors.length === 0; }
function error(v, code, path, message) { add(v, "errors", code, path, message); }
function warning(v, code, path, message) { add(v, "warnings", code, path, message); }
function string(value, path, v, required = false) { if (value == null) { if (required) error(v, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (typeof value !== "string" || !value.trim()) { error(v, "INVALID_STRING", path, `${path} must be a non-empty string.`); return null; } return value.trim(); }
function positiveInteger(value, path, v, required = false) { if (value == null) { if (required) error(v, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (!Number.isInteger(value) || value < 1) { error(v, "INVALID_POSITIVE_INTEGER", path, `${path} must be a positive integer.`); return null; } return value; }
function enumeration(value, allowed, path, v, required = false, fallback = null) { if (value == null) { if (required) error(v, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return fallback; } if (!Object.values(allowed).includes(value)) { error(v, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; } return value; }
function date(value, path, v) { const result = string(value, path, v); if (result && Number.isNaN(Date.parse(result))) { error(v, "INVALID_DATE", path, `${path} must be ISO-compatible.`); return null; } return result; }
function refs(value, path, v) { if (value == null) return []; if (!Array.isArray(value)) { error(v, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const ref = string(entry, `${path}[${index}]`, v); if (!ref) return; if (seen.has(ref)) { warning(v, "DUPLICATE_NORMALIZED_REFERENCE", path, `Duplicate reference removed: ${ref}.`); return; } seen.add(ref); result.push(ref); }); return result; }
function extensionValue(value, path, v) { if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value; if (Array.isArray(value)) return value.map((entry, index) => extensionValue(entry, `${path}[${index}]`, v)); if (!isObject(value)) { error(v, "INVALID_EXTENSION_VALUE", path, `${path} contains an unsupported value.`); return null; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); if (PROHIBITED_EXTENSION_KEYS.has(normalized) || typeof entry === "function") { error(v, "PROHIBITED_DRAFT_SELECTION_EXTENSION", `${path}.${key}`, `${key} is outside Draft Selection ownership.`); return []; } return [[key, extensionValue(entry, `${path}.${key}`, v)]]; })); }
function extensions(value, v) { if (value == null) return {}; if (!isObject(value)) { error(v, "INVALID_EXTENSIONS", "extensions", "extensions must be an object or null."); return {}; } return extensionValue(value, "extensions", v); }
function rejectUnknownNested(value, path, v) { if (!isObject(value)) return; const key = Object.keys(value).find((entry) => !NESTED_KEYS[path].has(entry)); if (key) error(v, "UNSUPPORTED_NESTED_FIELD", `${path}.${key}`, `${path}.${key} is not supported.`); }

function normalize(input) {
  const v = validationShape(); const x = isObject(input) ? input : {};
  if (!isObject(input)) error(v, "INVALID_DRAFT_SELECTION", "", "DraftSelection must be an object.");
  if (Object.hasOwn(x, "contract") && x.contract !== DRAFT_SELECTION_CONTRACT_NAME) error(v, "CONTRACT_MISMATCH", "contract", "Contract identity does not match.");
  if (Object.hasOwn(x, "contractVersion") && x.contractVersion !== DRAFT_SELECTION_CONTRACT_VERSION) error(v, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Contract version does not match.");
  if (Object.hasOwn(x, "schemaVersion") && x.schemaVersion !== DRAFT_SELECTION_SCHEMA_VERSION) error(v, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Schema version does not match.");
  const unknown = Object.keys(x).filter((key) => !KEYS.has(key)); if (unknown.length) error(v, "UNSUPPORTED_DRAFT_SELECTION_FIELD", unknown[0], `${unknown[0]} is outside Draft Selection ownership.`);
  const selectionRef = string(x.selectionRef, "selectionRef", v, true);
  const selectionRevision = positiveInteger(x.selectionRevision, "selectionRevision", v, true);
  const verificationInput = isObject(x.verification) ? x.verification : {}; if (x.verification != null && !isObject(x.verification)) error(v, "INVALID_VERIFICATION", "verification", "verification must be an object or null.");
  const provenanceInput = isObject(x.provenance) ? x.provenance : {}; if (x.provenance != null && !isObject(x.provenance)) error(v, "INVALID_PROVENANCE", "provenance", "provenance must be an object or null.");
  const lifecycleInput = isObject(x.lifecycle) ? x.lifecycle : {}; if (x.lifecycle != null && !isObject(x.lifecycle)) error(v, "INVALID_LIFECYCLE", "lifecycle", "lifecycle must be an object or null.");
  const versioningInput = isObject(x.versioning) ? x.versioning : {}; if (x.versioning != null && !isObject(x.versioning)) error(v, "INVALID_VERSIONING", "versioning", "versioning must be an object or null.");
  rejectUnknownNested(verificationInput, "verification", v); rejectUnknownNested(provenanceInput, "provenance", v); rejectUnknownNested(lifecycleInput, "lifecycle", v); rejectUnknownNested(versioningInput, "versioning", v);
  const predecessorSelectionRef = string(versioningInput.predecessorSelectionRef, "versioning.predecessorSelectionRef", v);
  const replacementSelectionRef = string(versioningInput.replacementSelectionRef, "versioning.replacementSelectionRef", v);
  if (selectionRevision === 1 && predecessorSelectionRef) error(v, "UNEXPECTED_PREDECESSOR", "versioning.predecessorSelectionRef", "Revision 1 cannot declare a predecessor.");
  if (selectionRevision > 1 && !predecessorSelectionRef) error(v, "MISSING_PREDECESSOR", "versioning.predecessorSelectionRef", "A revision after 1 requires a predecessor reference.");
  if (selectionRef && [predecessorSelectionRef, replacementSelectionRef].includes(selectionRef)) error(v, "SELF_VERSION_REFERENCE", "versioning", "A selection cannot reference itself as predecessor or replacement.");
  if (predecessorSelectionRef && predecessorSelectionRef === replacementSelectionRef) error(v, "CONFLICTING_VERSION_REFERENCES", "versioning", "Predecessor and replacement references must differ.");
  const result = {
    contract: DRAFT_SELECTION_CONTRACT_NAME, contractVersion: DRAFT_SELECTION_CONTRACT_VERSION, schemaVersion: DRAFT_SELECTION_SCHEMA_VERSION,
    selectionRef, selectionRevision, prospectRef: string(x.prospectRef, "prospectRef", v, true), selectingOrganizationRef: string(x.selectingOrganizationRef, "selectingOrganizationRef", v, true),
    draftCycleRef: string(x.draftCycleRef, "draftCycleRef", v, true), leagueRef: string(x.leagueRef, "leagueRef", v), round: positiveInteger(x.round, "round", v, true),
    overallPick: positiveInteger(x.overallPick, "overallPick", v, true), selectionType: enumeration(x.selectionType, DRAFT_SELECTION_TYPES, "selectionType", v, true),
    selectionDate: date(x.selectionDate, "selectionDate", v), effectiveAt: date(x.effectiveAt, "effectiveAt", v), sourceRefs: refs(x.sourceRefs, "sourceRefs", v), evidenceArtifactRefs: refs(x.evidenceArtifactRefs, "evidenceArtifactRefs", v), reviewRefs: refs(x.reviewRefs, "reviewRefs", v),
    verification: { state: enumeration(verificationInput.state, DRAFT_SELECTION_VERIFICATION_STATES, "verification.state", v, false, DRAFT_SELECTION_VERIFICATION_STATES.UNVERIFIED), reviewerRefs: refs(verificationInput.reviewerRefs, "verification.reviewerRefs", v), verifiedAt: date(verificationInput.verifiedAt, "verification.verifiedAt", v), notes: string(verificationInput.notes, "verification.notes", v) },
    provenance: { createdBy: string(provenanceInput.createdBy, "provenance.createdBy", v), createdAt: date(provenanceInput.createdAt, "provenance.createdAt", v), updatedBy: string(provenanceInput.updatedBy, "provenance.updatedBy", v), updatedAt: date(provenanceInput.updatedAt, "provenance.updatedAt", v) },
    lifecycle: { state: enumeration(lifecycleInput.state, DRAFT_SELECTION_LIFECYCLE_STATES, "lifecycle.state", v, false, DRAFT_SELECTION_LIFECYCLE_STATES.ACTIVE), effectiveFrom: date(lifecycleInput.effectiveFrom, "lifecycle.effectiveFrom", v), effectiveTo: date(lifecycleInput.effectiveTo, "lifecycle.effectiveTo", v), supersededAt: date(lifecycleInput.supersededAt, "lifecycle.supersededAt", v), archivedAt: date(lifecycleInput.archivedAt, "lifecycle.archivedAt", v) },
    versioning: { predecessorSelectionRef, replacementSelectionRef, requestId: string(versioningInput.requestId, "versioning.requestId", v), operationId: string(versioningInput.operationId, "versioning.operationId", v), batchId: string(versioningInput.batchId, "versioning.batchId", v) },
    limitations: refs(x.limitations, "limitations", v), notes: string(x.notes, "notes", v), extensions: extensions(x.extensions, v), validation: v,
  };
  if (result.lifecycle.effectiveFrom && result.lifecycle.effectiveTo && Date.parse(result.lifecycle.effectiveFrom) > Date.parse(result.lifecycle.effectiveTo)) error(v, "INVALID_DATE_RANGE", "lifecycle.effectiveTo", "effectiveTo cannot precede effectiveFrom.");
  if (result.provenance.createdAt && result.provenance.updatedAt && Date.parse(result.provenance.createdAt) > Date.parse(result.provenance.updatedAt)) error(v, "INVALID_DATE_RANGE", "provenance.updatedAt", "updatedAt cannot precede createdAt.");
  v.valid = v.errors.length === 0; return result;
}

export function createDraftSelection(input = {}) { return normalize(input); }
export function createUnavailableDraftSelection(input = {}) { const x = isObject(input) ? input : {}; const { reason, ...selectionInput } = x; const result = normalize(selectionInput); error(result.validation, "DRAFT_SELECTION_UNAVAILABLE", "", typeof reason === "string" && reason.trim() ? reason.trim() : "No usable DraftSelection is available."); return result; }
export function validateDraftSelection(value) { return normalize(value).validation; }
export function isDraftSelection(value) { return Boolean(isObject(value) && value.contract === DRAFT_SELECTION_CONTRACT_NAME && value.contractVersion === DRAFT_SELECTION_CONTRACT_VERSION && value.schemaVersion === DRAFT_SELECTION_SCHEMA_VERSION && validateDraftSelection(value).valid); }

export default Object.freeze({ createDraftSelection, createUnavailableDraftSelection, validateDraftSelection, isDraftSelection });
