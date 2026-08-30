import priorReview, { RESULT_COLUMNS_017C25 } from "./FidFunctionOwnerCapabilityAmendment017c25IndependentReviewOracle.js";

const occurrences = (text, value) => text.split(value).length - 1;
export function reviewCustomSettingCorrection017c27(sql) {
  const failures = [];
  const valid = "lbht.preflight_017c24_result";
  const invalid = "lbht.017c24_preflight_result";
  const declared = sql.match(/result_setting constant text := '([^']+)'/)?.[1];
  const read = sql.match(/current_setting\('([^']+)'/)?.[1];
  if (occurrences(sql, invalid) !== 0) failures.push("invalid_setting_present");
  if (occurrences(sql, valid) !== 2) failures.push("single_governed_setting");
  const components = (declared ?? "").split(".");
  if (components.length < 2 || components.some((part) => !/^[a-z_][a-z0-9_]*$/.test(part))) failures.push("setting_name_invalid");
  if (declared !== read) failures.push("bridge_name_mismatch");
  if (!new RegExp(`result_setting constant text := '${valid.replace(".", "\\.")}'`).test(sql)
    || !new RegExp(`current_setting\\('${valid.replace(".", "\\.")}',\\s*true\\)`).test(sql)) failures.push("bridge_name_mismatch");
  if ((sql.match(/set_config\([^;]*,\s*true\s*\)/gi) ?? []).length !== 3 || /set_config\([^;]*,\s*false\s*\)/i.test(sql)) failures.push("transaction_local_setting");
  if (sql.indexOf("set_config(result_setting, 'PENDING', true)") > sql.indexOf("FOR principal_name")) failures.push("pending_not_initialized_first");
  if (!/classification'<>\s*'PENDING'/i.test(sql)) failures.push("pending_output_guard");
  if (!/current_setting[\s\S]*SELECT[\s\S]*FROM payload/i.test(sql)) failures.push("visible_final_select");
  let cursor = -1;
  for (const column of RESULT_COLUMNS_017C25) { const position = sql.indexOf(` AS ${column}`, cursor + 1); if (position < 0 || position <= cursor) failures.push(`column:${column}`); cursor = position; }
  const normalized = sql.replaceAll(valid, invalid).replaceAll("17C.27.1", "17C.24.1");
  const preserved = priorReview(normalized);
  if (!preserved.passed) failures.push(...preserved.failures.map((failure) => `preservation:${failure}`));
  if (/executionAuthorization|retryAuthorized|migration014Authorized/i.test(sql)) failures.push("authorization_scope");
  return Object.freeze({ passed: failures.length === 0, failures: Object.freeze([...new Set(failures)]) });
}
export default reviewCustomSettingCorrection017c27;
