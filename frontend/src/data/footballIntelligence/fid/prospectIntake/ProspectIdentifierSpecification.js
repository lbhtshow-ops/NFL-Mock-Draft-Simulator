import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";
import { PROSPECT_IDENTIFIER_FORMAT_STATUSES, PROSPECT_IDENTIFIER_SPECIFICATION_CONTRACT_NAME, PROSPECT_IDENTIFIER_SPECIFICATION_CONTRACT_VERSION, PROSPECT_IDENTIFIER_TYPES } from "./prospectIdentifierConventionConstants.js";

const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const requiredText = (value, path, errors) => { if (typeof value !== "string" || !value.trim()) { errors.push({ code: "MISSING_REQUIRED_FIELD", path }); return null; } return value.trim(); };
const bool = (value, path, errors) => { if (typeof value !== "boolean") errors.push({ code: "BOOLEAN_REQUIRED", path }); return value === true; };

export function createProspectIdentifierSpecification(input = {}) {
  const x = isObject(input) ? input : {}; const errors = [];
  if (!isObject(input)) errors.push({ code: "INVALID_SPECIFICATION", path: "" });
  const identifierType = requiredText(x.identifierType, "identifierType", errors);
  const formatStatus = requiredText(x.formatStatus, "formatStatus", errors);
  if (identifierType && !Object.values(PROSPECT_IDENTIFIER_TYPES).includes(identifierType)) errors.push({ code: "UNRECOGNIZED_IDENTIFIER_TYPE", path: "identifierType" });
  if (formatStatus && !Object.values(PROSPECT_IDENTIFIER_FORMAT_STATUSES).includes(formatStatus)) errors.push({ code: "UNRECOGNIZED_FORMAT_STATUS", path: "formatStatus" });
  const result = { contract: PROSPECT_IDENTIFIER_SPECIFICATION_CONTRACT_NAME, contractVersion: PROSPECT_IDENTIFIER_SPECIFICATION_CONTRACT_VERSION, identifierType, semanticOwner: requiredText(x.semanticOwner, "semanticOwner", errors), namespace: requiredText(x.namespace, "namespace", errors), format: requiredText(x.format, "format", errors), formatStatus, issuer: requiredText(x.issuer, "issuer", errors), callerSuppliedAllowed: bool(x.callerSuppliedAllowed, "callerSuppliedAllowed", errors), deterministic: bool(x.deterministic, "deterministic", errors), opaque: bool(x.opaque, "opaque", errors), immutable: bool(x.immutable, "immutable", errors), revisionScoped: bool(x.revisionScoped, "revisionScoped", errors), draftCycleScoped: bool(x.draftCycleScoped, "draftCycleScoped", errors), persistenceScoped: bool(x.persistenceScoped, "persistenceScoped", errors), globallyUnique: bool(x.globallyUnique, "globallyUnique", errors), domainUnique: bool(x.domainUnique, "domainUnique", errors), reuseRequired: bool(x.reuseRequired, "reuseRequired", errors), mergeBehavior: requiredText(x.mergeBehavior, "mergeBehavior", errors), deprecationBehavior: requiredText(x.deprecationBehavior, "deprecationBehavior", errors), validationRule: requiredText(x.validationRule, "validationRule", errors), prohibitedInputs: Array.isArray(x.prohibitedInputs) ? [...new Set(x.prohibitedInputs)] : [], notes: x.notes ?? null, validation: { valid: errors.length === 0, errors, warnings: [], checkedAt: null, contractVersion: PROSPECT_IDENTIFIER_SPECIFICATION_CONTRACT_VERSION } };
  return deepFreeze(result);
}
export const validateProspectIdentifierSpecification = (value) => createProspectIdentifierSpecification(value).validation;
export const isProspectIdentifierSpecification = (value) => Boolean(value?.contract === PROSPECT_IDENTIFIER_SPECIFICATION_CONTRACT_NAME && validateProspectIdentifierSpecification(value).valid);
export default Object.freeze({ createProspectIdentifierSpecification, validateProspectIdentifierSpecification, isProspectIdentifierSpecification });
