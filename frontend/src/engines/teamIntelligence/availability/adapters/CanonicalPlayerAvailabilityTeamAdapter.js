import {
  createNFLTeamAvailabilityEvidence,
} from "../NFLTeamAvailabilityEvidenceContract.js";

const CANONICAL_PLAYER_CONTRACT = "CanonicalPlayerAvailabilityImpactResult";
const PRIMARY_ROLES = new Set(["PRIMARY", "STARTER"]);

function canonicalPlayer(value) {
  return Boolean(
    value && typeof value === "object" &&
    value.contract === CANONICAL_PLAYER_CONTRACT &&
    value.playerId && value.availability,
  );
}

function projectPlayer(result) {
  return Object.freeze({
    playerId: result.playerId,
    displayName: result.displayName || null,
    position: result.position || null,
    availability: result.availability,
    caliber: result.caliber || null,
    impactContext: result.impactContext || null,
    impact: result.impact || null,
    decisionInfluenceEvidence: result.decisionInfluenceEvidence || null,
    readiness: result.readiness || null,
    missingEvidence: Array.isArray(result.missingEvidence) ? result.missingEvidence : [],
    provenance: result.provenance || null,
    versions: result.versions || null,
  });
}

function resolveQuarterbackState(players) {
  const candidates = players.filter(
    (player) => player.position === "QB" &&
      PRIMARY_ROLES.has(player?.impactContext?.role),
  );
  if (candidates.length !== 1) return null;
  const qb = candidates[0];
  return Object.freeze({
    playerId: qb.playerId,
    displayName: qb.displayName,
    status: qb.availability?.status || "UNKNOWN",
    availabilityConfidence: qb.availability?.confidence ?? 0,
    caliberGrade: qb.caliber?.caliberGrade ?? null,
    caliberConfidence: qb.caliber?.confidence ?? null,
    impactModelState: qb.impact?.modelState || "UNMODELED",
    overallImpact: qb.impact?.overallImpact ?? null,
    impactConfidence: qb.impact?.confidence ?? 0,
    role: qb.impactContext?.role || null,
  });
}

export function adaptCanonicalPlayerAvailabilityResultsToTeamEvidence({
  teamAbbreviation = null,
  playerResults = [],
  freshness = null,
  provenance = null,
  sourceRefs = [],
} = {}) {
  const players = (Array.isArray(playerResults) ? playerResults : [])
    .filter(canonicalPlayer)
    .map(projectPlayer);

  return createNFLTeamAvailabilityEvidence({
    teamAbbreviation,
    players,
    quarterbackState: resolveQuarterbackState(players),
    freshness,
    provenance,
    sourceRefs,
  });
}

export default {
  adaptCanonicalPlayerAvailabilityResultsToTeamEvidence,
};
