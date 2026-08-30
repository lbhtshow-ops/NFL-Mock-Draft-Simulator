const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_017C2_EXECUTION_FAILURE_RECORD = deepFreeze({
  recordId: "CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_017C2_EXECUTION_FAILURE_RECORD",
  recordVersion: "1.0.0",
  classification: "PREFLIGHT_SQL_POSTGRESQL_ORDER_BY_COMPATIBILITY_FAILURE",
  sqlstate: "0A000",
  artifact: "017c2_stage2_read_only_target_preflight_successor.sql",
  artifactSha256: "D9956965EACC8F022E6FE962EFC06F6604711A9159C25728AEADE248BCE7BBAE",
  failureLocation: { line: 123, clause: "ORDER BY ordinal_position NULLS LAST, migration_id COLLATE C" },
  sanitizedPostgresqlDetail: "A set-operation ORDER BY may use result-column names but not an expression unless the set result is wrapped by an outer query.",
  databaseMutations: 0,
  migration014Executed: false,
  stage2Completed: false,
  automaticProgressionProhibited: true,
  correctiveSuccessorRequired: true,
  sensitiveOutputRecorded: false,
});

export default CANONICAL_PROSPECT_IDENTIFIER_STAGE_2_PREFLIGHT_017C2_EXECUTION_FAILURE_RECORD;
