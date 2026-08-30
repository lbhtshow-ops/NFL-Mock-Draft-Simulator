import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../../contracts/IntelligenceResultContract.js";
import {
  PLAYER_CALIBER_READINESS,
  PLAYER_CALIBER_SUBJECT_KINDS,
  createCanonicalPlayerCaliberResult,
} from "../CanonicalPlayerCaliberContract.js";

const resolvePlayerId = (player = {}) =>
  player?.canonicalPlayerId || player?.id || player?.playerId || null;
const resolveDisplayName = (player = {}) =>
  player?.displayName || player?.name || player?.player || null;
const resolvePosition = (player = {}) =>
  player?.identity?.position || player?.position || null;

/**
 * Projects the existing PlayerRosterEvaluationEngine output into the canonical
 * caliber contract. It intentionally exposes governance gaps instead of
 * manufacturing confidence, provenance, or evaluator versions.
 */
export function adaptNFLPlayerEvaluationToCanonicalCaliber({
  player = {},
  evaluation = null,
} = {}) {
  const quality = evaluation?.playerQuality;
  const hasQuality = typeof quality === "number" && Number.isFinite(quality);
  const missingEvidence = [];

  if (!hasQuality) missingEvidence.push("playerQuality");
  if (typeof evaluation?.evaluationConfidence !== "number") {
    missingEvidence.push("standardizedEvaluationConfidence");
  }
  if (!evaluation?.evidenceProvenance) {
    missingEvidence.push("standardizedEvidenceProvenance");
  }
  if (!evaluation?.versions?.evaluator) {
    missingEvidence.push("evaluatorVersion");
  }

  const confidence =
    typeof evaluation?.evaluationConfidence === "number"
      ? evaluation.evaluationConfidence
      : 0;

  return createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
    playerId: resolvePlayerId(player),
    displayName: resolveDisplayName(player),
    position: resolvePosition(player),
    available: hasQuality,
    dataState: hasQuality ? DATA_STATES.AVAILABLE : DATA_STATES.UNAVAILABLE,
    readiness: hasQuality
      ? missingEvidence.length
        ? PLAYER_CALIBER_READINESS.PARTIAL
        : PLAYER_CALIBER_READINESS.AVAILABLE
      : PLAYER_CALIBER_READINESS.UNAVAILABLE,
    caliberGrade: hasQuality ? quality : null,
    caliberTier: evaluation?.playerTier || null,
    rosterValue: evaluation?.rosterValue ?? null,
    currentFormGrade: evaluation?.currentFormGrade ?? null,
    careerBaselineGrade: evaluation?.careerBaselineGrade ?? null,
    confidence,
    evidenceLevel: evaluation?.evidenceLevel || EVIDENCE_LEVELS.NONE,
    missingEvidence,
    evidenceRefs: evaluation?.evidenceRefs || [],
    sources: evaluation?.sources || [],
    provenance: evaluation?.evidenceProvenance || {},
    explanation: {
      caliberRationale: evaluation?.positionEvaluation?.notes || [],
      confidenceRationale:
        confidence > 0
          ? evaluation?.confidenceRationale || []
          : [
              "The current NFL roster evaluator does not yet expose standardized evaluation confidence.",
            ],
    },
    sourceEvaluation: {
      engine: "PlayerRosterEvaluationEngine",
      model:
        evaluation?.positionEvaluation?.positionModel ||
        evaluation?.positionEvaluation?.model ||
        null,
      sourceField: "playerQuality",
    },
    versions: {
      evaluator: evaluation?.versions?.evaluator || null,
      model: evaluation?.versions?.model || null,
      weights: evaluation?.versions?.weights || null,
      data: evaluation?.versions?.data ?? null,
    },
  });
}

export default adaptNFLPlayerEvaluationToCanonicalCaliber;
