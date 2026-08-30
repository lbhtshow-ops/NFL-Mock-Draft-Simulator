import {
  ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY as policy,
  ATHLETIC_DECISION_SUPPORT_POLICY_ID,
  ATHLETIC_DECISION_SUPPORT_POLICY_VERSION,
} from "../athletics/AthleticDecisionSupportCompatibilityPolicy.js";
import { getAthleticIntelligenceResult } from "../AthleticIntelligenceEngine.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function same(left, right, message) { assert(JSON.stringify(left) === JSON.stringify(right), message); }
function frozen(value) { return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen)); }
function consumer(id) { return policy.authorizedConsumers.find(({ consumerId }) => consumerId === id); }
const checks = [];
function check(id, run) { checks.push({ id, run }); }

check("immutable", () => assert(frozen(policy), "Policy is mutable."));
check("serializable", () => assert(JSON.parse(JSON.stringify(policy)).policyId === ATHLETIC_DECISION_SUPPORT_POLICY_ID, "Policy is not serializable."));
check("identity", () => assert(policy.policyId === ATHLETIC_DECISION_SUPPORT_POLICY_ID && policy.policyVersion === ATHLETIC_DECISION_SUPPORT_POLICY_VERSION && policy.domain === "ATHLETIC", "Policy identity changed."));
check("valid-version", () => assert(/^\d+\.\d+\.\d+$/.test(policy.policyVersion), "Policy version invalid."));
check("transitional", () => assert(policy.status === "ACTIVE_TRANSITIONAL_COMPATIBILITY_POLICY" && policy.governanceStatus === "TRANSITIONAL", "Transitional status missing."));
check("legacy-classification", () => assert(policy.classification === "LEGACY_DECLARED_MODELED_OUTPUT" && policy.owner === "UNKNOWN" && policy.canonicalDerivation === false && policy.permittedUse === "BOUNDED_COMPATIBILITY", "Classification changed."));
check("production-not-approved", () => assert(policy.productionReadiness.legacyAnalyticalScoring === "NOT_APPROVED", "Legacy scoring approved."));
check("consumer-count", () => assert(policy.authorizedConsumers.length === 11, "Consumer inventory incomplete."));
check("consumer-ids-unique", () => assert(new Set(policy.authorizedConsumers.map(({ consumerId }) => consumerId)).size === 11, "Duplicate consumer ID."));
check("consumer-detail", () => assert(policy.authorizedConsumers.every((item) => item.consumerType && item.fieldsConsumed.length && typeof item.numericalDependency === "boolean" && item.decisionImpact && item.compatibilityAuthorization && item.migrationStatus && item.riskLevel && item.limitations.length && item.removalCondition), "Consumer detail incomplete."));
check("no-consumer-migrated", () => assert(policy.authorizedConsumers.every((item) => item.migrationStatus === "NOT_MIGRATED" && item.canonicalEvidenceConsumed === false), "Automatic migration claimed."));
check("authorized-fields", () => assert(["overallAthleticScore", "speed", "explosiveness", "agility", "strength", "sizeAdjustedAthleticism"].every((field) => policy.authorizedFields.includes(field)), "Authorized field missing."));
check("prohibited-claims", () => assert(["canonical", "verified", "calibrated", "evidence-derived", "percentile-based", "position-normalized", "Combine-equivalent", "RAS-equivalent", "predictive", "production-approved", "decision-authoritative", "stored confidence is canonical confidence"].every((claim) => policy.prohibitedClaims.includes(claim)), "Prohibited claim missing."));

check("draft-board-use", () => { const value = consumer("DRAFT_BOARD"); assert(value.compatibilityAuthorization === "AUTHORIZED_TEMPORARY" && value.decisionImpact === "DIRECT_RANKING_INFLUENCE", "Draft Board policy wrong." ); });
check("draft-board-fallback", () => { const value = policy.fallbackInventory.find(({ fallbackId }) => fallbackId === "DRAFT_BOARD_MISSING_ATHLETIC_SCORE"); assert(value.currentValue === 80 && value.canonicalMeaning === "NONE" && value.governanceStatus === "UNRESOLVED_GOVERNANCE_DEBT", "Fallback 80 policy wrong." ); });
check("draft-board-production-blocker", () => assert(policy.productionReadiness.blockers.includes("Active Draft Board fallback 80"), "Fallback production blocker missing."));
check("draft-decision", () => { const value = consumer("DRAFT_DECISION"); assert(value.compatibilityAuthorization === "AUTHORIZED_TEMPORARY" && value.fieldsConsumed.includes("athleticism weight") && value.limitations.some((text) => text.includes("not canonical decision authority")), "Draft Decision policy wrong." ); });
check("quarterback-components", () => { const value = consumer("QUARTERBACK_MODEL"); assert(["speed", "agility", "explosiveness", "sizeAdjustedAthleticism"].every((field) => value.fieldsConsumed.includes(field)), "Quarterback dependency incomplete." ); });
check("quarterback-governance-limitation", () => assert(consumer("QUARTERBACK_MODEL").limitations.some((text) => text.includes("not fully canonical")), "Quarterback canonical limitation missing."));
check("player-evaluation-blocker", () => assert(consumer("CARRYOVER_EVALUATION").limitations.some((text) => text.includes("runtime import-resolution issue")), "Player Evaluation blocker missing."));

check("canonical-outside-policy", () => assert(policy.effectiveScope.includes("AthleticModeledOutputDeclaration") && !policy.effectiveScope.includes("CanonicalAthleticEvidenceEngine"), "Canonical evidence governed as compatibility."));
check("canonical-score-separated", () => { const result = getAthleticIntelligenceResult({ playerId: "2026-arch-manning", position: "QB" }); assert(result.score === 90 && result.rawData.canonicalResult.score === null, "Legacy score entered canonical result." ); });
check("canonical-confidence-separated", () => { const result = getAthleticIntelligenceResult({ playerId: "2026-arch-manning", position: "QB" }); assert(result.confidence === 0.87 && result.rawData.canonicalResult.confidence === 0 && result.rawData.canonicalResult.value.confidenceAssessment.confidenceKnown === false, "Legacy confidence entered canonical result." ); });
check("model-identities-separated", () => { const result = getAthleticIntelligenceResult({ playerId: "2026-arch-manning", position: "QB" }); assert(result.versions.model === "ATHLETIC-1.0.0" && result.rawData.canonicalResult.value.model === "CANONICAL_ATHLETIC_EVIDENCE_ENGINE", "Model identities collapsed." ); });
check("readiness-separated", () => assert(policy.productionReadiness.canonicalEvidenceReporting.includes("FACTUAL_EVIDENCE_REPORTING") && policy.productionReadiness.legacyAnalyticalScoring === "NOT_APPROVED", "Production readiness collapsed."));
check("all-blockers", () => assert(policy.productionReadiness.blockers.length === 9, "Production blocker inventory changed."));
check("removal-complete", () => assert(policy.removalConditions.length === 15, "Removal conditions incomplete."));
check("review-complete", () => assert(policy.reviewConditions.length === 9 && policy.reviewConditions.includes("A new consumer is added") && policy.reviewConditions.includes("A consumer changes weights"), "Review conditions incomplete."));
check("no-runtime-enforcement", () => assert(policy.limitations.some((text) => text.includes("No automatic migration or runtime policy enforcement")), "Runtime enforcement implied."));
check("phase-status", () => assert(policy.phaseStatus === "PHASE_2_COMPLETE_WITH_TRANSITIONAL_SCORE", "Phase status changed."));

const snapshots = Object.freeze({
  full: Object.freeze({ policyId: "ATHLETIC_DECISION_SUPPORT_COMPATIBILITY_POLICY", policyVersion: "1.0.0", domain: "ATHLETIC", status: "ACTIVE_TRANSITIONAL_COMPATIBILITY_POLICY", consumers: 11, productionReadiness: "NOT_APPROVED", phaseStatus: "PHASE_2_COMPLETE_WITH_TRANSITIONAL_SCORE" }),
  draftBoard: Object.freeze({ authorization: "AUTHORIZED_TEMPORARY", fallback: "80", decisionImpact: "DIRECT_RANKING_INFLUENCE", canonicalMeaning: "NONE" }),
  quarterback: Object.freeze({ authorization: "AUTHORIZED_TEMPORARY", fields: Object.freeze(["speed", "agility", "explosiveness", "sizeAdjustedAthleticism"]), canonicalEvidenceConsumed: false }),
  blockers: Object.freeze(["Unknown score derivation", "Unknown owner", "Undocumented calibration", "Undocumented reproducibility", "Undocumented confidence method", "Unresolved position and population semantics", "Active Draft Board fallback 80", "Consumer dependence on legacy modeled outputs", "No approved canonical Athletic scoring model"]),
  removal: Object.freeze([...policy.removalConditions]),
});
check("snapshot-full-policy", () => same({ policyId: policy.policyId, policyVersion: policy.policyVersion, domain: policy.domain, status: policy.status, consumers: policy.authorizedConsumers.length, productionReadiness: policy.productionReadiness.legacyAnalyticalScoring, phaseStatus: policy.phaseStatus }, snapshots.full, "Full policy snapshot changed."));
check("snapshot-draft-board", () => { const value = consumer("DRAFT_BOARD"); same({ authorization: value.compatibilityAuthorization, fallback: value.currentFallback, decisionImpact: value.decisionImpact, canonicalMeaning: policy.fallbackInventory[0].canonicalMeaning }, snapshots.draftBoard, "Draft Board snapshot changed." ); });
check("snapshot-quarterback", () => { const value = consumer("QUARTERBACK_MODEL"); same({ authorization: value.compatibilityAuthorization, fields: value.fieldsConsumed, canonicalEvidenceConsumed: value.canonicalEvidenceConsumed }, snapshots.quarterback, "Quarterback snapshot changed." ); });
check("snapshot-blockers", () => same(policy.productionReadiness.blockers, snapshots.blockers, "Blocker snapshot changed."));
check("snapshot-removal", () => same(policy.removalConditions, snapshots.removal, "Removal snapshot changed."));

export function runAthleticDecisionSupportCompatibilityPolicyDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((entry) => entry.passed).length;
  return { suite: "AthleticDecisionSupportCompatibilityPolicyDiagnostics", total: results.length, passed, failed: results.length - passed, policySnapshots: 5, consumers: policy.authorizedConsumers.length, results };
}
export default { runAthleticDecisionSupportCompatibilityPolicyDiagnostics };
