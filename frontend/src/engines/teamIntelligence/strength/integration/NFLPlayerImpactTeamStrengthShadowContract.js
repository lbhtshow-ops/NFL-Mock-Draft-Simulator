export const NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_CONTRACT =
  "NFLPlayerImpactTeamStrengthShadowIntegration";

export const NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_VERSION =
  "FIE-NFL-PLAYER-IMPACT-TEAM-STRENGTH-SHADOW-1.0.0";

export const NFL_TEAM_STRENGTH_SHADOW_STATES = Object.freeze({
  READY: "READY",
  PARTIAL: "PARTIAL",
  UNAVAILABLE: "UNAVAILABLE",
});

export const NFL_TEAM_STRENGTH_SHADOW_BLOCKERS = Object.freeze({
  CALIBRATION_REQUIRED: "CALIBRATION_REQUIRED",
  BASELINE_STRENGTH_UNAVAILABLE: "BASELINE_STRENGTH_UNAVAILABLE",
  NO_MODELED_PLAYER_IMPACT: "NO_MODELED_PLAYER_IMPACT",
});

const array = (value) => (Array.isArray(value) ? value : []);
const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);

export function validateNFLPlayerImpactTeamStrengthShadowResult(value) {
  const errors = [];

  if (!value || typeof value !== "object") {
    return { valid: false, errors: ["RESULT_REQUIRED"] };
  }

  if (value.contract !== NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_CONTRACT) {
    errors.push("INVALID_CONTRACT");
  }

  if (value.version !== NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_VERSION) {
    errors.push("INVALID_VERSION");
  }

  if (finite(value.shadowAdjustment?.numericDelta)) {
    errors.push("NUMERIC_DELTA_MUST_REMAIN_NULL");
  }

  if (finite(value.shadowAdjustment?.adjustedTeamStrength)) {
    errors.push("ADJUSTED_TEAM_STRENGTH_MUST_REMAIN_NULL");
  }

  if (value.shadowAdjustment?.authorized !== false) {
    errors.push("SHADOW_ADJUSTMENT_MUST_REMAIN_UNAUTHORIZED");
  }

  if (value.outputs?.winProbability !== null) {
    errors.push("WIN_PROBABILITY_MUST_REMAIN_NULL");
  }

  if (value.outputs?.pointSpread !== null) {
    errors.push("POINT_SPREAD_MUST_REMAIN_NULL");
  }

  if (value.outputs?.pickRecommendation !== null) {
    errors.push("PICK_RECOMMENDATION_MUST_REMAIN_NULL");
  }

  if (!array(value.blockers).includes(
    NFL_TEAM_STRENGTH_SHADOW_BLOCKERS.CALIBRATION_REQUIRED
  )) {
    errors.push("CALIBRATION_BLOCKER_REQUIRED");
  }

  return { valid: errors.length === 0, errors };
}

export default {
  NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_CONTRACT,
  NFL_PLAYER_IMPACT_TEAM_STRENGTH_SHADOW_VERSION,
  NFL_TEAM_STRENGTH_SHADOW_STATES,
  NFL_TEAM_STRENGTH_SHADOW_BLOCKERS,
  validateNFLPlayerImpactTeamStrengthShadowResult,
};
