export const SOURCE_DEFINITIONS = [
  { key: "production", label: "Production", coverageKey: "production" },
  { key: "footballIQ", label: "Football IQ", coverageKey: "footballIQ" },
  { key: "playerTraits", label: "Player Traits", coverageKey: "playerTraits" },
  { key: "athleticism", label: "Athletic Intelligence", coverageKey: "athleticIntelligence" },
  { key: "schemeFit", label: "Scheme Fit", coverageKey: "schemeFit" },
];

export function formatSourceLabel(value) {
  if (typeof value !== "string" || !value.trim()) return "Not Reported";
  return value.trim().replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatScore(value) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "\u2014";
}

export function formatConfidence(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? `${Math.round(value * 100)}%`
    : "\u2014";
}

export function formatYesNo(value) {
  return value ? "Yes" : "No";
}

export function formatVersion(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "Not Reported";
}

export function formatStructuredScalar(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return formatYesNo(value);
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) return value.join(", ");
  return "Structured Detail Available";
}
