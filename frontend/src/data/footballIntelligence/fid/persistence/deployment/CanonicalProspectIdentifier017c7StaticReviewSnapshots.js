export const CANONICAL_PROSPECT_IDENTIFIER_017C7_STATIC_REVIEW_SNAPSHOTS = Object.freeze({
  exactApprovedReview: Object.freeze({ status: "READY_FOR_CONTROLLED_SUPABASE_OWNERSHIP_CAPABILITY_READ_ONLY_PREFLIGHT_EXECUTION", authorizedExecutions: 1 }),
  wrongProject: Object.freeze({ status: "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_REVIEW_BLOCKED", authorizedExecutions: 0 }),
  wrongDatabase: Object.freeze({ status: "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_REVIEW_BLOCKED", authorizedExecutions: 0 }),
  wrongSqlEditorRole: Object.freeze({ status: "SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_REVIEW_BLOCKED", authorizedExecutions: 0 }),
  currentUserMismatch: Object.freeze({ classification: "EXECUTION_IDENTITY_MISMATCH", transferCapable: false }),
  sessionUserMismatch: Object.freeze({ classification: "EXECUTION_IDENTITY_MISMATCH", transferCapable: false }),
  noSetCapability: Object.freeze({ classification: "MEMBER_WITHOUT_SET_OR_ADMIN_CAPABILITY", transferCapable: false }),
  noDeploymentSchemaCreate: Object.freeze({ classification: "DEPLOYMENT_ROLE_SCHEMA_CAPABILITY_MISSING", transferCapable: false }),
  noOwnerSchemaCreate: Object.freeze({ classification: "TARGET_OWNER_SCHEMA_CAPABILITY_MISSING", transferCapable: false }),
  adminWithoutSet: Object.freeze({ classification: "MEMBERSHIP_AMENDMENT_AUTHORITY_PRESENT_REVIEW_REQUIRED", transferCapable: false }),
  completeTransferCapabilities: Object.freeze({ classification: "FUNCTION_OWNER_TRANSFER_CAPABILITY_CONFIRMED", migrationDeploymentAuthorized: false }),
  secondExecution: Object.freeze({ status: "AUTHORIZATION_CONSUMED_STOP_REQUIRED", authorizedExecutions: 0 }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_017C7_STATIC_REVIEW_SNAPSHOTS;
