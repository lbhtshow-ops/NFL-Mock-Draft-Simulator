import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";
import { PROSPECT_IDENTITY_DECISIONS, PROSPECT_IDENTITY_DRY_RUN_PLAN_CONTRACT_NAME, PROSPECT_IDENTITY_DRY_RUN_PLAN_CONTRACT_VERSION, PROSPECT_IDENTITY_DRY_RUN_PLAN_SCHEMA_VERSION, PROSPECT_IDENTITY_GOVERNANCE, PROSPECT_IDENTITY_READINESS_STATES } from "./prospectIdentityDryRunConstants.js";

const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const array = (value) => Array.isArray(value) ? structuredClone(value) : [];
export function createProspectIdentityDryRunPlan(input = {}) {
  const x = isObject(input) ? input : {}; const errors = [];
  const required = (key) => { if (typeof x[key] !== "string" || !x[key].trim()) errors.push({ code: "MISSING_REQUIRED_FIELD", path: key, message: `${key} is required.` }); return typeof x[key] === "string" && x[key].trim() ? x[key].trim() : null; };
  const decision = required("decision"); const readiness = required("readiness");
  if (decision && !Object.values(PROSPECT_IDENTITY_DECISIONS).includes(decision)) errors.push({ code: "UNRECOGNIZED_DECISION", path: "decision", message: "decision is not recognized." });
  if (readiness && !Object.values(PROSPECT_IDENTITY_READINESS_STATES).includes(readiness)) errors.push({ code: "UNRECOGNIZED_READINESS", path: "readiness", message: "readiness is not recognized." });
  const governance = { ...PROSPECT_IDENTITY_GOVERNANCE, ...(isObject(x.governance) ? x.governance : {}) };
  for (const [key, value] of Object.entries(PROSPECT_IDENTITY_GOVERNANCE)) if (governance[key] !== value) errors.push({ code: "INVALID_GOVERNANCE", path: `governance.${key}`, message: `${key} must remain ${value}.` });
  return deepFreeze({ contract: PROSPECT_IDENTITY_DRY_RUN_PLAN_CONTRACT_NAME, contractVersion: PROSPECT_IDENTITY_DRY_RUN_PLAN_CONTRACT_VERSION, schemaVersion: PROSPECT_IDENTITY_DRY_RUN_PLAN_SCHEMA_VERSION, requestIdentity: structuredClone(x.requestIdentity ?? {}), candidateIdentity: structuredClone(x.candidateIdentity ?? {}), existingMatches: array(x.existingMatches), duplicateCandidates: array(x.duplicateCandidates), referenceAssessment: structuredClone(x.referenceAssessment ?? {}), draftCycleAssessment: structuredClone(x.draftCycleAssessment ?? {}), recordAssessment: array(x.recordAssessment), conflicts: array(x.conflicts), blockers: array(x.blockers), warnings: array(x.warnings), requiredFutureActions: array(x.requiredFutureActions), prohibitedActions: array(x.prohibitedActions), readiness, decision, governance, validation: { valid: errors.length === 0, errors, warnings: [], checkedAt: null, contractVersion: PROSPECT_IDENTITY_DRY_RUN_PLAN_CONTRACT_VERSION, schemaVersion: PROSPECT_IDENTITY_DRY_RUN_PLAN_SCHEMA_VERSION } });
}
export function validateProspectIdentityDryRunPlan(value) { return createProspectIdentityDryRunPlan(value).validation; }
export function isProspectIdentityDryRunPlan(value) { return Boolean(isObject(value) && value.contract === PROSPECT_IDENTITY_DRY_RUN_PLAN_CONTRACT_NAME && validateProspectIdentityDryRunPlan(value).valid); }
export default Object.freeze({ createProspectIdentityDryRunPlan, validateProspectIdentityDryRunPlan, isProspectIdentityDryRunPlan });
