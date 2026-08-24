export const NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT =
  "NFLTeamAvailabilityEvidence";
export const NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT_VERSION =
  "FIE-NFL-TEAM-AVAILABILITY-EVIDENCE-1.0.0";

const array = (value) => (Array.isArray(value) ? value : []);
const stringOrNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const numberOrNull = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function createNFLTeamAvailabilityEvidence({
  teamAbbreviation = null,
  players = [],
  quarterbackState = null,
  freshness = null,
  provenance = null,
  sourceRefs = [],
} = {}) {
  const normalizedPlayers = array(players);
  const statusCounts = normalizedPlayers.reduce((counts, player) => {
    const status = player?.availability?.status || "UNKNOWN";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const modeledImpactCount = normalizedPlayers.filter(
    (player) => player?.impact?.modelState === "MODELED" &&
      typeof player?.impact?.overallImpact === "number",
  ).length;

  return Object.freeze({
    contract: NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT,
    contractVersion: NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT_VERSION,
    teamAbbreviation: stringOrNull(teamAbbreviation)?.toUpperCase() || null,
    available: normalizedPlayers.length > 0,
    playerCount: normalizedPlayers.length,
    players: normalizedPlayers,
    quarterbackState: quarterbackState ?? null,
    statusCounts: Object.freeze({ ...statusCounts }),
    modeledImpactCount,
    unmodeledImpactCount: normalizedPlayers.length - modeledImpactCount,
    freshness: freshness ?? null,
    provenance: provenance ?? null,
    sourceRefs: array(sourceRefs),
  });
}

export function validateNFLTeamAvailabilityEvidence(value) {
  const errors = [];
  if (!value || typeof value !== "object") return { valid: false, errors: ["EVIDENCE_REQUIRED"] };
  if (value.contract !== NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT) errors.push("INVALID_CONTRACT");
  if (value.contractVersion !== NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT_VERSION) errors.push("INVALID_CONTRACT_VERSION");
  if (value.teamAbbreviation !== null && typeof value.teamAbbreviation !== "string") errors.push("INVALID_TEAM_ABBREVIATION");
  if (!Array.isArray(value.players)) errors.push("PLAYERS_REQUIRED");
  if (typeof value.playerCount !== "number") errors.push("PLAYER_COUNT_REQUIRED");
  if (value.playerCount !== array(value.players).length) errors.push("PLAYER_COUNT_MISMATCH");
  return { valid: errors.length === 0, errors };
}

export default {
  NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT,
  NFL_TEAM_AVAILABILITY_EVIDENCE_CONTRACT_VERSION,
  createNFLTeamAvailabilityEvidence,
  validateNFLTeamAvailabilityEvidence,
};
