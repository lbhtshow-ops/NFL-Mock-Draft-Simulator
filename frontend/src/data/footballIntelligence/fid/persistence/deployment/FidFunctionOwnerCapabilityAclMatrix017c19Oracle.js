import matrix from "./FidFunctionOwnerCapabilityAclMatrix017c19.js";

const requiredTokens = [
  "aclexplode", "has_table_privilege", "has_schema_privilege", "has_function_privilege",
  "is_grantable", "relowner=postgres_oid", "proowner=owner_oid", "prosecdef",
  "search_path=pg_catalog, fid", "relkind='S'", "to_regprocedure",
  "metadata_oid::pg_catalog.regclass", "migration_014", "CURRENT_USER", "SESSION_USER",
];
const mutations = /\b(?:insert|update|delete|truncate|grant|revoke|alter|drop|create\s+(?:table|schema|function|role)|set\s+role)\b/i;
const strip = (sql) => sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''");

export function evaluateMatrix017c19(candidate = matrix) {
  const failures = [];
  if (candidate.id !== "FID_FUNCTION_OWNER_ACL_MATRIX_017C19_V1" || !Object.isFrozen(candidate)) failures.push("matrix_identity_or_freeze");
  if (candidate.tables?.length !== 7) failures.push("seven_tables");
  if (candidate.expectedSequenceCount !== 0) failures.push("zero_sequences");
  if (candidate.functions?.[0] !== "fid_execute_atomic_persistence_batch(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)") failures.push("function_signature");
  for (const item of candidate.entries ?? []) {
    for (const field of ["principal","principalType","objectClass","object","privilege","expectedDirect","expectedEffective","expectedGrantOption","expectedBefore","expectedAfter","governingArtifact","coverage"])
      if (!(field in item)) failures.push(`entry_field:${field}`);
    if (!item.coverage?.preflight || !item.coverage?.reconciliation || !item.coverage?.postVerification) failures.push(`coverage:${item.object}:${item.privilege}`);
  }
  const expectedEntries = 10 + (7*5*7) + (5*3) + 5;
  if (candidate.entries?.length !== expectedEntries) failures.push("entry_cardinality");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export function evaluateSuccessor017c19(sql, kind) {
  const failures = requiredTokens.filter((token) => !sql.includes(token)).map((token) => `missing:${token}`);
  if (mutations.test(strip(sql))) failures.push("unexpected_mutation");
  if (/\bFROM\s+fid\.fid_persistence_migrations\b/i.test(strip(sql))) failures.push("static_optional_metadata_reference");
  if (!sql.includes("IF metadata_oid IS NULL") || sql.indexOf("EXECUTE pg_catalog.format") < sql.indexOf("IF metadata_oid IS NULL")) failures.push("optional_metadata_order");
  for (const table of matrix.tables) if (!sql.includes(`'${table}'`)) failures.push(`missing_table:${table}`);
  for (const privilege of matrix.tablePrivileges) if (!sql.includes(`'${privilege}'`)) failures.push(`missing_privilege:${privilege}`);
  for (const principal of ["fid_function_owner","service_role","anon","authenticated","PUBLIC"]) if (!sql.includes(`'${principal}'`)) failures.push(`missing_principal:${principal}`);
  if (kind === "reconciliation") {
    for (const outcome of ["FULLY_UNAPPLIED","FULLY_APPLIED","SET_ONLY_PARTIALLY_APPLIED","CREATE_ONLY_PARTIALLY_APPLIED","STATE_INCONSISTENT_RECOVERY_REQUIRED","STATE_UNRESOLVED"])
      if (!sql.includes(outcome)) failures.push(`missing_outcome:${outcome}`);
    if (sql.indexOf("STATE_UNRESOLVED") > sql.indexOf("FULLY_UNAPPLIED")) failures.push("unresolved_not_first");
  }
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze(failures) });
}

export const NEGATIVE_SCENARIOS_017C19 = Object.freeze([
  ...matrix.tables.flatMap((table) => matrix.tablePrivileges.map((privilege) => `owner_boundary:${table}:${privilege}`)),
  ...matrix.tables.flatMap((table) => ["service_role","anon","authenticated","PUBLIC"].flatMap((role) => matrix.tablePrivileges.map((privilege) => `denial:${role}:${table}:${privilege}`))),
  "unauthorized_grant_option","wrong_object_owner","unexpected_table","unexpected_function","unexpected_sequence",
  "missing_governed_table","missing_governed_function","wrong_function_signature","wrong_security_mode","wrong_function_search_path",
  "service_role_rpc_execute_missing","anon_rpc_execute_added","authenticated_rpc_execute_added","public_rpc_execute_added",
  "owner_create_other_application_schema","effective_without_direct","direct_without_effective","metadata_relation_missing","metadata_conflict",
  "fully_unapplied","fully_applied","set_only","create_only","unresolved_identity","wrong_current_user","wrong_session_user",
]);

export default Object.freeze({ evaluateMatrix017c19, evaluateSuccessor017c19, NEGATIVE_SCENARIOS_017C19 });
