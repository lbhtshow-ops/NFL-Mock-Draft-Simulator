export const ATHLETIC_MODELED_OUTPUT_DECLARATION_CONTRACT = "AthleticModeledOutputDeclaration";
export const ATHLETIC_MODELED_OUTPUT_DECLARATION_VERSION = "1.0.0";

const COMPONENT_SCORE_FIELDS = Object.freeze(["speed", "explosiveness", "agility", "strength", "sizeAdjustedAthleticism"]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.values(value).forEach(deepFreeze); return Object.freeze(value); }
function issue(code, path, message) { return Object.freeze({ code, path, message }); }
function score(value, path, errors) { if (value == null) return null; if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) { errors.push(issue("INVALID_DECLARED_SCORE", path, `${path} must be a finite number from 0 to 100 or null.`)); return null; } return value; }
function nullableString(value, path, errors) { if (value == null) return null; if (typeof value !== "string") { errors.push(issue("INVALID_TEXT", path, `${path} must be a string or null.`)); return null; } return value; }
function strings(value, path, errors) { if (value == null) return []; if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) { errors.push(issue("INVALID_TEXT_COLLECTION", path, `${path} must contain only strings.`)); return []; } return [...value]; }

export function createAthleticModeledOutputDeclaration(input = {}) {
  const errors = [];
  const value = isObject(input) ? input : {};
  if (!isObject(input)) errors.push(issue("INVALID_DECLARATION_INPUT", "", "Declaration input must be an object."));
  const supplied = isObject(value.componentScores) ? value.componentScores : {};
  if (value.componentScores != null && !isObject(value.componentScores)) errors.push(issue("INVALID_COMPONENT_SCORES", "componentScores", "componentScores must be an object or null."));
  const unsupported = Object.keys(supplied).find((field) => !COMPONENT_SCORE_FIELDS.includes(field));
  if (unsupported) errors.push(issue("UNSUPPORTED_SCORE_FIELD", `componentScores.${unsupported}`, "Unsupported Athletic component score."));
  const storedConfidence = value.storedConfidence == null ? null : value.storedConfidence;
  if (storedConfidence !== null && (typeof storedConfidence !== "number" || !Number.isFinite(storedConfidence))) errors.push(issue("INVALID_STORED_CONFIDENCE", "storedConfidence", "storedConfidence must be a finite number or null."));

  return deepFreeze({
    contract: ATHLETIC_MODELED_OUTPUT_DECLARATION_CONTRACT,
    contractVersion: ATHLETIC_MODELED_OUTPUT_DECLARATION_VERSION,
    classification: "LEGACY_DECLARED_MODELED_OUTPUT",
    owner: "UNKNOWN",
    overallScore: score(value.overallScore, "overallScore", errors),
    componentScores: Object.fromEntries(COMPONENT_SCORE_FIELDS.map((field) => [field, score(supplied[field], `componentScores.${field}`, errors)])),
    storedConfidence: typeof storedConfidence === "number" && Number.isFinite(storedConfidence) ? storedConfidence : null,
    strengths: strings(value.strengths, "strengths", errors),
    limitations: strings(value.limitations, "limitations", errors),
    summary: nullableString(value.summary, "summary", errors),
    sourceLabel: nullableString(value.sourceLabel, "sourceLabel", errors),
    lastUpdated: nullableString(value.lastUpdated, "lastUpdated", errors),
    derivationStatus: "UNKNOWN",
    governanceStatus: "TRANSITIONAL",
    calibrationStatus: "NOT_DOCUMENTED",
    reproducibilityStatus: "NOT_DOCUMENTED",
    canonicalDerivation: false,
    modelVersion: null,
    declaredBy: null,
    permittedUse: "COMPATIBILITY_ONLY",
    validation: { valid: errors.length === 0, errors },
  });
}

export function validateAthleticModeledOutputDeclaration(input) { return createAthleticModeledOutputDeclaration(input).validation; }
export function isAthleticModeledOutputDeclaration(value) { return Boolean(value && value.contract === ATHLETIC_MODELED_OUTPUT_DECLARATION_CONTRACT && value.contractVersion === ATHLETIC_MODELED_OUTPUT_DECLARATION_VERSION && value.validation?.valid === true && value.permittedUse === "COMPATIBILITY_ONLY"); }

export default { createAthleticModeledOutputDeclaration, validateAthleticModeledOutputDeclaration, isAthleticModeledOutputDeclaration };
