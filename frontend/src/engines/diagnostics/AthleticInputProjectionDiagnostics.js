import {
  ATHLETIC_INPUT_CONTRACT,
  ATHLETIC_INPUT_VERSION,
  createAthleticInputProjection,
  isAthleticInputProjection,
  validateAthleticInputProjection,
} from "../athletics/AthleticInputProjection.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
function hasError(value, code) { return value.validation.errors.some((error) => error.code === code); }
function valid(overrides = {}) { return { identity: { playerId: "player:test", playerName: "Test Player", position: "WR" }, measurements: { height: 74, weight: 205, armLength: 32, handSize: 9.5, wingSpan: 78 }, testing: { fortyYardDash: 4.42, tenYardSplit: 1.52, twentyYardSplit: null, verticalJump: 38, broadJump: 126, threeCone: 6.9, shortShuttle: 4.1, benchPress: 18, gpsMetrics: null, accelerationMetrics: null, velocityMetrics: null, gameSpeedMetrics: null }, testingAvailability: "PARTIAL", testingContext: { eventType: "COMBINE", venue: "Indianapolis" }, measurementMetadata: { source: "Caller package", verification: "VERIFIED", measurementDate: "2026-03-01", units: { height: "in", weight: "lb" }, unknownState: "KNOWN" }, testingMetadata: { source: "Caller package", verification: "VERIFIED", testingDate: "2026-03-02", timing: "ELECTRONIC", units: { fortyYardDash: "s" } }, evidenceMetadata: { sourceIds: ["source-1"] }, limitations: ["GPS not supplied"], unknownFields: { futureSensor: null }, ...overrides }; }
const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("required-fields", () => assert(isAthleticInputProjection(createAthleticInputProjection(valid())), "Valid projection rejected."));
check("identity", () => { const result = createAthleticInputProjection(valid()); assert(result.contract === ATHLETIC_INPUT_CONTRACT && result.contractVersion === ATHLETIC_INPUT_VERSION, "Contract identity changed."); });
check("optional-fields", () => assert(createAthleticInputProjection({ identity: valid().identity, testingAvailability: "UNKNOWN" }).validation.valid, "Optional sections became required."));
check("serialization", () => assert(JSON.parse(JSON.stringify(createAthleticInputProjection(valid()))).identity.playerId === "player:test", "Serialization failed."));
check("immutability", () => assert(frozen(createAthleticInputProjection(valid())), "Projection is mutable."));
check("validation-failures", () => assert(!validateAthleticInputProjection({ testingAvailability: "INVALID" }).valid, "Invalid input accepted."));
check("unknown-handling", () => { const result = createAthleticInputProjection(valid({ unknownFields: { vendorMetric: { state: "UNKNOWN", value: null } } })); assert(result.unknownFields.vendorMetric.state === "UNKNOWN", "Unknown field changed."); });
check("future-placeholders", () => { const result = createAthleticInputProjection(valid()); assert(result.testing.gpsMetrics === null && result.testing.accelerationMetrics === null && result.testing.velocityMetrics === null && result.testing.gameSpeedMetrics === null, "Future placeholders absent."); });
check("caller-preservation", () => { const input = valid(); const before = JSON.stringify(input); createAthleticInputProjection(input); assert(JSON.stringify(input) === before && !Object.isFrozen(input), "Caller input changed."); });
check("reject-analysis", () => assert(hasError(createAthleticInputProjection(valid({ testingContext: { score: 90 } })), "PROHIBITED_ANALYTICAL_FIELD"), "Analytical value accepted."));
check("unsupported-goes-to-unknown", () => assert(hasError(createAthleticInputProjection(valid({ measurements: { height: 74, vendorMetric: 2 } })), "UNSUPPORTED_FIELD"), "Unsupported measurement silently accepted."));
check("no-analysis-produced", () => { const result = createAthleticInputProjection(valid()); assert(!Object.hasOwn(result, "score") && !Object.hasOwn(result, "confidence") && !Object.hasOwn(result, "summary"), "Analysis produced."); });

export function runAthleticInputProjectionDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((result) => result.passed).length;
  return { suite: "AthleticInputProjectionDiagnostics", total: results.length, passed, failed: results.length - passed, results };
}
export default { runAthleticInputProjectionDiagnostics };
