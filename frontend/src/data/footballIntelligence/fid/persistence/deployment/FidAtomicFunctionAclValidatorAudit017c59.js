export const FID_ATOMIC_FUNCTION_ACL_VALIDATOR_AUDIT_017C59 = Object.freeze({
  auditId: "FID_ATOMIC_FUNCTION_ACL_VALIDATOR_AUDIT_017C59_V1",
  version: "17C.59.1",
  outcome: "OUTCOME_D_REPOSITORY_EVIDENCE_INSUFFICIENT",
  status: "OWNER_PRESERVING_ACL_VALIDATOR_CORRECTION_REQUIRED",
  protectedRemediation: Object.freeze({
    filename: "017c54a_fid_atomic_function_acl_corrected_owner_preserving_remediation.sql",
    sha256: "A185395ADB3383D3F904CBC0DAB24F99BDDBFE14E5C4BD0FF0F079348590046A",
    modified: false,
  }),
  protectedReconciliation: Object.freeze({
    filename: "017c58a_fid_atomic_function_acl_failed_after_state_read_only_reconciliation.sql",
    sha256: "8F723344492AC678939930DCBA82D3B657106158AD3793543D36D7BAC929D1C1",
    modified: false,
  }),
  observedRolledBackState: Object.freeze({
    publicDirectExecuteCount: 1,
    ownerDirectExecuteCount: 1,
    serviceDirectExecuteCount: 0,
    anonDirectExecuteCount: 0,
    authenticatedDirectExecuteCount: 0,
    directExecuteEntryCount: 2,
    grantableExecuteEntryCount: 0,
  }),
  fiveFailedReconciliationPredicates: Object.freeze([
    "after_public_direct_execute_absent",
    "after_service_direct_execute_present",
    "after_public_effective_execute_absent",
    "after_anon_effective_execute_absent",
    "after_authenticated_effective_execute_absent",
  ]),
  dependencyGraph: Object.freeze({
    directAcl:
      "pg_proc.proacl -> COALESCE(proacl,acldefault('f',proowner)) -> aclexplode -> seven direct/count predicates",
    effectiveAcl:
      "role OID + function OID -> has_function_privilege -> five effective predicates",
    ownership:
      "pg_proc.proowner = fid_function_owner OID -> owner-derived-authority and owner-remains-owner predicates",
    finalAssertion:
      "OR of twelve negated predicates -> RAISE EXCEPTION 'after-state ACL mismatch'",
  }),
  transactionReview: Object.freeze({
    validationTiming: "AFTER_MUTATIONS_IN_THE_SAME_TRANSACTION",
    mutationOrder: Object.freeze([
      "REVOKE EXECUTE FROM PUBLIC, anon, authenticated",
      "GRANT EXECUTE TO service_role",
      "after-state catalog and effective-privilege query",
    ]),
    transactionLocalAclVisibility: true,
    transactionVisibilityDefectProved: false,
  }),
  blocker: Object.freeze({
    reason:
      "The 17C.58 observation is after rollback and proves the exact pre-remediation state, not the transaction-local state at the failed assertion.",
    missingRepositoryEvidence: Object.freeze([
      "the complete 61-field 17C.58 reconciliation result row",
      "anon_membership_execute_path and authenticated_membership_execute_path values",
      "a transaction-local predicate trace from the failed 17C.57 attempt",
    ]),
    consequence:
      "Repository evidence cannot prove whether the validator's effective-privilege assumptions are defective or the remediation fails to remove membership-derived authority.",
  }),
  successorRemediationCreated: false,
  remediationCorrectionCreated: false,
  executionAuthorizationCreated: false,
  remediationAuthorizationCreated: false,
  reconciliationAuthorizationCreated: false,
  sqlExecuted: false,
  databaseConnected: false,
});

export default FID_ATOMIC_FUNCTION_ACL_VALIDATOR_AUDIT_017C59;
