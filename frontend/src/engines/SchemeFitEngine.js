import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary.js";
import schemeFitProfiles from "../data/footballIntelligence/schemes/schemeFitProfiles.js";
import defaultSchemeFitProfile from "../data/footballIntelligence/schemes/defaultSchemeFitProfile.js";
import { resolvePlayerContext } from "./context/PlayerContextResolver.js";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine.js";
import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract.js";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId.js";

const SCHEME_FIT_MODEL_VERSION = "SCHEME-FIT-1.0.0";

function getSchemeFitScore(profile = {}) {
  const score = profile?.versatility?.score;

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

  if (getSchemeFitScore(profile) === null) {
    missingEvidence.push("versatility.score");
  }

  return missingEvidence;
}

function buildSchemeFitExplanation(profile = {}) {
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

  const contextualFactors = [];

  if (profile?.versatility?.notes) {
    contextualFactors.push(
      profile.versatility.notes
    );
  }

  if (profile?.notes) {
    contextualFactors.push(profile.notes);
  }

  return {
    positiveFactors,
    limitingFactors,
    contextualFactors,
  };
}

export function getSchemeFitProfile(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) return defaultSchemeFitProfile;

  return schemeFitProfiles[playerId] || defaultSchemeFitProfile;
}

export function getSchemeFitSummary(player) {
  const playerId = getCanonicalPlayerId(player);
  const profile = getSchemeFitProfile(player);

  if (!playerId || profile === defaultSchemeFitProfile) {
    return createIntelligenceSummary({
      available: false,
      playerId,
      summary: "No scheme fit profile available yet.",
      notes: "No scheme fit profile available yet.",
      data: defaultSchemeFitProfile,
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
export function getSchemeFitIntelligenceResult(
  player,
  options = {}
) {
  const playerId = getCanonicalPlayerId(player);

  const playerContext =
    options?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  const profile = getSchemeFitProfile(player);

  if (
    !playerId ||
    profile === defaultSchemeFitProfile
  ) {
    return createUnavailableIntelligenceResult({
      domain: "schemeFit",
      playerId,

      competitionLevel:
        playerContext?.competition?.level || null,

      careerStage:
        playerContext?.careerStage || null,

      dataState: playerId
        ? DATA_STATES.UNAVAILABLE
        : DATA_STATES.UNKNOWN,

      summary:
        "No scheme fit profile is currently available for this player.",

      missingEvidence: [
        "schemeFitProfile",
      ],

      frameworkVersion: "1.0.0",
      modelVersion: SCHEME_FIT_MODEL_VERSION,
    });
  }

  const score = getSchemeFitScore(profile);
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
    domain: "schemeFit",

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
      "Scheme fit profile available.",

    explanation:
      buildSchemeFitExplanation(profile),

    evidence: [
      {
        type: "SCHEME_FIT_PROFILE",
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
    modelVersion: SCHEME_FIT_MODEL_VERSION,
    dataVersion:
      profile?.lastUpdated || null,
  });
}

export default {
  getSchemeFitProfile,
  getSchemeFitSummary,
  getSchemeFitIntelligenceResult,
};
