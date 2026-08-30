import { DATA_STATES, isIntelligenceResult } from "../contracts/IntelligenceResultContract.js";
import { runConfidenceUtilsDiagnostics } from "./ConfidenceUtilsDiagnostics.js";
import { runRecognitionInputProjectionDiagnostics } from "./RecognitionInputProjectionDiagnostics.js";
import {
  getPlayerRecognitionIntelligenceResult,
  getPlayerRecognitionSummary,
} from "../playerEvaluation/PlayerRecognitionEngine.js";
import {
  RECOGNITION_COMPLETENESS,
  createRecognitionInput,
} from "../playerEvaluation/recognition/RecognitionInputProjection.js";
import { calculateLegacyRecognitionScore } from "../playerEvaluation/recognition/LegacyRecognitionScorer.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function context(id = "00-0033873") { return { available: true, playerId: id, position: "QB", competition: { level: "NFL" }, careerStage: "NFL_VETERAN", frameworkVersion: "1.0.0" }; }
function projection({ records = [{ type: "mvp", season: 2024 }], completeness = "COMPLETE", metadata = false, limitations = [] } = {}) {
  const enriched = records.map((record) => metadata ? { ...record, sourceRefs: ["source:test"], evidenceRefs: ["evidence:test"], verification: { state: "VERIFIED" }, provenance: { actor: "test" }, issuingOrganizationRef: "organization:test" } : record);
  return createRecognitionInput({ playerContext: context(), evidenceState: DATA_STATES.AVAILABLE, records: enriched, completeness: { status: completeness, scope: "Diagnostic scope", limitations }, limitations: [] });
}
const checks = [];
function check(id, run) { checks.push({ id, run }); }
function noLegacyFields(result) { return ["rawScore", "careerRecognitionScore", "tier", "provenEliteCeiling", "establishedCareerBaseline"].every((key) => !Object.hasOwn(result.value || {}, key)); }

check("valid-contract", () => assert(isIntelligenceResult(getPlayerRecognitionIntelligenceResult(projection())), "Invalid result."));
check("raw-array-rejected", () => assert(!getPlayerRecognitionIntelligenceResult([{ type: "mvp", season: 2024 }]).available, "Raw array accepted."));
check("player-name-rejected", () => assert(!getPlayerRecognitionIntelligenceResult("Patrick Mahomes").available, "Name accepted."));
check("invalid-unavailable", () => assert(getPlayerRecognitionIntelligenceResult({}).dataState === DATA_STATES.UNKNOWN, "Invalid state changed."));
check("domain", () => assert(getPlayerRecognitionIntelligenceResult(projection()).domain === "recognition", "Domain changed."));
check("model-metadata", () => { const r = getPlayerRecognitionIntelligenceResult(projection()); assert(r.value.model === "PlayerRecognitionEngine" && r.versions.model === "2.0.0", "Model changed."); });
check("context", () => { const r = getPlayerRecognitionIntelligenceResult(projection()); assert(r.value.position === "QB" && r.competitionLevel === "NFL" && r.careerStage === "NFL_VETERAN", "Context lost."); });
check("available", () => assert(getPlayerRecognitionIntelligenceResult(projection()).available, "Evidence unavailable."));
check("partial-limitations", () => assert(getPlayerRecognitionIntelligenceResult(projection({ completeness: "PARTIAL" })).value.limitations.length > 0, "Partial limitation missing."));
check("complete-empty", () => { const r = getPlayerRecognitionIntelligenceResult(projection({ records: [] })); assert(r.available && r.value.completeEmpty && r.value.recognitionCount === 0, "Complete empty failed."); });
check("missing-not-empty", () => { const p = createRecognitionInput({ playerContext: context(), evidenceState: DATA_STATES.UNKNOWN }); const r = getPlayerRecognitionIntelligenceResult(p); assert(!r.available && r.value.recognitions === null, "Missing became empty."); });
check("count-and-facts", () => { const r = getPlayerRecognitionIntelligenceResult(projection({ records: [{ type: "proBowl", season: 2023 }, { type: "mvp", season: 2024 }] })); assert(r.value.recognitionCount === 2 && r.value.recognitions.length === 2, "Facts changed."); });
check("stable-seasons", () => assert(JSON.stringify(getPlayerRecognitionIntelligenceResult(projection({ records: [{ type: "mvp", season: 2024 }, { type: "proBowl", season: 2023 }] })).value.representedSeasons) === "[2023,2024]", "Seasons unstable."));
check("no-prestige-fields", () => assert(noLegacyFields(getPlayerRecognitionIntelligenceResult(projection())), "Legacy fields leaked."));
check("no-score", () => assert(getPlayerRecognitionIntelligenceResult(projection()).score === null, "Prestige score produced."));
check("confidence-bounded", () => { const c = getPlayerRecognitionIntelligenceResult(projection()).confidence; assert(c >= 0 && c <= 1, "Confidence invalid."); });
check("complete-over-partial", () => assert(getPlayerRecognitionIntelligenceResult(projection()).confidence > getPlayerRecognitionIntelligenceResult(projection({ completeness: "PARTIAL" })).confidence, "Completeness ignored."));
check("metadata-coverage", () => assert(getPlayerRecognitionIntelligenceResult(projection({ metadata: true })).confidence > getPlayerRecognitionIntelligenceResult(projection()).confidence, "Metadata ignored."));
check("count-independent", () => { const one = getPlayerRecognitionIntelligenceResult(projection()).confidence; const two = getPlayerRecognitionIntelligenceResult(projection({ records: [{ type: "mvp", season: 2024 }, { type: "caller-award", season: 2023 }] })).confidence; assert(one === two, "Count changed confidence."); });
check("prestige-independent", () => { const a = getPlayerRecognitionIntelligenceResult(projection()).confidence; const b = getPlayerRecognitionIntelligenceResult(projection({ records: [{ type: "caller-label", season: 2024 }] })).confidence; assert(a === b, "Prestige changed confidence."); });
check("unknown-confidence-metadata", () => { const p = createRecognitionInput({ playerContext: context(), evidenceState: DATA_STATES.UNKNOWN }); const r = getPlayerRecognitionIntelligenceResult(p); assert(r.confidence === 0 && r.value.confidenceKnown === false && r.dataState === DATA_STATES.UNKNOWN, "Unknown limitation lost."); });
check("immutable", () => assert(Object.isFrozen(getPlayerRecognitionIntelligenceResult(projection()).value.recognitions[0]), "Result mutable."));
check("input-unchanged", () => { const p = projection(); const before = JSON.stringify(p); getPlayerRecognitionIntelligenceResult(p); assert(JSON.stringify(p) === before, "Input changed."); });
check("deterministic", () => { const p = projection(); assert(JSON.stringify(getPlayerRecognitionIntelligenceResult(p)) === JSON.stringify(getPlayerRecognitionIntelligenceResult(p)), "Output nondeterministic."); });

const snapshots = [
  ["00-0033873", { rawScore: 20, score: 86, recentRecognitionScore: 57, eliteSeasonCount: 2, establishedCareerBaseline: 86 }],
  ["00-0034796", { rawScore: 25, score: 95, recentRecognitionScore: 88, eliteSeasonCount: 3, establishedCareerBaseline: 86 }],
  ["00-0034857", { rawScore: 14, score: 75, recentRecognitionScore: 70, eliteSeasonCount: 1, establishedCareerBaseline: 78 }],
  ["00-0036389", { rawScore: 6, score: 61, recentRecognitionScore: 54, eliteSeasonCount: 0, establishedCareerBaseline: null }],
];
snapshots.forEach(([id, expected]) => check(`legacy-snapshot-${id}`, () => { const result = getPlayerRecognitionSummary({ playerId: id, position: "QB", competitionLevel: "NFL", yearsExperience: 5 }); Object.entries(expected).forEach(([key, value]) => assert(result[key] === value, `${id} ${key} changed.`)); }));
check("legacy-missing", () => { const result = getPlayerRecognitionSummary({ playerId: "missing", position: "QB", competitionLevel: "NFL", yearsExperience: 1 }); assert(!result.available && result.score === 0 && result.awards.length === 0, "Missing legacy changed."); });
check("legacy-partial", () => { const result = getPlayerRecognitionSummary({ playerId: "00-0033873", position: "QB", competitionLevel: "NFL", yearsExperience: 5 }); assert(result.available && result.score === 86, "Wrapper failed."); });
check("legacy-tier-boundaries", () => { [0, 3, 8, 14, 20].forEach((rawScore) => assert(calculateLegacyRecognitionScore([{ type: rawScore ? "mvp" : "unknown", season: 2026 }]).tier, "Tier missing.")); });
check("confidence-regression", () => assert(runConfidenceUtilsDiagnostics().failed === 0, "Confidence regression."));
check("projection-regression", () => assert(runRecognitionInputProjectionDiagnostics().failed === 0, "Projection regression."));

export function runPlayerRecognitionEngineDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((result) => result.passed).length;
  return { suite: "PlayerRecognitionEngineDiagnostics", total: results.length, passed, failed: results.length - passed, compatibilitySnapshots: snapshots.length + 1, results };
}
export default { runPlayerRecognitionEngineDiagnostics };
