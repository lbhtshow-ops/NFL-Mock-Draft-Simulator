const count = (text, pattern) => [...text.matchAll(pattern)].length;
const builderCounts = (sql) => {
  const counts = [];
  const token = "pg_catalog.jsonb_build_object(";
  for (let start = sql.indexOf(token); start >= 0; start = sql.indexOf(token, start)) {
    let depth = 1, quoted = false, commas = 0, content = false, index = start + token.length;
    for (; index < sql.length && depth; index += 1) {
      const character = sql[index];
      if (character === "'" && sql[index + 1] === "'") { index += 1; continue; }
      if (character === "'") { quoted = !quoted; continue; }
      if (quoted) continue;
      if (character === "(") depth += 1;
      else if (character === ")") depth -= 1;
      else if (character === "," && depth === 1) commas += 1;
      if (depth === 1 && !/\s/.test(character) && character !== ")") content = true;
    }
    counts.push(content ? commas + 1 : 0);
    start = index;
  }
  return counts;
};

export function reviewFidAtomicFunctionAclTransactionLocalDiagnostic017c60(sql = "") {
  const failures = [], clean = sql.replace(/^--.*$/gm, "");
  const gate = (name, passed) => { if (!passed) failures.push(name); };
  const begin = clean.search(/^BEGIN;$/m), output = clean.search(/^SELECT r\.\* FROM/m), rollback = clean.search(/^ROLLBACK;$/m);
  gate("transaction_boundary", count(clean, /^BEGIN;$/gm) === 1 && count(clean, /^ROLLBACK;$/gm) === 1 && begin < output && output < rollback);
  gate("no_commit", count(clean, /^\s*COMMIT\s*;/gim) === 0);
  gate("one_visible_row", count(clean, /^SELECT r\.\* FROM/gm) === 1);
  gate("exact_revoke", count(clean, /^\s*REVOKE EXECUTE ON FUNCTION fid\.fid_execute_atomic_persistence_batch\(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb\) FROM PUBLIC, anon, authenticated;$/gm) === 1);
  gate("exact_grant", count(clean, /^\s*GRANT EXECUTE ON FUNCTION fid\.fid_execute_atomic_persistence_batch\(text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb\) TO service_role;$/gm) === 1);
  gate("before_gate", clean.includes("IF before_exact THEN") && clean.indexOf("IF before_exact THEN") < clean.indexOf("REVOKE EXECUTE"));
  gate("metadata_guard", clean.includes("to_regclass('fid.fid_persistence_migrations')") && !/FROM\s+fid\.fid_persistence_migrations/i.test(clean));
  gate("bounded_jsonb", builderCounts(sql).length === 4 && Math.max(...builderCounts(sql)) <= 100);
  const forbidden = /\b(?:ALTER\s+ROLE|SET\s+ROLE|CREATE\s+(?:TEMP|TABLE|FUNCTION|SCHEMA)|INSERT|UPDATE|DELETE|TRUNCATE|DROP|LOCK\s+TABLE|FOR\s+(?:UPDATE|SHARE)|pg_advisory_|gen_random_uuid|uuid_generate)\b/i;
  gate("no_prohibited_operation", !forbidden.test(clean));
  for (const token of [
    "after_public_direct_execute_absent", "after_service_direct_execute_present", "after_public_effective_execute_absent",
    "after_anon_effective_execute_absent", "after_authenticated_effective_execute_absent", "owner_direct_execute_preserved",
    "owner_effective_execute_preserved", "owner_derived_authority_preserved", "count_detail_reconciled",
    "transaction_local_diagnostic", "persistent_change_authorized", "explicit_rollback_present", "result_emitted_before_rollback",
  ]) gate(`required:${token}`, sql.includes(token));
  const classifications = ["EVIDENCE_UNRESOLVED", "BEFORE_STATE_MISMATCH", "INCONSISTENT_RECOVERY_REQUIRED", "EXACT_OWNER_PRESERVING_AFTER_STATE", "EFFECTIVE_PRIVILEGE_ORACLE_MISMATCH", "DIRECT_ACL_MUTATION_FAILURE", "PARTIAL_STATE"];
  let cursor = -1;
  for (const name of classifications) { const next = sql.indexOf(name); gate(`precedence:${name}`, next > cursor); cursor = next; }
  const signature = sql.match(/AS r\(([\s\S]*?)\);\s*ROLLBACK;/)?.[1] ?? "";
  const fields = [...signature.matchAll(/\b([a-z][a-z0-9_]*)\s+(?:text|integer|boolean|jsonb)(?=,|\s*$)/g)].map((match) => match[1]);
  gate("visible_contract", fields.length === 47 && new Set(fields).size === 47);
  return Object.freeze({ accepted: failures.length === 0, failures: Object.freeze([...new Set(failures)]), builderArgumentCounts: Object.freeze(builderCounts(sql)), visibleFieldCount: fields.length });
}

export default reviewFidAtomicFunctionAclTransactionLocalDiagnostic017c60;
