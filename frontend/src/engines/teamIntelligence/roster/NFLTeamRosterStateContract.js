export const NFL_TEAM_ROSTER_STATE_CONTRACT = "NFLTeamRosterState";
export const NFL_TEAM_ROSTER_STATE_CONTRACT_VERSION =
  "FIE-NFL-TEAM-ROSTER-STATE-1.0.0";

export const NFL_TEAM_POSITION_GROUPS = Object.freeze([
  "QB", "RB", "FB", "WR", "TE", "OT", "IOL",
  "EDGE", "DL", "LB", "CB", "S", "K", "P", "LS",
]);

export const NFL_TEAM_UNIT_POSITIONS = Object.freeze({
  offense: Object.freeze(["QB", "RB", "FB", "WR", "TE", "OT", "IOL"]),
  defense: Object.freeze(["EDGE", "DL", "LB", "CB", "S"]),
  specialTeams: Object.freeze(["K", "P", "LS"]),
});

const array = (value) => (Array.isArray(value) ? value : []);
const numberOrNull = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const stringOrNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function normalizePosition(value) {
  const position = stringOrNull(value)?.toUpperCase() || "UNKNOWN";
  if (position === "DE") return "EDGE";
  if (position === "DT") return "DL";
  if (["C", "G", "OG"].includes(position)) return "IOL";
  if (["T", "LT", "RT"].includes(position)) return "OT";
  return position;
}

function rawPlayerProjection(player = {}) {
  return {
    playerId: player.playerId || player.id || null,
    displayName:
      player?.identity?.playerName || player.displayName || player.name || null,
    position: normalizePosition(player?.identity?.position || player.position),
    starter:
      typeof player?.roster?.starter === "boolean"
        ? player.roster.starter
        : typeof player.starter === "boolean"
          ? player.starter
          : null,
    depthChartRole: player?.roster?.depthChartRole || player.depthChartRole || null,
    depthChartRank: numberOrNull(player?.roster?.depthChartRank ?? player.depthChartRank),
  };
}

function availabilityById(availabilityEvidence) {
  return new Map(
    array(availabilityEvidence?.players)
      .filter((player) => player?.playerId)
      .map((player) => [player.playerId, player]),
  );
}

function synthesizePositionGroup(position, rawPlayers, availabilityMap) {
  const rosterPlayers = rawPlayers.filter((player) => player.position === position);
  const tracked = rosterPlayers
    .map((player) => ({ raw: player, availability: availabilityMap.get(player.playerId) || null }))
    .filter((entry) => entry.availability);

  const statusCounts = tracked.reduce((counts, entry) => {
    const status = entry.availability?.availability?.status || "UNKNOWN";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  const knownStarterCount = rosterPlayers.filter((player) => player.starter === true).length;
  const knownStarterStatusCount = rosterPlayers.filter((player) => typeof player.starter === "boolean").length;
  const caliberObservedCount = tracked.filter(
    (entry) => typeof entry.availability?.caliber?.caliberGrade === "number",
  ).length;
  const modeledImpactCount = tracked.filter(
    (entry) => entry.availability?.impact?.modelState === "MODELED" &&
      typeof entry.availability?.impact?.overallImpact === "number",
  ).length;

  return Object.freeze({
    position,
    rosterPlayerCount: rosterPlayers.length,
    trackedAvailabilityPlayerCount: tracked.length,
    knownStarterCount,
    starterStateObservedCount: knownStarterStatusCount,
    caliberObservedCount,
    modeledImpactCount,
    statusCounts: Object.freeze({ ...statusCounts }),
    completeness:
      rosterPlayers.length > 0 ? tracked.length / rosterPlayers.length : null,
    strengthScore: null,
    availabilityScore: null,
    depthScore: null,
    players: Object.freeze(
      rosterPlayers.map((player) => {
        const observed = availabilityMap.get(player.playerId) || null;
        return Object.freeze({
          ...player,
          availabilityStatus: observed?.availability?.status || null,
          caliberGrade: numberOrNull(observed?.caliber?.caliberGrade),
          impactModelState: observed?.impact?.modelState || "UNMODELED",
          overallImpact: numberOrNull(observed?.impact?.overallImpact),
        });
      }),
    ),
  });
}

function synthesizeUnitState(unit, positions, positionGroups) {
  const groups = positions.map((position) => positionGroups[position]);
  const rosterPlayerCount = groups.reduce((sum, group) => sum + group.rosterPlayerCount, 0);
  const trackedAvailabilityPlayerCount = groups.reduce(
    (sum, group) => sum + group.trackedAvailabilityPlayerCount,
    0,
  );
  return Object.freeze({
    unit,
    positions: Object.freeze([...positions]),
    rosterPlayerCount,
    trackedAvailabilityPlayerCount,
    knownStarterCount: groups.reduce((sum, group) => sum + group.knownStarterCount, 0),
    caliberObservedCount: groups.reduce((sum, group) => sum + group.caliberObservedCount, 0),
    modeledImpactCount: groups.reduce((sum, group) => sum + group.modeledImpactCount, 0),
    completeness: rosterPlayerCount > 0 ? trackedAvailabilityPlayerCount / rosterPlayerCount : null,
    strengthScore: null,
    availabilityScore: null,
    performanceScore: null,
  });
}

export function createNFLTeamRosterState({
  teamAbbreviation = null,
  roster = [],
  availabilityEvidence = null,
  source = null,
} = {}) {
  const rawPlayers = array(roster).map(rawPlayerProjection);
  const observedById = availabilityById(availabilityEvidence);
  const positionGroups = Object.fromEntries(
    NFL_TEAM_POSITION_GROUPS.map((position) => [
      position,
      synthesizePositionGroup(position, rawPlayers, observedById),
    ]),
  );
  const units = Object.fromEntries(
    Object.entries(NFL_TEAM_UNIT_POSITIONS).map(([unit, positions]) => [
      unit,
      synthesizeUnitState(unit, positions, positionGroups),
    ]),
  );
  const trackedPlayerCount = rawPlayers.filter((player) => observedById.has(player.playerId)).length;

  return Object.freeze({
    contract: NFL_TEAM_ROSTER_STATE_CONTRACT,
    contractVersion: NFL_TEAM_ROSTER_STATE_CONTRACT_VERSION,
    teamAbbreviation: stringOrNull(teamAbbreviation)?.toUpperCase() || null,
    available: rawPlayers.length > 0,
    rosterPlayerCount: rawPlayers.length,
    trackedAvailabilityPlayerCount: trackedPlayerCount,
    completeness: rawPlayers.length > 0 ? trackedPlayerCount / rawPlayers.length : null,
    positionGroups: Object.freeze(positionGroups),
    units: Object.freeze(units),
    source: source ?? null,
    scoring: Object.freeze({
      teamStrength: null,
      rosterStrength: null,
      availability: null,
      state: "UNMODELED",
    }),
  });
}

export function validateNFLTeamRosterState(value) {
  const errors = [];
  if (!value || typeof value !== "object") return { valid: false, errors: ["ROSTER_STATE_REQUIRED"] };
  if (value.contract !== NFL_TEAM_ROSTER_STATE_CONTRACT) errors.push("INVALID_CONTRACT");
  if (value.contractVersion !== NFL_TEAM_ROSTER_STATE_CONTRACT_VERSION) errors.push("INVALID_CONTRACT_VERSION");
  if (!value.positionGroups || typeof value.positionGroups !== "object") errors.push("POSITION_GROUPS_REQUIRED");
  if (!value.units || typeof value.units !== "object") errors.push("UNITS_REQUIRED");
  if (value.scoring?.teamStrength !== null) errors.push("TEAM_STRENGTH_MUST_REMAIN_UNMODELED");
  return { valid: errors.length === 0, errors };
}

export default {
  NFL_TEAM_ROSTER_STATE_CONTRACT,
  NFL_TEAM_ROSTER_STATE_CONTRACT_VERSION,
  NFL_TEAM_POSITION_GROUPS,
  NFL_TEAM_UNIT_POSITIONS,
  createNFLTeamRosterState,
  validateNFLTeamRosterState,
};
