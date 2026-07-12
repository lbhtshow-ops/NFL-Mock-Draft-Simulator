// src/engines/ProductionEngine.js

import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary";
import productionProfiles from "../data/footballIntelligence/production/productionProfiles";
import defaultProductionProfile from "../data/footballIntelligence/production/defaultProductionProfile";

import { resolvePlayerContext } from "./context/PlayerContextResolver";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine";

import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId";

const PRODUCTION_MODEL_VERSION = "PRODUCTION-1.0.0";

function getProductionScore(profile = {}) {
  const score =
    profile?.productionScores?.overallProductionScore;

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

function getSeasonEvidence(profile = {}) {
  const season =
    profile?.statistics?.season || {};

  return {
    year: season?.year ?? null,
    school: season?.school ?? null,
    games: season?.games ?? null,
    starts: season?.starts ?? null,
  };
}

function getMissingEvidence(profile = {}) {
  const missingEvidence = [];

  const season =
    profile?.statistics?.season || {};

  if (season?.year == null) {
    missingEvidence.push("season.year");
  }

  if (season?.games == null) {
    missingEvidence.push("season.games");
  }

  if (season?.starts == null) {
    missingEvidence.push("season.starts");
  }

  if (
    profile?.productionScores?.consistency == null
  ) {
    missingEvidence.push(
      "productionScores.consistency"
    );
  }

  if (
    profile?.productionScores?.efficiency == null
  ) {
    missingEvidence.push(
      "productionScores.efficiency"
    );
  }

  if (
    profile?.productionScores?.explosiveness == null
  ) {
    missingEvidence.push(
      "productionScores.explosiveness"
    );
  }

  if (
    profile?.productionScores
      ?.situationalProduction == null
  ) {
    missingEvidence.push(
      "productionScores.situationalProduction"
    );
  }

  if (
    profile?.productionScores
      ?.overallProductionScore == null
  ) {
    missingEvidence.push(
      "productionScores.overallProductionScore"
    );
  }

  return missingEvidence;
}

function buildProductionEvidence(profile = {}) {
  const productionScores =
    profile?.productionScores || {};

  const season = getSeasonEvidence(profile);

  return [
    {
      type: "SEASON_SAMPLE",
      value: season,
    },

    {
      type: "PRODUCTION_COMPONENTS",
      value: {
        consistency:
          productionScores?.consistency ?? null,

        efficiency:
          productionScores?.efficiency ?? null,

        explosiveness:
          productionScores?.explosiveness ?? null,

        situationalProduction:
          productionScores?.situationalProduction ??
          null,

        overallProductionScore:
          productionScores?.overallProductionScore ??
          null,
      },
    },
  ];
}

function buildProductionExplanation(profile = {}) {
  const strengths = Array.isArray(profile?.strengths)
    ? profile.strengths
    : [];

  const concerns = Array.isArray(profile?.concerns)
    ? profile.concerns
    : [];

  const contextualFactors = [];

  const season = getSeasonEvidence(profile);

  if (season.year) {
    contextualFactors.push(
      `Production evidence is currently based on the ${season.year} season.`
    );
  }

  if (
    typeof season.games === "number" &&
    typeof season.starts === "number"
  ) {
    contextualFactors.push(
      `The profile includes ${season.games} game(s) and ${season.starts} start(s).`
    );
  }

  return {
    positiveFactors: strengths,
    limitingFactors: concerns,
    contextualFactors,
  };
}

/*
 * Legacy profile retrieval.
 *
 * This function remains unchanged so existing prospect
 * screens and services continue to work.
 */
export function getProductionProfile(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) {
    return defaultProductionProfile;
  }

  return (
    productionProfiles[playerId] ||
    defaultProductionProfile
  );
}

/*
 * Legacy intelligence-summary output.
 *
 * Existing UI components currently consume this shape,
 * so it must remain available during migration.
 */
export function getProductionSummary(player) {
  const playerId = getCanonicalPlayerId(player);
  const profile = getProductionProfile(player);

  if (
    !playerId ||
    profile === defaultProductionProfile
  ) {
    return createIntelligenceSummary({
      available: false,
      playerId,
      summary:
        "No production profile available yet.",
      notes:
        "No production profile available yet.",
      data: defaultProductionProfile,
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
export function getProductionIntelligenceResult(
  player,
  options = {}
) {
  const playerId = getCanonicalPlayerId(player);

  const playerContext =
    options?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  const profile = getProductionProfile(player);

  if (
    !playerId ||
    profile === defaultProductionProfile
  ) {
    return createUnavailableIntelligenceResult({
      domain: "production",
      playerId,

      competitionLevel:
        playerContext?.competition?.level || null,

      careerStage:
        playerContext?.careerStage || null,

      dataState: playerId
        ? DATA_STATES.UNAVAILABLE
        : DATA_STATES.UNKNOWN,

      summary:
        "No production profile is currently available for this player.",

      missingEvidence: [
        "productionProfile",
      ],

      frameworkVersion: "1.0.0",
      modelVersion: PRODUCTION_MODEL_VERSION,
    });
  }

  const score = getProductionScore(profile);
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
    domain: "production",

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
      "Production profile available.",

    explanation:
      buildProductionExplanation(profile),

    evidence:
      buildProductionEvidence(profile),

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
    modelVersion: PRODUCTION_MODEL_VERSION,
    dataVersion:
      profile?.statistics?.season?.year || null,
  });
}

export default {
  getProductionProfile,
  getProductionSummary,
  getProductionIntelligenceResult,
};