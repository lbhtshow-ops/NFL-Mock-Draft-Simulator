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
 * Projects a governed ProspectPositionModelContract result. overallGrade keeps
 * its existing meaning: projected NFL playing quality at maturity on the
 * position-calibrated common 0-100 scale. No re-scoring occurs here.
 */
export function adaptProspectEvaluationToCanonicalCaliber({
  player = {},
  modelResult = null,
} = {}) {
  const grade = modelResult?.overallGrade;
  const hasGrade = Boolean(
    modelResult?.available &&
      typeof grade === "number" &&
      Number.isFinite(grade)
  );
  const missingEvidence = Array.isArray(modelResult?.missingEvidence)
    ? [...modelResult.missingEvidence]
    : [];

  return createCanonicalPlayerCaliberResult({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.PROSPECT,
    playerId: modelResult?.playerId || resolvePlayerId(player),
    displayName: resolveDisplayName(player),
    position: modelResult?.position || resolvePosition(player),
    available: hasGrade,
    dataState:
      modelResult?.dataState ||
      (hasGrade ? DATA_STATES.AVAILABLE : DATA_STATES.UNAVAILABLE),
    readiness: hasGrade
      ? missingEvidence.length
        ? PLAYER_CALIBER_READINESS.PARTIAL
        : PLAYER_CALIBER_READINESS.AVAILABLE
      : PLAYER_CALIBER_READINESS.UNAVAILABLE,
    caliberGrade: hasGrade ? grade : null,
    caliberTier: modelResult?.conclusions?.tier || null,
    confidence: modelResult?.confidence ?? 0,
    evidenceLevel: modelResult?.evidenceLevel || EVIDENCE_LEVELS.NONE,
    missingEvidence,
    evidenceRefs: modelResult?.evidenceRefs || [],
    sources: modelResult?.sources || [],
    provenance: modelResult?.provenance || {},
    explanation: {
      strengths: modelResult?.explanation?.strengths || [],
      concerns: modelResult?.explanation?.concerns || [],
      contextualFactors: modelResult?.explanation?.contextualFactors || [],
    },
    sourceEvaluation: {
      engine: "ProspectPositionModelRegistry",
      model: modelResult?.versions?.model || null,
      sourceField: "overallGrade",
    },
    versions: {
      evaluator: modelResult?.versions?.evaluator || null,
      model: modelResult?.versions?.model || null,
      weights: modelResult?.versions?.weights || null,
      data: modelResult?.versions?.data ?? null,
    },
  });
}

export default adaptProspectEvaluationToCanonicalCaliber;
