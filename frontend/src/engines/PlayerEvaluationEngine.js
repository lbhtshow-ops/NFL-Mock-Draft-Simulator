import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary";
import { getPlayerTier } from "./PlayerTiers";
import { assignPlayerArchetype } from "./PlayerArchetypeEngine";
import { getPlayerComparison } from "./PlayerComparisonEngine";
import scoutingProfiles from "../data/footballIntelligence/scouting/scoutingProfiles";
import defaultScoutingProfile from "../data/footballIntelligence/scouting/defaultScoutingProfile";
import { resolvePlayerContext } from "./context/PlayerContextResolver";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine";
import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId";

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

  const scoutingProfile = getScoutingProfile(player);

  if (
    !playerId ||
    scoutingProfile === defaultScoutingProfile
  ) {
    return createUnavailableIntelligenceResult({
      domain: "playerEvaluation",
      playerId,

      competitionLevel:
        playerContext?.competition?.level || null,

      careerStage:
        playerContext?.careerStage || null,

      dataState: playerId
        ? DATA_STATES.UNAVAILABLE
        : DATA_STATES.UNKNOWN,

      summary:
        "No prospect evaluation profile is currently available for this player.",

      missingEvidence: playerId
        ? ["evaluationProfile"]
        : ["playerId", "evaluationProfile"],

      frameworkVersion: "1.0.0",
      modelVersion:
        PLAYER_EVALUATION_MODEL_VERSION,
    });
  }

  const storedEvaluation =
    getStoredEvaluation(scoutingProfile);

  const nonProspectContext =
    isNonProspectContext(playerContext);

  const score = nonProspectContext
    ? null
    : storedEvaluation.overallGrade;

  const missingEvidence =
    getMissingEvaluationEvidence(
      storedEvaluation
    );

  if (nonProspectContext) {
    missingEvidence.push(
      "currentLevelEvaluation"
    );
  }

  const dataState =
    score !== null && !nonProspectContext
      ? DATA_STATES.AVAILABLE
      : DATA_STATES.INSUFFICIENT_SAMPLE;

  const confidence =
    scoutingProfile?.confidence || 0;

  const evidenceTransition =
    options?.evidenceTransition ||
    resolveEvidenceTransition(player, {
      playerContext,
    });

  const strengths = Array.isArray(
    scoutingProfile?.strengths
  )
    ? scoutingProfile.strengths
    : [];

  const limitingFactors = Array.isArray(
    scoutingProfile?.weaknesses
  )
    ? scoutingProfile.weaknesses
    : Array.isArray(
        scoutingProfile?.developmentAreas
      )
    ? scoutingProfile.developmentAreas
    : [];

  return createIntelligenceResult({
    domain: "playerEvaluation",

    available: true,
    dataState,

    score,
    value: {
      type: "STRUCTURED",
      data: {
        evaluation: {
          overallGrade:
            storedEvaluation.overallGrade,
          tier: storedEvaluation.tier,
          comparison:
            storedEvaluation.comparison,
        },

        projection: {
          draftProjection:
            storedEvaluation.draftProjection,
          readiness:
            storedEvaluation.readiness,
          developmentProjection:
            storedEvaluation.developmentProjection,
          ceiling: storedEvaluation.ceiling,
          floor: storedEvaluation.floor,
        },

        profile: {
          archetype:
            storedEvaluation.archetype,
          riskProfile:
            storedEvaluation.riskProfile,
          translationRisk:
            storedEvaluation.translationRisk,
        },

        narrative: {
          summary: storedEvaluation.summary,
        },
      },
    },

    confidence,
    evidenceLevel:
      getEvidenceLevel(confidence),

    playerId,

    competitionLevel:
      playerContext?.competition?.level || null,

    careerStage:
      playerContext?.careerStage || null,

    summary: storedEvaluation.summary,

    explanation: {
      positiveFactors: strengths,
      limitingFactors,
      contextualFactors:
        storedEvaluation.summary
          ? [storedEvaluation.summary]
          : [],
    },

    evidence: [
      {
        type: "PLAYER_EVALUATION_PROFILE",
        value: scoutingProfile,
      },
    ],

    missingEvidence,

    sources: scoutingProfile?.source
      ? [scoutingProfile.source]
      : [],

    rawData: {
      profile: scoutingProfile,
      playerContext,
      evidenceTransition,
    },

    lastUpdated:
      scoutingProfile?.lastUpdated || null,

    frameworkVersion: "1.0.0",
    modelVersion:
      PLAYER_EVALUATION_MODEL_VERSION,
    dataVersion:
      scoutingProfile?.lastUpdated || null,
  });
}

export default {
  getEstimatedPlayerGrade,
  getDraftProjection,
  getPlayerEvaluationSummary,
  evaluatePlayer,
  getPlayerEvaluationIntelligenceResult,
};
