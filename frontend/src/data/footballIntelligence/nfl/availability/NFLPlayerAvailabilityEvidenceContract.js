export const NFL_PLAYER_AVAILABILITY_EVIDENCE_CONTRACT =
  "NFLPlayerAvailabilityEvidence";

export const NFL_PLAYER_AVAILABILITY_EVIDENCE_VERSION =
  "NFL-PLAYER-AVAILABILITY-EVIDENCE-1.0.0";

export const NFL_PLAYER_AVAILABILITY_SOURCE =
  "nflverse-injury-reports";

function stringOrNull(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function integerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function normalizeStatus(value) {
  const status = String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  const aliases = {
    OUT: "OUT",
    INACTIVE: "OUT",
    IR: "INJURED_RESERVE",
    INJURED_RESERVE: "INJURED_RESERVE",
    PUP: "PUP",
    DOUBTFUL: "DOUBTFUL",
    QUESTIONABLE: "QUESTIONABLE",
    LIMITED: "LIMITED",
    FULL: "FULL",
    FULL_PARTICIPATION: "FULL",
    ACTIVE: "ACTIVE",
    AVAILABLE: "ACTIVE",
    DNP: "DID_NOT_PARTICIPATE",
    DID_NOT_PARTICIPATE: "DID_NOT_PARTICIPATE",
    DID_NOT_PRACTICE: "DID_NOT_PARTICIPATE",
  };

  return aliases[status] || (status || "UNKNOWN");
}

export function createNFLPlayerAvailabilityEvidence({
  season,
  week,
  team,
  playerId = null,
  playerName = null,
  position = null,
  gameType = "REG",
  primaryInjury = null,
  secondaryInjury = null,
  reportStatus = null,
  practiceStatus = null,
  modifiedAt = null,
  source = NFL_PLAYER_AVAILABILITY_SOURCE,
  sourceUrl = null,
} = {}) {
  const normalizedSeason = integerOrNull(season);
  const normalizedWeek = integerOrNull(week);
  const normalizedTeam = stringOrNull(team)?.toUpperCase() || null;

  if (!normalizedSeason || !normalizedWeek || !normalizedTeam) {
    throw new Error(
      "NFL Player Availability Evidence requires season, week, and team."
    );
  }

  return {
    contract: NFL_PLAYER_AVAILABILITY_EVIDENCE_CONTRACT,
    version: NFL_PLAYER_AVAILABILITY_EVIDENCE_VERSION,

    season: normalizedSeason,
    week: normalizedWeek,
    gameType: String(gameType || "REG").toUpperCase(),
    team: normalizedTeam,

    player: {
      playerId: stringOrNull(playerId),
      playerName: stringOrNull(playerName),
      position: stringOrNull(position)?.toUpperCase() || null,
    },

    injury: {
      primary: stringOrNull(primaryInjury),
      secondary: stringOrNull(secondaryInjury),
    },

    status: {
      report: normalizeStatus(reportStatus),
      practice: normalizeStatus(practiceStatus),
    },

    provenance: {
      source,
      sourceUrl,
      modifiedAt: stringOrNull(modifiedAt),
    },
  };
}

export function isNFLPlayerAvailabilityEvidence(value) {
  return Boolean(
    value &&
      value.contract === NFL_PLAYER_AVAILABILITY_EVIDENCE_CONTRACT &&
      value.version === NFL_PLAYER_AVAILABILITY_EVIDENCE_VERSION &&
      Number.isInteger(value.season) &&
      Number.isInteger(value.week) &&
      typeof value.team === "string"
  );
}

export default {
  NFL_PLAYER_AVAILABILITY_EVIDENCE_CONTRACT,
  NFL_PLAYER_AVAILABILITY_EVIDENCE_VERSION,
  NFL_PLAYER_AVAILABILITY_SOURCE,
  createNFLPlayerAvailabilityEvidence,
  isNFLPlayerAvailabilityEvidence,
};
