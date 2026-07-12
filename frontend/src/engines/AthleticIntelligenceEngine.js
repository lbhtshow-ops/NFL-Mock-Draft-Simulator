// src/engines/AthleticIntelligenceEngine.js

import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary";
import athleticProfiles from "../data/footballIntelligence/athletics/athleticProfiles";
import defaultAthleticProfile from "../data/footballIntelligence/athletics/defaultAthleticProfile";

import { resolvePlayerContext } from "./context/PlayerContextResolver";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId";

import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract";

const ATHLETIC_MODEL_VERSION = "ATHLETIC-1.0.0";

function getAthleticScore(profile = {}) {
  const score = profile?.scores?.overallAthleticScore;

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

function getMissingMeasurements(profile = {}) {
  const measurements = profile?.measurements || {};
  const missingMeasurements = [];

  if (measurements.height == null) {
    missingMeasurements.push("measurements.height");
  }

  if (measurements.weight == null) {
    missingMeasurements.push("measurements.weight");
  }

  if (measurements.armLength == null) {
    missingMeasurements.push("measurements.armLength");
  }

  if (measurements.handSize == null) {
    missingMeasurements.push("measurements.handSize");
  }

  if (measurements.wingspan == null) {
    missingMeasurements.push("measurements.wingspan");
  }

  return missingMeasurements;
}

function getMissingTesting(profile = {}) {
  const testing = profile?.testing || {};
  const missingTesting = [];

  if (testing.fortyYardDash == null) {
    missingTesting.push("testing.fortyYardDash");
  }

  if (testing.tenYardSplit == null) {
    missingTesting.push("testing.tenYardSplit");
  }

  if (testing.verticalJump == null) {
    missingTesting.push("testing.verticalJump");
  }

  if (testing.broadJump == null) {
    missingTesting.push("testing.broadJump");
  }

  if (testing.threeCone == null) {
    missingTesting.push("testing.threeCone");
  }

  if (testing.shortShuttle == null) {
    missingTesting.push("testing.shortShuttle");
  }

  if (testing.benchPress == null) {
    missingTesting.push("testing.benchPress");
  }

  return missingTesting;
}

function getMissingScores(profile = {}) {
  const scores = profile?.scores || {};
  const missingScores = [];

  if (scores.speed == null) {
    missingScores.push("scores.speed");
  }

  if (scores.explosiveness == null) {
    missingScores.push("scores.explosiveness");
  }

  if (scores.agility == null) {
    missingScores.push("scores.agility");
  }

  if (scores.strength == null) {
    missingScores.push("scores.strength");
  }

  if (scores.sizeAdjustedAthleticism == null) {
    missingScores.push(
      "scores.sizeAdjustedAthleticism"
    );
  }

  if (scores.overallAthleticScore == null) {
    missingScores.push(
      "scores.overallAthleticScore"
    );
  }

  return missingScores;
}

function getMissingEvidence(profile = {}) {
  return [
    ...getMissingMeasurements(profile),
    ...getMissingTesting(profile),
    ...getMissingScores(profile),
  ];
}

function buildAthleticEvidence(profile = {}) {
  const measurements = profile?.measurements || {};
  const testing = profile?.testing || {};
  const scores = profile?.scores || {};

  return [
    {
      type: "MEASUREMENTS",
      value: {
        height: measurements.height ?? null,
        weight: measurements.weight ?? null,
        armLength: measurements.armLength ?? null,
        handSize: measurements.handSize ?? null,
        wingspan: measurements.wingspan ?? null,
      },
    },

    {
      type: "ATHLETIC_TESTING",
      value: {
        fortyYardDash:
          testing.fortyYardDash ?? null,

        tenYardSplit:
          testing.tenYardSplit ?? null,

        verticalJump:
          testing.verticalJump ?? null,

        broadJump:
          testing.broadJump ?? null,

        threeCone:
          testing.threeCone ?? null,

        shortShuttle:
          testing.shortShuttle ?? null,

        benchPress:
          testing.benchPress ?? null,
      },
    },

    {
      type: "ATHLETIC_COMPONENT_SCORES",
      value: {
        speed: scores.speed ?? null,

        explosiveness:
          scores.explosiveness ?? null,

        agility: scores.agility ?? null,

        strength: scores.strength ?? null,

        sizeAdjustedAthleticism:
          scores.sizeAdjustedAthleticism ?? null,

        overallAthleticScore:
          scores.overallAthleticScore ?? null,
      },
    },
  ];
}

function buildAthleticExplanation(profile = {}) {
  const positiveFactors = Array.isArray(
    profile?.strengths
  )
    ? profile.strengths
    : [];

  const limitingFactors = Array.isArray(
    profile?.limitations
  )
    ? profile.limitations
    : [];

  const contextualFactors = [];

  const measurements = profile?.measurements || {};
  const testing = profile?.testing || {};

  if (
    measurements.height != null ||
    measurements.weight != null
  ) {
    const height =
      measurements.height ?? "unknown height";

    const weight =
      measurements.weight != null
        ? `${measurements.weight} pounds`
        : "unknown weight";

    contextualFactors.push(
      `The athletic evaluation includes listed measurements of ${height} and ${weight}.`
    );
  }

  const hasVerifiedTesting = Object.values(
    testing
  ).some(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value)
  );

  if (!hasVerifiedTesting) {
    contextualFactors.push(
      "Verified athletic testing data is not currently available, so the profile relies primarily on size-adjusted athletic evaluation and football movement evidence."
    );
  }

  return {
    positiveFactors,
    limitingFactors,
    contextualFactors,
  };
}

/*
 * Legacy profile retrieval.
 *
 * Existing prospect screens and services continue
 * to use this function during framework migration.
 */
export function getAthleticProfile(player) {
  const playerId = getCanonicalPlayerId(player);

  if (!playerId) {
    return defaultAthleticProfile;
  }

  return (
    athleticProfiles[playerId] ||
    defaultAthleticProfile
  );
}

/*
 * Legacy intelligence-summary output.
 *
 * This remains available so the existing Prospect
 * Intelligence Center does not break.
 */
export function getAthleticSummary(player) {
  const playerId = getCanonicalPlayerId(player);
  const profile = getAthleticProfile(player);

  if (
    !playerId ||
    profile === defaultAthleticProfile
  ) {
    return createIntelligenceSummary({
      available: false,
      playerId,
      summary:
        "No athletic profile available yet.",
      notes:
        "No athletic profile available yet.",
      data: defaultAthleticProfile,
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
 * Future position models and services should consume
 * this function rather than relying on the legacy
 * intelligence-summary structure.
 */
export function getAthleticIntelligenceResult(
  player,
  options = {}
) {
  const playerId = getCanonicalPlayerId(player);

  const playerContext =
    options?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  const profile = getAthleticProfile(player);

  if (
    !playerId ||
    profile === defaultAthleticProfile
  ) {
    return createUnavailableIntelligenceResult({
      domain: "athleticism",

      playerId,

      competitionLevel:
        playerContext?.competition?.level || null,

      careerStage:
        playerContext?.careerStage || null,

      dataState: playerId
        ? DATA_STATES.UNAVAILABLE
        : DATA_STATES.UNKNOWN,

      summary:
        "No athletic profile is currently available for this player.",

      missingEvidence: [
        "athleticProfile",
      ],

      frameworkVersion: "1.0.0",
      modelVersion: ATHLETIC_MODEL_VERSION,
    });
  }

  const score = getAthleticScore(profile);
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
    domain: "athleticism",

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
      "Athletic profile available.",

    explanation:
      buildAthleticExplanation(profile),

    evidence:
      buildAthleticEvidence(profile),

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
    modelVersion: ATHLETIC_MODEL_VERSION,
    dataVersion:
      profile?.lastUpdated || null,
  });
}

export default {
  getAthleticProfile,
  getAthleticSummary,
  getAthleticIntelligenceResult,
};