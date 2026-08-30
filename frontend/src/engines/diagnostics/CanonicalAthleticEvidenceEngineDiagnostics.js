import { isIntelligenceResult } from "../contracts/IntelligenceResultContract.js";
import {
  createAthleticInputProjection,
  createAthleticModeledOutputDeclaration,
  getCanonicalAthleticEvidenceResult,
} from "../athletics/index.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function same(left, right, message) { assert(JSON.stringify(left) === JSON.stringify(right), message); }
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
function rejects(value) { try { getCanonicalAthleticEvidenceResult(value); return false; } catch (error) { return error instanceof TypeError; } }
function base(overrides = {}) {
  return createAthleticInputProjection({
    identity: { playerId: "caller:athlete", playerName: "Caller Athlete", position: "WR" },
    measurements: { height: 74, weight: 205, armLength: 32, handSize: 9.5, wingSpan: 78 },
    testing: { fortyYardDash: 4.42, tenYardSplit: 1.52, twentyYardSplit: 2.58, verticalJump: 38, broadJump: 126, threeCone: 6.9, shortShuttle: 4.1, benchPress: 18, gpsMetrics: { maxSpeed: 21.2 }, accelerationMetrics: { peak: 8.1 }, velocityMetrics: { max: 21.2 }, gameSpeedMetrics: { max: 20.7 } },
    testingAvailability: "AVAILABLE",
    testingContext: { eventType: "COMBINE", venue: "Indianapolis", timing: "ELECTRONIC", status: "COMPLETE" },
    measurementMetadata: { source: "caller:measurements", verification: "VERIFIED", measurementDate: "2026-03-01", units: { height: "in", weight: "lb", armLength: "in", handSize: "in", wingSpan: "in" } },
    testingMetadata: { source: "caller:testing", verification: "VERIFIED", testingDate: "2026-03-02", timing: "ELECTRONIC", units: { fortyYardDash: "s", verticalJump: "in" } },
    evidenceMetadata: { source: "caller:evidence", verification: "VERIFIED" },
    limitations: [], unknownFields: {}, ...overrides,
  });
}
function empty(overrides = {}) { return base({ measurements: {}, testing: {}, testingAvailability: "UNKNOWN", testingContext: null, measurementMetadata: null, testingMetadata: null, evidenceMetadata: null, ...overrides }); }
function result(overrides = {}) { return getCanonicalAthleticEvidenceResult(base(overrides)); }
function hasKeyDeep(value, prohibited) { if (!value || typeof value !== "object") return false; return Object.entries(value).some(([key, item]) => prohibited.has(key) || hasKeyDeep(item, prohibited)); }
const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("accept-valid-projection", () => assert(isIntelligenceResult(result()), "Valid projection rejected."));
check("reject-player-id", () => assert(rejects("caller:athlete"), "Player ID accepted."));
check("reject-player-name", () => assert(rejects("Caller Athlete"), "Player name accepted."));
check("reject-raw-profile", () => assert(rejects({ playerId: "caller:athlete", measurements: {}, testing: {}, scores: {} }), "Raw profile accepted."));
check("reject-arbitrary-object", () => assert(rejects({ identity: {} }), "Arbitrary object accepted."));
check("reject-contract-lookalike", () => assert(rejects({ contract: "AthleticInputProjection", contractVersion: "1.0.0", validation: { valid: true } }), "Contract lookalike accepted."));
check("reject-modeled-declaration", () => assert(rejects(createAthleticModeledOutputDeclaration({ overallScore: 90 })), "Modeled declaration accepted."));
check("reject-intelligence-result", () => assert(rejects(result()), "Built result accepted."));
check("reject-invalid-projection", () => assert(rejects(createAthleticInputProjection({ identity: {}, testingAvailability: "INVALID" })), "Invalid projection accepted."));
check("reject-null", () => assert(rejects(null), "Null accepted."));
check("reject-undefined", () => assert(rejects(undefined), "Undefined accepted."));

check("valid-intelligence-result", () => assert(isIntelligenceResult(result()), "Invalid IntelligenceResult."));
check("score-null", () => assert(result().score === null, "Score produced."));
check("confidence-zero", () => assert(result().confidence === 0, "Confidence changed."));
check("confidence-unknown", () => assert(result().value.confidenceAssessment.confidenceKnown === false, "Confidence claimed known."));
check("canonical-governance", () => { const g = result().value.governance; assert(g.owner === "CANONICAL_ENGINE" && g.origin === "GOVERNED_CALLER_INPUT" && g.derivationStatus === "DERIVED" && g.governanceStatus === "CANONICAL" && g.calibrationStatus === "NOT_APPLICABLE" && g.reproducibilityStatus === "REPRODUCIBLE" && g.canonicalDerivation === true && g.permittedUse === "EVIDENCE_REPORTING", "Governance changed."); });
check("model-identity", () => { const r = result(); assert(r.value.model === "CANONICAL_ATHLETIC_EVIDENCE_ENGINE" && r.versions.model === "1.0.0", "Model identity changed."); });
check("no-modeled-scores", () => assert(!hasKeyDeep(result(), new Set(["overallScore", "componentScores", "storedConfidence", "speedScore", "explosivenessScore", "agilityScore", "strengthScore"])), "Legacy modeled score leaked."));
check("evidence-only-derivation", () => assert(result().value.outputType === "FACTUAL_ATHLETIC_EVIDENCE_REPORT" && result().value.scoringStatus.canonicalScoreAvailable === false, "Derivation scope changed."));

check("complete-inventory", () => { const r = result(); assert(r.value.suppliedFields.measurements.length === 5 && r.value.suppliedFields.testing.length === 12 && r.value.unresolvedFields.measurements.length === 0 && r.value.unresolvedFields.testing.length === 0, "Complete inventory wrong."); });
check("partial-measurements", () => { const r = result({ measurements: { height: 74, weight: 205 }, testing: {} }); same(r.value.suppliedFields.measurements, ["height", "weight"], "Partial supplied wrong."); same(r.value.unresolvedFields.measurements, ["armLength", "handSize", "wingSpan"], "Partial unresolved wrong."); });
check("measurements-only", () => { const r = result({ testing: {}, testingAvailability: "UNAVAILABLE" }); assert(r.value.availability.status === "PARTIAL" && r.value.suppliedFields.testing.length === 0, "Measurements-only wrong."); });
check("testing-only", () => { const r = result({ measurements: {} }); assert(r.value.availability.status === "PARTIAL" && r.value.suppliedFields.measurements.length === 0, "Testing-only wrong."); });
check("no-evidence", () => { const r = getCanonicalAthleticEvidenceResult(empty()); assert(!r.available && r.dataState === "UNKNOWN" && r.value.availability.status === "UNKNOWN", "No-evidence semantics wrong."); });
check("explicit-unavailable", () => assert(getCanonicalAthleticEvidenceResult(empty({ testingAvailability: "UNAVAILABLE" })).value.availability.status === "UNAVAILABLE", "Unavailable state changed."));
check("unknown-verification", () => { const r = result({ measurementMetadata: { verification: "UNKNOWN" }, testingMetadata: { verification: "UNKNOWN" }, evidenceMetadata: { verification: "UNKNOWN" } }); assert(r.value.measurements[0].verificationStatus === "UNKNOWN", "Unknown verification invented."); });
check("unknown-timing", () => { const r = result({ testingContext: { venue: "Pro Day" }, testingMetadata: {} }); assert(r.value.limitations.includes("Timing method is unknown."), "Unknown timing omitted."); });
check("caller-conflicts", () => { const conflict = { field: "height", values: [73, 74], limitation: "Sources disagree" }; const r = result({ evidenceMetadata: { conflicts: [conflict] } }); const reported = r.value.conflicts[0]; assert(reported.field === conflict.field && reported.limitation === conflict.limitation, "Conflict changed."); same(reported.values, conflict.values, "Conflict values changed."); assert(r.value.limitations.some((item) => item.includes("conflicts remain unresolved")), "Conflict limitation omitted."); });
check("future-placeholders-absent", () => { const r = result({ testing: { fortyYardDash: 4.42 } }); assert(r.value.unresolvedFields.testing.includes("gpsMetrics") && r.value.limitations.some((item) => item.includes("Future metric placeholders")), "Future placeholders wrong."); });
check("explicit-limitations", () => assert(result({ limitations: ["Caller limitation"] }).value.limitations[0] === "Caller limitation", "Caller limitation changed."));
check("field-metadata", () => { const r = result(); const height = r.value.measurements.find((item) => item.field === "height"); assert(height.unit === "in" && height.sourceReference === "caller:measurements" && height.verificationStatus === "VERIFIED" && height.date === "2026-03-01", "Field metadata wrong."); });
check("zero-is-supplied", () => assert(result({ testing: { benchPress: 0 } }).value.suppliedFields.testing.includes("benchPress"), "Zero became unresolved."));
check("no-coverage-percentage", () => assert(result().value.completeness.coveragePercentage === null, "Coverage percentage invented."));

check("prohibited-analysis", () => { const prohibited = new Set(["athleticScore", "componentScore", "tier", "grade", "percentile", "ranking", "athleticQualityLabel", "playerQualityConclusion", "prestige", "projection", "riskScore", "ceilingScore"]); assert(!hasKeyDeep(result(), prohibited), "Prohibited analysis present."); });
check("caller-unchanged", () => { const input = base(); const before = JSON.stringify(input); getCanonicalAthleticEvidenceResult(input); assert(JSON.stringify(input) === before, "Caller input changed."); });
check("deterministic", () => { const input = base(); same(getCanonicalAthleticEvidenceResult(input), getCanonicalAthleticEvidenceResult(input), "Output nondeterministic."); });
check("immutable", () => assert(frozen(result()), "Output mutable."));
check("no-player-resolution", () => { const r = result({ identity: { playerId: "unknown:never-resolve", playerName: "Supplied Name", position: "X" } }); assert(r.playerId === "unknown:never-resolve" && r.value.identity.playerName === "Supplied Name", "Identity resolved."); });
check("complete-confidence-unknown", () => assert(result().confidence === 0 && result().value.confidenceAssessment.confidenceKnown === false, "Complete evidence invented confidence."));
check("missing-confidence-unknown", () => { const r = getCanonicalAthleticEvidenceResult(empty()); assert(r.confidence === 0 && r.value.confidenceAssessment.confidenceKnown === false, "Missing evidence became known zero." ); });
check("legacy-confidence-excluded", () => assert(!hasKeyDeep(result(), new Set(["storedConfidence"])), "Legacy confidence entered result."));

const snapshots = Object.freeze([
  Object.freeze(["complete", Object.freeze({ availability: "AVAILABLE", suppliedMeasurements: 5, suppliedTesting: 12, unresolvedMeasurements: 0, unresolvedTesting: 0, conflicts: 0, score: null, confidence: 0 })]),
  Object.freeze(["partial", Object.freeze({ availability: "PARTIAL", suppliedMeasurements: 2, suppliedTesting: 0, unresolvedMeasurements: 3, unresolvedTesting: 12, conflicts: 0, score: null, confidence: 0 })]),
  Object.freeze(["unavailable", Object.freeze({ availability: "UNAVAILABLE", suppliedMeasurements: 0, suppliedTesting: 0, unresolvedMeasurements: 5, unresolvedTesting: 12, conflicts: 0, score: null, confidence: 0 })]),
  Object.freeze(["conflicting", Object.freeze({ availability: "AVAILABLE", suppliedMeasurements: 5, suppliedTesting: 12, unresolvedMeasurements: 0, unresolvedTesting: 0, conflicts: 1, score: null, confidence: 0 })]),
]);
function snapshot(resultValue) { return { availability: resultValue.value.availability.status, suppliedMeasurements: resultValue.value.suppliedFields.measurements.length, suppliedTesting: resultValue.value.suppliedFields.testing.length, unresolvedMeasurements: resultValue.value.unresolvedFields.measurements.length, unresolvedTesting: resultValue.value.unresolvedFields.testing.length, conflicts: resultValue.value.conflicts.length, score: resultValue.score, confidence: resultValue.confidence }; }
check("snapshot-complete", () => same(snapshot(result()), snapshots[0][1], "Complete snapshot changed."));
check("snapshot-partial", () => same(snapshot(result({ measurements: { height: 74, weight: 205 }, testing: {} })), snapshots[1][1], "Partial snapshot changed."));
check("snapshot-unavailable", () => same(snapshot(getCanonicalAthleticEvidenceResult(empty({ testingAvailability: "UNAVAILABLE" }))), snapshots[2][1], "Unavailable snapshot changed."));
check("snapshot-conflicting", () => same(snapshot(result({ evidenceMetadata: { conflicts: [{ field: "height", values: [73, 74] }] } })), snapshots[3][1], "Conflict snapshot changed."));

export function runCanonicalAthleticEvidenceEngineDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((entry) => entry.passed).length;
  return { suite: "CanonicalAthleticEvidenceEngineDiagnostics", total: results.length, passed, failed: results.length - passed, fixedSnapshots: snapshots.length, results };
}
export default { runCanonicalAthleticEvidenceEngineDiagnostics };
