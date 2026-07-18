export function formatComponentLabel(value) {
  if (typeof value !== "string" || !value.trim()) return "Not Reported";

  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatComponentScore(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "—";
}

export function formatComponentConfidence(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? `${Math.round(value * 100)}%`
    : "—";
}

export function formatComponentWeight(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "—";
  }

  const percentage = value * 100;
  return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`;
}

export const QUARTERBACK_COMPONENT_ORDER = [
  ["accuracy", "Accuracy"],
  ["armTalent", "Arm Talent"],
  ["processing", "Processing"],
  ["decisionMaking", "Decision Making"],
  ["pocketManagement", "Pocket Management"],
  ["mobility", "Mobility"],
  ["playmaking", "Playmaking"],
  ["mechanics", "Mechanics"],
];

export function getComponentAggregationState({
  key,
  component,
  aggregation,
  modelAvailable,
}) {
  const included = Array.isArray(aggregation?.includedComponents)
    ? aggregation.includedComponents.includes(key)
    : false;
  const exclusion = Array.isArray(aggregation?.excludedComponents)
    ? aggregation.excludedComponents.find((entry) => entry?.key === key) || null
    : null;
  const explicitlyBlocking = Array.isArray(aggregation?.criticalMissingComponents)
    ? aggregation.criticalMissingComponents.includes(key)
    : false;
  const requiredBlocking =
    !modelAvailable && !component?.available && (component?.required || component?.critical);

  if (included) return { status: "INCLUDED", exclusion };
  if (explicitlyBlocking || requiredBlocking) {
    return { status: "BLOCKED", exclusion };
  }
  if (exclusion) return { status: "EXCLUDED", exclusion };
  return { status: "UNAVAILABLE", exclusion: null };
}
