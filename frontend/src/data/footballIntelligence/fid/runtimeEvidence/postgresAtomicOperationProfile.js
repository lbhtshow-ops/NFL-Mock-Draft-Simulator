import { deepFreeze } from "./contractSupport.js";
import { isCanonicalSha256Digest } from "./canonicalIdentity.js";

export const REF_V1_7_ADAPTER_VERSION = "1.0.0";
export const POSTGRES_TRANSACTION_POLICIES = Object.freeze(["ROLLBACK_REQUIRED", "COMMIT_PROHIBITED", "COMMIT_ALLOWED", "READ_ONLY_EXPECTED", "TRANSACTION_LOCAL_MUTATION_EXPECTED"]);
export const POSTGRES_STAGE_TYPES = Object.freeze(["GOVERNED_OPERATION", "BOUNDED_OBSERVATION"]);
const sensitive = /(password|passwd|credential|secret|token|api_?key|private_?key|connection_?string|database_?url|environment_?object|role_?graph|client|pool|query|statement|sql)/i;
const requiredRefs = ["profileRef", "manifestRef", "executionPlanRef", "observationPlanRef", "artifactRef", "artifactDigest", "authorizationRef", "targetRef", "environmentRef", "executionRef", "attemptRef", "correlationRef"];

function inspect(value, path, errors, seen = new Set()) {
  if (typeof value === "function") return errors.push({ code: "EXECUTABLE_PROFILE_INPUT_PROHIBITED", path });
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (sensitive.test(key)) errors.push({ code: "SENSITIVE_OR_UNRESTRICTED_PROFILE_FIELD", path: `${path}.${key}` });
    inspect(child, `${path}.${key}`, errors, seen);
  }
}

export function createPostgresAtomicOperationProfile(input = {}) {
  const errors = [];
  inspect(input, "$", errors);
  for (const key of requiredRefs) if (typeof input[key] !== "string" || !input[key]) errors.push({ code: "REQUIRED_PROFILE_REFERENCE_MISSING", path: `$.${key}` });
  if (!isCanonicalSha256Digest(input.artifactDigest)) errors.push({ code: "INVALID_ARTIFACT_DIGEST", path: "$.artifactDigest" });
  if (!POSTGRES_TRANSACTION_POLICIES.includes(input.transactionPolicy)) errors.push({ code: "UNSUPPORTED_TRANSACTION_POLICY", path: "$.transactionPolicy" });
  if (input.retryAllowed !== false) errors.push({ code: "ZERO_RETRY_REQUIRED", path: "$.retryAllowed" });
  if (input.interactiveContinuation === true) errors.push({ code: "INTERACTIVE_CONTINUATION_PROHIBITED", path: "$.interactiveContinuation" });
  if (!Number.isInteger(input.outputPolicy?.maximumBytes) || input.outputPolicy.maximumBytes < 1 || input.outputPolicy.maximumBytes > 8192 || !Number.isInteger(input.outputPolicy?.maximumRows) || input.outputPolicy.maximumRows < 0 || input.outputPolicy.maximumRows > 64) errors.push({ code: "BOUNDED_OUTPUT_POLICY_REQUIRED", path: "$.outputPolicy" });
  const stages = Array.isArray(input.stages) ? input.stages : [];
  if (!stages.length) errors.push({ code: "ORDERED_STAGES_REQUIRED", path: "$.stages" });
  const refs = new Set();
  stages.forEach((stage, index) => {
    const path = `$.stages[${index}]`;
    if (!stage || typeof stage !== "object") return errors.push({ code: "INVALID_STAGE", path });
    if (!stage.stageRef || refs.has(stage.stageRef)) errors.push({ code: refs.has(stage.stageRef) ? "DUPLICATE_STAGE" : "STAGE_REFERENCE_REQUIRED", path: `${path}.stageRef` });
    refs.add(stage.stageRef);
    if (stage.sequence !== index + 1) errors.push({ code: "STAGE_ORDER_INVALID", path: `${path}.sequence` });
    if (!POSTGRES_STAGE_TYPES.includes(stage.stageType)) errors.push({ code: "UNSUPPORTED_STAGE_TYPE", path: `${path}.stageType` });
    if (typeof stage.payloadText !== "string" || !stage.payloadText || !isCanonicalSha256Digest(stage.payloadDigest)) errors.push({ code: "EXACT_STAGE_PAYLOAD_BINDING_REQUIRED", path });
    if (stage.applicationData === true || stage.unrestrictedCatalog === true || stage.optional === true) errors.push({ code: "PROHIBITED_STAGE_SCOPE", path });
  });
  const result = { model: "PostgresAtomicOperationProfile", modelVersion: REF_V1_7_ADAPTER_VERSION, ...input, stages: stages.map((stage) => ({ ...stage })), stopConditions: [...(input.stopConditions ?? [])], prohibitedActions: [...(input.prohibitedActions ?? [])], extensions: { ...(input.extensions ?? {}) }, authorizationCreated: false, authorizationActivated: false, validation: { valid: errors.length === 0, errors } };
  return deepFreeze(result);
}
