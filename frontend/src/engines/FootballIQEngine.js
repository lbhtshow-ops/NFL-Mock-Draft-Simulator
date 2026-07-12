import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary";
import footballIQProfiles from "../data/footballIntelligence/footballIQ/footballIQProfiles";
import defaultFootballIQProfile from "../data/footballIntelligence/footballIQ/defaultFootballIQProfile";
import { resolvePlayerContext } from "./context/PlayerContextResolver";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine";
import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId";

const FOOTBALL_IQ_MODEL_VERSION = "FOOTBALL-IQ-1.0.0";

function getFootballIQScore(profile = {}) {
  const score = profile?.scores?.overallFootballIQ;

  if (
    typeof score === "number" &&
    Number.isFinite(score)
  ) {
    return score;
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

function getMissingEvidence(profile = {}) {
  const missingEvidence = [];

  if (getFootballIQScore(profile) === null) {
    missingEvidence.push("scores.overallFootballIQ");
  }

  return missingEvidence;
}

function buildFootballIQExplanation(profile = {}) {
  const positiveFactors = Array.isArray(
    profile?.strengths
  )
    ? profile.strengths
    : [];

  const limitingFactors = Array.isArray(
    profile?.concerns
  )
    ? profile.concerns
    : [];

  const contextualFactors = profile?.notes
    ? [profile.notes]
    : [];

  return {
    positiveFactors,
    limitingFactors,
    contextualFactors,
  };
}

export function getFootballIQProfile(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) return defaultFootballIQProfile;

  return footballIQProfiles[playerId] || defaultFootballIQProfile;
}

export function getFootballIQSummary(player) {
  const playerId = getCanonicalPlayerId(player);
  const profile = getFootballIQProfile(player);

  if (!playerId || profile === defaultFootballIQProfile) {
    return createIntelligenceSummary({
      available: false,
      playerId,
      summary: "No Football IQ profile available yet.",
      notes: "No Football IQ profile available yet.",
      data: defaultFootballIQProfile,
    });
  }

  return createIntelligenceSummary({
    available: true,
    playerId,
    confidence: profile.confidence || 0,
    source: profile.source || "Unknown",
    lastUpdated: profile.lastUpdated || null,
    summary: profile.notes || "",
    notes: profile.notes || "",
    data: profile,
  });
}

/*
 * New standardized framework output.
 *
 * Future position models and intelligence services
 * should consume this function instead of depending
 * directly on the legacy summary shape.
 */
export function getFootballIQIntelligenceResult(
  player,
  options = {}
) {
  const playerId = getCanonicalPlayerId(player);

  const playerContext =
    options?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  const profile = getFootballIQProfile(player);

  if (
    !playerId ||
    profile === defaultFootballIQProfile
  ) {
    return createUnavailableIntelligenceResult({
      domain: "footballIQ",
      playerId,

      competitionLevel:
        playerContext?.competition?.level || null,

      careerStage:
        playerContext?.careerStage || null,

      dataState: playerId
        ? DATA_STATES.UNAVAILABLE
        : DATA_STATES.UNKNOWN,

      summary:
        "No Football IQ profile is currently available for this player.",

      missingEvidence: [
        "footballIQProfile",
      ],

      frameworkVersion: "1.0.0",
      modelVersion: FOOTBALL_IQ_MODEL_VERSION,
    });
  }

  const score = getFootballIQScore(profile);
  const confidence = profile?.confidence || 0;

  const evidenceTransition =
    options?.evidenceTransition ||
    resolveEvidenceTransition(player, {
      playerContext,
    });

  const missingEvidence =
    getMissingEvidence(profile);

  const hasUsableScore =
    typeof score === "number" &&
    Number.isFinite(score);

  const dataState = hasUsableScore
    ? DATA_STATES.AVAILABLE
    : DATA_STATES.INSUFFICIENT_SAMPLE;

  return createIntelligenceResult({
    domain: "footballIQ",

    available: hasUsableScore,
    dataState,

    score,
    confidence,
    evidenceLevel:
      getEvidenceLevel(confidence),

    playerId,

    competitionLevel:
      playerContext?.competition?.level || null,

    careerStage:
      playerContext?.careerStage || null,

    summary:
      profile?.notes ||
      "Football IQ profile available.",

    explanation:
      buildFootballIQExplanation(profile),

    evidence: [
      {
        type: "FOOTBALL_IQ_PROFILE",
        value: profile,
      },
    ],

    missingEvidence,

    sources: profile?.source
      ? [profile.source]
      : [],

    rawData: {
      profile,
      playerContext,
      evidenceTransition,
    },

    lastUpdated:
      profile?.lastUpdated || null,

    frameworkVersion: "1.0.0",
    modelVersion: FOOTBALL_IQ_MODEL_VERSION,
    dataVersion:
      profile?.lastUpdated || null,
  });
}

export default {
  getFootballIQProfile,
  getFootballIQSummary,
  getFootballIQIntelligenceResult,
};
