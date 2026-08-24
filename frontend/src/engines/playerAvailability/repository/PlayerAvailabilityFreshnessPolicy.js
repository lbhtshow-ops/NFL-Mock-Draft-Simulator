import {
  AVAILABILITY_FRESHNESS_STATES,
} from "../contracts/PlayerAvailabilityEvidenceContract.js";

export const PLAYER_AVAILABILITY_FRESHNESS_POLICY_VERSION =
  "FIE-PLAYER-AVAILABILITY-FRESHNESS-POLICY-1.0.0";

/**
 * This policy does not invent TTL thresholds. It reconciles freshness states
 * already determined by the acquisition/repository boundary.
 */
export function resolvePlayerAvailabilityFreshness({
  evidenceFreshness = AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
  repositoryFreshness = AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
  acquisitionFreshness = AVAILABILITY_FRESHNESS_STATES.UNKNOWN,
} = {}) {
  const states = [evidenceFreshness, repositoryFreshness, acquisitionFreshness];
  if (states.includes(AVAILABILITY_FRESHNESS_STATES.STALE)) {
    return AVAILABILITY_FRESHNESS_STATES.STALE;
  }
  if (states.every((value) => value === AVAILABILITY_FRESHNESS_STATES.FRESH)) {
    return AVAILABILITY_FRESHNESS_STATES.FRESH;
  }
  return AVAILABILITY_FRESHNESS_STATES.UNKNOWN;
}

export default { resolvePlayerAvailabilityFreshness };
