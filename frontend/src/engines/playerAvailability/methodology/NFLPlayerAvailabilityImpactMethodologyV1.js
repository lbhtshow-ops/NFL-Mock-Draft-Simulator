import {
  PLAYER_IMPACT_DIMENSIONS,
  PLAYER_IMPACT_METHODOLOGY_STATES,
  createPlayerAvailabilityImpactMethodologyProfile,
} from "./PlayerAvailabilityImpactMethodologyContract.js";

/**
 * LBHT NFL Player Availability Impact V1 — validated candidate profile.
 *
 * IMPORTANT:
 * - VALIDATED, not APPROVED.
 * - Numeric outputs are PROVISIONAL shadow intelligence.
 * - They MUST NOT be interpreted as points, win probability, betting value,
 *   WAR, or direct Pick'em probability adjustments.
 * - This profile translates the repository's pre-existing V1 heuristic
 *   concepts into the canonical multi-dimensional methodology boundary so
 *   they can be calibrated/replaced without hard-coding them into the engine.
 */
export const NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE =
  createPlayerAvailabilityImpactMethodologyProfile({
    profileId: "lbht:nfl-player-availability-impact:v1",
    profileVersion: "1.0.0",
    state: PLAYER_IMPACT_METHODOLOGY_STATES.VALIDATED,

    dimensions: {
      [PLAYER_IMPACT_DIMENSIONS.CALIBER]: 0.25,
      [PLAYER_IMPACT_DIMENSIONS.ROLE]: 0.20,
      [PLAYER_IMPACT_DIMENSIONS.REPLACEMENT_GAP]: 0.20,
      [PLAYER_IMPACT_DIMENSIONS.TEAM_DEPENDENCY]: 0.15,
      [PLAYER_IMPACT_DIMENSIONS.POSITION_IMPORTANCE]: 0.15,
      [PLAYER_IMPACT_DIMENSIONS.SNAP_SHARE]: 0.05,
    },

    roleScores: {
      PRIMARY: 1,
      STARTER: 0.9,
      KEY_ROTATION: 0.7,
      ROTATION: 0.5,
      BACKUP: 0.25,
      SPECIALIST: 0.35,
    },

    replacementGapScores: {
      ELITE: 0.05,
      STRONG: 0.20,
      AVERAGE: 0.50,
      REPLACEMENT_LEVEL: 0.75,
      POOR: 1,
    },

    teamDependencyScores: {
      VERY_HIGH: 1,
      HIGH: 0.8,
      MODERATE: 0.55,
      LOW: 0.3,
      VERY_LOW: 0.1,
    },

    positionImportanceScores: {
      VERY_HIGH: 1,
      HIGH: 0.8,
      MODERATE: 0.55,
      LOW: 0.3,
    },

    availabilityMultipliers: {
      AVAILABLE: 0,
      LIMITED: 0.20,
      QUESTIONABLE: 0.45,
      DOUBTFUL: 0.80,
      OUT: 1,
      INJURED_RESERVE: 1,
      PUP: 1,
      SUSPENDED: 1,
      INACTIVE: 1,
    },

    calibration: {
      benchmarkSetId: "lbht:legacy-v1-policy-parity",
      benchmarkSetVersion: "1.0.0",
      validationSampleSize: 1,
      validationMetrics: {
        state: "PROVISIONAL_POLICY_TRANSLATION",
        productionCalibrated: false,
      },
      limitations: [
        "Profile is a transparent translation of existing V1 heuristic concepts, not a fitted historical injury-impact model.",
        "Formal historical calibration is required before APPROVED state.",
        "Do not convert the 0-100 index directly into points or win probability.",
      ],
    },

    provenance: {
      contributors: [
        {
          source: "NFLPlayerAvailabilityImpactEngine legacy V1 policy",
          role: "POLICY_TRANSLATION_REFERENCE",
        },
      ],
      evidenceRefs: [],
    },
  });

export default NFL_PLAYER_AVAILABILITY_IMPACT_V1_PROFILE;
