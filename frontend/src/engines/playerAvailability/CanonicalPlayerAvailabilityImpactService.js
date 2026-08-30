import {
  evaluatePlayerAvailabilityImpact,
} from "./CanonicalPlayerAvailabilityImpactEngine.js";
import {
  adaptPlayerAvailabilityRepositorySnapshot,
  validatePlayerAvailabilityEvidenceRepository,
} from "./repository/index.js";

export const CANONICAL_PLAYER_AVAILABILITY_IMPACT_SERVICE_VERSION =
  "FIE-PLAYER-AVAILABILITY-IMPACT-SERVICE-1.2.0";

/**
 * Stable synchronous service boundary for callers that already possess
 * governed availability evidence.
 */
export function getCanonicalPlayerAvailabilityImpact(input = {}) {
  return evaluatePlayerAvailabilityImpact(input);
}

/**
 * Read-only repository-backed service boundary.
 *
 * The repository owns persistence. This service owns orchestration only:
 * read an explicit snapshot -> adapt to canonical evidence -> evaluate FIE.
 */
export async function getCanonicalPlayerAvailabilityImpactFromRepository({
  repository,
  player = {},
  snapshotRequest = {},
  ...evaluationInput
} = {}) {
  const validation = validatePlayerAvailabilityEvidenceRepository(repository);
  if (!validation.valid) {
    return Object.freeze({
      available: false,
      error: "INVALID_AVAILABILITY_REPOSITORY",
      errors: validation.errors,
      serviceVersion: CANONICAL_PLAYER_AVAILABILITY_IMPACT_SERVICE_VERSION,
      result: null,
      snapshot: null,
    });
  }

  const playerId =
    snapshotRequest?.playerId ||
    player?.canonicalPlayerId ||
    player?.id ||
    player?.playerId ||
    null;

  const rawSnapshot = await repository.getPlayerAvailabilitySnapshot({
    ...snapshotRequest,
    playerId,
  });
  const adapted = adaptPlayerAvailabilityRepositorySnapshot(rawSnapshot || {});

  if (!adapted.available) {
    return Object.freeze({
      available: false,
      error: "AVAILABILITY_SNAPSHOT_UNAVAILABLE",
      errors: adapted.errors,
      serviceVersion: CANONICAL_PLAYER_AVAILABILITY_IMPACT_SERVICE_VERSION,
      result: null,
      snapshot: adapted.snapshot,
    });
  }

  const result = evaluatePlayerAvailabilityImpact({
    ...evaluationInput,
    player,
    availabilityEvidence: adapted.evidence,
  });

  return Object.freeze({
    available: true,
    error: null,
    errors: [],
    serviceVersion: CANONICAL_PLAYER_AVAILABILITY_IMPACT_SERVICE_VERSION,
    result,
    snapshot: adapted.snapshot,
  });
}

export default {
  getCanonicalPlayerAvailabilityImpact,
  getCanonicalPlayerAvailabilityImpactFromRepository,
};
