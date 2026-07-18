export const DIAGNOSTIC_SUITE_INVENTORY = [
  { key: "contract", label: "Prospect Position Model Contract", total: 33 },
  { key: "sourceAdapter", label: "Source Adapter", total: 30 },
  { key: "aggregation", label: "Aggregation", total: 40 },
  { key: "registry", label: "Registry", total: 52 },
  { key: "quarterback", label: "Quarterback Model", total: 68 },
];

export const DIAGNOSTIC_TOTAL = 223;

export function formatHealthLabel(value) {
  if (typeof value !== "string" || !value.trim()) return "Not Reported";
  return value.trim().replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatReportedValue(value) {
  return typeof value === "string" && value.trim() ? value : "Not Reported";
}

export function createIdleDiagnosticState() {
  return {
    status: "IDLE",
    suites: [],
    total: DIAGNOSTIC_TOTAL,
    passedCount: 0,
    failedCount: 0,
    error: null,
  };
}

export function normalizeSuiteResult(definition, result) {
  const total = Number.isInteger(result?.total) ? result.total : definition.total;
  const passedCount = Number.isInteger(result?.passedCount) ? result.passedCount : 0;
  const failedCount = Number.isInteger(result?.failedCount) ? result.failedCount : Math.max(0, total - passedCount);
  const failedCaseIds = Array.isArray(result?.tests)
    ? result.tests.filter((test) => test?.passed === false && typeof test.id === "string").map((test) => test.id)
    : [];
  return {
    key: definition.key,
    label: definition.label,
    passed: result?.passed === true && failedCount === 0,
    total,
    passedCount,
    failedCount,
    failedCaseIds,
  };
}
