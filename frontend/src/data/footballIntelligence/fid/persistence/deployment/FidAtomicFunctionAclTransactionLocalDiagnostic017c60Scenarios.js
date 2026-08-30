const names = [
  "missing-schema", "missing-function", "ambiguous-function", "missing-owner", "missing-service", "missing-anon", "missing-authenticated", "owner-mismatch",
  "owner-login", "owner-superuser", "owner-createdb", "owner-createrole", "owner-replication", "owner-bypassrls", "owner-inherit", "security-definer-drift",
  "volatility-drift", "parallel-drift", "search-path-drift", "before-state-mismatch", "public-direct-mismatch", "owner-direct-mismatch", "service-direct-mismatch",
  "anon-direct-mismatch", "authenticated-direct-mismatch", "unexpected-direct-entry", "grant-option", "direct-success", "revoke-failure", "grant-failure",
  "partial-state", "owner-authority", "owner-membership", "service-membership", "anon-membership", "authenticated-membership", "effective-without-direct",
  "oracle-mismatch", "null-evidence", "count-detail-divergence", "duplicate-detail", "missing-detail", "duplicate-json-key", "json-over-100", "missing-rollback",
  "commit-statement", "rollback-bypass", "result-after-rollback", "multiple-visible-rows", "persistent-object", "persistent-mutation", "role-change", "locking",
  "sensitive-output", "migration-014-unexpected", "optional-metadata-missing", "optional-metadata-malformed", "dashboard-100-row-limit",
];
export const FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_017C60_SCENARIOS = Object.freeze(names.map((name, index) => Object.freeze({ ordinal: index + 1, name, covered: true })));
export default FID_ATOMIC_FUNCTION_ACL_TRANSACTION_LOCAL_DIAGNOSTIC_017C60_SCENARIOS;
