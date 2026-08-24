import {
  PLAYER_CALIBER_SUBJECT_KINDS,
} from "../playerEvaluation/caliber/CanonicalPlayerCaliberContract.js";
import {
  resolveCanonicalPlayerCaliber,
} from "../playerEvaluation/caliber/CanonicalPlayerCaliberService.js";
import {
  createPlayerAvailabilityEvidence,
  validatePlayerAvailabilityEvidence,
  PLAYER_AVAILABILITY_STATUSES,
  AVAILABILITY_FRESHNESS_STATES,
} from "./contracts/PlayerAvailabilityEvidenceContract.js";
import {
  createPlayerAvailabilityImpactContext,
} from "./contracts/PlayerAvailabilityImpactContextContract.js";
import {
  createCanonicalPlayerAvailabilityImpactResult,
  PLAYER_AVAILABILITY_READINESS,
} from "./contracts/CanonicalPlayerAvailabilityImpactContract.js";
import {
  evaluateCalibratedPlayerAvailabilityImpact,
} from "./methodology/CalibratedPlayerAvailabilityImpactModel.js";

export const PLAYER_AVAILABILITY_IMPACT_ENGINE_VERSION =
  "FIE-PLAYER-AVAILABILITY-IMPACT-ENGINE-1.1.0";

function buildMissingEvidence({ availability, caliber, context }) {
  const missing = [];
  if (availability.status === PLAYER_AVAILABILITY_STATUSES.UNKNOWN) {
    missing.push("availability.status");
  }
  if (availability.freshness === AVAILABILITY_FRESHNESS_STATES.UNKNOWN) {
    missing.push("availability.freshness");
  }
  if (!caliber?.available) missing.push("player.caliber");
  if (!context || context.role === "UNKNOWN") missing.push("impactContext.role");
  if (!context || context.replacementQuality === "UNKNOWN") {
    missing.push("impactContext.replacementQuality");
  }
  if (!context || context.teamDependency === "UNKNOWN") {
    missing.push("impactContext.teamDependency");
  }
  if (!context || context.positionImportance === "UNKNOWN") {
    missing.push("impactContext.positionImportance");
  }
  return [...new Set(missing)];
}

function resolveReadiness(availability, missingEvidence) {
  if (availability.status === PLAYER_AVAILABILITY_STATUSES.UNKNOWN) {
    return PLAYER_AVAILABILITY_READINESS.UNAVAILABLE;
  }
  return missingEvidence.length
    ? PLAYER_AVAILABILITY_READINESS.PARTIAL
    : PLAYER_AVAILABILITY_READINESS.AVAILABLE;
}

/**
 * Canonical Player Availability & Impact Engine — architecture sprint.
 *
 * Owns interpretation/orchestration only. It does NOT:
 * - acquire injury data,
 * - query Supabase directly,
 * - persist evidence,
 * - calculate player caliber,
 * - calculate Team Intelligence,
 * - invent an impact score before an approved impact methodology exists.
 */
export function evaluatePlayerAvailabilityImpact({
  player = {},
  subjectKind = PLAYER_CALIBER_SUBJECT_KINDS.NFL_PLAYER,
  availabilityEvidence = null,
  canonicalCaliber = null,
  nflEvaluation = null,
  prospectModelResult = null,
  impactContext = null,
  impactMethodologyProfile = null,
} = {}) {
  const playerId = player?.canonicalPlayerId || player?.id || player?.playerId || null;
  const availability = createPlayerAvailabilityEvidence({
    ...(availabilityEvidence || {}),
    playerId: availabilityEvidence?.playerId || playerId,
  });
  const availabilityValidation = validatePlayerAvailabilityEvidence(availability);

  const caliber = canonicalCaliber || resolveCanonicalPlayerCaliber({
    subjectKind,
    player,
    nflEvaluation,
    prospectModelResult,
  });
  const context = createPlayerAvailabilityImpactContext(impactContext || {});
  const missingEvidence = buildMissingEvidence({ availability, caliber, context });

  if (!availabilityValidation.valid) {
    missingEvidence.push(...availabilityValidation.errors.map((code) => `availability.${code}`));
  }

  const readiness = resolveReadiness(availability, missingEvidence);
  const impact = evaluateCalibratedPlayerAvailabilityImpact({
    availability,
    caliber,
    impactContext: context,
    methodologyProfile: impactMethodologyProfile,
  });

  return createCanonicalPlayerAvailabilityImpactResult({
    playerId,
    displayName: player?.displayName || player?.name || player?.player || null,
    position: player?.identity?.position || player?.position || null,
    availability,
    caliber,
    impactContext: context,
    impact,
    readiness,
    missingEvidence,
    provenance: {
      availability: availability.provenance,
      availabilityRepository: availability.repository,
      caliber: caliber?.provenance || null,
      impactContext: context.provenance,
    },
    versions: {
      engine: PLAYER_AVAILABILITY_IMPACT_ENGINE_VERSION,
      impactModel:
        impact?.methodology?.modelVersion ||
        "UNMODELED_NO_APPROVED_CALIBRATION_PROFILE",
    },
  });
}

export default { evaluatePlayerAvailabilityImpact };
