export const MAX_CONCLUSION_ITEMS = 8;
export const MAX_EXPLANATION_ITEMS = 12;

export function formatConclusionLabel(value) {
  if (typeof value !== "string" || !value.trim()) return "Not Reported";
  return value.trim().replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatSafeScalar(value) {
  if (typeof value === "string") return formatConclusionLabel(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "Structured Detail Available";
}

const SAFE_KEYS = [
  "label", "classification", "level", "projection", "primary", "secondary",
  "role", "style", "componentKey", "code", "priority", "reasonCode",
  "severity", "reason", "target", "score", "confidence", "evidenceLevel",
  "message", "path", "value", "factors", "reasons", "evidence", "limitations",
];

export function getSafeObjectFields(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return SAFE_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(value, key)).map((key) => {
    const fieldValue = value[key];
    const displayValue = key === "path" && typeof fieldValue === "string"
      ? fieldValue
      : Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === "string")
      ? fieldValue.map(formatConclusionLabel).join(", ") || "None Reported"
      : formatSafeScalar(fieldValue);
    return { key, value: displayValue };
  });
}

export function limitItems(value, maximum) {
  const entries = Array.isArray(value) ? value : [];
  return {
    entries: entries.slice(0, maximum),
    remaining: Math.max(0, entries.length - maximum),
  };
}

export function isEvidencePath(value) {
  return typeof value === "string" && (value.includes(".") || value.includes("[") || value.startsWith("components"));
}
