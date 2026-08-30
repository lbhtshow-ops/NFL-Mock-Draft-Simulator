import {
  PLAYER_IMPACT_MODEL_STATES,
} from "../contracts/CanonicalPlayerAvailabilityImpactContract.js";
import {
  PLAYER_IMPACT_DIMENSIONS,
  PLAYER_IMPACT_SCALE,
  PLAYER_IMPACT_AGGREGATION_METHODS,
  PLAYER_IMPACT_CONFIDENCE_STRATEGIES,
  validatePlayerAvailabilityImpactMethodologyProfile,
} from "./PlayerAvailabilityImpactMethodologyContract.js";
import {
  buildPlayerAvailabilityImpactFeatureVector,
} from "./PlayerAvailabilityImpactFeatureVector.js";

export const CALIBRATED_PLAYER_AVAILABILITY_IMPACT_MODEL_VERSION =
  "FIE-CALIBRATED-PLAYER-AVAILABILITY-IMPACT-MODEL-1.0.0";

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function unavailable(reason, limitations = []) {
  return {
    modelState: PLAYER_IMPACT_MODEL_STATES.UNMODELED,
    overallImpact: null,
    offensiveImpact: null,
    defensiveImpact: null,
    specialTeamsImpact: null,
    confidence: 0,
    methodology: null,
    featureVector: null,
    explanation: [],
    limitations: [reason, ...limitations].filter(Boolean),
  };
}

function phaseImpact(overallImpact, share) {
  return typeof share === "number" && Number.isFinite(share)
    ? round(overallImpact * Math.max(0, Math.min(1, share)))
    : null;
}

/**
 * Scores only when an explicitly APPROVED calibration profile is injected.
 *
 * The result is a normalized 0–100 relative team-degradation severity index.
 * It is intentionally NOT points, win probability, betting value, WAR, or
 * draft value.
 */
export function evaluateCalibratedPlayerAvailabilityImpact({
  availability = {},
  caliber = null,
  impactContext = {},
  methodologyProfile = null,
} = {}) {
  const validation = validatePlayerAvailabilityImpactMethodologyProfile(
    methodologyProfile,
    { requireApproved: false },
  );

  const profileState = methodologyProfile?.state || null;
  const scoringState =
    profileState === "APPROVED"
      ? PLAYER_IMPACT_MODEL_STATES.MODELED
      : profileState === "VALIDATED"
        ? PLAYER_IMPACT_MODEL_STATES.PROVISIONAL
        : null;

  if (!validation.valid || !scoringState) {
    return unavailable(
      "No validated or approved Player Availability Impact methodology profile is available.",
      validation.errors,
    );
  }

  const featureVector = buildPlayerAvailabilityImpactFeatureVector({
    availability,
    caliber,
    impactContext,
    methodologyProfile,
  });

  if (!featureVector.available) {
    return unavailable(
      "Approved methodology cannot score because required model features are missing.",
      featureVector.missingDimensions,
    );
  }

  if (
    methodologyProfile.aggregationMethod !==
    PLAYER_IMPACT_AGGREGATION_METHODS.WEIGHTED_SUM
  ) {
    return unavailable("Approved methodology uses an unsupported aggregation method.");
  }

  const weightedBase = Object.values(PLAYER_IMPACT_DIMENSIONS).reduce(
    (sum, dimension) =>
      sum +
      featureVector.features[dimension] *
        methodologyProfile.dimensions[dimension],
    0,
  );

  const overallImpact = round(
    weightedBase *
      featureVector.availabilityMultiplier *
      PLAYER_IMPACT_SCALE.MAX,
  );

  const confidenceInputs = [
    availability?.confidence,
    caliber?.confidence,
  ].filter(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1,
  );
  const confidence =
    methodologyProfile.confidenceStrategy ===
      PLAYER_IMPACT_CONFIDENCE_STRATEGIES.MIN_INPUT_CONFIDENCE &&
    confidenceInputs.length
      ? round(Math.min(...confidenceInputs), 4)
      : 0;

  return {
    modelState: scoringState,
    overallImpact,
    offensiveImpact: phaseImpact(overallImpact, impactContext?.offensiveSnapShare),
    defensiveImpact: phaseImpact(overallImpact, impactContext?.defensiveSnapShare),
    specialTeamsImpact: phaseImpact(
      overallImpact,
      impactContext?.specialTeamsSnapShare,
    ),
    confidence,
    methodology: {
      profileId: methodologyProfile.profileId,
      profileVersion: methodologyProfile.profileVersion,
      modelVersion: CALIBRATED_PLAYER_AVAILABILITY_IMPACT_MODEL_VERSION,
      benchmarkSetId: methodologyProfile.calibration?.benchmarkSetId || null,
      benchmarkSetVersion:
        methodologyProfile.calibration?.benchmarkSetVersion || null,
      aggregationMethod: methodologyProfile.aggregationMethod,
      confidenceStrategy: methodologyProfile.confidenceStrategy,
      scale: {
        min: PLAYER_IMPACT_SCALE.MIN,
        max: PLAYER_IMPACT_SCALE.MAX,
        semantics: PLAYER_IMPACT_SCALE.SEMANTICS,
      },
    },
    featureVector,
    explanation: [
      "Impact was calculated from an explicitly validated or approved methodology profile.",
      "Player caliber, role, replacement gap, team dependency, position importance, and snap share remain independent model dimensions.",
      "Availability status influences the result only through the supplied profile's availability multiplier.",
    ],
    limitations: [
      scoringState === PLAYER_IMPACT_MODEL_STATES.PROVISIONAL
        ? "PROVISIONAL scores are shadow intelligence only and are not production-approved for Team Intelligence or Pick'em decisions."
        : "The 0-100 impact index is a normalized relative team-degradation severity measure; it is not points, win probability, WAR, betting value, or draft value.",
    ],
  };
}

export default { evaluateCalibratedPlayerAvailabilityImpact };
