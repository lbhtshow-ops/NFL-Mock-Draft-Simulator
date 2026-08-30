import record from "./FidFunctionOwnerCapabilityMismatchResult017c43Record.js";

const clone = () => structuredClone(record);
const scenario = (name, mutate, accepted, failure) => Object.freeze({ name, input: mutate(clone()), accepted, failure });

export const FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_RESULT_017C43_SCENARIOS = Object.freeze([
  scenario("captured-result", (value) => value, true, null),
  scenario("wrong-hash", (value) => { value.executedSqlSha256 = "0".repeat(64); return value; }, false, "sql_hash"),
  scenario("authorization-reuse", (value) => { value.executionCount = 2; return value; }, false, "authorization_consumption"),
  scenario("count-drift", (value) => { value.result.detail_count = 5; return value; }, false, "detail_count"),
  scenario("mutation", (value) => { value.result.mutation_count = 1; return value; }, false, "read_only"),
  scenario("unknown-detail", (value) => { value.result.mismatch_details[0].mismatch_id = "UNKNOWN"; return value; }, false, "unknown:UNKNOWN"),
]);

export default FID_FUNCTION_OWNER_CAPABILITY_MISMATCH_RESULT_017C43_SCENARIOS;
