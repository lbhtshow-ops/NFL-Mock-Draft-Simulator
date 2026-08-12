import createIntelligenceSummary from "../data/footballIntelligence/createIntelligenceSummary.js";
import traitScoringRules from "../data/footballIntelligence/scouting/traitScoringRules.js";
import playerTraitProfiles from "../data/footballIntelligence/scouting/playerTraitProfiles.js";
import { resolvePlayerContext } from "./context/PlayerContextResolver.js";
import { resolveEvidenceTransition } from "./context/EvidenceTransitionEngine.js";
import {
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "./contracts/IntelligenceResultContract.js";
import { getCanonicalPlayerId } from "./shared/getCanonicalPlayerId.js";

const PLAYER_TRAIT_MODEL_VERSION = "PLAYER-TRAIT-1.0.0";

const positionTraitGroups = {
  QB: ["Accuracy", "ArmStrength", "Processing", "PocketPresence", "Anticipation"],
  RB: ["Vision", "Burst", "ContactBalance", "Elusiveness", "PassCatching"],
  WR: ["RouteRunning", "Release", "Hands", "Separation", "YAC"],
  TE: ["RouteRunning", "Hands", "Blocking", "ContestedCatch", "Versatility"],
  OT: ["PassProtection", "Anchor", "Footwork", "Power", "Length"],
  IOL: ["Anchor", "Power", "Leverage", "Awareness", "RunBlocking"],

  DL: ["Power", "Explosiveness", "HandUsage", "BlockShedding", "RunDefense"],
  EDGE: ["Burst", "Bend", "PassRush", "Power", "RunDefense"],
  LB: ["Processing", "Range", "Tackling", "Coverage", "Blitzing"],
  CB: ["ManCoverage", "ZoneCoverage", "BallSkills", "Speed", "Recovery"],
  S: ["Instincts", "Range", "BallSkills", "Tackling", "Versatility"],

  K: ["Accuracy", "LegStrength", "Consistency", "Pressure", "Kickoffs"],
  P: ["LegStrength", "HangTime", "Placement", "Consistency", "Pressure"],
};

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

function getValidTraitDimensions(traits = {}) {
  return Object.entries(traits).reduce(
    (result, [traitName, value]) => {
      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        result[traitName] = value;
      }

      return result;
    },
    {}
  );
}

function getMissingTraitEvidence(
  traits = {},
  positionTraitGroup = []
) {
  const missingEvidence =
    positionTraitGroup.reduce(
      (result, traitName) => {
        const value = traits?.[traitName];

        if (
          typeof value !== "number" ||
          !Number.isFinite(value)
        ) {
          result.push(`traits.${traitName}`);
        }

        return result;
      },
      []
    );

  const validTraitDimensions =
    getValidTraitDimensions(traits);

  if (
    Object.keys(validTraitDimensions).length === 0
  ) {
    missingEvidence.push("traitDimensions");
  }

  return missingEvidence;
}

export function getPositionTraitGroup(position) {
  if (!position) return [];

  return positionTraitGroups[position] || [];
}

export function getPlayerTraitProfile(playerId) {
  if (!playerId) return null;

  return playerTraitProfiles[playerId] || null;
}

export function getTraitScoringRule(traitName) {
  if (!traitName) return null;

  return traitScoringRules[traitName] || null;
}

export function getPlayerTraits(playerId) {
  const profile = getPlayerTraitProfile(playerId);

  if (!profile || !profile.traits) {
    return {};
  }

  return profile.traits;
}

export function getPrimaryTraitsForPlayer(playerId) {
  const profile = getPlayerTraitProfile(playerId);

  if (!profile) return {};

  const positionTraits = getPositionTraitGroup(profile.position);
  const traits = profile.traits || {};

  if (positionTraits.length === 0) {
    return traits;
  }

  return positionTraits.reduce((result, traitName) => {
    result[traitName] = traits[traitName] ?? null;
    return result;
  }, {});
}

export function getSecondaryTraitsForPlayer(playerId) {
  const profile = getPlayerTraitProfile(playerId);

  if (!profile) return {};

  const positionTraits = getPositionTraitGroup(profile.position);
  const traits = profile.traits || {};

  return Object.entries(traits).reduce((result, [traitName, score]) => {
    if (!positionTraits.includes(traitName)) {
      result[traitName] = score;
    }

    return result;
  }, {});
}

export function getPlayerTraitScore(playerId, traitName) {
  const traits = getPlayerTraits(playerId);

  if (!traits || !traits[traitName]) {
    return null;
  }

  return traits[traitName];
}

export function getPlayerTraitSummary(playerId) {
  const profile = getPlayerTraitProfile(playerId);

  if (!profile) {
    return createIntelligenceSummary({
      available: false,
      playerId,
      summary: "No trait profile available yet.",
      notes: "No trait profile available yet.",
      data: {
        playerName: null,
        position: null,
        traits: {},
        primaryTraits: {},
        secondaryTraits: {},
        positionTraitGroup: [],
      },
    });
  }

  const positionTraitGroup = getPositionTraitGroup(profile.position);
  const primaryTraits = getPrimaryTraitsForPlayer(playerId);
  const secondaryTraits = getSecondaryTraitsForPlayer(playerId);

  return createIntelligenceSummary({
    available: true,
    playerId,
    confidence: profile.confidence || 0,
    source: profile.source || "Unknown",
    lastUpdated: profile.lastUpdated || null,
    summary: profile.notes || "",
    notes: profile.notes || "",
    data: {
      playerName: profile.playerName,
      position: profile.position,
      traits: profile.traits || {},
      primaryTraits,
      secondaryTraits,
      positionTraitGroup,
    },
  });
}

/*
 * New standardized framework output.
 *
 * Existing raw-ID helpers remain unchanged. This
 * player-object API preserves the authored trait map
 * as a vector without inventing an aggregate score.
 */
export function getPlayerTraitIntelligenceResult(
  player,
  options = {}
) {
  const playerId = getCanonicalPlayerId(player);

  const playerContext =
    options?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  const profile = getPlayerTraitProfile(playerId);

  if (!playerId || !profile) {
    return createUnavailableIntelligenceResult({
      domain: "playerTraits",
      playerId,

      competitionLevel:
        playerContext?.competition?.level || null,

      careerStage:
        playerContext?.careerStage || null,

      dataState: playerId
        ? DATA_STATES.UNAVAILABLE
        : DATA_STATES.UNKNOWN,

      summary:
        "No player trait profile is currently available for this player.",

      missingEvidence: playerId
        ? ["traitProfile"]
        : ["playerId", "traitProfile"],

      frameworkVersion: "1.0.0",
      modelVersion: PLAYER_TRAIT_MODEL_VERSION,
    });
  }

  const traits = getPlayerTraits(playerId);
  const validTraitDimensions =
    getValidTraitDimensions(traits);

  const positionTraitGroup =
    getPositionTraitGroup(profile.position);

  const primaryTraits =
    getPrimaryTraitsForPlayer(playerId);

  const secondaryTraits =
    getSecondaryTraitsForPlayer(playerId);

  const missingEvidence =
    getMissingTraitEvidence(
      traits,
      positionTraitGroup
    );

  const hasValidTraitDimensions =
    Object.keys(validTraitDimensions).length > 0;

  const hasMissingPrimaryTraits =
    positionTraitGroup.some((traitName) => {
      const value = traits?.[traitName];

      return (
        typeof value !== "number" ||
        !Number.isFinite(value)
      );
    });

  const dataState =
    hasValidTraitDimensions &&
    !hasMissingPrimaryTraits
      ? DATA_STATES.AVAILABLE
      : DATA_STATES.INSUFFICIENT_SAMPLE;

  const confidence = profile?.confidence || 0;

  const evidenceTransition =
    options?.evidenceTransition ||
    resolveEvidenceTransition(player, {
      playerContext,
    });

  return createIntelligenceResult({
    domain: "playerTraits",

    available: true,
    dataState,

    score: null,
    value: {
      type: "VECTOR",
      data: validTraitDimensions,
    },

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
      "Player trait profile available.",

    explanation: {
      positiveFactors: [],
      limitingFactors: [],
      contextualFactors: profile?.notes
        ? [profile.notes]
        : [],
    },

    evidence: [
      {
        type: "PLAYER_TRAIT_PROFILE",
        value: profile,
      },
    ],

    missingEvidence,

    sources: profile?.source
      ? [profile.source]
      : [],

    rawData: {
      profile,
      traits,
      primaryTraits,
      secondaryTraits,
      positionTraitGroup,
      playerContext,
      evidenceTransition,
    },

    lastUpdated:
      profile?.lastUpdated || null,

    frameworkVersion: "1.0.0",
    modelVersion: PLAYER_TRAIT_MODEL_VERSION,
    dataVersion:
      profile?.lastUpdated || null,
  });
}

export default {
  getPositionTraitGroup,
  getPlayerTraitProfile,
  getTraitScoringRule,
  getPlayerTraits,
  getPrimaryTraitsForPlayer,
  getSecondaryTraitsForPlayer,
  getPlayerTraitScore,
  getPlayerTraitSummary,
  getPlayerTraitIntelligenceResult,
};
