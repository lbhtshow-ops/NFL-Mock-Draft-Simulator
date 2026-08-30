export const NFL_TEAM_PROFILE_CONTRACT = "NFLTeamProfile";
export const NFL_TEAM_PROFILE_CONTRACT_VERSION = "FIE-NFL-TEAM-PROFILE-1.0.0";

const stringOrNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function createNFLTeamProfile({
  teamAbbreviation = null,
  rosterState = null,
  performance = null,
  teamContext = null,
  availability = null,
} = {}) {
  return Object.freeze({
    contract: NFL_TEAM_PROFILE_CONTRACT,
    contractVersion: NFL_TEAM_PROFILE_CONTRACT_VERSION,
    teamAbbreviation: stringOrNull(teamAbbreviation)?.toUpperCase() || null,
    available: Boolean(rosterState?.available || performance?.available || availability?.available),
    rosterState: rosterState ?? null,
    units: rosterState?.units ?? null,
    positionGroups: rosterState?.positionGroups ?? null,
    performance: performance ?? null,
    availability: availability ?? null,
    context: teamContext ?? null,
    coaching: Object.freeze({ state: "UNMODELED", evidence: null }),
    scheme: Object.freeze({ state: "UNMODELED", evidence: null }),
    scoring: Object.freeze({
      overallStrength: null,
      offense: null,
      defense: null,
      specialTeams: null,
      roster: null,
      availability: null,
      state: "UNMODELED",
    }),
  });
}

export function validateNFLTeamProfile(value) {
  const errors = [];
  if (!value || typeof value !== "object") return { valid: false, errors: ["TEAM_PROFILE_REQUIRED"] };
  if (value.contract !== NFL_TEAM_PROFILE_CONTRACT) errors.push("INVALID_CONTRACT");
  if (value.contractVersion !== NFL_TEAM_PROFILE_CONTRACT_VERSION) errors.push("INVALID_CONTRACT_VERSION");
  if (value.scoring?.overallStrength !== null) errors.push("OVERALL_STRENGTH_MUST_REMAIN_UNMODELED");
  if (value.coaching?.state !== "UNMODELED") errors.push("COACHING_MUST_REMAIN_UNMODELED");
  if (value.scheme?.state !== "UNMODELED") errors.push("SCHEME_MUST_REMAIN_UNMODELED");
  return { valid: errors.length === 0, errors };
}

export default {
  NFL_TEAM_PROFILE_CONTRACT,
  NFL_TEAM_PROFILE_CONTRACT_VERSION,
  createNFLTeamProfile,
  validateNFLTeamProfile,
};
