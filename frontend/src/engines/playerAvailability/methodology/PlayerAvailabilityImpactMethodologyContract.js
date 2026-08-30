export const PLAYER_AVAILABILITY_IMPACT_METHODOLOGY_CONTRACT_VERSION =
  "FIE-PLAYER-AVAILABILITY-IMPACT-METHODOLOGY-1.0.0";

export const PLAYER_IMPACT_METHODOLOGY_STATES = Object.freeze({
  DRAFT: "DRAFT",
  VALIDATED: "VALIDATED",
  APPROVED: "APPROVED",
  RETIRED: "RETIRED",
});

export const PLAYER_IMPACT_DIMENSIONS = Object.freeze({
  CALIBER: "CALIBER",
  ROLE: "ROLE",
  REPLACEMENT_GAP: "REPLACEMENT_GAP",
  TEAM_DEPENDENCY: "TEAM_DEPENDENCY",
  POSITION_IMPORTANCE: "POSITION_IMPORTANCE",
  SNAP_SHARE: "SNAP_SHARE",
});

export const PLAYER_IMPACT_AGGREGATION_METHODS = Object.freeze({
  WEIGHTED_SUM: "WEIGHTED_SUM",
});

export const PLAYER_IMPACT_CONFIDENCE_STRATEGIES = Object.freeze({
  MIN_INPUT_CONFIDENCE: "MIN_INPUT_CONFIDENCE",
});

export const PLAYER_IMPACT_SCALE = Object.freeze({
  MIN: 0,
  MAX: 100,
  SEMANTICS:
    "Normalized relative team-degradation severity if the player's availability condition applies. It is not points, win probability, WAR, betting value, or draft value.",
});

const normalizeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const normalizeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const normalizeMap = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
const normalizeArray = (value) => (Array.isArray(value) ? [...value] : []);

export function createPlayerAvailabilityImpactMethodologyProfile({
  profileId = null,
  profileVersion = null,
  state = PLAYER_IMPACT_METHODOLOGY_STATES.DRAFT,
  aggregationMethod = PLAYER_IMPACT_AGGREGATION_METHODS.WEIGHTED_SUM,
  confidenceStrategy = PLAYER_IMPACT_CONFIDENCE_STRATEGIES.MIN_INPUT_CONFIDENCE,
  dimensions = {},
  roleScores = {},
  replacementGapScores = {},
  teamDependencyScores = {},
  positionImportanceScores = {},
  availabilityMultipliers = {},
  calibration = {},
  provenance = {},
} = {}) {
  return {
    contract: "PlayerAvailabilityImpactMethodologyProfile",
    contractVersion: PLAYER_AVAILABILITY_IMPACT_METHODOLOGY_CONTRACT_VERSION,
    profileId: normalizeString(profileId),
    profileVersion: normalizeString(profileVersion),
    state: Object.values(PLAYER_IMPACT_METHODOLOGY_STATES).includes(state)
      ? state
      : PLAYER_IMPACT_METHODOLOGY_STATES.DRAFT,
    aggregationMethod: Object.values(PLAYER_IMPACT_AGGREGATION_METHODS).includes(
      aggregationMethod,
    )
      ? aggregationMethod
      : null,
    confidenceStrategy: Object.values(PLAYER_IMPACT_CONFIDENCE_STRATEGIES).includes(
      confidenceStrategy,
    )
      ? confidenceStrategy
      : null,
    scale: {
      min: PLAYER_IMPACT_SCALE.MIN,
      max: PLAYER_IMPACT_SCALE.MAX,
      semantics: PLAYER_IMPACT_SCALE.SEMANTICS,
    },
    dimensions: normalizeMap(dimensions),
    mappings: {
      roleScores: normalizeMap(roleScores),
      replacementGapScores: normalizeMap(replacementGapScores),
      teamDependencyScores: normalizeMap(teamDependencyScores),
      positionImportanceScores: normalizeMap(positionImportanceScores),
      availabilityMultipliers: normalizeMap(availabilityMultipliers),
    },
    calibration: {
      benchmarkSetId: normalizeString(calibration?.benchmarkSetId),
      benchmarkSetVersion: normalizeString(calibration?.benchmarkSetVersion),
      validationSampleSize: normalizeNumber(calibration?.validationSampleSize),
      validationMetrics: normalizeMap(calibration?.validationMetrics),
      limitations: normalizeArray(calibration?.limitations),
    },
    provenance: {
      contributors: normalizeArray(provenance?.contributors),
      evidenceRefs: normalizeArray(provenance?.evidenceRefs),
    },
  };
}

function inUnitInterval(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validatePlayerAvailabilityImpactMethodologyProfile(profile, {
  requireApproved = false,
} = {}) {
  const errors = [];
  if (!profile || typeof profile !== "object") {
    return { valid: false, errors: ["PROFILE_REQUIRED"] };
  }
  if (profile.contract !== "PlayerAvailabilityImpactMethodologyProfile") {
    errors.push("INVALID_CONTRACT");
  }
  if (profile.contractVersion !== PLAYER_AVAILABILITY_IMPACT_METHODOLOGY_CONTRACT_VERSION) {
    errors.push("INVALID_CONTRACT_VERSION");
  }
  if (!profile.profileId) errors.push("PROFILE_ID_REQUIRED");
  if (!profile.profileVersion) errors.push("PROFILE_VERSION_REQUIRED");
  if (!Object.values(PLAYER_IMPACT_METHODOLOGY_STATES).includes(profile.state)) {
    errors.push("INVALID_STATE");
  }
  if (requireApproved && profile.state !== PLAYER_IMPACT_METHODOLOGY_STATES.APPROVED) {
    errors.push("PROFILE_NOT_APPROVED");
  }
  if (!Object.values(PLAYER_IMPACT_AGGREGATION_METHODS).includes(profile.aggregationMethod)) {
    errors.push("INVALID_AGGREGATION_METHOD");
  }
  if (!Object.values(PLAYER_IMPACT_CONFIDENCE_STRATEGIES).includes(profile.confidenceStrategy)) {
    errors.push("INVALID_CONFIDENCE_STRATEGY");
  }

  const dimensionKeys = Object.values(PLAYER_IMPACT_DIMENSIONS);
  const suppliedWeights = dimensionKeys
    .map((key) => profile.dimensions?.[key])
    .filter((value) => value !== undefined);
  if (suppliedWeights.length !== dimensionKeys.length) {
    errors.push("ALL_DIMENSION_WEIGHTS_REQUIRED");
  }
  if (suppliedWeights.some((value) => !inUnitInterval(value))) {
    errors.push("INVALID_DIMENSION_WEIGHT");
  }
  const weightSum = suppliedWeights.reduce((sum, value) => sum + value, 0);
  if (suppliedWeights.length === dimensionKeys.length && Math.abs(weightSum - 1) > 0.0001) {
    errors.push("DIMENSION_WEIGHTS_MUST_SUM_TO_ONE");
  }

  for (const [mapName, mapping] of Object.entries(profile.mappings || {})) {
    if (!mapping || typeof mapping !== "object") {
      errors.push(`INVALID_${mapName.toUpperCase()}`);
      continue;
    }
    for (const [key, value] of Object.entries(mapping)) {
      if (!inUnitInterval(value)) {
        errors.push(`INVALID_${mapName.toUpperCase()}_${key}`);
      }
    }
  }

  if (profile.state === PLAYER_IMPACT_METHODOLOGY_STATES.APPROVED) {
    if (!profile.calibration?.benchmarkSetId) errors.push("APPROVED_PROFILE_REQUIRES_BENCHMARK_SET");
    if (!profile.calibration?.benchmarkSetVersion) {
      errors.push("APPROVED_PROFILE_REQUIRES_BENCHMARK_VERSION");
    }
    if (
      typeof profile.calibration?.validationSampleSize !== "number" ||
      !Number.isFinite(profile.calibration.validationSampleSize) ||
      profile.calibration.validationSampleSize <= 0
    ) {
      errors.push("APPROVED_PROFILE_REQUIRES_VALIDATION_SAMPLE");
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export default {
  createPlayerAvailabilityImpactMethodologyProfile,
  validatePlayerAvailabilityImpactMethodologyProfile,
};
