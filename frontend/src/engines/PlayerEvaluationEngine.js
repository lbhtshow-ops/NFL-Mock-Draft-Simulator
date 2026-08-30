import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary.js";
import { getPlayerTier } from "./PlayerTiers.js";
import { assignPlayerArchetype } from "./PlayerArchetypeEngine.js";
import { getPlayerComparison } from "./PlayerComparisonEngine.js";
import scoutingProfiles from "../data/footballIntelligence/scouting/scoutingProfiles.js";
import defaultScoutingProfile from "../data/footballIntelligence/scouting/defaultScoutingProfile.js";
import { resolvePlayerContext } from "./context/PlayerContextResolver.js";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine.js";
import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract.js";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId.js";
import { evaluateCanonicalProspect } from "./playerEvaluation/prospect/CanonicalProspectEvaluationService.js";
import {
  PLAYER_CALIBER_SUBJECT_KINDS,
  resolveCanonicalPlayerCaliber,
} from "./playerEvaluation/caliber/index.js";

const PLAYER_EVALUATION_MODEL_VERSION =
  "PLAYER-EVALUATION-PROSPECT-1.0.0";

function getStoredOverallGrade(profile = {}) {
  const grade = profile?.projection?.overallGrade;

  if (
    typeof grade === "number" &&
    Number.isFinite(grade)
  ) {
    return grade;
  }

  return null;
}

function getEvidenceLevel(confidence = 0) {
  if (confidence >= 0.9) {
    return EVIDENCE_LEVELS.VERY_STRONG;
  }

  if (confidence >= 0.75) {
    return EVIDENCE_LEVELS.STRONG;
  }

  if (confidence >= 0.5) {
    return EVIDENCE_LEVELS.MODERATE;
  }

  if (confidence > 0) {
    return EVIDENCE_LEVELS.LIMITED;
  }

  return EVIDENCE_LEVELS.NONE;
}

function getStoredEvaluation(profile = {}) {
  const projection = profile?.projection || {};
  const nflProjection =
    profile?.nflProjection || {};

  return {
    overallGrade: getStoredOverallGrade(profile),
    tier: profile?.tier || null,
    comparison:
      profile?.nflComparison || null,

    draftProjection:
      projection?.roundGrade ||
      projection?.projection ||
      null,

    readiness:
      nflProjection?.yearOneRole ||
      profile?.readiness ||
      null,

    developmentProjection:
      nflProjection?.longTermProjection ||
      profile?.developmentProjection ||
      null,

    ceiling:
      projection?.ceiling ||
      profile?.ceiling ||
      null,

    floor:
      projection?.floor ||
      profile?.floor ||
      null,

    archetype: profile?.archetype || null,

    riskProfile:
      projection?.risk ||
      profile?.riskLevel ||
      null,

    translationRisk:
      profile?.translationRisk || null,

    summary:
      profile?.executiveSummary ||
      profile?.notes ||
      "",
  };
}

function getMissingEvaluationEvidence(
  storedEvaluation = {}
) {
  const missingEvidence = [];

  if (storedEvaluation.overallGrade === null) {
    missingEvidence.push(
      "projection.overallGrade"
    );
  }

  if (!storedEvaluation.draftProjection) {
    missingEvidence.push(
      "projection.roundGrade"
    );
  }

  if (!storedEvaluation.archetype) {
    missingEvidence.push("archetype");
  }

  if (!storedEvaluation.readiness) {
    missingEvidence.push("readiness");
  }

  if (!storedEvaluation.developmentProjection) {
    missingEvidence.push(
      "developmentProjection"
    );
  }

  if (!storedEvaluation.ceiling) {
    missingEvidence.push("ceiling");
  }

  if (!storedEvaluation.floor) {
    missingEvidence.push("floor");
  }

  if (!storedEvaluation.riskProfile) {
    missingEvidence.push("riskProfile");
  }

  if (!storedEvaluation.comparison) {
    missingEvidence.push("comparison");
  }

  return missingEvidence;
}

function isNonProspectContext(playerContext = {}) {
  return [
    "TRANSITION",
    "NFL",
    "HISTORICAL",
  ].includes(playerContext?.evaluationPath);
}

export const getEstimatedPlayerGrade = (player) => {
  const rank = player?.rank || player?.rankings?.overall || 999;

  if (rank <= 3) return 96;
  if (rank <= 5) return 94;
  if (rank <= 10) return 92;
  if (rank <= 15) return 90;
  if (rank <= 25) return 87;
  if (rank <= 40) return 84;
  if (rank <= 75) return 80;
  if (rank <= 120) return 75;
  if (rank <= 180) return 70;

  return 65;
};

export const getDraftProjection = (player) => {
  const rank = player?.rank || player?.rankings?.overall || 999;

  if (rank <= 5) return "Top 5";
  if (rank <= 10) return "Top 10";
  if (rank <= 32) return "Round 1";
  if (rank <= 64) return "Round 2";
  if (rank <= 100) return "Day 2";
  if (rank <= 180) return "Day 3";

  return "Priority Free Agent";
};

function getScoutingProfile(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) return defaultScoutingProfile;

  return scoutingProfiles[playerId] || defaultScoutingProfile;
}

export function getPlayerEvaluationSummary(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) {
    return createIntelligenceSummary({
      available: false,
      playerId: null,
      summary: "No evaluation profile available yet.",
      notes: "No evaluation profile available yet.",
      data: {},
    });
  }

  const scoutingProfile = getScoutingProfile(player);
  const hasScoutingProfile = scoutingProfile !== defaultScoutingProfile;

  const estimatedGrade = getEstimatedPlayerGrade(player);

  const formattedTier = getPlayerTier(player)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

  const projection = scoutingProfile.projection || {};

  const evaluationBase = {
    estimatedGrade,

    overallGrade: projection.overallGrade || estimatedGrade,
    grade: projection.overallGrade || player?.grade || estimatedGrade,

    tier: player?.tier || formattedTier,

    projection:
      projection.projection || player?.projection || getDraftProjection(player),

    draftProjection:
      projection.roundGrade || player?.projection || getDraftProjection(player),

    archetype: scoutingProfile.archetype || assignPlayerArchetype(player),

    strengths: scoutingProfile.strengths || [],

    weaknesses:
      scoutingProfile.weaknesses ||
      scoutingProfile.developmentAreas ||
      [],

    developmentAreas: scoutingProfile.developmentAreas || [],

    bestSchemeFits: scoutingProfile.bestSchemeFits || [],

    ceiling: projection.ceiling || scoutingProfile.ceiling || "Unknown",
    floor: projection.floor || scoutingProfile.floor || "Unknown",

    readiness:
      scoutingProfile.nflProjection?.yearOneRole ||
      scoutingProfile.readiness ||
      "Unknown",

    developmentProjection:
      scoutingProfile.nflProjection?.longTermProjection ||
      scoutingProfile.developmentProjection ||
      "Unknown",

    riskLevel: projection.risk || scoutingProfile.riskLevel || "Unknown",
    risk: projection.risk || scoutingProfile.riskLevel || "Unknown",

    executiveSummary:
      scoutingProfile.executiveSummary ||
      scoutingProfile.notes ||
      "",

    scoutingNotes:
      scoutingProfile.notes ||
      scoutingProfile.executiveSummary ||
      "",
  };

  const comparison =
    scoutingProfile.nflComparison ||
    getPlayerComparison(player, evaluationBase);

  const evaluation = {
    ...evaluationBase,
    nflComparison: comparison,
    comparison,
  };

  return createIntelligenceSummary({
    available: hasScoutingProfile,
    playerId,
    confidence: scoutingProfile.confidence || 0,
    source: scoutingProfile.source || "LBHT Scouting",
    lastUpdated: scoutingProfile.lastUpdated || null,
    summary: evaluation.executiveSummary,
    notes: evaluation.scoutingNotes,
    data: evaluation,
  });
}

export const evaluatePlayer = (player) => {
  const evaluationSummary = getPlayerEvaluationSummary(player);
  const evaluation = evaluationSummary?.data || {};

  return {
    ...player,
    ...evaluation,
    evaluationSummary,
  };
};

/*
 * New standardized prospect-evaluation output.
 *
 * The framework score uses only the authoritative
 * stored prospect grade. Legacy rank-based fallbacks
 * remain isolated to the existing APIs above.
 */
export function getPlayerEvaluationIntelligenceResult(
  player,
  options = {}
) {
  const playerId = getCanonicalPlayerId(player);
  const playerContext =
    options?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  if (!playerId) {
    return createUnavailableIntelligenceResult({
      domain: "playerEvaluation",
      playerId: null,
      competitionLevel: playerContext?.competition?.level || null,
      careerStage: playerContext?.careerStage || null,
      dataState: DATA_STATES.UNKNOWN,
      summary: "No canonical prospect identity is currently available for this player.",
      missingEvidence: ["playerId"],
      frameworkVersion: "1.0.0",
      modelVersion: PLAYER_EVALUATION_MODEL_VERSION,
    });
  }

  if (isNonProspectContext(playerContext)) {
    return createUnavailableIntelligenceResult({
      domain: "playerEvaluation",
      playerId,
      competitionLevel: playerContext?.competition?.level || null,
      careerStage: playerContext?.careerStage || null,
      dataState: DATA_STATES.NOT_APPLICABLE,
      summary: "Prospect position models are not applicable to the current player context.",
      missingEvidence: ["prospectContext"],
      frameworkVersion: "1.0.0",
      modelVersion: PLAYER_EVALUATION_MODEL_VERSION,
    });
  }

  const scoutingProfile = getScoutingProfile(player);
  const hasScoutingProfile = scoutingProfile !== defaultScoutingProfile;
  const runtime = evaluateCanonicalProspect({
    player,
    playerContext,
    scoutingProfile: hasScoutingProfile ? scoutingProfile : null,
    includeDiagnostics: options?.includeDiagnostics === true,
  });
  const modelResult = runtime?.modelResult || null;

  if (!runtime?.available || !modelResult) {
    const modelMissingEvidence = Array.isArray(modelResult?.missingEvidence)
      ? modelResult.missingEvidence
      : [];
    const position = runtime?.position || playerContext?.position || player?.position || null;
    const errorCode = runtime?.error || "PROSPECT_MODEL_UNAVAILABLE";

    return createIntelligenceResult({
      domain: "playerEvaluation",
      available: false,
      dataState: modelResult?.dataState || DATA_STATES.UNAVAILABLE,
      score: null,
      value: {
        type: "STRUCTURED",
        data: {
          evaluation: {
            overallGrade: null,
            position,
            model: modelResult?.model || null,
          },
          calibration: {
            storedScoutingProfileAvailable: hasScoutingProfile,
            storedOverallGrade: hasScoutingProfile
              ? getStoredOverallGrade(scoutingProfile)
              : null,
            scoringRole: "CALIBRATION_OR_FALLBACK_EVIDENCE_ONLY",
          },
        },
      },
      confidence: modelResult?.confidence || 0,
      evidenceLevel: modelResult?.evidenceLevel || EVIDENCE_LEVELS.NONE,
      playerId,
      competitionLevel: playerContext?.competition?.level || null,
      careerStage: playerContext?.careerStage || null,
      summary: `Prospect evaluation is unavailable because the canonical position model did not produce a governed grade (${errorCode}).`,
      explanation: {
        positiveFactors: [],
        limitingFactors: [errorCode],
        contextualFactors: hasScoutingProfile
          ? ["Stored scouting evaluation retained as calibration evidence only."]
          : [],
      },
      evidence: hasScoutingProfile
        ? [{ type: "STORED_SCOUTING_CALIBRATION_EVIDENCE", value: scoutingProfile }]
        : [],
      missingEvidence: [
        ...new Set([
          ...modelMissingEvidence,
          "registeredProspectPositionModel",
        ]),
      ],
      sources: hasScoutingProfile && scoutingProfile?.source
        ? [scoutingProfile.source]
        : [],
      rawData: {
        playerContext,
        prospectRuntime: runtime,
        prospectModelResult: modelResult,
        calibrationProfile: hasScoutingProfile ? scoutingProfile : null,
      },
      lastUpdated: hasScoutingProfile ? scoutingProfile?.lastUpdated || null : null,
      frameworkVersion: "1.0.0",
      modelVersion: modelResult?.versions?.model || PLAYER_EVALUATION_MODEL_VERSION,
      dataVersion: modelResult?.versions?.data ?? null,
    });
  }

  const strengths = Array.isArray(modelResult?.explanation?.strengths)
    ? modelResult.explanation.strengths
    : [];
  const concerns = Array.isArray(modelResult?.explanation?.concerns)
    ? modelResult.explanation.concerns
    : [];
  const contextualFactors = Array.isArray(modelResult?.explanation?.contextualFactors)
    ? modelResult.explanation.contextualFactors
    : [];

  return createIntelligenceResult({
    domain: "playerEvaluation",
    available: true,
    dataState: modelResult.dataState || DATA_STATES.AVAILABLE,
    score: modelResult.overallGrade,
    value: {
      type: "STRUCTURED",
      data: {
        evaluation: {
          overallGrade: modelResult.overallGrade,
          position: modelResult.position,
          model: modelResult.model,
          components: modelResult.components,
        },
        conclusions: modelResult.conclusions,
        aggregation: modelResult.aggregation,
        calibration: {
          storedScoutingProfileAvailable: hasScoutingProfile,
          storedOverallGrade: hasScoutingProfile
            ? getStoredOverallGrade(scoutingProfile)
            : null,
          scoringRole: "CALIBRATION_OR_FALLBACK_EVIDENCE_ONLY",
        },
      },
    },
    confidence: modelResult.confidence,
    evidenceLevel: modelResult.evidenceLevel,
    playerId,
    competitionLevel: playerContext?.competition?.level || null,
    careerStage: playerContext?.careerStage || null,
    summary: `Canonical ${modelResult.position} prospect evaluation produced by ${modelResult.model}.`,
    explanation: {
      positiveFactors: strengths,
      limitingFactors: concerns,
      contextualFactors,
    },
    evidence: [
      {
        type: "PROSPECT_POSITION_MODEL_RESULT",
        value: {
          model: modelResult.model,
          position: modelResult.position,
          overallGrade: modelResult.overallGrade,
          provenance: modelResult.provenance,
        },
      },
      ...(hasScoutingProfile
        ? [{ type: "STORED_SCOUTING_CALIBRATION_EVIDENCE", value: scoutingProfile }]
        : []),
    ],
    missingEvidence: modelResult.missingEvidence || [],
    sources: hasScoutingProfile && scoutingProfile?.source
      ? [scoutingProfile.source]
      : [],
    rawData: {
      playerContext,
      prospectRuntime: runtime,
      prospectModelResult: modelResult,
      calibrationProfile: hasScoutingProfile ? scoutingProfile : null,
    },
    lastUpdated: hasScoutingProfile ? scoutingProfile?.lastUpdated || null : null,
    frameworkVersion: "1.0.0",
    modelVersion: modelResult?.versions?.model || PLAYER_EVALUATION_MODEL_VERSION,
    dataVersion: modelResult?.versions?.data ?? null,
  });
}

/**
 * Convenience boundary for higher-level FIE consumers that need canonical
 * prospect caliber. It evaluates through the production prospect registry and
 * then delegates projection to CanonicalPlayerCaliberService without regrading.
 */
export function getCanonicalProspectCaliberResult(player, options = {}) {
  const evaluation = getPlayerEvaluationIntelligenceResult(player, options);
  const modelResult = evaluation?.rawData?.prospectModelResult || null;

  return resolveCanonicalPlayerCaliber({
    subjectKind: PLAYER_CALIBER_SUBJECT_KINDS.PROSPECT,
    player,
    prospectModelResult: modelResult,
  });
}

export default {
  getEstimatedPlayerGrade,
  getDraftProjection,
  getPlayerEvaluationSummary,
  evaluatePlayer,
  getPlayerEvaluationIntelligenceResult,
  getCanonicalProspectCaliberResult,
};
