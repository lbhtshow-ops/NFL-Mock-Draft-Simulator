const occurrences = (text, expression) => (text.match(expression) ?? []).length;

export function evaluate017c15CorrectedAmendment(sql = "") {
  const clean = sql.replace(/--.*$/gm, "");
  const lower = clean.toLowerCase();
  const before = lower.indexOf("$fid_17c15_before$");
  const firstGrant = lower.indexOf("grant create on schema fid");
  const after = lower.indexOf("$fid_17c15_after$");
  const checks = Object.freeze({
    transactionExact: occurrences(lower, /^begin;$/gm) === 1 && occurrences(lower, /^commit;$/gm) === 1,
    orderingExact: before >= 0 && before < firstGrant && firstGrant < after && after < lower.lastIndexOf("commit;"),
    grantsExact: occurrences(lower, /^grant /gm) === 2 && /grant create on schema fid to fid_function_owner;/i.test(clean) && /grant fid_function_owner to postgres with admin true, inherit false, set true;/i.test(clean),
    grantAuthority: lower.includes("n.nspowner=v_postgres") && lower.includes("acl.privilege_type='create'") && lower.includes("acl.is_grantable"),
    authorityBeforeMutation: lower.indexOf("fid_17c15_schema_grant_authority_missing") < firstGrant,
    boundaryBeforeMutation: lower.indexOf("fid_17c15_privilege_boundary_before_mismatch") < firstGrant,
    completeBoundary: ["has_table_privilege", "has_function_privilege", "has_schema_privilege", "acl.grantee=0", "service_role", "anon", "authenticated", "information_schema"].every((token) => lower.includes(token)),
    migrationBeforeAndAfter: lower.includes("fid_17c15_migration_state_before_mismatch") && lower.includes("fid_17c15_migration_state_after_mismatch"),
    noDynamicSql: !/\bexecute\s+(format|immediate)|\bformat\s*\(|query_to_xml/i.test(clean),
    noForbiddenMutation: !/\b(create|alter|drop)\s+(role|table|function|schema|policy)|\brevoke\b|\bset\s+role\b|\balter\s+(function|table|schema|sequence|view)\b[^;]*\bowner\s+to\b/i.test(clean),
    noRpcInvocation: !/fid_execute_prospect_identifier_issuance_transaction\s*\(|gen_random_uuid\s*\(/i.test(clean),
  });
  return Object.freeze({ passed: Object.values(checks).every(Boolean), checks, sqlExecuted: false });
}

export function evaluate017c15ReadOnlySql(sql = "", kind = "") {
  const lower = sql.toLowerCase();
  const checks = Object.freeze({
    startsWithWith: /^with\s/i.test(sql),
    noMutation: !/(^|;)\s*(insert|update|delete|merge|grant|revoke|alter|create|drop|lock|set\s+role)\b/im.test(sql),
    oidResolution: lower.includes("role_oids") && lower.includes("schema_oid") && lower.includes("function_oid"),
    completeBoundary: ["has_table_privilege", "has_function_privilege", "has_schema_privilege", "acl.grantee=0", "service_oid", "anon_oid", "authenticated_oid"].every((token) => lower.includes(token)),
    kindSpecific: kind === "preflight" ? lower.includes("schema_grant_authority") && lower.includes("is_grantable") : kind === "reconciliation" ? lower.includes("state_unresolved") && lower.includes("unexpected_privilege_expansion") : kind === "post" ? lower.includes("ownership_transfer_capability") && lower.includes("public_boundary_exact") : false,
    noDynamicSql: !/query_to_xml|\bexecute\s+(format|immediate)|\bformat\s*\(/i.test(sql),
  });
  return Object.freeze({ passed: Object.values(checks).every(Boolean), checks, readOnly: true });
}

export default Object.freeze({ evaluate017c15CorrectedAmendment, evaluate017c15ReadOnlySql });
