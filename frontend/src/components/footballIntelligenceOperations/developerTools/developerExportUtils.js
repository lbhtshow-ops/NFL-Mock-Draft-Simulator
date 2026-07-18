import { serializeDeveloperRecord } from "./developerToolsFormatters.js";

export function sanitizeFilenameSegment(value, fallback) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const segment = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return segment || fallback;
}

export function createCompactUtcTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "");
}

export function createDeveloperFilename({ recordKey, prospectId, fullEvaluation = false, date } = {}) {
  const safeProspectId = sanitizeFilenameSegment(prospectId, "unknown-prospect");
  const timestamp = createCompactUtcTimestamp(date);
  if (fullEvaluation) {
    return `lbht-qb-evaluation-${safeProspectId}-${timestamp}.json`;
  }
  const safeRecordKey = sanitizeFilenameSegment(recordKey, "record");
  return `lbht-qb-${safeRecordKey}-${safeProspectId}-${timestamp}.json`;
}

export async function copyDeveloperRecord(value) {
  if (!globalThis.navigator?.clipboard?.writeText) {
    throw new Error("CLIPBOARD_UNAVAILABLE");
  }
  await globalThis.navigator.clipboard.writeText(serializeDeveloperRecord(value));
}

export function downloadDeveloperRecord(value, filename) {
  const blob = new Blob([serializeDeveloperRecord(value)], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
