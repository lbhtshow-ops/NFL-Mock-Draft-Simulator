import { getAthleticIntelligenceResult, getAthleticSummary } from "../AthleticIntelligenceEngine.js";
import { ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY } from "../athletics/AthleticDecisionSupportCompatibilityPolicy.js";

export const ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY = ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.authorizedConsumers;

function assert(condition, message) { if (!condition) throw new Error(message); }
const checks = [];
function check(id, run) { checks.push({ id, run }); }
function arch() { return { playerId: "2026-arch-manning", position: "QB", playerContext: { competition: { level: "FBS" }, careerStage: "DRAFT_PROSPECT" } }; }

check("inventory-complete", () => assert(ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY.length === 11, "Consumer inventory incomplete."));
check("compatibility-only", () => assert(ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY.every((item) => item.compatibilityAuthorization !== "NOT_AUTHORIZED" && !item.canonicalEvidenceConsumed && item.migrationStatus === "NOT_MIGRATED"), "Consumer migration introduced."));
check("service-summary-shape", () => { const value = getAthleticSummary(arch()); assert(value.available && value.confidence === 0.87 && value.data.scores.overallAthleticScore === 90, "Service boundary changed."); });
check("prospect-result-shape", () => { const value = getAthleticIntelligenceResult(arch()); assert(value.domain === "athleticism" && value.score === 90 && value.rawData.profile.scores.overallAthleticScore === 90, "Prospect boundary changed."); });
check("canonical-not-assumed", () => { const value = getAthleticIntelligenceResult(arch()); assert(value.score === 90 && value.rawData.canonicalResult.score === null, "Canonical score assumed." ); });
check("executive-language-input", () => assert(getAthleticSummary(arch()).data.scores.overallAthleticScore === 90, "Executive input changed."));
check("explainability-input", () => assert(getAthleticSummary(arch()).data.scores.overallAthleticScore === 90, "Explainability input changed."));
check("draft-board-debt", () => { const item = ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY.find(({ consumerId }) => consumerId === "DRAFT_BOARD"); assert(item.fieldsConsumed.includes("fallback:80") && item.currentFallback === "80" && item.limitations.some((text) => text.includes("Production approval is blocked")), "Draft Board debt lost." ); });
check("draft-decision-boundary", () => assert(ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY.find(({ consumerId }) => consumerId === "DRAFT_DECISION").fieldsConsumed.includes("athleticism weight"), "Draft Decision weight boundary lost."));
check("quarterback-components", () => { const scores = getAthleticIntelligenceResult(arch()).rawData.profile.scores; assert(scores.speed === 88 && scores.agility === 89 && scores.explosiveness === 87 && scores.sizeAdjustedAthleticism === 91, "Quarterback components changed." ); });
check("source-adapter-boundary", () => { const value = getAthleticIntelligenceResult(arch()); assert(value.available && value.dataState === "AVAILABLE" && value.rawData.profile, "Source adapter prerequisites changed." ); });
check("ui-profile-boundary", () => { const value = getAthleticSummary(arch()).data; assert(value.measurements && value.testing && value.scores && value.notes, "UI profile changed." ); });
check("policy-covers-active-consumers", () => assert(ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY.every((item) => item.fieldsConsumed.length && item.removalCondition), "Active consumer policy incomplete."));
check("no-canonical-label", () => assert(ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.canonicalDerivation === false && ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.prohibitedClaims.includes("canonical"), "Legacy score labeled canonical."));
check("stored-confidence-not-canonical", () => assert(ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.prohibitedClaims.includes("stored confidence is canonical confidence"), "Stored confidence promoted."));
check("new-consumer-review", () => assert(ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.reviewConditions.includes("A new consumer is added"), "New numerical consumer review missing."));
check("production-claim-prohibited", () => assert(ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.prohibitedClaims.includes("production-approved") && ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY.productionReadiness.legacyAnalyticalScoring === "NOT_APPROVED", "Production claim introduced."));

export function runAthleticConsumerBoundaryDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((entry) => entry.passed).length;
  return { suite: "AthleticConsumerBoundaryDiagnostics", total: results.length, passed, failed: results.length - passed, consumers: ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY.length, results };
}
export default { runAthleticConsumerBoundaryDiagnostics, ATHLETIC_CONSUMER_GOVERNANCE_INVENTORY };
