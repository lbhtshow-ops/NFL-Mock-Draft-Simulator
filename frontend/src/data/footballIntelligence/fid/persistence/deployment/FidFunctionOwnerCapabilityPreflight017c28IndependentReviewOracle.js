import correctionReview from "./FidFunctionOwnerCapabilityPreflight017c27CorrectionOracle.js";
import { RESULT_COLUMNS_017C25 } from "./FidFunctionOwnerCapabilityAmendment017c25IndependentReviewOracle.js";

const count = (text, regex) => text.match(regex)?.length ?? 0;
export function independentlyReviewCorrectedPreflight017c28(sql, protectedSql) {
  const failures = [];
  const setting = "lbht.preflight_017c24_result";
  const invalid = "lbht.017c24_preflight_result";
  const declared = sql.match(/result_setting constant text := '([^']+)'/)?.[1];
  const read = sql.match(/current_setting\('([^']+)'/)?.[1];
  if (declared !== setting || read !== setting) failures.push("exact_setting_name");
  if (declared !== read) failures.push("read_write_mismatch");
  if ((declared ?? "").split(".").some((part) => !/^[a-z_][a-z0-9_]*$/.test(part)) || (declared ?? "").split(".").length !== 2) failures.push("invalid_simple_identifier");
  if (sql.includes(invalid)) failures.push("protected_invalid_setting_executable");
  if (/result_setting\s*:=|current_setting\([^']|set_config\(\s*[^r]/i.test(sql)) failures.push("dynamic_or_client_setting");
  if (count(sql, /set_config\(/gi) !== 3 || count(sql, /set_config\([^;]*,\s*true\s*\)/gi) !== 3) failures.push("transaction_local_bridge");
  if (count(sql, /BEGIN TRANSACTION READ ONLY;/gi) !== 1 || count(sql, /\bCOMMIT;/gi) !== 1) failures.push("read_only_transaction");
  if (count(sql, /WITH payload AS \(/g) !== 1 || !/classification'<>\s*'PENDING'/i.test(sql)) failures.push("ordinary_visible_select");
  let cursor = -1;
  for (const column of RESULT_COLUMNS_017C25) { const at = sql.indexOf(` AS ${column}`, cursor + 1); if (at < 0 || at <= cursor) failures.push(`column:${column}`); cursor = at; }
  const restored = sql.replace("-- Sprint 17C.27: PostgreSQL-valid custom-setting correction successor.", "-- Sprint 17C.24: dashboard-visible read-only ACL-matrix preflight successor.")
    .replaceAll(setting, invalid).replaceAll("17C.27.1", "17C.24.1");
  if (restored !== protectedSql) failures.push("unrelated_semantic_delta");
  const correction = correctionReview(sql);
  if (!correction.passed) failures.push(...correction.failures.map((failure) => `correction:${failure}`));
  if (/authorization017c(?:23|26)Consumed:\s*false/i.test(sql)) failures.push("consumed_authorization_reuse");
  if (/retryAuthorized:\s*true/i.test(sql)) failures.push("retry_permission");
  if (/executionAuthorizationCreated:\s*true/i.test(sql)) failures.push("authorization_created");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}
export default independentlyReviewCorrectedPreflight017c28;
