import contract from "./FidFunctionOwnerCapabilityMismatchDetail017c39Contract.js";
import review017c40 from "./FidFunctionOwnerCapabilityMismatchDetail017c40StaticOracle.js";

const strip = (sql) => sql.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''");

export function independentlyReview017c41(sql, predecessor) {
  const failures = [...review017c40(sql, predecessor).failures];
  const finalSelect = sql.slice(sql.lastIndexOf("\nSELECT "), sql.lastIndexOf("\n\nCOMMIT;"));
  for (const field of contract.orderedFields) if (!finalSelect.includes(field === "mismatch_count" ? "s.mismatch_count" : field)) failures.push(`missing_visible_${field}`);
  if ((sql.match(/row_number\(\) OVER\(ORDER BY unit_id,mismatch_id\)/gi) ?? []).length !== 1) failures.push("ordinal_source_not_unique");
  if (!/count\(\*\)::integer mismatch_count[\s\S]*jsonb_agg[\s\S]*ORDER BY mismatch_ordinal/i.test(sql)) failures.push("shared_detail_source_missing");
  if (!/5::integer captured_preflight_mismatch_count,s\.mismatch_count=5 captured_count_reconciled/i.test(finalSelect)) failures.push("captured_five_not_comparison_only");
  if (/jsonb_build_(?:array|object)\([^)]*(?:five|mismatch_1|mismatch_2|mismatch_3|mismatch_4|mismatch_5)/i.test(sql)) failures.push("fabricated_five_identities");
  if (!/CASE WHEN x\.acl_ready THEN[\s\S]*has_table_privilege\(x\.principal_oid,x\.table_oid/i.test(sql)) failures.push("table_oid_guard_missing");
  if (!/CASE WHEN g\.complete AND g\.function_oid IS NOT NULL[\s\S]*has_function_privilege\(x\.principal_oid,g\.function_oid/i.test(sql)) failures.push("function_oid_guard_missing");
  if (!/CASE WHEN relation_ref IS NULL THEN NULL ELSE pg_catalog\.query_to_xml/i.test(sql)) failures.push("metadata_relation_guard_missing");
  if (!/pg_catalog\.format\([\s\S]*FROM %s[\s\S]*relation_ref/i.test(sql)) failures.push("dynamic_identifier_not_catalog_resolved");
  if (/\b(?:relacl|nspacl|proacl|oid|function_definition|sql_text|credential|secret|token|url|connection_string)\b[\s\S]*\)\s+(?:database_observed_target_evidence|externally_authorized_target_binding|mismatch_details)/i.test(finalSelect)) failures.push("sensitive_visible_output");
  if (/\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|COMMENT|GRANT|REVOKE|COPY|SET\s+ROLE|SET\s+SESSION|FOR\s+(?:UPDATE|SHARE)|pg_advisory\w*|gen_random_uuid|uuid_generate\w*|nextval|setval)\b/i.test(strip(sql))) failures.push("mutation_or_operation");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}

export default independentlyReview017c41;
