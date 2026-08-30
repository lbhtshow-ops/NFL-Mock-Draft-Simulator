import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../contracts/IntelligenceResultContract.js";
import {
  PLAYER_CALIBER_READINESS,
} from "../caliber/CanonicalPlayerCaliberContract.js";

export const NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION =
  "FIE-NFL-PLAYER-EVALUATION-HARDENING-1.0.0";

const MODEL_VERSION = "NFL-POSITION-EVALUATION-LEGACY-1.0.0";
const WEIGHT_VERSION = "NFL-POSITION-WEIGHTS-LEGACY-1.0.0";

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function resolveEvidenceLevel(confidence) {
  if (confidence >= 0.9) return EVIDENCE_LEVELS.VERY_STRONG;
  if (confidence >= 0.7) return EVIDENCE_LEVELS.STRONG;
  if (confidence >= 0.5) return EVIDENCE_LEVELS.MODERATE;
  if (confidence > 0) return EVIDENCE_LEVELS.LIMITED;
  return EVIDENCE_LEVELS.NONE;
}

function resolveCurrentFormGrade(evaluation = {}) {
  const value =
    evaluation?.positionEvaluation?.performanceEvaluation?.performanceScore ??
    evaluation?.positionEvaluation?.currentPerformanceScore ??
    null;

  return isFiniteNumber(value) ? value : null;
}

function resolveCareerBaselineGrade(evaluation = {}) {
  const value =
    evaluation?.positionEvaluation?.recognitionEvaluation
      ?.establishedCareerBaseline ??
    evaluation?.recognition?.establishedCareerBaseline ??
    null;

  return isFiniteNumber(value) ? value : null;
}

function resolveSourceSignals(evaluation = {}) {
  const usageAvailable = Boolean(evaluation?.usage?.available);
  const performanceAvailable = Boolean(
    evaluation?.positionEvaluation?.performanceEvaluation?.available ??
      evaluation?.production?.available
  );
  const recognitionAvailable = Boolean(evaluation?.recognition?.available);
  const modelName =
    evaluation?.positionEvaluation?.model ||
    evaluation?.positionEvaluation?.positionModel ||
    null;
  const dedicatedModel = Boolean(
    modelName && modelName !== "GenericPlayerEvaluationModel"
  );

  return {
    usageAvailable,
    performanceAvailable,
    recognitionAvailable,
    dedicatedModel,
    modelName,
  };
}

function computeEvidenceConfidence(signals) {
  // Confidence is deliberately evidence-coverage based. It never uses the
  // player's grade, tier, roster value, position value, or reputation.
  return clamp01(
    (signals.usageAvailable ? 0.25 : 0) +
      (signals.performanceAvailable ? 0.4 : 0) +
      (signals.recognitionAvailable ? 0.15 : 0) +
      (signals.dedicatedModel ? 0.2 : 0)
  );
}

function resolveReadiness({ hasQuality, confidence }) {
  if (!hasQuality) return PLAYER_CALIBER_READINESS.UNAVAILABLE;
  if (confidence >= 0.7) return PLAYER_CALIBER_READINESS.AVAILABLE;
  return PLAYER_CALIBER_READINESS.PARTIAL;
}

function buildProvenance(evaluation = {}, signals = {}) {
  const refs = [];
  const sources = [];

  if (signals.usageAvailable) {
    refs.push({
      domain: "usage",
      matchedBy: evaluation?.usage?.matchedBy || null,
      gamesTracked: evaluation?.usage?.gamesTracked || 0,
    });
    sources.push("PlayerUsageIndex");
  }

  if (signals.performanceAvailable) {
    refs.push({
      domain: "performance",
      matchedBy: evaluation?.production?.matchedBy || null,
      gamesTracked:
        evaluation?.positionEvaluation?.performanceEvaluation?.sampleSize
          ?.gamesTracked ?? evaluation?.production?.gamesTracked ?? 0,
    });
    sources.push("PlayerPerformanceIndex");
  }

  if (signals.recognitionAvailable) {
    refs.push({
      domain: "recognition",
      tier: evaluation?.recognition?.tier || null,
      awardsObserved: Array.isArray(evaluation?.recognition?.awards)
        ? evaluation.recognition.awards.length
        : 0,
    });
    sources.push("PlayerRecognitionEngine");
  }

  if (signals.modelName) {
    refs.push({
      domain: "positionModel",
      model: signals.modelName,
    });
    sources.push(signals.modelName);
  }

  return {
    refs,
    sources: [...new Set(sources)],
  };
}

export function hardenNFLPlayerEvaluation({
  player = {},
  evaluation = null,
} = {}) {
  const base = evaluation && typeof evaluation === "object" ? evaluation : {};
  const playerQuality = base?.playerQuality;
  const rosterValue = base?.rosterValue;
  const hasQuality = isFiniteNumber(playerQuality);
  const signals = resolveSourceSignals(base);
  const evaluationConfidence = computeEvidenceConfidence(signals);
  const evidenceLevel = resolveEvidenceLevel(evaluationConfidence);
  const readiness = resolveReadiness({
    hasQuality,
    confidence: evaluationConfidence,
  });
  const currentFormGrade = resolveCurrentFormGrade(base);
  const careerBaselineGrade = resolveCareerBaselineGrade(base);
  const provenance = buildProvenance(base, signals);
  const missingEvidence = [];

  if (!hasQuality) missingEvidence.push("playerQuality");
  if (!signals.usageAvailable) missingEvidence.push("usageEvidence");
  if (!signals.performanceAvailable) missingEvidence.push("performanceEvidence");
  if (!signals.recognitionAvailable) missingEvidence.push("recognitionEvidence");
  if (currentFormGrade === null) missingEvidence.push("currentFormGrade");
  if (careerBaselineGrade === null) missingEvidence.push("careerBaselineGrade");

  const rosterValueSemantics =
    isFiniteNumber(rosterValue) && hasQuality
      ? rosterValue === playerQuality
        ? "LEGACY_EQUAL_TO_PLAYER_QUALITY"
        : "DISTINCT_FROM_PLAYER_QUALITY"
      : "UNAVAILABLE";

  return {
    ...base,
    available: hasQuality,
    dataState: hasQuality ? DATA_STATES.AVAILABLE : DATA_STATES.UNAVAILABLE,
    readiness,
    evaluationConfidence,
    evidenceLevel,
    currentFormGrade,
    careerBaselineGrade,
    missingEvidence,
    evidenceRefs: provenance.refs,
    sources: provenance.sources,
    evidenceProvenance: {
      evaluator: "PlayerRosterEvaluationEngine",
      evidenceDomains: provenance.refs,
    },
    confidenceRationale: [
      "Evaluation confidence is based on available usage, performance, recognition, and dedicated-position-model evidence coverage.",
      "Evaluation confidence never uses player quality, roster value, player tier, or positional value.",
    ],
    governance: {
      contractVersion: NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION,
      rosterValueSemantics,
      playerQualitySemantics: "PRESENT_NFL_PLAYING_QUALITY",
      currentFormSemantics:
        currentFormGrade === null
          ? "NOT_EXPLICITLY_MODELED"
          : "CURRENT_POSITION_PERFORMANCE",
      careerBaselineSemantics:
        careerBaselineGrade === null
          ? "NOT_EXPLICITLY_MODELED"
          : "ESTABLISHED_CAREER_BASELINE",
      limitations: [
        ...(rosterValueSemantics === "LEGACY_EQUAL_TO_PLAYER_QUALITY"
          ? [
              "This position model currently returns rosterValue equal to playerQuality; downstream engines must not interpret that equality as a validated roster-value model.",
            ]
          : []),
        ...(currentFormGrade === null
          ? ["This position model does not yet expose an explicit current-form grade."]
          : []),
        ...(careerBaselineGrade === null
          ? ["This position model does not yet expose an explicit career-baseline grade."]
          : []),
      ],
    },
    versions: {
      evaluator: NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION,
      model: signals.modelName ? MODEL_VERSION : null,
      weights: signals.modelName ? WEIGHT_VERSION : null,
      data: null,
    },
    subject: {
      playerId:
        player?.canonicalPlayerId || player?.id || player?.playerId || null,
      displayName:
        player?.displayName || player?.name || player?.player || null,
      position: player?.identity?.position || player?.position || null,
    },
  };
}

export default {
  NFL_PLAYER_EVALUATION_GOVERNANCE_VERSION,
  hardenNFLPlayerEvaluation,
};
