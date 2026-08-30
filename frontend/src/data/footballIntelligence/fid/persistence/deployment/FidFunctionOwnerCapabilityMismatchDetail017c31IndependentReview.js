export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C31_INDEPENDENT_REVIEW = Object.freeze({
  id: "FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_INDEPENDENT_REVIEW_017C31",
  version: "17C.31.1", reviewOnly: true,
  targetPath: "frontend/src/data/footballIntelligence/fid/persistence/deployment/review/017c30_fid_function_owner_capability_mismatch_detail_read_only_diagnostic.sql",
  targetSha256: "A9882BBA3AD98B4EC608FB741672ABCFCAFB1F99CC863DEE83F39C8F35061468",
  capturedMismatchCount: 5, capturedResultVerified: true,
  readOnlySafetyPassed: true, sanitizationPassed: true, optionalMetadataDesignPassed: true,
  aclPolicyChanged: false, aclGovernanceUnitsIntended: 261,
  blockingFindings: Object.freeze([
    "DETAIL_COUNT_DOES_NOT_PRESERVE_PROTECTED_MISSING_OBJECT_CONTROL_FLOW",
    "EXPECTED_BEFORE_SET_AND_CREATE_VIOLATIONS_CAN_BE_OMITTED",
    "MEMBERSHIP_MEMBER_ADMIN_INHERIT_SET_IDENTITIES_ARE_COLLAPSED",
    "GOVERNED_ENVIRONMENT_TARGET_BINDING_IS_ABSENT",
    "MISSING_GOVERNED_OBJECT_CAN_RAISE_IN_PRIVILEGE_INSPECTION",
  ]),
  authorization017c23Consumed: true, authorization017c26Consumed: true, authorization017c29Consumed: true,
  retryAuthorized: false, diagnosticExecutionAuthorized: false, authorizationCreated: false,
  sqlExecuted: false, databaseConnected: false, amendmentAuthorized: false, migration014Authorized: false,
  status: "FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_DIAGNOSTIC_CORRECTION_REQUIRED",
  requiredNextAction: "BOUNDED_REPOSITORY_CORRECTION_OF_017C30_MISMATCH_DETAIL_DIAGNOSTIC",
});
export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_017C31_INDEPENDENT_REVIEW;
