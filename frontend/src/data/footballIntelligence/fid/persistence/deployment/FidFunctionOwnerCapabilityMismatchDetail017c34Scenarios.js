export const EXACT_TARGET_017C34 = Object.freeze({ organization: "Lunch Break Hot Take", projectName: "LBHT FID Persistence Test", region: "us-east-1",
  projectId: "ahmorpzcaapvoymiqlkv", database: "Primary Database", branch: "main", sqlRole: "postgres",
  governedEnvironment: "DEDICATED_NON_PRODUCTION_TEST" });
export const TARGET_FIELD_ORDER_017C34 = Object.freeze(["organization", "projectName", "region", "projectId", "database", "branch", "sqlRole", "governedEnvironment"]);

export function evaluateExactTarget017c34({ target, outputFields = TARGET_FIELD_ORDER_017C34, mismatchCount = 0, classification = "NO_MISMATCHES", clientOverride = false, environmentOverride = false }) {
  const failures = [];
  for (const [field, expected] of Object.entries(EXACT_TARGET_017C34)) if (target?.[field] !== expected) failures.push(`invalid_${field}`);
  if (clientOverride) failures.push("client_override_attempt");
  if (environmentOverride) failures.push("environment_override_attempt");
  if (JSON.stringify(outputFields) !== JSON.stringify(TARGET_FIELD_ORDER_017C34)) failures.push("output_contract");
  const bindingValid = failures.length === 0;
  if (!bindingValid && !["TARGET_BINDING_INCONSISTENT", "EVIDENCE_UNRESOLVED"].includes(classification)) failures.push("invalid_target_usable_classification");
  return Object.freeze({ accepted: failures.length === 0, bindingValid, mismatchCount, failures: Object.freeze([...new Set(failures)]) });
}

const altered = (id, field, value, extra = {}) => Object.freeze({ id, input: Object.freeze({ target: Object.freeze({ ...EXACT_TARGET_017C34, [field]: value }), ...extra }), expectedFailure: `invalid_${field}` });
export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C34_SCENARIOS = Object.freeze([
  altered("missing-organization", "organization", undefined), altered("wrong-organization", "organization", "Other"), altered("case-organization", "organization", "LUNCH BREAK HOT TAKE"), altered("space-organization", "organization", "Lunch Break Hot Take "),
  altered("missing-project-name", "projectName", undefined), altered("wrong-project-name", "projectName", "Other"), altered("case-project-name", "projectName", "lbht fid persistence test"),
  altered("missing-region", "region", undefined), altered("wrong-region", "region", "us-west-1"), altered("missing-project-id", "projectId", undefined), altered("wrong-project-id", "projectId", "wrong"),
  altered("wrong-database", "database", "Replica"), altered("wrong-branch", "branch", "develop"), altered("wrong-role", "sqlRole", "anon"), altered("wrong-environment", "governedEnvironment", "PRODUCTION"),
  altered("dashboard-label-environment", "governedEnvironment", "PRODUCTION"),
  Object.freeze({ id: "client-override", input: Object.freeze({ target: EXACT_TARGET_017C34, clientOverride: true }), expectedFailure: "client_override_attempt" }),
  Object.freeze({ id: "environment-override", input: Object.freeze({ target: EXACT_TARGET_017C34, environmentOverride: true }), expectedFailure: "environment_override_attempt" }),
  altered("invalid-target-passing-classification", "region", "wrong", { classification: "NO_MISMATCHES" }),
  altered("invalid-target-zero-mismatches", "region", "wrong", { mismatchCount: 0 }), altered("invalid-target-five-mismatches", "region", "wrong", { mismatchCount: 5, classification: "MISMATCH_DETAIL_REVIEW_REQUIRED" }),
  Object.freeze({ id: "missing-output-field", input: Object.freeze({ target: EXACT_TARGET_017C34, outputFields: TARGET_FIELD_ORDER_017C34.slice(0, 7) }), expectedFailure: "output_contract" }),
  Object.freeze({ id: "output-order-drift", input: Object.freeze({ target: EXACT_TARGET_017C34, outputFields: Object.freeze(["projectName", "organization", ...TARGET_FIELD_ORDER_017C34.slice(2)]) }), expectedFailure: "output_contract" }),
]);
export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C34_SCENARIOS;
