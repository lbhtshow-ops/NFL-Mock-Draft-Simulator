import productionProfiles from "../../data/footballIntelligence/production/productionProfiles.js";
import defaultProductionProfile from "../../data/footballIntelligence/production/defaultProductionProfile.js";
import {
  PRODUCTION_MODELED_OUTPUT_REMOVAL_CONDITION,
  createProductionModeledOutputDeclaration,
  isProductionModeledOutputDeclaration,
  validateProductionModeledOutputDeclaration,
} from "../production/ProductionModeledOutputDeclaration.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [];
function check(id, run) { checks.push({ id, run }); }

const input = {
  productionScores: {
    consistency: 87,
    efficiency: 91,
    explosiveness: 90,
    situationalProduction: 88,
    overallProductionScore: 89,
  },
  strengths: ["Efficient passer"],
  concerns: ["Limited sample"],
  notes: "Legacy declaration.",
  sourceLabel: "LBHT Film Study",
  lastUpdated: "2026-07-03",
};

check("valid-declaration", () => assert(isProductionModeledOutputDeclaration(createProductionModeledOutputDeclaration(input)), "Declaration invalid."));
check("scores-exact", () => assert(JSON.stringify(createProductionModeledOutputDeclaration(input).productionScores) === JSON.stringify(input.productionScores), "Scores changed."));
check("category-not-recalculated", () => assert(createProductionModeledOutputDeclaration(input).productionScores.efficiency === 91, "Category recalculated."));
check("overall-not-recalculated", () => assert(createProductionModeledOutputDeclaration(input).productionScores.overallProductionScore === 89, "Overall recalculated."));
check("unknown-derivation", () => assert(createProductionModeledOutputDeclaration(input).derivationStatus === "UNKNOWN", "Derivation claimed."));
check("noncanonical", () => assert(createProductionModeledOutputDeclaration(input).canonicalDerivation === false, "Canonical derivation claimed."));
check("undocumented-calibration", () => assert(createProductionModeledOutputDeclaration(input).calibrationStatus === "NOT_DOCUMENTED", "Calibration claimed."));
check("unresolved-model", () => assert(createProductionModeledOutputDeclaration(input).modelVersion === null, "Model invented."));
check("missing-remains-null", () => assert(createProductionModeledOutputDeclaration({ productionScores: {} }).productionScores.overallProductionScore === null, "Missing became zero."));
check("invalid-number", () => assert(!validateProductionModeledOutputDeclaration({ productionScores: { consistency: Number.NaN } }).valid, "NaN accepted."));
check("out-of-range", () => assert(!validateProductionModeledOutputDeclaration({ productionScores: { consistency: 101 } }).valid, "Undefined score bound accepted."));
check("input-unchanged", () => { const before = JSON.stringify(input); createProductionModeledOutputDeclaration(input); assert(JSON.stringify(input) === before, "Input changed."); });
check("deeply-immutable", () => { const result = createProductionModeledOutputDeclaration(input); assert(Object.isFrozen(result) && Object.isFrozen(result.productionScores) && Object.isFrozen(result.strengths), "Output mutable."); });
check("deterministic", () => assert(JSON.stringify(createProductionModeledOutputDeclaration(input)) === JSON.stringify(createProductionModeledOutputDeclaration(input)), "Output nondeterministic."));
check("text-preservation", () => { const result = createProductionModeledOutputDeclaration(input); assert(result.strengths[0] === input.strengths[0] && result.concerns[0] === input.concerns[0] && result.notes === input.notes, "Text changed."); });
check("source-label-only", () => { const result = createProductionModeledOutputDeclaration(input); assert(result.sourceLabel === input.sourceLabel && result.declaredBy === null, "Source promoted."); });
check("last-updated", () => assert(createProductionModeledOutputDeclaration(input).lastUpdated === input.lastUpdated, "Update date changed."));
check("no-statistics", () => assert(!Object.hasOwn(createProductionModeledOutputDeclaration(input), "statistics"), "Objective statistics included."));
check("transitional", () => assert(createProductionModeledOutputDeclaration(input).governanceStatus === "TRANSITIONAL", "Transitional status missing."));
check("removal-condition", () => assert(PRODUCTION_MODELED_OUTPUT_REMOVAL_CONDITION.includes("active evaluation and Decision Engine consumers"), "Removal condition missing."));

const snapshots = [
  ["2026-arch-manning", { consistency: 87, efficiency: 91, explosiveness: 90, situationalProduction: 88, overallProductionScore: 89 }],
  ["2026-peter-woods", { consistency: 89, efficiency: 88, explosiveness: 90, situationalProduction: 91, overallProductionScore: 89 }],
  ["2026-caleb-downs", { consistency: 94, efficiency: 93, explosiveness: 91, situationalProduction: 95, overallProductionScore: 94 }],
  ["2026-francis-mauigoa", { consistency: 91, efficiency: 90, explosiveness: 92, situationalProduction: 91, overallProductionScore: 91 }],
];
snapshots.forEach(([playerId, expected]) => check(`snapshot-${playerId}`, () => {
  const profile = productionProfiles[playerId];
  assert(JSON.stringify(profile.productionScores) === JSON.stringify(expected), `${playerId} changed.`);
  const declaration = createProductionModeledOutputDeclaration({ productionScores: profile.productionScores, strengths: profile.strengths, concerns: profile.concerns, notes: profile.notes, sourceLabel: profile.source, lastUpdated: profile.lastUpdated });
  assert(declaration.productionScores.overallProductionScore === expected.overallProductionScore, `${playerId} declaration changed.`);
}));
check("missing-profile", () => assert(defaultProductionProfile.playerId === null && productionProfiles.missing === undefined, "Missing profile changed."));

export function runProductionModeledOutputDeclarationDiagnostics() {
  const results = checks.map(({ id, run }) => {
    try { run(); return { id, passed: true, error: null }; }
    catch (error) { return { id, passed: false, error: error.message }; }
  });
  const passed = results.filter((result) => result.passed).length;
  return { suite: "ProductionModeledOutputDeclarationDiagnostics", total: results.length, passed, failed: results.length - passed, compatibilitySnapshots: snapshots.length + 1, results };
}

export default { runProductionModeledOutputDeclarationDiagnostics };
