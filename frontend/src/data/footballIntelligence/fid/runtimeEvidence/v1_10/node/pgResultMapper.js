const DEFAULT_LIMITS = Object.freeze({ maximumRows: 64, maximumBytes: 8192, maximumColumns: 32, maximumStringBytes: 256, maximumDepth: 2 });
const bytes = (value) => new TextEncoder().encode(value).byteLength;
const fail = (code) => { throw Object.assign(new TypeError(code), { code, resultReceived: true }); };

function bounded(value, limits, depth, seen) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") { if (!Number.isFinite(value)) fail("PG_RESULT_UNSUPPORTED_VALUE"); return value; }
  if (typeof value === "string") { if (bytes(value) > limits.maximumStringBytes) fail("PG_RESULT_STRING_LIMIT_EXCEEDED"); return value; }
  if (typeof value !== "object" || depth > limits.maximumDepth || seen.has(value) || value instanceof Date || ArrayBuffer.isView(value)) fail("PG_RESULT_UNSUPPORTED_VALUE");
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) fail("PG_RESULT_UNSUPPORTED_VALUE");
  seen.add(value);
  const output = Array.isArray(value) ? value.map((item) => bounded(item, limits, depth + 1, seen)) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, bounded(item, limits, depth + 1, seen)]));
  seen.delete(value);
  return output;
}

export function mapPgResult(result, context = {}, requestedLimits = {}) {
  if (!result || typeof result !== "object" || result.client || result.connection) fail("PG_RESULT_INVALID");
  const limits = Object.freeze({ ...DEFAULT_LIMITS, ...requestedLimits });
  const rows = Array.isArray(result.rows) ? result.rows : [];
  if (rows.length > limits.maximumRows) fail("PG_RESULT_ROW_LIMIT_EXCEEDED");
  if (rows.some((row) => row && typeof row === "object" && Object.keys(row).length > limits.maximumColumns)) fail("PG_RESULT_COLUMN_LIMIT_EXCEEDED");
  const mapped = Object.freeze({ command: typeof result.command === "string" && /^[A-Z ]{1,32}$/.test(result.command) ? result.command : null, rowCount: Number.isInteger(result.rowCount) && result.rowCount >= 0 ? result.rowCount : null, rows: bounded(rows, limits, 0, new Set()), sourceClassification: "SYNTHETIC", stageRef: context.stageRef ?? null, transactionRef: context.transactionRef ?? null, uncertainty: false });
  if (bytes(JSON.stringify(mapped)) > limits.maximumBytes) fail("PG_RESULT_BYTE_LIMIT_EXCEEDED");
  return mapped;
}

export { DEFAULT_LIMITS as PG_RESULT_DEFAULT_LIMITS };
