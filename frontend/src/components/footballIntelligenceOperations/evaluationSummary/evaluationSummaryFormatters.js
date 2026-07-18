export function formatReadableLabel(value, fallback = "Not Established") {
  if (typeof value !== "string" || !value.trim()) return fallback;

  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatConfidence(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? `${Math.round(value * 100)}%`
    : "—";
}

export function getProvisionalGradeDescriptor(grade) {
  if (typeof grade !== "number" || !Number.isFinite(grade)) return null;
  if (grade >= 95) return "Rare Franchise-Level Projection";
  if (grade >= 90) return "High-End NFL Starter Projection";
  if (grade >= 85) return "Quality NFL Starter Projection";
  if (grade >= 80) return "Starter Traits with Development Needed";
  if (grade >= 75) return "Developmental Starter Projection";
  if (grade >= 70) return "Backup / Spot-Starter Projection";
  if (grade >= 65) return "Developmental Backup Projection";
  if (grade >= 60) return "Limited NFL Projection";
  return "Uncertain NFL Translation";
}

export function formatHighlight(value) {
  if (typeof value === "string") return formatReadableLabel(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Structured Result Available";
  }

  const component = formatReadableLabel(value.componentKey, "");
  const code = formatReadableLabel(value.code, "");
  const scalar = Object.entries(value)
    .filter(([key, entry]) =>
      key !== "componentKey" && key !== "code" &&
      ["string", "number", "boolean"].includes(typeof entry)
    )
    .map(([key, entry]) => `${formatReadableLabel(key)}: ${formatReadableLabel(String(entry))}`)
    .join(" · ");

  return [component, code, scalar].filter(Boolean).join(" — ") ||
    "Structured Result Available";
}
