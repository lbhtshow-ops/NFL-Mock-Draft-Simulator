import {
  PLAYER_IMPACT_DIMENSIONS,
  validatePlayerAvailabilityImpactMethodologyProfile,
} from "./PlayerAvailabilityImpactMethodologyContract.js";

export const PLAYER_AVAILABILITY_IMPACT_FEATURE_VECTOR_VERSION =
  "FIE-PLAYER-AVAILABILITY-IMPACT-FEATURE-VECTOR-1.0.0";

const clamp01 = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : null;

function resolveSnapShare(context = {}) {
  const shares = [
    context.offensiveSnapShare,
    context.defensiveSnapShare,
    context.specialTeamsSnapShare,
  ].filter((value) => typeof value === "number" && Number.isFinite(value));
  return shares.length ? clamp01(Math.max(...shares)) : null;
}

function lookup(mapping, key) {
  if (!key || key === "UNKNOWN") return null;
  const value = mapping?.[key];
  return clamp01(value);
}

/**
 * Projects governed Availability inputs into normalized model features.
 *
 * No football-value constants live here. Enum-to-number translations and
 * weights come exclusively from the injected methodology profile.
 */
export function buildPlayerAvailabilityImpactFeatureVector({
  availability = {},
  caliber = null,
  impactContext = {},
  methodologyProfile = null,
} = {}) {
  const methodologyValidation = validatePlayerAvailabilityImpactMethodologyProfile(
    methodologyProfile,
    { requireApproved: false },
  );

  const scoringEligible =
    methodologyProfile?.state === "VALIDATED" ||
    methodologyProfile?.state === "APPROVED";

  const features = {
    [PLAYER_IMPACT_DIMENSIONS.CALIBER]:
      caliber?.available && typeof caliber?.caliberGrade === "number"
        ? clamp01(caliber.caliberGrade / 100)
        : null,
    [PLAYER_IMPACT_DIMENSIONS.ROLE]:
      lookup(methodologyProfile?.mappings?.roleScores, impactContext?.role),
    [PLAYER_IMPACT_DIMENSIONS.REPLACEMENT_GAP]:
      lookup(
        methodologyProfile?.mappings?.replacementGapScores,
        impactContext?.replacementQuality,
      ),
    [PLAYER_IMPACT_DIMENSIONS.TEAM_DEPENDENCY]:
      lookup(
        methodologyProfile?.mappings?.teamDependencyScores,
        impactContext?.teamDependency,
      ),
    [PLAYER_IMPACT_DIMENSIONS.POSITION_IMPORTANCE]:
      lookup(
        methodologyProfile?.mappings?.positionImportanceScores,
        impactContext?.positionImportance,
      ),
    [PLAYER_IMPACT_DIMENSIONS.SNAP_SHARE]: resolveSnapShare(impactContext),
  };

  const availabilityMultiplier = lookup(
    methodologyProfile?.mappings?.availabilityMultipliers,
    availability?.status,
  );

  const missingDimensions = Object.entries(features)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  if (availabilityMultiplier === null) {
    missingDimensions.push("AVAILABILITY_MULTIPLIER");
  }

  return {
    contract: "PlayerAvailabilityImpactFeatureVector",
    contractVersion: PLAYER_AVAILABILITY_IMPACT_FEATURE_VECTOR_VERSION,
    available:
      methodologyValidation.valid &&
      scoringEligible &&
      missingDimensions.length === 0,
    features,
    availabilityMultiplier,
    missingDimensions: [...new Set(missingDimensions)],
    methodology: methodologyProfile
      ? {
          profileId: methodologyProfile.profileId,
          profileVersion: methodologyProfile.profileVersion,
          state: methodologyProfile.state,
        }
      : null,
    validation: methodologyValidation,
  };
}

export default { buildPlayerAvailabilityImpactFeatureVector };
