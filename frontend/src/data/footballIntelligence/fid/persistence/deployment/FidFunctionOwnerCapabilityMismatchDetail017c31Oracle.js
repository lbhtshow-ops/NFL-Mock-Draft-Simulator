export function independentlyReviewMismatchDetail017c31(sql) {
  const findings=[];
  const tableAcl=sql.match(/table_acl AS \(([\s\S]*?)\n\),\nschema_policy AS/i)?.[1]??"";
  const hasMissingTableGuard=/FROM table_policy x CROSS JOIN roles r\s+WHERE EXISTS/i.test(tableAcl);
  if(!hasMissingTableGuard && /has_table_privilege\([\s\S]*x\.table_name/i.test(tableAcl)) findings.push("missing_object_fanout_or_error");
  if(/TABLE_'\|\|upper\(t\.table_name\)\|\|'_OWNER[\s\S]*FROM table_acl WHERE/i.test(sql) && !hasMissingTableGuard) findings.push("aggregate_detail_count_unreconciled");
  if(!/set_state\s*=\s*true[\s\S]*(?:mismatch|UNEXPECTED)/i.test(sql)) findings.push("set_true_not_reported");
  if(!/create_state\s*=\s*true[\s\S]*(?:mismatch|UNEXPECTED)/i.test(sql)) findings.push("create_true_not_reported");
  if(/OWNER_MEMBERSHIP_OPTIONS/.test(sql) && !/MEMBERSHIP_(?:MEMBER|ADMIN|INHERIT|SET)/.test(sql)) findings.push("membership_identities_collapsed");
  if(!sql.includes("DEDICATED_NON_PRODUCTION_TEST")) findings.push("governed_environment_binding_absent");
  if(!/unresolved[\s\S]*(?:owner_oid|postgres_oid|service_oid|anon_oid|authenticated_oid|fid_oid)/i.test(sql)) findings.push("missing_role_or_schema_evidence_not_classified");
  const bare=sql.replace(/--.*$/gm,"").replace(/'(?:''|[^'])*'/g,"''");
  if(/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SET\s+ROLE|SET\s+SESSION|FOR\s+(?:UPDATE|SHARE)|pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\b/i.test(bare)) findings.push("read_only_violation");
  if(/fid_execute_(?:atomic_persistence_batch|prospect_identifier_issuance_transaction)\s*\(/i.test(bare)) findings.push("rpc_invocation");
  return Object.freeze({passed:findings.length===0,correctionRequired:findings.length>0,findings:Object.freeze([...new Set(findings)])});
}
export default independentlyReviewMismatchDetail017c31;
