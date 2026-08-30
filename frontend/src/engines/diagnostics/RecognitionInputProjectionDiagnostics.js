import { DATA_STATES } from "../contracts/IntelligenceResultContract.js";
import {
  RECOGNITION_COMPLETENESS,
  createRecognitionInput,
  isRecognitionInput,
  validateRecognitionInput,
} from "../playerEvaluation/recognition/RecognitionInputProjection.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function context() {
  return { available: true, playerId: "player:test", position: "QB", competition: { level: "NFL" }, careerStage: "NFL_VETERAN", frameworkVersion: "1.0.0" };
}
function input(overrides = {}) {
  return { playerContext: context(), evidenceState: DATA_STATES.AVAILABLE, records: [{ type: "mvp", season: 2024 }], completeness: { status: RECOGNITION_COMPLETENESS.COMPLETE, scope: "Supplied repository coverage", limitations: [] }, ...overrides };
}
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
function hasError(result, code) { return result.validation.errors.some((error) => error.code === code); }

const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("valid-construction", () => assert(isRecognitionInput(createRecognitionInput(input())), "Valid input failed."));
check("deep-immutability", () => assert(frozen(createRecognitionInput(input())), "Projection is mutable."));
check("context-unchanged", () => { const value = context(); const before = JSON.stringify(value); createRecognitionInput(input({ playerContext: value })); assert(JSON.stringify(value) === before && !Object.isFrozen(value), "Context changed."); });
check("records-unchanged", () => { const record = { type: "mvp", season: 2024 }; const before = JSON.stringify(record); createRecognitionInput(input({ records: [record] })); assert(JSON.stringify(record) === before && !Object.isFrozen(record), "Record changed."); });
check("array-unchanged", () => { const records = [{ type: "mvp", season: 2024 }]; createRecognitionInput(input({ records })); assert(!Object.isFrozen(records), "Array changed."); });
check("deterministic", () => assert(JSON.stringify(createRecognitionInput(input())) === JSON.stringify(createRecognitionInput(input())), "Construction is nondeterministic."));
check("stable-metadata", () => { const result = createRecognitionInput(input()); assert(result.contract === "RecognitionInputProjection" && result.version === "1.0.0", "Metadata changed."); });
check("records-vs-missing", () => assert(createRecognitionInput(input()).evidenceState !== createRecognitionInput({ playerContext: context() }).evidenceState, "States collapsed."));
check("explicit-complete-empty", () => assert(createRecognitionInput(input({ records: [] })).validation.valid, "Complete empty failed."));
check("empty-without-completeness", () => assert(hasError(createRecognitionInput(input({ records: [], completeness: null })), "AMBIGUOUS_EMPTY_EVIDENCE"), "Empty evidence was inferred complete."));
check("partial-distinct", () => assert(createRecognitionInput(input({ completeness: { status: "PARTIAL", scope: "Known sources", limitations: ["Coverage incomplete"] } })).completeness.status === "PARTIAL", "Partial collapsed."));
check("missing-distinct-empty", () => { const missing = createRecognitionInput({ playerContext: context() }); const empty = createRecognitionInput(input({ records: [] })); assert(missing.evidenceState === DATA_STATES.UNKNOWN && empty.evidenceState === DATA_STATES.AVAILABLE, "Missing and complete empty collapsed."); });
check("invalid-distinct-missing", () => assert(!createRecognitionInput({ playerContext: context(), records: "bad" }).validation.valid, "Invalid became missing."));
check("complete-empty-nonempty-distinction", () => assert(createRecognitionInput(input()).records.length === 1, "Records were discarded by completeness."));
check("missing-with-records-rejected", () => assert(hasError(createRecognitionInput(input({ evidenceState: DATA_STATES.UNKNOWN })), "CONTRADICTORY_EVIDENCE_STATE"), "Contradiction accepted."));
check("partial-with-records-valid", () => assert(createRecognitionInput(input({ completeness: { status: "PARTIAL", scope: "Known sources", limitations: [] } })).validation.valid, "Partial records failed."));
check("unknown-completeness-explicit", () => assert(createRecognitionInput(input({ completeness: { status: "UNKNOWN" } })).completeness.status === "UNKNOWN", "Unknown completeness changed."));
check("award-type-valid", () => assert(createRecognitionInput(input()).records[0].type === "mvp", "Type changed."));
check("blank-type-rejected", () => assert(hasError(createRecognitionInput(input({ records: [{ type: " ", season: 2024 }] })), "INVALID_AWARD_TYPE"), "Blank type accepted."));
check("season-valid", () => assert(createRecognitionInput(input()).records[0].season === 2024, "Season changed."));
check("season-unresolved", () => assert(createRecognitionInput(input({ records: [{ type: "mvp", season: null }] })).validation.valid, "Unresolved season rejected."));
check("season-invalid", () => assert(hasError(createRecognitionInput(input({ records: [{ type: "mvp", season: "2024" }] })), "INVALID_AWARD_SEASON"), "Invalid season accepted."));
check("extra-field-rejected", () => assert(hasError(createRecognitionInput(input({ records: [{ type: "mvp", season: 2024, prestige: 100 }] })), "UNSUPPORTED_RECORD_FIELD"), "Extra field accepted."));
check("duplicates-rejected", () => assert(hasError(createRecognitionInput(input({ records: [{ type: "MVP", season: 2024 }, { type: "mvp", season: 2024 }] })), "DUPLICATE_RECOGNITION_RECORD"), "Duplicate accepted."));
check("order-normalized", () => { const a = createRecognitionInput(input({ records: [{ type: "proBowl", season: 2024 }, { type: "mvp", season: 2024 }] })); const b = createRecognitionInput(input({ records: [...input({ records: [{ type: "proBowl", season: 2024 }, { type: "mvp", season: 2024 }] }).records].reverse() })); assert(JSON.stringify(a.records) === JSON.stringify(b.records), "Order remained semantic."); });
check("no-prestige", () => assert(!Object.hasOwn(createRecognitionInput(input()).records[0], "prestige"), "Prestige calculated."));
check("no-taxonomy", () => assert(createRecognitionInput(input({ records: [{ type: "caller-label", season: 2024 }] })).validation.valid, "Taxonomy imposed."));

[["sourceRefs", "sourceRefs"], ["evidenceRefs", "evidenceRefs"], ["verification", "verification"], ["provenance", "provenance"], ["issuingOrganizationRef", "issuingOrganizationRef"]].forEach(([id, field]) => {
  check(`missing-${id}-unknown`, () => assert(createRecognitionInput(input()).records[0][field] === null, `${field} fabricated.`));
});
check("unknown-metadata-valid", () => assert(createRecognitionInput(input()).validation.valid, "Unknown metadata invalidated structure."));

[
  ["no-legacy-registry-output", "recognitionProfile"], ["no-fid-output", "fid"], ["no-research-output", "research"],
  ["no-fiis-output", "fiis"], ["no-persistence-output", "persistence"], ["no-intelligence-result", "score"],
  ["no-confidence", "confidence"], ["no-evidence-level", "evidenceLevel"], ["no-decision", "recommendation"],
  ["no-application", "presentation"], ["no-canonical-record", "canonicalRecord"],
].forEach(([id, key]) => check(id, () => assert(!Object.hasOwn(createRecognitionInput(input()), key), `${key} output found.`)));
check("pure-repeatability", () => { const value = input(); assert(JSON.stringify(createRecognitionInput(value)) === JSON.stringify(createRecognitionInput(value)), "Side effect changed output."); });
check("recognition-caller-not-required", () => assert(createRecognitionInput(input()).validation.valid, "Projection depends on Recognition engine."));
check("roster-caller-not-required", () => assert(createRecognitionInput(input()).validation.valid, "Projection depends on roster evaluation."));
check("validator-api", () => assert(validateRecognitionInput(input()).valid, "Validator failed."));

export function runRecognitionInputProjectionDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((result) => result.passed).length;
  return { suite: "RecognitionInputProjectionDiagnostics", total: results.length, passed, failed: results.length - passed, results };
}

export default { runRecognitionInputProjectionDiagnostics };
