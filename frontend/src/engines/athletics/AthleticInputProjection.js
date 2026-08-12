export const ATHLETIC_INPUT_CONTRACT = "AthleticInputProjection";
export const ATHLETIC_INPUT_VERSION = "1.0.0";

export const ATHLETIC_UNKNOWN_STATES = Object.freeze({
  KNOWN: "KNOWN",
  UNKNOWN: "UNKNOWN",
  NOT_MEASURED: "NOT_MEASURED",
  NOT_REPORTED: "NOT_REPORTED",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

export const ATHLETIC_TESTING_AVAILABILITY = Object.freeze({
  AVAILABLE: "AVAILABLE",
  PARTIAL: "PARTIAL",
  UNAVAILABLE: "UNAVAILABLE",
  UNKNOWN: "UNKNOWN",
});

const MEASUREMENT_FIELDS = Object.freeze(["height", "weight", "armLength", "handSize", "wingSpan"]);
const TESTING_FIELDS = Object.freeze([
  "fortyYardDash", "tenYardSplit", "twentyYardSplit", "verticalJump", "broadJump",
  "threeCone", "shortShuttle", "benchPress", "gpsMetrics", "accelerationMetrics",
  "velocityMetrics", "gameSpeedMetrics",
]);
const PROHIBITED_KEYS = new Set([
  "score", "scores", "overallscore", "overallathleticscore", "confidence", "strengths",
  "summary", "explanation", "grade", "ranking", "recommendation", "normalization",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function clone(value) { if (Array.isArray(value)) return value.map(clone); if (!isObject(value)) return value; return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])); }
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.values(value).forEach(deepFreeze); return Object.freeze(value); }
function issue(code, path, message) { return Object.freeze({ code, path, message }); }
function normalizedKey(key) { return key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); }

function identity(value, errors) {
  if (!isObject(value)) { errors.push(issue("INVALID_IDENTITY", "identity", "Caller-supplied identity is required.")); return { playerId: null, playerName: null, position: null }; }
  const result = {};
  ["playerId", "playerName", "position"].forEach((field) => {
    if (typeof value[field] !== "string" || !value[field].trim()) errors.push(issue("MISSING_IDENTITY_FIELD", `identity.${field}`, `${field} is required.`));
    result[field] = typeof value[field] === "string" && value[field].trim() ? value[field] : null;
  });
  Object.entries(value).forEach(([key, item]) => { if (!Object.hasOwn(result, key)) result[key] = clone(item); });
  return result;
}

function objectiveValue(value, path, errors) {
  if (value === null) return null;
  if (["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) errors.push(issue("INVALID_NUMBER", path, "Numeric values must be finite."));
    if (typeof value === "string" && !value.trim()) errors.push(issue("INVALID_TEXT", path, "Text values must be nonempty."));
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => objectiveValue(item, `${path}.${index}`, errors));
  if (!isObject(value)) { errors.push(issue("INVALID_OBJECTIVE_VALUE", path, "Unsupported objective value.")); return null; }
  const result = {};
  Object.entries(value).forEach(([key, item]) => {
    if (PROHIBITED_KEYS.has(normalizedKey(key))) { errors.push(issue("PROHIBITED_ANALYTICAL_FIELD", `${path}.${key}`, `${key} is not Athletic input evidence.`)); return; }
    result[key] = objectiveValue(item, `${path}.${key}`, errors);
  });
  return result;
}

function fieldSet(value, fields, path, errors) {
  if (value != null && !isObject(value)) errors.push(issue("INVALID_FIELD_SET", path, `${path} must be an object or null.`));
  const input = isObject(value) ? value : {};
  const unknown = Object.keys(input).find((key) => !fields.includes(key));
  if (unknown) errors.push(issue("UNSUPPORTED_FIELD", `${path}.${unknown}`, `${unknown} must be placed in unknownFields.`));
  return Object.fromEntries(fields.map((field) => [field, objectiveValue(input[field] ?? null, `${path}.${field}`, errors)]));
}

function objectSection(value, path, errors) {
  if (value == null) return null;
  if (!isObject(value)) { errors.push(issue("INVALID_METADATA", path, `${path} must be an object or null.`)); return null; }
  return objectiveValue(value, path, errors);
}

function limitations(value, errors) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push(issue("INVALID_LIMITATIONS", "limitations", "limitations must contain nonempty strings.")); return [];
  }
  return [...value];
}

export function createAthleticInputProjection(input = {}) {
  const errors = [];
  const value = isObject(input) ? input : {};
  if (!isObject(input)) errors.push(issue("INVALID_ATHLETIC_INPUT", "", "Athletic input must be an object."));
  const availability = Object.values(ATHLETIC_TESTING_AVAILABILITY).includes(value.testingAvailability)
    ? value.testingAvailability : ATHLETIC_TESTING_AVAILABILITY.UNKNOWN;
  if (!Object.values(ATHLETIC_TESTING_AVAILABILITY).includes(value.testingAvailability)) errors.push(issue("INVALID_TESTING_AVAILABILITY", "testingAvailability", "Explicit supported testing availability is required."));
  const unknownFields = value.unknownFields == null ? {} : objectSection(value.unknownFields, "unknownFields", errors);

  return deepFreeze({
    contract: ATHLETIC_INPUT_CONTRACT,
    contractVersion: ATHLETIC_INPUT_VERSION,
    identity: identity(value.identity, errors),
    measurements: fieldSet(value.measurements, MEASUREMENT_FIELDS, "measurements", errors),
    testing: fieldSet(value.testing, TESTING_FIELDS, "testing", errors),
    testingAvailability: availability,
    testingContext: objectSection(value.testingContext, "testingContext", errors),
    measurementMetadata: objectSection(value.measurementMetadata, "measurementMetadata", errors),
    testingMetadata: objectSection(value.testingMetadata, "testingMetadata", errors),
    evidenceMetadata: objectSection(value.evidenceMetadata, "evidenceMetadata", errors),
    limitations: limitations(value.limitations, errors),
    unknownFields: unknownFields || {},
    validation: { valid: errors.length === 0, errors },
  });
}

export function validateAthleticInputProjection(input) { return createAthleticInputProjection(input).validation; }
export function isAthleticInputProjection(value) { return Boolean(value && value.contract === ATHLETIC_INPUT_CONTRACT && value.contractVersion === ATHLETIC_INPUT_VERSION && value.validation?.valid === true); }

export default { createAthleticInputProjection, validateAthleticInputProjection, isAthleticInputProjection, ATHLETIC_TESTING_AVAILABILITY, ATHLETIC_UNKNOWN_STATES };
