import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";

const strip = (sql) => sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''");
const orderedPatterns = Object.freeze([
  /result_identity/, /result_version/, /\bmode\b/, /\bclassification\b/, /s\.mismatch_count/, /s\.mismatch_details/,
  /detail_count/, /count_reconciled/, /captured_preflight_mismatch_count/, /captured_count_reconciled/,
  /u\.unresolved_details/, /x\.state_conflicts/, /expected_before_set_state/, /expected_before_create_state/,
  /membership_evidence/, /metadata_storage_present/, /migration_014_metadata_count/, /\bevidence_complete/,
  /database_observed_target_evidence/, /externally_authorized_target_binding/, /d\.database_evidence_complete/,
  /external_target_attestation_required/, /overall_target_verified/, /\bread_only/, /mutation_count/,
]);

export function review017c40Sql(sql, predecessor) {
  const failures = [];
  const finalSelect = sql.slice(sql.lastIndexOf("\nSELECT "), sql.lastIndexOf("\n\nCOMMIT;"));
  let cursor = 0;
  for (let index = 0; index < orderedPatterns.length; index += 1) {
    const match = finalSelect.slice(cursor).match(orderedPatterns[index]);
    if (!match) { failures.push(`missing_or_reordered_${contract.orderedFields[index]}`); continue; }
    cursor += match.index + match[0].length;
  }
  if (orderedPatterns.length !== 25) failures.push("oracle_field_count");
  if (!/'MISMATCH_DETAIL_DIAGNOSTIC'::text mode/i.test(finalSelect)) failures.push("mode_value");
  if (!/\(m\.relation_ref IS NOT NULL\)::boolean metadata_storage_present/i.test(finalSelect)) failures.push("guarded_metadata_presence");
  if (!/m\.metadata_014::bigint migration_014_metadata_count/i.test(finalSelect)) failures.push("aggregate_metadata_count");
  if (!/d\.database_evidence_complete[\s\S]*jsonb_array_length\(u\.unresolved_details\)=0[\s\S]*tables WHERE table_oid IS NULL[\s\S]*g\.function_oid IS NOT NULL[\s\S]*evidence_complete/i.test(finalSelect)) failures.push("database_evidence_completeness");
  const external = finalSelect.match(/jsonb_build_object\('authority_source','CANONICAL_PROSPECT_IDENTIFIER[\s\S]*?\) externally_authorized_target_binding/i)?.[0] ?? "";
  if (!/'project_reference',c\.project_id/i.test(external) || !/'dashboard_database_source',c\.database_source/i.test(external)) failures.push("successor_nested_keys");
  if (/'project_id',c\.project_id/i.test(external) || /'database_source',c\.database_source/i.test(external)) failures.push("deprecated_nested_keys");
  if (!/true external_target_attestation_required,false overall_target_verified/i.test(finalSelect)) failures.push("split_authority_flags");
  if ((sql.match(/SPLIT_AUTHORITY_25_FIELD_FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_DETAIL_RESULT/g) ?? []).length !== 1
    || !/FROM summary s CROSS JOIN unresolved_summary u CROSS JOIN state_summary x CROSS JOIN state st\s+CROSS JOIN constants c CROSS JOIN database_observed_target d CROSS JOIN metadata m CROSS JOIN governed_function g;/i.test(finalSelect)) failures.push("single_bounded_result_row");
  const body = (value) => value.slice(value.indexOf("database_observed_target AS ("), value.indexOf("\nSELECT '", value.indexOf("state_summary AS")));
  if (body(sql) !== body(predecessor)) failures.push("mismatch_or_acl_body_changed");
  if (!/row_number\(\) OVER\(ORDER BY unit_id,mismatch_id\)/i.test(sql) || !/jsonb_array_length\(s\.mismatch_details\) detail_count/i.test(finalSelect)) failures.push("cardinality_or_ordering");
  if (!/FROM tables WHERE complete AND NOT acl_ready/i.test(sql) || !/FROM table_acl WHERE complete AND acl_ready AND/i.test(sql)) failures.push("table_prerequisite_skip");
  if (!/query_to_xml\(pg_catalog\.format\([\s\S]*relation_ref/i.test(sql)) failures.push("guarded_dynamic_metadata");
  if (!/BEGIN TRANSACTION READ ONLY/i.test(sql) || !/\bCOMMIT;/i.test(sql)) failures.push("read_only_transaction");
  if (/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|SET\s+ROLE|pg_advisory\w*|gen_random_uuid|uuid_generate\w*)\b/i.test(strip(sql))) failures.push("mutating_or_operational_sql");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export default review017c40Sql;
