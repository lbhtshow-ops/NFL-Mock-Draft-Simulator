export const DEVELOPER_RECORDS = [
  { key: "evaluation", label: "Evaluation" },
  { key: "result", label: "Result" },
  { key: "components", label: "Components" },
  { key: "aggregation", label: "Aggregation" },
  { key: "conclusions", label: "Conclusions" },
  { key: "explanation", label: "Explanation" },
  { key: "provenance", label: "Provenance" },
  { key: "validation", label: "Validation" },
  { key: "readiness", label: "Readiness" },
  { key: "sources", label: "Sources" },
  { key: "diagnostics", label: "Diagnostics" },
];

const MAX_DEPTH = 24;
const MAX_ARRAY_LENGTH = 1000;
const MAX_OBJECT_KEYS = 1000;

function isPlainObject(value) {
  if (!value || Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function isErrorLike(value) {
  return value instanceof Error || (
    isPlainObject(value) &&
    typeof value.name === "string" &&
    typeof value.message === "string" &&
    typeof value.stack === "string"
  );
}

function sanitizeError(value) {
  const result = {};
  for (const key of ["code", "name", "message"]) {
    const field = value?.[key];
    if (typeof field === "string" || (key === "code" && typeof field === "number")) {
      result[key] = field;
    }
  }
  return result;
}

function sanitizeValue(value, depth, ancestors) {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return `[BigInt: ${value.toString()}]`;
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }
  if (depth >= MAX_DEPTH) return "[Maximum Depth Reached]";
  if (isErrorLike(value)) return sanitizeError(value);
  if (!Array.isArray(value) && !isPlainObject(value)) return "[Unsupported Value]";
  if (ancestors.has(value)) return "[Circular Reference]";

  ancestors.add(value);
  let result;

  if (Array.isArray(value)) {
    const retained = value.slice(0, MAX_ARRAY_LENGTH).map((entry) => {
      const sanitized = sanitizeValue(entry, depth + 1, ancestors);
      return sanitized === undefined ? null : sanitized;
    });
    if (value.length > MAX_ARRAY_LENGTH) {
      retained.push(`[${value.length - MAX_ARRAY_LENGTH} additional item(s) omitted]`);
    }
    result = retained;
  } else {
    const keys = Object.keys(value);
    result = {};
    keys.slice(0, MAX_OBJECT_KEYS).forEach((key) => {
      const sanitized = sanitizeValue(value[key], depth + 1, ancestors);
      if (sanitized !== undefined) result[key] = sanitized;
    });
    if (keys.length > MAX_OBJECT_KEYS) {
      result["[Truncated Object Keys]"] = `${keys.length - MAX_OBJECT_KEYS} key(s) omitted`;
    }
  }

  ancestors.delete(value);
  return result;
}

export function sanitizeForDeveloperTools(value) {
  const sanitized = sanitizeValue(value, 0, new WeakSet());
  return sanitized === undefined ? null : sanitized;
}

export function serializeDeveloperRecord(value) {
  return JSON.stringify(sanitizeForDeveloperTools(value), null, 2);
}

export function getDeveloperRecords(evaluation, diagnosticState) {
  const result = evaluation?.result;
  return {
    evaluation,
    result,
    components: result?.components,
    aggregation: result?.aggregation,
    conclusions: result?.conclusions,
    explanation: result?.explanation,
    provenance: result?.provenance,
    validation: evaluation?.validation,
    readiness: evaluation?.readiness,
    sources: evaluation?.adaptedSources,
    diagnostics: diagnosticState,
  };
}

export function hasDeveloperRecord(value) {
  return value !== null && value !== undefined;
}

export function formatMetadataValue(value) {
  if (value === null || value === undefined || value === "") return "Not Reported";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" ? value : "Not Reported";
}

export function countObjectEntries(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value).length
    : null;
}

export function countValidationEntries(value, key) {
  return Array.isArray(value?.[key]) ? value[key].length : null;
}
