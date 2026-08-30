const INCONSISTENT = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_INCONSISTENT_RECOVERY_REQUIRED";
const UNRESOLVED = "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_STATE_UNRESOLVED";

export function classify017c17(evidence = {}) {
  if (evidence.inspectable !== true || evidence.metadataPresent !== true ||
      typeof evidence.set !== "boolean" || typeof evidence.create !== "boolean") return UNRESOLVED;
  if (evidence.protectedExact !== true || evidence.metadata014Rows !== 0 ||
      evidence.metadata013Exact !== true) return INCONSISTENT;
  if (!evidence.set && !evidence.create) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_UNAPPLIED";
  if (evidence.set && evidence.create) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_FULLY_APPLIED";
  if (evidence.set) return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_SET_ONLY_PARTIALLY_APPLIED";
  return "FID_FUNCTION_OWNER_CAPABILITY_AMENDMENT_CREATE_ONLY_PARTIALLY_APPLIED";
}

export function inspect017c17Sql(sql = "", { reconciliation = false } = {}) {
  const staticOptionalReference = /\b(?:from|join)\s+fid\.fid_persistence_migrations\b/i.test(
    sql.replace(/'(?:(?:'')|[^'])*'/g, "''"),
  );
  const mutation = /\b(?:grant|revoke|alter|create\s+(?:table|view|function|procedure|temporary|temp)|drop|insert|update|delete|truncate|lock|set\s+role)\b/i.test(
    sql.replace(/--.*$/gm, "").replace(/'(?:(?:'')|[^'])*'/g, "''"),
  );
  const unsafeRegclass = /::\s*(?:pg_catalog\.)?regclass/i.test(sql) &&
    !/metadata_oid::pg_catalog\.regclass/i.test(sql);
  const discovery = sql.indexOf("IF metadata_oid IS NULL");
  const execution = sql.indexOf("EXECUTE pg_catalog.format");
  const dynamicAfterDiscovery = discovery >= 0 && execution > discovery;
  const controlledDynamicIdentity = /metadata_oid::pg_catalog\.regclass/.test(sql) &&
    !/\bUSING\b/.test(sql) && !/\|\|/.test(sql);
  const sanitizedOutput = !sql.split(/\r?\n/).some((line) => /RAISE\s+NOTICE/i.test(line) && /migration_id/i.test(line));
  const sixDistinct = !reconciliation || [
    "FULLY_UNAPPLIED", "FULLY_APPLIED", "SET_ONLY_PARTIALLY_APPLIED",
    "CREATE_ONLY_PARTIALLY_APPLIED", "STATE_INCONSISTENT_RECOVERY_REQUIRED", "STATE_UNRESOLVED",
  ].every((token) => sql.includes(token));
  const unresolvedFirst = !reconciliation ||
    sql.indexOf("STATE_UNRESOLVED") < sql.indexOf("FULLY_UNAPPLIED");
  return Object.freeze({
    staticOptionalReference, mutation, unsafeRegclass, dynamicAfterDiscovery,
    controlledDynamicIdentity, sanitizedOutput, sixDistinct, unresolvedFirst,
    passed: !staticOptionalReference && !mutation && !unsafeRegclass && dynamicAfterDiscovery &&
      controlledDynamicIdentity && sanitizedOutput && sixDistinct && unresolvedFirst,
  });
}

export default Object.freeze({ classify017c17, inspect017c17Sql });
