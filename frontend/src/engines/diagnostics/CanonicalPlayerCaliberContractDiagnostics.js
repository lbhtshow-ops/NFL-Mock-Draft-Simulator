import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../contracts/IntelligenceResultContract.js";
import {
  PLAYER_CALIBER_SUBJECT_KINDS,
  createCanonicalPlayerCaliberResult,
  validateCanonicalPlayerCaliberResult,
  adaptNFLPlayerEvaluationToCanonicalCaliber,
  adaptProspectEvaluationToCanonicalCaliber,
  resolveCanonicalPlayerCaliber,
} from "../playerEvaluation/caliber/index.js";

const checks = {};
const failures = [];
function check(name, fn) {
  try {
    checks[name] = Boolean(fn());
    if (!checks[name]) failures.push(name);
  } catch (error) {
    checks[name] = false;
    failures.push(`${name}: ${error?.message || error}`);
  }
}

check("contract_validates_available_result", () => {
  const result = createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    available: true,
    caliberGrade: 88,
    confidence: 0.8,
    evidenceLevel: EVIDENCE_LEVELS.STRONG,
  });
  return validateCanonicalPlayerCaliberResult(result).valid;
});

check("caliber_is_not_roster_value", () => {
  const result = createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    available: true,
    caliberGrade: 91,
    rosterValue: 84,
  });
  return result.caliberGrade === 91 && result.rosterValue === 84;
});

check("confidence_is_not_inferred_from_quality", () => {
  const result = createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    available: true,
    caliberGrade: 99,
  });
  return result.confidence === 0 && result.evidenceLevel === EVIDENCE_LEVELS.NONE;
});

check("unavailable_never_invents_grade", () => {
  const result = createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.PROSPECT,
    available: false,
    caliberGrade: 90,
  });
  return result.caliberGrade === null && result.available === false;
});

check("nfl_adapter_uses_player_quality_only", () => {
  const result = adaptNFLPlayerEvaluationToCanonicalCaliber({
    player: { id: "nfl-1", name: "Player One", position: "EDGE" },
    evaluation: {
      playerQuality: 87,
      rosterValue: 93,
      playerTier: "elite",
      positionEvaluation: { positionModel: "DefensiveLineEvaluationModel", notes: [] },
    },
  });
  return result.caliberGrade === 87 && result.rosterValue === 93 && result.sourceEvaluation.sourceField === "playerQuality";
});

check("nfl_adapter_never_falls_back_to_roster_value", () => {
  const result = adaptNFLPlayerEvaluationToCanonicalCaliber({
    player: { id: "nfl-2", position: "WR" },
    evaluation: { rosterValue: 95 },
  });
  return result.available === false && result.caliberGrade === null;
});

check("nfl_adapter_surfaces_governance_gaps", () => {
  const result = adaptNFLPlayerEvaluationToCanonicalCaliber({
    player: { id: "nfl-3", position: "QB" },
    evaluation: { playerQuality: 90, rosterValue: 94, playerTier: "elite" },
  });
  return result.confidence === 0 &&
    result.missingEvidence.includes("standardizedEvaluationConfidence") &&
    result.missingEvidence.includes("standardizedEvidenceProvenance") &&
    result.missingEvidence.includes("evaluatorVersion");
});

check("nfl_adapter_preserves_governed_confidence_when_present", () => {
  const result = adaptNFLPlayerEvaluationToCanonicalCaliber({
    player: { id: "nfl-4", position: "CB" },
    evaluation: {
      playerQuality: 86,
      evaluationConfidence: 0.77,
      evidenceLevel: EVIDENCE_LEVELS.STRONG,
      evidenceProvenance: { contributors: [{ contributorId: "fixture" }] },
      versions: { evaluator: "NFL-EVAL-2.0.0" },
    },
  });
  return result.confidence === 0.77 &&
    result.evidenceLevel === EVIDENCE_LEVELS.STRONG &&
    !result.missingEvidence.includes("standardizedEvaluationConfidence");
});

check("prospect_adapter_preserves_governed_grade_and_confidence", () => {
  const result = adaptProspectEvaluationToCanonicalCaliber({
    player: { id: "prospect-1", name: "Prospect One", position: "QB" },
    modelResult: {
      available: true,
      dataState: DATA_STATES.AVAILABLE,
      playerId: "prospect-1",
      position: "QB",
      overallGrade: 88,
      confidence: 0.82,
      evidenceLevel: EVIDENCE_LEVELS.STRONG,
      missingEvidence: [],
      evidenceRefs: ["evidence:1"],
      provenance: { contributors: [{ contributorId: "production" }] },
      conclusions: {},
      explanation: {},
      versions: { model: "QB-PROSPECT-1.0.0", weights: "QB-WEIGHTS-1.0.0", data: "fixture" },
    },
  });
  return result.caliberGrade === 88 && result.confidence === 0.82 && result.versions.weights === "QB-WEIGHTS-1.0.0";
});

check("prospect_adapter_requires_available_grade", () => {
  const result = adaptProspectEvaluationToCanonicalCaliber({
    player: { id: "prospect-2", position: "CB" },
    modelResult: {
      available: false,
      overallGrade: 90,
      confidence: 0.9,
      evidenceLevel: EVIDENCE_LEVELS.VERY_STRONG,
    },
  });
  return result.available === false && result.caliberGrade === null;
});

check("shared_service_routes_nfl_without_regrading", () => {
  const result = resolveCanonicalPlayerCaliber({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    player: { id: "nfl-service", position: "LT" },
    nflEvaluation: { playerQuality: 89, rosterValue: 96 },
  });
  return result.caliberGrade === 89 && result.rosterValue === 96;
});

check("shared_service_routes_prospect_without_regrading", () => {
  const result = resolveCanonicalPlayerCaliber({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.PROSPECT,
    player: { id: "prospect-service", position: "EDGE" },
    prospectModelResult: {
      available: true,
      overallGrade: 84,
      confidence: 0.7,
      evidenceLevel: EVIDENCE_LEVELS.MODERATE,
      missingEvidence: ["filmDepth"],
      versions: { model: "EDGE-PROSPECT-1.0.0" },
    },
  });
  return result.caliberGrade === 84 && result.readiness === "PARTIAL";
});

check("shared_service_rejects_ambiguous_subject_kind", () => {
  const result = resolveCanonicalPlayerCaliber({
    subjectKind: "UNKNOWN",
    player: { id: "ambiguous" },
  });
  return result.available === false &&
    result.caliberGrade === null &&
    result.missingEvidence.includes("supportedSubjectKind");
});

check("current_form_and_career_baseline_are_independent", () => {
  const result = createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    available: true,
    caliberGrade: 92,
    currentFormGrade: 78,
    careerBaselineGrade: 94,
  });
  return result.caliberGrade === 92 && result.currentFormGrade === 78 && result.careerBaselineGrade === 94;
});

const output = {
  suite: "Canonical Player Caliber Contract & Projection Boundary",
  contractVersion: "FIE-EVALUATION-INTEGRITY-SPRINT1-1.0.1",
  status: failures.length ? "FAIL" : "PASS",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
};
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exitCode = 1;
