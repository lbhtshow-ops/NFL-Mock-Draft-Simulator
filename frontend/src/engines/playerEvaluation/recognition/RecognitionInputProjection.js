import { DATA_STATES } from "../../contracts/IntelligenceResultContract.js";

export const RECOGNITION_INPUT_CONTRACT = "RecognitionInputProjection";
export const RECOGNITION_INPUT_VERSION = "1.0.0";

export const RECOGNITION_COMPLETENESS = Object.freeze({
  COMPLETE: "COMPLETE",
  PARTIAL: "PARTIAL",
  UNKNOWN: "UNKNOWN",
});

const INPUT_KEYS = new Set([
  "contract", "version", "playerContext", "evidenceState", "records",
  "completeness", "limitations", "validation",
]);
const RECORD_KEYS = new Set([
  "type", "season", "sourceRefs", "evidenceRefs", "verification",
  "provenance", "issuingOrganizationRef", "notes", "extensions",
]);

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function issue(code, path, message) {
  return { code, path, message };
}

function validatePlayerContext(value, errors) {
  if (!isObject(value)) {
    errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext", "Player Context is required."));
    return null;
  }

  if (typeof value.available !== "boolean") {
    errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.available", "Player Context availability must be boolean."));
  }
  if (typeof value.playerId !== "string" || !value.playerId.trim()) {
    errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.playerId", "Player Context playerId is required."));
  }
  if (!isObject(value.competition) || typeof value.competition.level !== "string") {
    errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.competition", "Player Context competition is required."));
  }
  if (typeof value.careerStage !== "string" || !value.careerStage) {
    errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.careerStage", "Player Context careerStage is required."));
  }
  if (typeof value.frameworkVersion !== "string" || !value.frameworkVersion) {
    errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.frameworkVersion", "Player Context frameworkVersion is required."));
  }

  return clone(value);
}

function normalizeRefs(value, path, errors) {
  if (value == null) return null;
  if (!Array.isArray(value)) {
    errors.push(issue("INVALID_REFERENCE_COLLECTION", path, `${path} must be an array or null.`));
    return null;
  }
  const refs = value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      errors.push(issue("INVALID_REFERENCE", `${path}[${index}]`, "References must be nonempty strings."));
      return null;
    }
    return item.trim();
  }).filter(Boolean);
  if (new Set(refs).size !== refs.length) {
    errors.push(issue("DUPLICATE_REFERENCE", path, `${path} contains duplicate references.`));
  }
  return refs;
}

function normalizeRecord(value, index, errors) {
  const path = `records[${index}]`;
  if (!isObject(value)) {
    errors.push(issue("INVALID_RECOGNITION_RECORD", path, "Recognition records must be objects."));
    return null;
  }
  const unsupported = Object.keys(value).find((key) => !RECORD_KEYS.has(key));
  if (unsupported) {
    errors.push(issue("UNSUPPORTED_RECORD_FIELD", `${path}.${unsupported}`, "Unsupported fields must use extensions."));
  }
  const type = typeof value.type === "string" ? value.type.trim() : "";
  if (!type) errors.push(issue("INVALID_AWARD_TYPE", `${path}.type`, "Award type must be a nonempty string."));
  const season = value.season == null ? null : value.season;
  if (season !== null && (!Number.isInteger(season) || season < 1800 || season > 3000)) {
    errors.push(issue("INVALID_AWARD_SEASON", `${path}.season`, "Award season must be an integer from 1800 to 3000 or null."));
  }
  ["verification", "provenance", "extensions"].forEach((key) => {
    if (value[key] != null && !isObject(value[key])) {
      errors.push(issue("INVALID_METADATA", `${path}.${key}`, `${key} must be an object or null.`));
    }
  });
  const issuer = value.issuingOrganizationRef == null ? null : value.issuingOrganizationRef;
  if (issuer !== null && (typeof issuer !== "string" || !issuer.trim())) {
    errors.push(issue("INVALID_ISSUER_REFERENCE", `${path}.issuingOrganizationRef`, "Issuer reference must be a nonempty string or null."));
  }
  const notes = value.notes == null ? null : value.notes;
  if (notes !== null && typeof notes !== "string") {
    errors.push(issue("INVALID_NOTES", `${path}.notes`, "Notes must be a string or null."));
  }
  return {
    type,
    season: season !== null && Number.isInteger(season) ? season : null,
    sourceRefs: normalizeRefs(value.sourceRefs, `${path}.sourceRefs`, errors),
    evidenceRefs: normalizeRefs(value.evidenceRefs, `${path}.evidenceRefs`, errors),
    verification: value.verification == null ? null : clone(value.verification),
    provenance: value.provenance == null ? null : clone(value.provenance),
    issuingOrganizationRef: typeof issuer === "string" ? issuer.trim() : null,
    notes,
    extensions: value.extensions == null ? null : clone(value.extensions),
  };
}

function normalizeCompleteness(value, errors) {
  if (value == null) return { status: RECOGNITION_COMPLETENESS.UNKNOWN, scope: null, limitations: [] };
  if (!isObject(value)) {
    errors.push(issue("INVALID_COMPLETENESS", "completeness", "Completeness must be an object or null."));
    return { status: RECOGNITION_COMPLETENESS.UNKNOWN, scope: null, limitations: [] };
  }
  const status = Object.values(RECOGNITION_COMPLETENESS).includes(value.status)
    ? value.status
    : RECOGNITION_COMPLETENESS.UNKNOWN;
  if (status !== value.status) errors.push(issue("INVALID_COMPLETENESS_STATUS", "completeness.status", "Completeness status is unsupported."));
  const scope = typeof value.scope === "string" && value.scope.trim() ? value.scope.trim() : null;
  if (status === RECOGNITION_COMPLETENESS.COMPLETE && !scope) {
    errors.push(issue("MISSING_COMPLETENESS_SCOPE", "completeness.scope", "Complete coverage requires a descriptive scope."));
  }
  const limitations = value.limitations == null ? [] : value.limitations;
  if (!Array.isArray(limitations) || limitations.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push(issue("INVALID_COMPLETENESS_LIMITATIONS", "completeness.limitations", "Completeness limitations must be strings."));
  }
  return { status, scope, limitations: Array.isArray(limitations) ? limitations.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()) : [] };
}

export function createRecognitionInput(input = {}) {
  const errors = [];
  const warnings = [];
  const value = isObject(input) ? input : {};
  if (!isObject(input)) errors.push(issue("INVALID_INPUT", "", "Recognition input must be an object."));
  const unsupported = Object.keys(value).find((key) => !INPUT_KEYS.has(key));
  if (unsupported) errors.push(issue("UNSUPPORTED_INPUT_FIELD", unsupported, "Unsupported input field."));

  const playerContext = validatePlayerContext(value.playerContext, errors);
  const evidenceState = Object.values(DATA_STATES).includes(value.evidenceState)
    ? value.evidenceState
    : DATA_STATES.UNKNOWN;
  if (value.evidenceState != null && evidenceState !== value.evidenceState) {
    errors.push(issue("INVALID_EVIDENCE_STATE", "evidenceState", "Evidence state must use DATA_STATES."));
  }
  const suppliedRecords = value.records == null ? [] : value.records;
  if (!Array.isArray(suppliedRecords)) errors.push(issue("INVALID_RECORD_COLLECTION", "records", "Records must be an array or null."));
  const records = (Array.isArray(suppliedRecords) ? suppliedRecords : [])
    .map((record, index) => normalizeRecord(record, index, errors))
    .filter(Boolean)
    .sort((left, right) => `${left.type.toLowerCase()}|${left.season ?? "UNKNOWN"}`.localeCompare(`${right.type.toLowerCase()}|${right.season ?? "UNKNOWN"}`));
  const identities = records.map((record) => `${record.type.toLowerCase()}|${record.season ?? "UNKNOWN"}`);
  if (new Set(identities).size !== identities.length) {
    errors.push(issue("DUPLICATE_RECOGNITION_RECORD", "records", "Exact structural duplicates are not permitted."));
  }
  const completeness = normalizeCompleteness(value.completeness, errors);
  if (evidenceState === DATA_STATES.UNKNOWN && records.length) {
    errors.push(issue("CONTRADICTORY_EVIDENCE_STATE", "evidenceState", "Missing or unknown evidence cannot contain supplied records."));
  }
  if (evidenceState === DATA_STATES.AVAILABLE && records.length === 0 && completeness.status !== RECOGNITION_COMPLETENESS.COMPLETE) {
    errors.push(issue("AMBIGUOUS_EMPTY_EVIDENCE", "completeness", "Available empty evidence requires an explicit COMPLETE declaration."));
  }
  if (completeness.status === RECOGNITION_COMPLETENESS.PARTIAL && records.length === 0) {
    warnings.push(issue("PARTIAL_WITHOUT_RECORDS", "records", "Partial evidence contains no supplied records."));
  }

  const result = {
    contract: RECOGNITION_INPUT_CONTRACT,
    version: RECOGNITION_INPUT_VERSION,
    playerContext,
    evidenceState,
    records,
    completeness,
    limitations: Array.isArray(value.limitations) ? value.limitations.map(clone) : [],
    validation: { valid: errors.length === 0, errors, warnings },
  };
  return deepFreeze(result);
}

export function validateRecognitionInput(input) {
  return createRecognitionInput(input).validation;
}

export function isRecognitionInput(value) {
  return Boolean(value && value.contract === RECOGNITION_INPUT_CONTRACT && value.version === RECOGNITION_INPUT_VERSION && value.validation?.valid);
}

export default {
  createRecognitionInput,
  validateRecognitionInput,
  isRecognitionInput,
  RECOGNITION_COMPLETENESS,
};
