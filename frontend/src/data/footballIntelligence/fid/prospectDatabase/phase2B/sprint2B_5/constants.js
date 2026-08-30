export const DRAFT_RESULT_CONTRACT = "FID-DRAFT-RESULT-SNAPSHOT-1.0.0";
export const DRAFT_RESULT_SCHEMA = "FID-DRAFT-RESULT-SNAPSHOT-SCHEMA-1.0.0";
export const DRAFT_RESULT_VIEW_VERSION = "FID-DRAFT-RESULT-APPLICATION-VIEW-1.0.0";

export const RESULT_STATUS = Object.freeze({
  PARTIAL: "PARTIAL_FIXTURE_RESULT",
  COMPLETE: "COMPLETE_FIXTURE_RESULT",
  INVALID: "RESULT_INVALID",
});

export const FUTURE_INTELLIGENCE_STATUS = "ENGINE_UNAVAILABLE";

export const clone = (value) => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
