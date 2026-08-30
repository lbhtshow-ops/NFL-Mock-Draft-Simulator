export const CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_STATIC_REVIEW_SNAPSHOTS = Object.freeze({
  missingDeploymentUsage: Object.freeze({ executionReady: false, classification: "DEPLOYMENT_ROLE_SCHEMA_CAPABILITY_MISSING" }),
  missingDeploymentCreate: Object.freeze({ executionReady: false, classification: "DEPLOYMENT_ROLE_SCHEMA_CAPABILITY_MISSING" }),
  missingOwnerUsage: Object.freeze({ executionReady: false, classification: "TARGET_OWNER_SCHEMA_CAPABILITY_MISSING" }),
  missingOwnerCreate: Object.freeze({ executionReady: false, classification: "TARGET_OWNER_SCHEMA_CAPABILITY_MISSING" }),
  currentRoleMismatch: Object.freeze({ executionReady: false, classification: "EXECUTION_IDENTITY_MISMATCH" }),
  sessionRoleMismatch: Object.freeze({ executionReady: false, classification: "EXECUTION_IDENTITY_MISMATCH" }),
  memberWithoutSet: Object.freeze({ executionReady: false, classification: "MEMBER_WITHOUT_SET_OR_ADMIN_CAPABILITY" }),
  adminWithoutSet: Object.freeze({ executionReady: false, classification: "MEMBERSHIP_AMENDMENT_AUTHORITY_PRESENT_REVIEW_REQUIRED" }),
  completeCapabilities: Object.freeze({ executionReady: false, classification: "FUNCTION_OWNER_TRANSFER_CAPABILITY_CONFIRMED", reason: "CORRECTION_REVIEW_STILL_REQUIRED" }),
});

export default CANONICAL_PROSPECT_IDENTIFIER_SUPABASE_OWNERSHIP_CAPABILITY_PREFLIGHT_STATIC_REVIEW_SNAPSHOTS;
