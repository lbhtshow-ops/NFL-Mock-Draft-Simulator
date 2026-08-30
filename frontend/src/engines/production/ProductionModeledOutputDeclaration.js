export const PRODUCTION_MODELED_OUTPUT_DECLARATION_CONTRACT =
  "ProductionModeledOutputDeclaration";
export const PRODUCTION_MODELED_OUTPUT_DECLARATION_VERSION = "1.0.0";

export const PRODUCTION_MODELED_OUTPUT_STATUSES = Object.freeze({
  DERIVATION: "UNKNOWN",
  GOVERNANCE: "TRANSITIONAL",
  CALIBRATION: "NOT_DOCUMENTED",
});

export const PRODUCTION_MODELED_OUTPUT_REMOVAL_CONDITION =
  "Remove after active evaluation and Decision Engine consumers no longer depend on undocumented stored Production scores, or after a governed Production model replaces them through an approved migration.";

const SCORE_FIELDS = Object.freeze([
  "consistency",
  "efficiency",
  "explosiveness",
  "situationalProduction",
  "overallProductionScore",
]);

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function issue(code, path, message) {
  return Object.freeze({ code, path, message });
}

function score(value, path, errors) {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(issue("INVALID_DECLARED_SCORE", path, `${path} must be a finite number from 0 to 100 or null.`));
    return null;
  }
  return value;
}

function strings(value, path, errors) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(issue("INVALID_TEXT_COLLECTION", path, `${path} must contain only strings.`));
    return [];
  }
  return [...value];
}

export function createProductionModeledOutputDeclaration(input = {}) {
  const errors = [];
  const value = isObject(input) ? input : {};
  if (!isObject(input)) errors.push(issue("INVALID_DECLARATION_INPUT", "", "Declaration input must be an object."));

  const suppliedScores = isObject(value.productionScores) ? value.productionScores : {};
  if (value.productionScores != null && !isObject(value.productionScores)) {
    errors.push(issue("INVALID_SCORE_COLLECTION", "productionScores", "productionScores must be an object or null."));
  }
  const productionScores = Object.fromEntries(
    SCORE_FIELDS.map((field) => [field, score(suppliedScores[field], `productionScores.${field}`, errors)])
  );
  const unknownScore = Object.keys(suppliedScores).find((field) => !SCORE_FIELDS.includes(field));
  if (unknownScore) errors.push(issue("UNSUPPORTED_SCORE_FIELD", `productionScores.${unknownScore}`, "Unsupported modeled score field."));

  const sourceLabel = value.sourceLabel == null ? null : value.sourceLabel;
  if (sourceLabel !== null && typeof sourceLabel !== "string") errors.push(issue("INVALID_SOURCE_LABEL", "sourceLabel", "sourceLabel must be a string or null."));
  const lastUpdated = value.lastUpdated == null ? null : value.lastUpdated;
  if (lastUpdated !== null && typeof lastUpdated !== "string") errors.push(issue("INVALID_LAST_UPDATED", "lastUpdated", "lastUpdated must be a string or null."));
  const notes = value.notes == null ? null : value.notes;
  if (notes !== null && typeof notes !== "string") errors.push(issue("INVALID_NOTES", "notes", "notes must be a string or null."));

  return deepFreeze({
    contract: PRODUCTION_MODELED_OUTPUT_DECLARATION_CONTRACT,
    contractVersion: PRODUCTION_MODELED_OUTPUT_DECLARATION_VERSION,
    classification: "LEGACY_DECLARED_MODELED_OUTPUT",
    productionScores,
    strengths: strings(value.strengths, "strengths", errors),
    concerns: strings(value.concerns, "concerns", errors),
    notes: typeof notes === "string" ? notes : null,
    declaredBy: null,
    sourceLabel: typeof sourceLabel === "string" ? sourceLabel : null,
    lastUpdated: typeof lastUpdated === "string" ? lastUpdated : null,
    derivationStatus: PRODUCTION_MODELED_OUTPUT_STATUSES.DERIVATION,
    governanceStatus: PRODUCTION_MODELED_OUTPUT_STATUSES.GOVERNANCE,
    calibrationStatus: PRODUCTION_MODELED_OUTPUT_STATUSES.CALIBRATION,
    canonicalDerivation: false,
    modelVersion: null,
    limitations: [
      "Stored Production scores have no documented formula, calibration record, model version, or reproducible derivation.",
      "The source label is preserved as a legacy label and is not verified provenance.",
    ],
    extensions: null,
    removalCondition: PRODUCTION_MODELED_OUTPUT_REMOVAL_CONDITION,
    validation: { valid: errors.length === 0, errors },
  });
}

export function validateProductionModeledOutputDeclaration(input) {
  return createProductionModeledOutputDeclaration(input).validation;
}

export function isProductionModeledOutputDeclaration(value) {
  return Boolean(
    value &&
      value.contract === PRODUCTION_MODELED_OUTPUT_DECLARATION_CONTRACT &&
      value.contractVersion === PRODUCTION_MODELED_OUTPUT_DECLARATION_VERSION &&
      value.validation?.valid === true &&
      value.canonicalDerivation === false
  );
}

export default {
  createProductionModeledOutputDeclaration,
  validateProductionModeledOutputDeclaration,
  isProductionModeledOutputDeclaration,
};
