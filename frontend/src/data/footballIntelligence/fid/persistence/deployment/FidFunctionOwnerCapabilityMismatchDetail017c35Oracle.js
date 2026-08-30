const TARGET_FIELDS = Object.freeze([
  "organization", "project_name", "region", "project_id", "database", "branch", "sql_role", "governed_environment",
]);

export function independentlyReviewExactTargetBinding017c35(sql) {
  const failures = [];
  const targetBinding = sql.match(/target_binding AS \([\s\S]*?\n\),\nidentities AS \(/i)?.[0] ?? "";
  const readsOnlyConstants = /FROM constants c/i.test(targetBinding);
  const hasIndependentObservedSource = /(?:current_database\s*\(|current_user\b|session_user\b|current_setting\s*\(|pg_catalog\.)/i.test(targetBinding);

  if (readsOnlyConstants && !hasIndependentObservedSource) failures.push("tautological_target_binding_validation");
  for (const field of TARGET_FIELDS) {
    if (!new RegExp(`c\\.${field}\\s*=`, "i").test(targetBinding)) failures.push(`missing_target_comparison_${field}`);
  }
  if (/CROSS JOIN target_binding b CROSS JOIN constants c/i.test(sql)) failures.push("visible_and_validated_target_share_literal_source");
  if (!/CASE WHEN NOT b\.binding_valid THEN 'TARGET_BINDING_INCONSISTENT'/i.test(sql)) failures.push("target_failure_precedence_missing");

  return Object.freeze({
    passed: failures.length === 0,
    correctionRequired: failures.length > 0,
    failures: Object.freeze([...new Set(failures)]),
  });
}

export default independentlyReviewExactTargetBinding017c35;
