export const PREFLIGHT_RESULT_CLASSIFICATIONS_017C23 = Object.freeze({
  exact: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_EXACT_BEFORE_STATE",
  review: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_REVIEW_REQUIRED",
  blocked: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_BLOCKED",
  failed: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_EXECUTION_FAILED",
  incomplete: "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_PREFLIGHT_RESULT_INCOMPLETE",
});

const TARGET = Object.freeze({
  projectId: "ahmorpzcaapvoymiqlkv",
  database: "Primary Database",
  branch: "main",
  sqlRole: "postgres",
});

const exactObject = (actual, expected) => expected
  && Object.keys(expected).every((key) => actual?.[key] === expected[key]);

export function evaluateFidFunctionOwnerCapabilityAmendment017c23Result(evidence) {
  const C = PREFLIGHT_RESULT_CLASSIFICATIONS_017C23;
  if (!evidence || evidence.resultSetPresent === false) return Object.freeze({ classification: C.incomplete, reasons: Object.freeze(["missing_result_set"]) });
  if (evidence.sqlError || evidence.executionFailed) return Object.freeze({ classification: C.failed, reasons: Object.freeze(["sql_execution_failed"]) });
  if (evidence.allResultSetsComplete !== true || evidence.requiredColumnsComplete !== true) {
    return Object.freeze({ classification: C.incomplete, reasons: Object.freeze(["complete_sanitized_evidence_required"]) });
  }

  const review = [];
  const blocked = [];
  if (evidence.projectIdentitySeparatelyConfirmed !== true) review.push("project_identity_not_separately_confirmed");
  if (!evidence.target || ["projectId", "database", "branch", "sqlRole"].some((key) => evidence.target[key] == null)) review.push("target_identity_missing");
  else if (!exactObject(evidence.target, TARGET)) blocked.push("target_identity_drift");
  if (evidence.currentUser == null || evidence.sessionUser == null || evidence.schema == null) review.push("database_identity_unresolved");
  else if (evidence.currentUser !== "postgres" || evidence.sessionUser !== "postgres" || evidence.schema !== "fid") blocked.push("database_identity_drift");
  if (evidence.governedRolesExact == null) review.push("governed_roles_unresolved");
  else if (evidence.governedRolesExact !== true) blocked.push("governed_role_drift");

  const expectedMembership = { member: true, admin: true, inherit: false, set: false };
  const expectedOwner = { login: false, superuser: false, createdb: false, createrole: false, replication: false, bypassrls: false, inherit: false };
  const expectedSchema = { ownerUsage: true, ownerCreate: false, postgresGrantAuthority: true, ownerCreateOnOtherGovernedSchemas: false };
  if (evidence.membership == null) review.push("membership_unresolved");
  else if (!exactObject(evidence.membership, expectedMembership)) blocked.push("membership_drift");
  if (evidence.ownerRole == null) review.push("owner_role_unresolved");
  else if (!exactObject(evidence.ownerRole, expectedOwner)) blocked.push("owner_role_drift");
  if (evidence.schemaPrivileges == null) review.push("schema_privileges_unresolved");
  else if (!exactObject(evidence.schemaPrivileges, expectedSchema) || evidence.schemaPrivileges.effectiveCreateWithoutGrantAuthority === true) blocked.push("schema_privilege_drift");

  const matrixKeys = [
    "corrected261UnitsExact", "sevenBaselineTablesExact", "ownerPrivilegesExact",
    "serviceRoleBoundaryExact", "browserAndPublicDenialsExact", "functionBoundaryExact",
    "noUnexpectedTable", "noUnexpectedFunction", "noSequenceInFid",
    "noUnexpectedOwnership", "noUnexpectedGrantOption", "directAndEffectiveRelationshipsExact",
  ];
  if (!evidence.aclMatrix || matrixKeys.some((key) => evidence.aclMatrix[key] == null)) review.push("acl_matrix_unresolved");
  else if (matrixKeys.some((key) => evidence.aclMatrix[key] !== true)) blocked.push("acl_matrix_drift");

  const migrationKeys = ["migration014ObjectsAbsent", "migration014MetadataAbsent", "fullyRolledBack", "migrations001Through013Governed"];
  if (!evidence.migrationState || migrationKeys.some((key) => evidence.migrationState[key] == null)) review.push("migration_state_unresolved");
  else if (migrationKeys.some((key) => evidence.migrationState[key] !== true)) blocked.push("migration_state_drift");

  if (blocked.length) return Object.freeze({ classification: C.blocked, reasons: Object.freeze(blocked) });
  if (review.length) return Object.freeze({ classification: C.review, reasons: Object.freeze(review) });
  return Object.freeze({ classification: C.exact, reasons: Object.freeze([]) });
}

export default evaluateFidFunctionOwnerCapabilityAmendment017c23Result;
