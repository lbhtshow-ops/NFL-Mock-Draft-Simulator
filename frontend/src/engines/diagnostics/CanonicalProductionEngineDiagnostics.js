import { DATA_STATES, EVIDENCE_LEVELS, isIntelligenceResult } from "../contracts/IntelligenceResultContract.js";
import { createProductionModeledOutputDeclaration } from "../production/ProductionModeledOutputDeclaration.js";
import {
  PRODUCTION_COMPLETENESS,
  PRODUCTION_SAMPLE_STATUS,
  createProductionInput,
} from "../production/ProductionInputProjection.js";
import { getCanonicalProductionIntelligenceResult } from "../production/CanonicalProductionEngine.js";
import defaultProductionProfile from "../../data/footballIntelligence/production/defaultProductionProfile.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function same(left, right, message) { assert(JSON.stringify(left) === JSON.stringify(right), message); }
function context(overrides = {}) { return { available: true, playerId: "player:production-test", position: "DL", competition: { level: "FBS" }, careerStage: "DRAFT_PROSPECT", frameworkVersion: "1.0.0", ...overrides }; }
function declaration() { return createProductionModeledOutputDeclaration({ productionScores: { consistency: 88, efficiency: 87, explosiveness: 90, situationalProduction: 89, overallProductionScore: 89 }, strengths: ["Legacy strength"], concerns: ["Legacy concern"], notes: "Legacy note", sourceLabel: "Legacy source", lastUpdated: "2026-07-03" }); }
function available(overrides = {}) { return createProductionInput({ playerContext: context(), evidenceState: DATA_STATES.AVAILABLE, objectiveEvidence: { season: { year: 2025, school: "Test University", team: null }, defense: { tackles: 31, sacks: 0, pressures: null } }, completeness: { status: PRODUCTION_COMPLETENESS.COMPLETE, scope: "2025 supplied statistical package", limitations: [] }, sample: { status: PRODUCTION_SAMPLE_STATUS.SUFFICIENT, opportunities: { games: 13, starts: 13, snaps: null } }, ...overrides }); }
function partial() { return available({ completeness: { status: PRODUCTION_COMPLETENESS.PARTIAL, scope: "Known 2025 fields", limitations: ["Coverage is incomplete."] } }); }
function unavailable(state = DATA_STATES.UNAVAILABLE) { return createProductionInput({ playerContext: context(), evidenceState: state, objectiveEvidence: null, completeness: { status: PRODUCTION_COMPLETENESS.UNKNOWN, scope: null, limitations: [] }, sample: { status: PRODUCTION_SAMPLE_STATUS.UNKNOWN, opportunities: null } }); }
function insufficient() { return available({ evidenceState: DATA_STATES.INSUFFICIENT_SAMPLE, sample: { status: PRODUCTION_SAMPLE_STATUS.INSUFFICIENT, opportunities: { games: 1, starts: 0 } } }); }
function result(input = available()) { return getCanonicalProductionIntelligenceResult(input); }
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
const source = getCanonicalProductionIntelligenceResult.toString();
const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("valid-projection-accepted", () => assert(result().available, "Valid projection rejected."));
check("player-name-rejected", () => assert(result("Peter Woods").value.inputStatus === "INVALID", "Name accepted."));
check("player-id-rejected", () => assert(result("2026-peter-woods").value.inputStatus === "INVALID", "ID accepted."));
check("raw-profile-rejected", () => assert(result({ statistics: { defense: { sacks: 3 } } }).value.inputStatus === "INVALID", "Raw profile accepted."));
check("arbitrary-player-rejected", () => assert(result({ playerId: "x", position: "DL" }).value.inputStatus === "INVALID", "Player accepted."));
check("default-sentinel-rejected", () => assert(result(defaultProductionProfile).value.inputStatus === "INVALID", "Default sentinel accepted."));
check("projection-lookalike-rejected", () => assert(result({ contract: "ProductionInputProjection", contractVersion: "1.0.0", validation: { valid: true } }).value.inputStatus === "INVALID", "Lookalike accepted."));
check("no-registry-lookup", () => assert(!/getCanonicalPlayerId|productionProfiles/.test(source), "Registry lookup imported."));
check("no-legacy-dataset-import", () => assert(!/createProductionProfile|defaultProductionProfile|productionProfiles/.test(source), "Legacy dataset imported."));
check("no-active-consumer-import", () => assert(!/FootballIntelligenceService|PlayerEvaluation|DraftBoard|DraftDecision/.test(source), "Consumer imported."));

check("valid-intelligence-result", () => assert(isIntelligenceResult(result()), "Contract invalid."));
check("score-always-null", () => [available(), partial(), unavailable(), unavailable(DATA_STATES.UNKNOWN), insufficient()].forEach((input) => assert(result(input).score === null, "Score produced.")));
check("unknown-confidence", () => assert(result().confidence === 0 && result().value.confidenceKnown === false, "Confidence claimed."));
check("evidence-level-none", () => assert(result().evidenceLevel === EVIDENCE_LEVELS.NONE, "Evidence level claimed."));
check("confidence-explained", () => assert(result().explanation.contextualFactors.some((item) => item.includes("unknown confidence")), "Unknown confidence unexplained."));
check("deeply-immutable", () => assert(frozen(result(available({ legacyModeledOutputDeclaration: declaration() }))), "Result mutable."));
check("caller-input-unchanged", () => { const raw = { playerContext: context(), evidenceState: DATA_STATES.AVAILABLE, objectiveEvidence: { games: 0 }, completeness: { status: "COMPLETE", scope: "test", limitations: [] }, sample: { status: "UNKNOWN", opportunities: null } }; const before = JSON.stringify(raw); const projection = createProductionInput(raw); result(projection); assert(JSON.stringify(raw) === before && !Object.isFrozen(raw), "Caller input changed."); });
check("projection-unchanged", () => { const input = available(); const before = JSON.stringify(input); result(input); assert(JSON.stringify(input) === before, "Projection changed."); });
check("declaration-unchanged", () => { const declared = declaration(); const before = JSON.stringify(declared); result(available({ legacyModeledOutputDeclaration: declared })); assert(JSON.stringify(declared) === before, "Declaration changed."); });
check("deterministic", () => same(result(), result(), "Output nondeterministic."));

check("player-id-preserved", () => assert(result().playerId === "player:production-test", "Player lost."));
check("position-preserved", () => assert(result().value.context.position === "DL", "Position lost."));
check("competition-preserved", () => assert(result().competitionLevel === "FBS", "Competition lost."));
check("career-stage-preserved", () => assert(result().careerStage === "DRAFT_PROSPECT", "Career stage lost."));
check("framework-version-preserved", () => assert(result().value.context.frameworkVersion === "1.0.0" && result().versions.framework === "1.0.0", "Framework version lost."));
check("season-preserved", () => assert(result().value.context.represented.season === 2025, "Season lost."));
check("school-team-preserved", () => { const represented = result().value.context.represented; assert(represented.school === "Test University" && represented.team === null, "School/team changed."); });
check("missing-context-not-invented", () => { const represented = result(available({ objectiveEvidence: { defense: { sacks: 1 } } })).value.context.represented; assert(represented.season === null && represented.school === null && represented.team === null, "Context invented."); });

check("top-categories-deterministic", () => same(result().value.evidenceInventory.topLevelCategories, ["defense", "season"], "Categories unstable."));
check("nested-paths-deterministic", () => same(result().value.evidenceInventory.suppliedPaths, ["defense.sacks", "defense.tackles", "season.school", "season.year"], "Paths unstable."));
check("null-distinct-from-absent", () => { const inventory = result().value.evidenceInventory; assert(inventory.unresolvedPaths.includes("defense.pressures") && !inventory.unresolvedPaths.includes("defense.interceptions"), "Null/absent collapsed."); });
check("numeric-zero-preserved", () => assert(result().value.objectiveEvidence.defense.sacks === 0, "Zero lost."));
check("position-specific-preserved", () => { const r = result(available({ objectiveEvidence: { trench: { passRushSnaps: 101, doubleTeamRateLabel: "SUPPLIED" } } })); assert(r.value.objectiveEvidence.trench.passRushSnaps === 101 && r.value.objectiveEvidence.trench.doubleTeamRateLabel === "SUPPLIED", "Position evidence changed."); });
check("field-count-factual", () => assert(result().value.evidenceInventory.suppliedScalarCount === 4 && result().value.evidenceInventory.unresolvedFieldCount === 2, "Counts wrong."));
check("no-expected-denominator", () => assert(result().value.evidenceInventory.expectedFieldCount === null && result().value.evidenceInventory.coverageRatio === null, "Denominator invented."));
check("no-completeness-inference", () => assert(result(partial()).value.completeness.status === "PARTIAL" && result(partial()).value.completeness.inferredFromFieldCounts === false, "Completeness inferred."));
check("no-sample-inference", () => { const r = result(available({ sample: { status: "UNKNOWN", opportunities: { games: 1000 } } })); assert(r.value.sample.status === "UNKNOWN" && r.value.sample.inferredFromOpportunities === false, "Sample inferred."); });

check("available-complete", () => assert(result().available && result().dataState === DATA_STATES.AVAILABLE, "Complete unavailable."));
check("complete-scope-only", () => assert(result().value.completeness.appliesOnlyToDeclaredScope && result().value.limitations.some((item) => item.includes("caller-declared scope")), "Scope claim widened."));
check("available-partial-limitations", () => { const r = result(partial()); assert(r.available && r.value.limitations.includes("Coverage is incomplete."), "Partial limitation lost."); });
check("unavailable-preserved", () => { const r = result(unavailable()); assert(!r.available && r.dataState === DATA_STATES.UNAVAILABLE && r.value.objectiveEvidence === null, "Unavailable changed."); });
check("unknown-preserved", () => { const r = result(unavailable(DATA_STATES.UNKNOWN)); assert(!r.available && r.dataState === DATA_STATES.UNKNOWN, "Unknown changed."); });
check("insufficient-facts-preserved", () => { const r = result(insufficient()); assert(r.available && r.dataState === DATA_STATES.INSUFFICIENT_SAMPLE && r.value.objectiveEvidence.defense.tackles === 31, "Insufficient facts lost."); });
check("insufficient-no-model", () => assert(result(insufficient()).score === null && result(insufficient()).value.outputType === "FACTUAL_PRODUCTION_REPORT", "Insufficient modeled."));
check("invalid-distinct-from-missing", () => { const invalid = result({}); const missing = result(unavailable()); assert(invalid.value.inputStatus === "INVALID" && missing.value.inputStatus === "VALID", "Invalid became missing."); });
check("default-never-evidence-absence", () => assert(result(defaultProductionProfile).value.inputStatus === "INVALID", "Sentinel became absence."));

check("declaration-availability", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.declaration.supplied, "Declaration unavailable."));
check("declaration-values-not-canonical", () => { const r = result(available({ legacyModeledOutputDeclaration: declaration() })); assert(!Object.hasOwn(r.value.declaration, "productionScores") && r.score === null, "Values adopted."); });
check("declaration-no-score-effect", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).score === result().score, "Declaration changed score."));
check("declaration-no-completeness-effect", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.completeness.status === result().value.completeness.status, "Declaration changed completeness."));
check("declaration-no-sample-effect", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.sample.status === result().value.sample.status, "Declaration changed sample."));
check("declaration-no-count-effect", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.evidenceInventory.suppliedScalarCount === result().value.evidenceInventory.suppliedScalarCount, "Declaration changed count."));
check("strengths-not-canonical", () => assert(!JSON.stringify(result(available({ legacyModeledOutputDeclaration: declaration() })).value).includes("Legacy strength"), "Strength adopted."));
check("concerns-not-canonical", () => assert(!JSON.stringify(result(available({ legacyModeledOutputDeclaration: declaration() })).value).includes("Legacy concern"), "Concern adopted."));
check("notes-not-canonical", () => assert(!JSON.stringify(result(available({ legacyModeledOutputDeclaration: declaration() })).value).includes("Legacy note"), "Note adopted."));
check("unknown-derivation-preserved", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.declaration.derivationStatus === "UNKNOWN", "Derivation promoted."));
check("transitional-preserved", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.declaration.governanceStatus === "TRANSITIONAL", "Governance promoted."));
check("noncanonical-preserved", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.declaration.canonicalDerivation === false, "Canonical derivation claimed."));
check("calibration-preserved", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.declaration.calibrationStatus === "NOT_DOCUMENTED", "Calibration promoted."));
check("legacy-ownership-preserved", () => assert(result(available({ legacyModeledOutputDeclaration: declaration() })).value.declaration.classification === "LEGACY_DECLARED_MODELED_OUTPUT", "Legacy identity lost."));

check("no-production-score", () => assert(result().score === null, "Production score exists."));
check("no-consistency-analysis", () => assert(!Object.hasOwn(result().value, "consistency"), "Consistency analysis exists."));
check("no-efficiency-analysis", () => assert(!Object.hasOwn(result().value, "efficiency"), "Efficiency analysis exists."));
check("no-explosiveness-analysis", () => assert(!Object.hasOwn(result().value, "explosiveness"), "Explosiveness analysis exists."));
check("no-situational-analysis", () => assert(!Object.hasOwn(result().value, "situationalProduction"), "Situational analysis exists."));
check("no-ranking", () => assert(!Object.hasOwn(result().value, "ranking"), "Ranking exists."));
check("no-projection", () => assert(!Object.hasOwn(result().value, "projection"), "Projection exists."));
check("no-recommendation", () => assert(!Object.hasOwn(result().value, "recommendation"), "Recommendation exists."));
check("no-fit", () => assert(!Object.hasOwn(result().value, "teamFit") && !Object.hasOwn(result().value, "schemeFit"), "Fit exists."));
check("no-quality-language", () => assert(!/\b(elite|good|bad|strong|weak|quality player|productive player)\b/i.test(result().summary), "Quality language exists."));
check("no-total-interpretation", () => assert(!/tackles.*(good|bad|strong|weak)|sacks.*(good|bad|strong|weak)/i.test(JSON.stringify(result())), "Totals interpreted."));
check("no-confidence-formula", () => assert(!/assessConfidence|confidenceFor|confidenceWeight/.test(source) && result().confidence === 0, "Confidence formula exists."));

check("no-fid-dependency", () => assert(!/footballIntelligence\/fid/.test(source), "FID dependency."));
check("no-fiis-dependency", () => assert(!/FIIS|Fiis/.test(source), "FIIS dependency."));
check("no-decision-engine", () => assert(!/DraftDecisionEngine/.test(source), "Decision dependency."));
check("no-draft-board", () => assert(!/DraftBoardEngine/.test(source), "Draft Board dependency."));
check("no-simulator", () => assert(!/Simulator|simulator/.test(source), "Simulator dependency."));
check("no-ui", () => assert(!/components\/|views\/|pages\//.test(source), "UI dependency."));
check("no-persistence", () => assert(!/Supabase|supabase|persistence|repository lookup/i.test(source), "Persistence dependency."));
check("no-network", () => assert(!/fetch\(|axios|https?:\/\//.test(source), "Network dependency."));
check("no-evidence-transition", () => assert(!/EvidenceTransition/.test(source), "Evidence Transition dependency."));
check("no-hidden-registry", () => assert(!/registry|resolvePlayerContext|getProductionProfile/.test(source), "Hidden registry dependency."));

export function runCanonicalProductionEngineDiagnostics() {
  const results = checks.map(({ id, run }) => {
    try { run(); return { id, passed: true, error: null }; }
    catch (error) { return { id, passed: false, error: error.message }; }
  });
  const passed = results.filter((entry) => entry.passed).length;
  return { suite: "CanonicalProductionEngineDiagnostics", total: results.length, passed, failed: results.length - passed, results };
}

export default { runCanonicalProductionEngineDiagnostics };
