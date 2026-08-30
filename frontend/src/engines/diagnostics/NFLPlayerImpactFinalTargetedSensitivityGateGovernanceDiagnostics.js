import assert from "node:assert/strict";
import { NFL_PLAYER_IMPACT_FINAL_TARGETED_SENSITIVITY_GATE_2D3A as G } from "../teamIntelligence/strength/calibration/playerEvidence/NFLPlayerImpactFinalTargetedSensitivityGateGovernance.js";

const tests = [];
const test = (name, fn) => {
  try { fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
};

test("contract", () => assert.equal(G.contractVersion, "FIE-NFL-PLAYER-IMPACT-FINAL-TARGETED-SENSITIVITY-GATE-GOVERNANCE-1.0.0"));
test("no-historical-reopen", () => assert.equal(G.historicalConstructionReopeningAuthorized, false));
test("legacy-131", () => assert.equal(G.coreMatchedEffectCorpusRequired.legacyEffects, 131));
test("expansion-minimum-500", () => assert.equal(G.coreMatchedEffectCorpusRequired.expansionMinimumEffects, 500));
test("three-windows", () => assert.deepEqual([...G.performanceWindow.windows], ["EARLY","MID","LATE"]));
test("window-variation-can-carry", () => assert.equal(G.performanceWindow.variationMayBeCarriedForwardToShadowValidation, true));
test("opponent-adjustment-required", () => assert.equal(G.opponentAdjustment.required, true));
test("raw-vs-residual", () => assert.equal(G.opponentAdjustment.compareRawMarginEffectToCanonicalResidualizedEffect, true));
test("opponent-min-100", () => assert.equal(G.opponentAdjustment.minimumComparableRows, 100));
test("team-game-effect-unit", () => assert.equal(G.playerHeterogeneity.unitOfEffect, "TEAM_GAME_ATT"));
test("aggregate-player-evidence", () => assert.equal(G.playerHeterogeneity.aggregatePlayerEvidenceWithinTreatedTeamGame, true));
test("no-individual-player-att", () => assert.equal(G.playerHeterogeneity.individualPlayerATTMayBeInvented, false));
test("no-source-rebuild", () => assert.equal(G.antiWeedsPolicy.doNotRebuildHistoricalSources, true));
test("no-matcher-retune", () => assert.equal(G.antiWeedsPolicy.doNotRetuneMatcher, true));
test("no-new-model-here", () => assert.equal(G.antiWeedsPolicy.doNotCreateNewPlayerImpactModelHere, true));
test("no-pickem-weights", () => assert.equal(G.antiWeedsPolicy.doNotCreateIndependentPickemWeights, true));
test("shadow-only", () => assert.equal(G.safeguards.mode, "SHADOW_ONLY"));
test("production-fit-blocked", () => assert.equal(G.safeguards.productionWeightsFitAuthorized, false));
test("calibration-blocked", () => assert.equal(G.safeguards.calibrationAuthorized, false));
test("team-strength-blocked", () => assert.equal(G.safeguards.teamStrengthMutationAuthorized, false));
test("decision-model-blocked", () => assert.equal(G.safeguards.decisionModelMutationAuthorized, false));
test("pickem-blocked", () => assert.equal(G.safeguards.pickemMutationAuthorized, false));

const passed = tests.filter(t => t.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({
  suite: "NFL Player Impact Final Targeted Sensitivity Gate Governance",
  status: failed ? "FAIL" : "PASS",
  passed,
  failed,
  tests
}, null, 2));
if (failed) process.exitCode = 1;
