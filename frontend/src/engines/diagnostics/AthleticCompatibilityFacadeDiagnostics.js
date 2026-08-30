import athleticProfiles from "../../data/footballIntelligence/athletics/athleticProfiles.js";
import defaultAthleticProfile from "../../data/footballIntelligence/athletics/defaultAthleticProfile.js";
import {
  getAthleticIntelligenceResult,
  getAthleticProfile,
  getAthleticSummary,
} from "../AthleticIntelligenceEngine.js";
import { isAthleticInputProjection, isAthleticModeledOutputDeclaration } from "../athletics/index.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
function same(left, right, message) { assert(JSON.stringify(left) === JSON.stringify(right), message); }
function player(playerId, position = "QB") { return { playerId, playerName: playerId, position, playerContext: { competition: { level: "FBS" }, careerStage: "DRAFT_PROSPECT" } }; }
function compatibilityView(result) { return { domain: result.domain, available: result.available, dataState: result.dataState, score: result.score, confidence: result.confidence, evidenceLevel: result.evidenceLevel, playerId: result.playerId, competitionLevel: result.competitionLevel, careerStage: result.careerStage, summary: result.summary, explanation: result.explanation, evidence: result.evidence, missingEvidence: result.missingEvidence, sources: result.sources, lastUpdated: result.lastUpdated, versions: result.versions, profile: result.rawData?.profile ?? null, playerContext: result.rawData?.playerContext ?? null, evidenceTransition: result.rawData?.evidenceTransition ?? null }; }
const checks = [];
function check(id, run) { checks.push({ id, run }); }

const snapshots = Object.freeze(Object.entries(athleticProfiles).map(([id, profile]) => Object.freeze({ id, score: profile.scores.overallAthleticScore, componentScores: Object.freeze({ ...profile.scores }), confidence: profile.confidence, strengths: Object.freeze([...profile.strengths]), limitations: Object.freeze([...profile.limitations]), summary: profile.notes, measurements: Object.freeze({ ...profile.measurements }), testing: Object.freeze({ ...profile.testing }), source: profile.source, lastUpdated: profile.lastUpdated })));

check("profile-api", () => snapshots.forEach(({ id }) => assert(getAthleticProfile(player(id)) === athleticProfiles[id], `${id} profile changed.`)));
check("summary-api", () => snapshots.forEach(({ id, summary, confidence }) => { const value = getAthleticSummary(player(id)); assert(value.summary === summary && value.confidence === confidence && value.data === athleticProfiles[id], `${id} summary changed.`); }));
check("result-api", () => snapshots.forEach(({ id, score, confidence, summary }) => { const value = getAthleticIntelligenceResult(player(id)); assert(value.score === score && value.confidence === confidence && value.summary === summary && value.versions.model === "ATHLETIC-1.0.0", `${id} result changed.`); }));
check("missing-player", () => { const value = getAthleticIntelligenceResult({}); assert(!value.available && value.score === null && value.confidence === 0 && value.dataState === "UNKNOWN" && value.summary === "No athletic profile is currently available for this player.", "Missing player changed."); });
check("default-profile", () => assert(getAthleticProfile(player("missing")) === defaultAthleticProfile && getAthleticSummary(player("missing")).data === defaultAthleticProfile, "Default behavior changed."));
check("legacy-scores", () => snapshots.forEach(({ id, score }) => assert(getAthleticIntelligenceResult(player(id)).score === score, `${id} score changed.`)));
check("legacy-confidence", () => snapshots.forEach(({ id, confidence }) => assert(getAthleticIntelligenceResult(player(id)).confidence === confidence, `${id} confidence changed.`)));
check("legacy-narratives", () => snapshots.forEach(({ id, strengths, limitations, summary }) => { const value = getAthleticIntelligenceResult(player(id)); same(value.explanation.positiveFactors, strengths, `${id} strengths changed.`); same(value.explanation.limitingFactors, limitations, `${id} limitations changed.`); assert(value.summary === summary, `${id} summary changed.`); }));
check("legacy-components", () => snapshots.forEach(({ id, componentScores }) => same(getAthleticIntelligenceResult(player(id)).rawData.profile.scores, componentScores, `${id} components changed.`)));
check("legacy-facts", () => snapshots.forEach(({ id, measurements, testing }) => { const profile = getAthleticIntelligenceResult(player(id)).rawData.profile; same(profile.measurements, measurements, `${id} measurements changed.`); same(profile.testing, testing, `${id} testing changed.`); }));

check("valid-projection", () => snapshots.forEach(({ id }) => assert(isAthleticInputProjection(getAthleticIntelligenceResult(player(id)).rawData.athleticInputProjection), `${id} projection invalid.`)));
check("valid-declaration", () => snapshots.forEach(({ id }) => assert(isAthleticModeledOutputDeclaration(getAthleticIntelligenceResult(player(id)).rawData.legacyModeledOutputDeclaration), `${id} declaration invalid.`)));
check("canonical-once", () => snapshots.forEach(({ id }) => assert(getAthleticIntelligenceResult(player(id)).rawData.canonicalInvocationCount === 1, `${id} invocation count changed.`)));
check("canonical-score-null", () => snapshots.forEach(({ id }) => assert(getAthleticIntelligenceResult(player(id)).rawData.canonicalResult.score === null, `${id} canonical score produced.`)));
check("canonical-confidence-unknown", () => snapshots.forEach(({ id }) => { const value = getAthleticIntelligenceResult(player(id)).rawData.canonicalResult; assert(value.confidence === 0 && value.value.confidenceAssessment.confidenceKnown === false, `${id} canonical confidence changed.`); }));
check("modeled-values-separated", () => snapshots.forEach(({ id, score, confidence }) => { const raw = getAthleticIntelligenceResult(player(id)).rawData; assert(raw.legacyModeledOutputDeclaration.overallScore === score && raw.legacyModeledOutputDeclaration.storedConfidence === confidence && raw.canonicalResult.value.scoringStatus.legacyModeledOutputsConsumed === false, `${id} separation failed.`); }));
check("narratives-excluded", () => snapshots.forEach(({ id, strengths, limitations, summary }) => { const canonical = JSON.stringify(getAthleticIntelligenceResult(player(id)).rawData.canonicalResult); [...strengths, ...limitations, summary].filter(Boolean).forEach((text) => assert(!canonical.includes(text), `${id} narrative leaked.`)); }));
check("factual-limitations", () => snapshots.forEach(({ id }) => assert(getAthleticIntelligenceResult(player(id)).rawData.canonicalResult.value.limitations.every((item) => typeof item === "string"), `${id} limitations invalid.`)));
check("governance-separated", () => snapshots.forEach(({ id }) => { const raw = getAthleticIntelligenceResult(player(id)).rawData; assert(raw.compatibilityGovernance.governanceStatus === "TRANSITIONAL" && raw.compatibilityGovernance.permittedUse === "COMPATIBILITY_ONLY" && raw.compatibilityGovernance.canonicalDerivation === false, `${id} compatibility governance changed.`); assert(raw.canonicalResult.value.governance.governanceStatus === "CANONICAL" && raw.canonicalResult.value.governance.permittedUse === "EVIDENCE_REPORTING" && raw.canonicalResult.value.governance.canonicalDerivation === true, `${id} canonical governance changed.`); }));
check("model-identities-separated", () => snapshots.forEach(({ id }) => { const value = getAthleticIntelligenceResult(player(id)); assert(value.versions.model === "ATHLETIC-1.0.0" && value.rawData.canonicalResult.value.model === "CANONICAL_ATHLETIC_EVIDENCE_ENGINE", `${id} models collapsed.`); }));
check("profile-unchanged", () => snapshots.forEach(({ id, componentScores }) => same(athleticProfiles[id].scores, componentScores, `${id} registry changed.`)));
check("artifacts-immutable", () => snapshots.forEach(({ id }) => { const raw = getAthleticIntelligenceResult(player(id)).rawData; assert(Object.isFrozen(raw.athleticInputProjection) && Object.isFrozen(raw.legacyModeledOutputDeclaration) && Object.isFrozen(raw.canonicalResult), `${id} artifacts mutable.`); }));
check("final-result-immutable", () => snapshots.forEach(({ id }) => assert(Object.isFrozen(getAthleticIntelligenceResult(player(id))), `${id} result mutable.`)));
check("deterministic", () => snapshots.forEach(({ id }) => same(compatibilityView(getAthleticIntelligenceResult(player(id))), compatibilityView(getAthleticIntelligenceResult(player(id))), `${id} nondeterministic.`)));

check("snapshot-populated", () => { const value = getAthleticIntelligenceResult(player("2026-arch-manning")); assert(value.score === 90 && value.confidence === 0.87, "Populated snapshot changed."); });
check("snapshot-no-testing", () => { const value = getAthleticIntelligenceResult(player("2026-arch-manning")); assert(value.rawData.canonicalResult.value.suppliedFields.testing.length === 0 && value.score === 90, "No-testing snapshot changed."); });
check("snapshot-default", () => { const value = getAthleticIntelligenceResult(player("missing")); assert(value.score === null && value.confidence === 0 && value.rawData.profile === defaultAthleticProfile, "Default snapshot changed."); });
check("snapshot-components-confidence", () => { const value = getAthleticIntelligenceResult(player("2026-peter-woods", "DL")); assert(value.rawData.profile.scores.strength === 94 && value.confidence === 0.88, "Component snapshot changed."); });
check("snapshot-canonical-addition", () => { const value = getAthleticIntelligenceResult(player("2026-caleb-downs", "S")); assert(value.score === 94 && value.confidence === 0.92 && value.rawData.canonicalEvidence.scoreUsedForCompatibility === false && value.rawData.canonicalEvidence.result.score === null, "Canonical additive snapshot changed."); });

export function runAthleticCompatibilityFacadeDiagnostics() {
  const results = checks.map(({ id, run }) => { try { run(); return { id, passed: true, error: null }; } catch (error) { return { id, passed: false, error: error.message }; } });
  const passed = results.filter((entry) => entry.passed).length;
  return { suite: "AthleticCompatibilityFacadeDiagnostics", total: results.length, passed, failed: results.length - passed, legacySnapshots: snapshots.length + 1, compatibilitySnapshots: 5, results };
}
export default { runAthleticCompatibilityFacadeDiagnostics };
