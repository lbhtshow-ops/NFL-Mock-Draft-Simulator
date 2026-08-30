import { DATA_STATES } from "../contracts/IntelligenceResultContract.js";
import { createProductionModeledOutputDeclaration } from "../production/ProductionModeledOutputDeclaration.js";
import {
  PRODUCTION_COMPLETENESS,
  PRODUCTION_INPUT_CONTRACT,
  PRODUCTION_INPUT_VERSION,
  PRODUCTION_SAMPLE_STATUS,
  createProductionInput,
  isProductionInput,
  validateProductionInput,
} from "../production/ProductionInputProjection.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function context() { return { available: true, playerId: "player:test", position: "QB", competition: { level: "FBS" }, careerStage: "DRAFT_PROSPECT", frameworkVersion: "1.0.0" }; }
function modeled() { return createProductionModeledOutputDeclaration({ productionScores: { consistency: 80, overallProductionScore: 82 }, strengths: ["Legacy strength"], concerns: ["Legacy concern"], sourceLabel: "Legacy label" }); }
function valid(overrides = {}) { return { playerContext: context(), evidenceState: DATA_STATES.AVAILABLE, objectiveEvidence: { season: { year: 2025, school: "Test" }, offense: { passing: { attempts: 100, completions: 60, interceptions: 0 } } }, completeness: { status: PRODUCTION_COMPLETENESS.COMPLETE, scope: "2025 supplied statistical package", limitations: [] }, sample: { status: PRODUCTION_SAMPLE_STATUS.SUFFICIENT, opportunities: { games: 10, starts: 8, attempts: 100 } }, ...overrides }; }
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
function hasError(result, code) { return result.validation.errors.some((error) => error.code === code); }
const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("identity", () => { const r = createProductionInput(valid()); assert(r.contract === PRODUCTION_INPUT_CONTRACT && r.contractVersion === PRODUCTION_INPUT_VERSION, "Identity changed."); });
check("valid", () => assert(isProductionInput(createProductionInput(valid())), "Valid input failed."));
check("immutable", () => assert(frozen(createProductionInput(valid({ legacyModeledOutputDeclaration: modeled() }))), "Projection mutable."));
check("context-unchanged", () => { const value = context(); const before = JSON.stringify(value); createProductionInput(valid({ playerContext: value })); assert(JSON.stringify(value) === before && !Object.isFrozen(value), "Context changed."); });
check("evidence-unchanged", () => { const value = valid().objectiveEvidence; const before = JSON.stringify(value); createProductionInput(valid({ objectiveEvidence: value })); assert(JSON.stringify(value) === before && !Object.isFrozen(value), "Evidence changed."); });
check("array-unchanged", () => { const limitations = ["Partial coverage"]; createProductionInput(valid({ completeness: { status: "PARTIAL", scope: "Known package", limitations } })); assert(!Object.isFrozen(limitations), "Caller array frozen."); });
check("deterministic", () => assert(JSON.stringify(createProductionInput(valid())) === JSON.stringify(createProductionInput(valid())), "Nondeterministic."));
check("evidence-separated", () => { const r = createProductionInput(valid({ legacyModeledOutputDeclaration: modeled() })); assert(r.objectiveEvidence.offense && r.legacyModeledOutputDeclaration.productionScores, "Sections collapsed."); });

[["productionScores", { overallProductionScore: 90 }], ["overallProductionScore", 90], ["strengths", "Good"], ["concerns", "Concern"], ["notes", "Analysis"], ["grade", 90], ["recommendation", "Draft"]].forEach(([key, value]) => {
  check(`reject-${key}`, () => assert(hasError(createProductionInput(valid({ objectiveEvidence: { season: 2025, [key]: value } })), "PROHIBITED_ANALYTICAL_FIELD"), `${key} accepted.`));
});
check("no-analysis-outputs", () => { const r = createProductionInput(valid()); assert(!Object.hasOwn(r, "score") && !Object.hasOwn(r, "confidence") && !Object.hasOwn(r, "evidenceLevel"), "Analysis produced."); });

check("available", () => assert(createProductionInput(valid()).evidenceState === DATA_STATES.AVAILABLE, "Available changed."));
check("partial", () => assert(createProductionInput(valid({ completeness: { status: "PARTIAL", scope: "Known package", limitations: ["Coverage incomplete"] } })).validation.valid, "Partial failed."));
check("missing-vs-zero", () => { const missing = createProductionInput({ playerContext: context(), evidenceState: DATA_STATES.UNAVAILABLE, objectiveEvidence: null, completeness: { status: "UNKNOWN" }, sample: { status: "UNKNOWN" } }); const zero = createProductionInput(valid({ objectiveEvidence: { games: 0 } })); assert(missing.objectiveEvidence === null && zero.objectiveEvidence.games === 0, "Missing and zero collapsed."); });
check("unknown", () => assert(createProductionInput({ playerContext: context(), evidenceState: DATA_STATES.UNKNOWN, completeness: { status: "UNKNOWN" }, sample: { status: "UNKNOWN" } }).validation.valid, "Unknown failed."));
check("invalid-distinct", () => assert(!createProductionInput(valid({ objectiveEvidence: { games: Number.NaN } })).validation.valid, "Invalid became missing."));
check("insufficient", () => { const r = createProductionInput(valid({ evidenceState: DATA_STATES.INSUFFICIENT_SAMPLE, sample: { status: "INSUFFICIENT", opportunities: { games: 1 } } })); assert(r.validation.valid && r.evidenceState === DATA_STATES.INSUFFICIENT_SAMPLE, "Insufficient failed."); });
check("no-default-sentinel", () => assert(!Object.hasOwn(createProductionInput(valid()), "profile"), "Default profile used."));
check("no-complete-empty", () => assert(hasError(createProductionInput(valid({ objectiveEvidence: {} })), "MISSING_OBJECTIVE_EVIDENCE"), "Complete empty fabricated."));

check("complete-scope", () => assert(hasError(createProductionInput(valid({ completeness: { status: "COMPLETE", scope: null, limitations: [] } })), "MISSING_COMPLETENESS_SCOPE"), "Scope not required."));
check("partial-limitations", () => assert(hasError(createProductionInput(valid({ completeness: { status: "PARTIAL", scope: "Known", limitations: [] } })), "MISSING_PARTIAL_LIMITATION"), "Partial limitation not required."));
check("unknown-completeness", () => { const r = createProductionInput({ playerContext: context(), evidenceState: DATA_STATES.UNKNOWN, completeness: { status: "UNKNOWN" }, sample: { status: "UNKNOWN" } }); assert(r.completeness.status === "UNKNOWN", "Unknown inferred."); });
check("no-count-inference", () => assert(createProductionInput(valid({ completeness: { status: "PARTIAL", scope: "One package", limitations: ["Incomplete"] } })).completeness.status === "PARTIAL", "Count inferred completeness."));
check("scope-preserved", () => assert(createProductionInput(valid()).completeness.scope === "2025 supplied statistical package", "Scope changed."));
check("bad-completeness", () => assert(hasError(createProductionInput(valid({ completeness: { status: "CERTAIN", scope: "x" } })), "INVALID_COMPLETENESS_STATUS"), "Unsupported completeness accepted."));

[["SUFFICIENT", "sufficient"], ["INSUFFICIENT", "insufficient"], ["UNKNOWN", "unknown"], ["NOT_APPLICABLE", "not-applicable"]].forEach(([status, id]) => check(`sample-${id}`, () => { const state = status === "INSUFFICIENT" ? DATA_STATES.INSUFFICIENT_SAMPLE : DATA_STATES.AVAILABLE; const r = createProductionInput(valid({ evidenceState: state, sample: { status, opportunities: { snaps: 0, attempts: 10 } } })); assert(r.sample.status === status, "Sample status changed."); }));
check("no-sample-calculation", () => { const r = createProductionInput(valid({ sample: { status: "SUFFICIENT", opportunities: { games: 0 } } })); assert(r.sample.status === "SUFFICIENT", "Sample recalculated."); });
check("position-opportunities", () => { const r = createProductionInput(valid({ sample: { status: "SUFFICIENT", opportunities: { passRushSnaps: 100, coverageSnaps: null } } })); assert(r.sample.opportunities.passRushSnaps === 100 && r.sample.opportunities.coverageSnaps === null, "Opportunities changed."); });

check("zero-statistic", () => assert(createProductionInput(valid({ objectiveEvidence: { sacks: 0 } })).objectiveEvidence.sacks === 0, "Zero lost."));
check("missing-statistic", () => assert(!Object.hasOwn(createProductionInput(valid({ objectiveEvidence: { games: 1 } })).objectiveEvidence, "sacks"), "Missing fabricated."));
check("negative-rejected", () => assert(hasError(createProductionInput(valid({ objectiveEvidence: { games: -1 } })), "INVALID_OBJECTIVE_NUMBER"), "Negative accepted."));
check("nonfinite-rejected", () => assert(hasError(createProductionInput(valid({ objectiveEvidence: { games: Infinity } })), "INVALID_OBJECTIVE_NUMBER"), "Infinity accepted."));
check("numeric-string-rejected", () => assert(hasError(createProductionInput(valid({ objectiveEvidence: { games: "10" } })), "NUMERIC_STRING_NOT_ACCEPTED"), "Numeric string accepted."));

check("declaration-valid", () => assert(createProductionInput(valid({ legacyModeledOutputDeclaration: modeled() })).validation.valid, "Declaration rejected."));
check("declaration-optional", () => assert(createProductionInput(valid()).legacyModeledOutputDeclaration === null, "Declaration required."));
check("declaration-preserved", () => { const r = createProductionInput(valid({ legacyModeledOutputDeclaration: modeled() })); assert(r.legacyModeledOutputDeclaration.productionScores.overallProductionScore === 82 && r.legacyModeledOutputDeclaration.canonicalDerivation === false, "Declaration changed."); });
check("declaration-governance", () => { const d = createProductionInput(valid({ legacyModeledOutputDeclaration: modeled() })).legacyModeledOutputDeclaration; assert(d.derivationStatus === "UNKNOWN" && d.calibrationStatus === "NOT_DOCUMENTED" && d.governanceStatus === "TRANSITIONAL", "Governance changed."); });
check("declaration-no-effect", () => { const base = createProductionInput(valid()); const withDeclaration = createProductionInput(valid({ legacyModeledOutputDeclaration: modeled() })); assert(base.completeness.status === withDeclaration.completeness.status && base.sample.status === withDeclaration.sample.status, "Declaration affected evidence state."); });

check("validator", () => assert(validateProductionInput(valid()).valid, "Validator failed."));

export function runProductionInputProjectionDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((result) => result.passed).length;
  return { suite: "ProductionInputProjectionDiagnostics", total: results.length, passed, failed: results.length - passed, results };
}
export default { runProductionInputProjectionDiagnostics };
