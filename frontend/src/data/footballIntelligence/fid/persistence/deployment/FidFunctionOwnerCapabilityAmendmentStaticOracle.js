const count = (sql, pattern) => (sql.match(pattern) ?? []).length;

export function evaluateFidFunctionOwnerCapabilityAmendmentSql(sql = "") {
  const normalized = sql.replace(/--.*$/gm, "");
  const lower = normalized.toLowerCase();
  const grants = normalized.match(/\bGRANT\b[^;]*;/gi) ?? [];
  const checks = Object.freeze({
    oneTransaction: count(lower, /\bbegin\s*;/g) === 1 && count(lower, /\bcommit\s*;/g) === 1,
    beforeAndAfterAssertions: lower.includes("$fid_capability_before$") && lower.includes("$fid_capability_after$"),
    exactSchemaGrant: count(lower, /grant\s+create\s+on\s+schema\s+fid\s+to\s+fid_function_owner\s*;/g) === 1,
    exactMembershipGrant: count(lower, /grant\s+fid_function_owner\s+to\s+postgres\s+with\s+admin\s+true\s*,\s*inherit\s+false\s*,\s*set\s+true\s*;/g) === 1,
    noAllOrWildcard: grants.every((grant) => !/all\s+privileges|on\s+all|\*/i.test(grant)),
    noOtherGrantTarget: count(lower, /\bgrant\b/g) === 2,
    noRoleAlteration: !/\balter\s+role\b|\bcreate\s+role\b|\bdrop\s+role\b/i.test(normalized),
    noOwnershipOrSetRole: !/\balter\s+(function|table|schema|sequence|view)\b[^;]*\bowner\s+to\b|\bset\s+role\b/i.test(normalized),
    noApplicationDdl: !/\b(create|alter|drop)\s+(table|function|schema|policy|extension)\b/i.test(normalized),
    noDynamicSql: !/\bexecute\s+(format|immediate)|\bformat\s*\(/i.test(normalized),
    noRpcOrIdentifier: !/fid_execute_prospect_identifier_issuance_transaction\s*\(|gen_random_uuid\s*\(|uuid_generate/i.test(normalized),
    noRuntimeGrant: grants.every((grant) => !/\b(service_role|anon|authenticated|public)\b/i.test(grant)),
    migration014AbsentAssertions: ["fid_identifier_reservations", "fid_identifier_issuance_ledger", "fid_identifier_issuance_idempotency", "fid_execute_prospect_identifier_issuance_transaction"].every((name) => lower.includes(name)),
  });
  return Object.freeze({ checks, passed: Object.values(checks).every(Boolean), sqlExecuted: false });
}

export default Object.freeze({ evaluateFidFunctionOwnerCapabilityAmendmentSql });
