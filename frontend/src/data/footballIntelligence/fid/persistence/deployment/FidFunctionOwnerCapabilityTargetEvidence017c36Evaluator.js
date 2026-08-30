const prohibited = /(?:target_binding\s+AS[\s\S]*FROM\s+constants|set_config\s*\(|current_setting\s*\(|connection_string|credential|secret|token|pg_authid)/i;

export function evaluateSplitAuthorityTargetEvidence017c36(sql) {
  const failures = [];
  if (prohibited.test(sql)) failures.push("prohibited_or_sensitive_target_evidence");
  if (!/current_database\(\).*CURRENT_USER.*SESSION_USER/is.test(sql)) failures.push("database_session_evidence_missing");
  if (!/database_observed_target_evidence/i.test(sql)) failures.push("database_observed_boundary_missing");
  if (!/externally_authorized_target_binding/i.test(sql)) failures.push("external_authority_boundary_missing");
  if (!/external_target_attestation_required/i.test(sql)) failures.push("external_attestation_requirement_missing");
  if (!/false overall_target_verified/i.test(sql)) failures.push("sql_must_not_claim_overall_target_verified");
  if (!/REQUIRED_NOT_DATABASE_OBSERVED/i.test(sql)) failures.push("external_metadata_mislabeled");
  if (!/BEGIN TRANSACTION READ ONLY/i.test(sql) || !/\bCOMMIT;/i.test(sql)) failures.push("read_only_transaction_missing");
  if (/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|SET\s+ROLE)\b/i.test(sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''"))) failures.push("mutating_sql");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export function combineFutureExecutionEvidence017c36({ authorizationActive, authorizationExact, operatorDashboardConfirmed, databaseEvidenceComplete }) {
  const ready = authorizationActive === true && authorizationExact === true && operatorDashboardConfirmed === true && databaseEvidenceComplete === true;
  return Object.freeze({ ready, classification: ready ? "SPLIT_AUTHORITY_TARGET_BINDING_COMPLETE" : "SPLIT_AUTHORITY_TARGET_BINDING_INCOMPLETE" });
}

export default evaluateSplitAuthorityTargetEvidence017c36;
