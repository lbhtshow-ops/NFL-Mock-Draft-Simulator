import {
  formatComponentLabel,
  formatComponentWeight,
} from "../componentBreakdown/componentBreakdownFormatters.js";

export { formatComponentLabel, formatComponentWeight };

export function formatGrade(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

export function formatCount(value) {
  return Array.isArray(value) ? value.length : 0;
}

export function formatYesNo(value) {
  return value ? "Yes" : "No";
}

export function formatSafeValue(value) {
  if (typeof value === "string") return formatComponentLabel(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return formatYesNo(value);
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return value.join(", ");
  }
  return "Structured Detail Available";
}

export function calculateWeightedContribution(score, appliedWeight) {
  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    typeof appliedWeight !== "number" ||
    !Number.isFinite(appliedWeight)
  ) {
    return null;
  }
  return score * appliedWeight;
}
