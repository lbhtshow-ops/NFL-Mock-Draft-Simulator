import { DATA_STATES } from "../contracts/IntelligenceResultContract.js";
import { isProductionModeledOutputDeclaration } from "./ProductionModeledOutputDeclaration.js";

export const PRODUCTION_INPUT_CONTRACT = "ProductionInputProjection";
export const PRODUCTION_INPUT_VERSION = "1.0.0";
export const PRODUCTION_COMPLETENESS = Object.freeze({ COMPLETE: "COMPLETE", PARTIAL: "PARTIAL", UNKNOWN: "UNKNOWN" });
export const PRODUCTION_SAMPLE_STATUS = Object.freeze({ SUFFICIENT: "SUFFICIENT", INSUFFICIENT: "INSUFFICIENT", UNKNOWN: "UNKNOWN", NOT_APPLICABLE: "NOT_APPLICABLE" });

const PROHIBITED_EVIDENCE_KEYS = new Set([
  "productionscores", "overallproductionscore", "consistency", "efficiency",
  "explosiveness", "situationalproduction", "strengths", "concerns", "notes",
  "tier", "grade", "ranking", "recommendation", "teamfit", "schemefit",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function clone(value) { if (Array.isArray(value)) return value.map(clone); if (!isObject(value)) return value; return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])); }
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.values(value).forEach(deepFreeze); return Object.freeze(value); }
function issue(code, path, message) { return { code, path, message }; }

function playerContext(value, errors) {
  if (!isObject(value)) { errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext", "Governed Player Context is required.")); return null; }
  if (typeof value.available !== "boolean") errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.available", "available must be boolean."));
  if (typeof value.playerId !== "string" || !value.playerId.trim()) errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.playerId", "playerId is required."));
  if (!isObject(value.competition) || typeof value.competition.level !== "string") errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.competition", "competition.level is required."));
  if (typeof value.careerStage !== "string" || !value.careerStage) errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.careerStage", "careerStage is required."));
  if (typeof value.frameworkVersion !== "string" || !value.frameworkVersion) errors.push(issue("INVALID_PLAYER_CONTEXT", "playerContext.frameworkVersion", "frameworkVersion is required."));
  return clone(value);
}

function objectiveValue(value, path, errors, counters) {
  if (value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) { errors.push(issue("INVALID_OBJECTIVE_NUMBER", path, "Objective numeric values must be finite and nonnegative.")); return null; }
    counters.supplied += 1;
    return value;
  }
  if (typeof value === "string") {
    if (!value.trim()) { errors.push(issue("INVALID_OBJECTIVE_TEXT", path, "Objective text must be nonempty.")); return null; }
    if (Number.isFinite(Number(value))) { errors.push(issue("NUMERIC_STRING_NOT_ACCEPTED", path, "Numeric strings are not accepted as objective numbers.")); return null; }
    counters.supplied += 1;
    return value.trim();
  }
  if (!isObject(value)) { errors.push(issue("INVALID_OBJECTIVE_VALUE", path, "Objective evidence supports nested objects, finite numbers, strings, and null.")); return null; }
  const result = {};
  Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).forEach(([key, item]) => {
    const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
    if (PROHIBITED_EVIDENCE_KEYS.has(normalized)) { errors.push(issue("PROHIBITED_ANALYTICAL_FIELD", `${path}.${key}`, `${key} is not objective Production evidence.`)); return; }
    result[key] = objectiveValue(item, `${path}.${key}`, errors, counters);
  });
  return result;
}

function completeness(value, errors) {
  const input = isObject(value) ? value : {};
  if (!isObject(value)) errors.push(issue("INVALID_COMPLETENESS", "completeness", "Explicit completeness is required."));
  const status = Object.values(PRODUCTION_COMPLETENESS).includes(input.status) ? input.status : PRODUCTION_COMPLETENESS.UNKNOWN;
  if (status !== input.status) errors.push(issue("INVALID_COMPLETENESS_STATUS", "completeness.status", "Unsupported completeness status."));
  const scope = typeof input.scope === "string" && input.scope.trim() ? input.scope.trim() : null;
  const limitations = Array.isArray(input.limitations) && input.limitations.every((item) => typeof item === "string" && item.trim()) ? input.limitations.map((item) => item.trim()) : [];
  if (input.limitations != null && limitations.length !== input.limitations.length) errors.push(issue("INVALID_LIMITATIONS", "completeness.limitations", "Limitations must be nonempty strings."));
  if (status === PRODUCTION_COMPLETENESS.COMPLETE && !scope) errors.push(issue("MISSING_COMPLETENESS_SCOPE", "completeness.scope", "COMPLETE requires a defined scope."));
  if (status === PRODUCTION_COMPLETENESS.PARTIAL && limitations.length === 0) errors.push(issue("MISSING_PARTIAL_LIMITATION", "completeness.limitations", "PARTIAL requires an explicit limitation."));
  return { status, scope, limitations };
}

function sample(value, errors) {
  const input = isObject(value) ? value : {};
  if (!isObject(value)) errors.push(issue("INVALID_SAMPLE_DECLARATION", "sample", "Explicit sample declaration is required."));
  const status = Object.values(PRODUCTION_SAMPLE_STATUS).includes(input.status) ? input.status : PRODUCTION_SAMPLE_STATUS.UNKNOWN;
  if (status !== input.status) errors.push(issue("INVALID_SAMPLE_STATUS", "sample.status", "Unsupported sample status."));
  const opportunities = input.opportunities == null ? null : objectiveValue(input.opportunities, "sample.opportunities", errors, { supplied: 0 });
  return { status, opportunities };
}

export function createProductionInput(input = {}) {
  const errors = [];
  const value = isObject(input) ? input : {};
  if (!isObject(input)) errors.push(issue("INVALID_PRODUCTION_INPUT", "", "Production input must be an object."));
  const context = playerContext(value.playerContext, errors);
  const allowedStates = [DATA_STATES.AVAILABLE, DATA_STATES.UNAVAILABLE, DATA_STATES.UNKNOWN, DATA_STATES.INSUFFICIENT_SAMPLE];
  const evidenceState = allowedStates.includes(value.evidenceState) ? value.evidenceState : DATA_STATES.UNKNOWN;
  if (!allowedStates.includes(value.evidenceState)) errors.push(issue("INVALID_EVIDENCE_STATE", "evidenceState", "Unsupported Production evidence state."));
  const counters = { supplied: 0 };
  const objectiveEvidence = value.objectiveEvidence == null ? null : objectiveValue(value.objectiveEvidence, "objectiveEvidence", errors, counters);
  const coverage = completeness(value.completeness, errors);
  const sampleDeclaration = sample(value.sample, errors);
  const hasEvidence = counters.supplied > 0;
  if ([DATA_STATES.AVAILABLE, DATA_STATES.INSUFFICIENT_SAMPLE].includes(evidenceState) && !hasEvidence) errors.push(issue("MISSING_OBJECTIVE_EVIDENCE", "objectiveEvidence", "The declared state requires objective evidence."));
  if ([DATA_STATES.UNKNOWN, DATA_STATES.UNAVAILABLE].includes(evidenceState) && hasEvidence) errors.push(issue("CONTRADICTORY_EVIDENCE_STATE", "evidenceState", "Missing or unknown evidence cannot contain supplied objective facts."));
  if (evidenceState === DATA_STATES.UNKNOWN && coverage.status !== PRODUCTION_COMPLETENESS.UNKNOWN) errors.push(issue("CONTRADICTORY_COMPLETENESS", "completeness.status", "Unknown evidence requires UNKNOWN completeness."));
  if (evidenceState === DATA_STATES.INSUFFICIENT_SAMPLE && sampleDeclaration.status !== PRODUCTION_SAMPLE_STATUS.INSUFFICIENT) errors.push(issue("SAMPLE_STATE_MISMATCH", "sample.status", "INSUFFICIENT_SAMPLE requires an INSUFFICIENT declaration."));
  if (evidenceState === DATA_STATES.AVAILABLE && sampleDeclaration.status === PRODUCTION_SAMPLE_STATUS.INSUFFICIENT) errors.push(issue("SAMPLE_STATE_MISMATCH", "sample.status", "Available evidence cannot declare an insufficient sample state."));
  if ([DATA_STATES.AVAILABLE, DATA_STATES.INSUFFICIENT_SAMPLE].includes(evidenceState) && !coverage.scope) errors.push(issue("MISSING_EVIDENCE_SCOPE", "completeness.scope", "Supplied Production evidence requires a descriptive scope."));
  let legacyModeledOutputDeclaration = null;
  if (value.legacyModeledOutputDeclaration != null) {
    if (!isProductionModeledOutputDeclaration(value.legacyModeledOutputDeclaration)) errors.push(issue("INVALID_MODELED_OUTPUT_DECLARATION", "legacyModeledOutputDeclaration", "The optional declaration is invalid."));
    else legacyModeledOutputDeclaration = clone(value.legacyModeledOutputDeclaration);
  }
  return deepFreeze({
    contract: PRODUCTION_INPUT_CONTRACT,
    contractVersion: PRODUCTION_INPUT_VERSION,
    playerContext: context,
    evidenceState,
    objectiveEvidence,
    completeness: coverage,
    sample: sampleDeclaration,
    legacyModeledOutputDeclaration,
    validation: { valid: errors.length === 0, errors },
  });
}

export function validateProductionInput(input) { return createProductionInput(input).validation; }
export function isProductionInput(value) { return Boolean(value && value.contract === PRODUCTION_INPUT_CONTRACT && value.contractVersion === PRODUCTION_INPUT_VERSION && value.validation?.valid === true); }
export default { createProductionInput, validateProductionInput, isProductionInput, PRODUCTION_COMPLETENESS, PRODUCTION_SAMPLE_STATUS };
