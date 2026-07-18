import { formatComponentLabel } from "../componentBreakdown/componentBreakdownFormatters.js";

export const MAX_INSPECTOR_ENTRIES = 6;

export function formatBoolean(value) {
  return value ? "Yes" : "No";
}

export function formatScalar(value) {
  if (typeof value === "string") return formatComponentLabel(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "Structured Detail Available";
}

export function getSafeObjectFields(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  const preferredKeys = [
    "code", "path", "domain", "sourceName", "sourceId", "contributorId",
    "metric", "value", "score", "coverage", "factor", "componentKey",
    "reason", "message",
  ];

  return preferredKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(value, key))
    .map((key) => ({ key, value: formatScalar(value[key]) }));
}
