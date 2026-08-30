export const NFL_AVAILABILITY_SIGNAL_CONTRACT = "NFLAvailabilitySignal";
export const NFL_AVAILABILITY_SIGNAL_VERSION = "NFL-AVAILABILITY-SIGNAL-1.0.0";

export const NFL_AVAILABILITY_SIGNAL_CLASSES = Object.freeze({
  OFFICIAL_INJURY_REPORT: "OFFICIAL_INJURY_REPORT",
  ROSTER_STATUS: "ROSTER_STATUS",
  TRANSACTION: "TRANSACTION",
  DEPTH_CHART: "DEPTH_CHART",
  GAMEDAY_INACTIVE: "GAMEDAY_INACTIVE",
});

export const NFL_AVAILABILITY_AUTHORITY = Object.freeze({
  OFFICIAL: 500,
  GAMEDAY: 450,
  ROSTER: 350,
  TRANSACTION: 325,
  ROLE: 250,
  SUPPLEMENTAL: 100,
});

const clean = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const int = (value) => Number.isInteger(Number(value)) ? Number(value) : null;

export function createNFLAvailabilitySignal({
  signalClass,
  authority,
  season,
  week,
  gameType = "REG",
  team,
  playerId = null,
  playerName = null,
  position = null,
  observedAt,
  effectiveAt = null,
  source,
  sourceUrl = null,
  status = null,
  practiceStatus = null,
  injury = null,
  rosterStatus = null,
  transactionType = null,
  statusBefore = null,
  statusAfter = null,
  depthPosition = null,
  depthRank = null,
  starter = null,
  estimatedReturnDate = null,
  providerPlayerId = null,
  providerTeamId = null,
  metadata = {},
} = {}) {
  const normalizedSeason = int(season);
  const normalizedWeek = int(week);
  const normalizedTeam = clean(team)?.toUpperCase() || null;
  const normalizedClass = clean(signalClass)?.toUpperCase() || null;
  const normalizedObservedAt = clean(observedAt);
  if (!normalizedSeason || !normalizedWeek || !normalizedTeam || !normalizedClass || !normalizedObservedAt || !clean(source)) {
    throw new Error("NFL Availability Signal requires signalClass, season, week, team, observedAt, and source.");
  }
  return {
    contract: NFL_AVAILABILITY_SIGNAL_CONTRACT,
    version: NFL_AVAILABILITY_SIGNAL_VERSION,
    signalClass: normalizedClass,
    authority: Number.isFinite(Number(authority)) ? Number(authority) : NFL_AVAILABILITY_AUTHORITY.SUPPLEMENTAL,
    season: normalizedSeason,
    week: normalizedWeek,
    gameType: String(gameType || "REG").toUpperCase(),
    team: normalizedTeam,
    player: {
      playerId: clean(playerId), playerName: clean(playerName), position: clean(position)?.toUpperCase() || null,
      providerPlayerId: clean(providerPlayerId), providerTeamId: clean(providerTeamId),
    },
    availability: {
      status: clean(status)?.toUpperCase() || null,
      practiceStatus: clean(practiceStatus)?.toUpperCase() || null,
      injury: clean(injury),
      rosterStatus: clean(rosterStatus)?.toUpperCase() || null,
      estimatedReturnDate: clean(estimatedReturnDate),
    },
    transaction: {
      type: clean(transactionType)?.toUpperCase() || null,
      statusBefore: clean(statusBefore)?.toUpperCase() || null,
      statusAfter: clean(statusAfter)?.toUpperCase() || null,
    },
    role: {
      depthPosition: clean(depthPosition)?.toUpperCase() || null,
      depthRank: int(depthRank),
      starter: typeof starter === "boolean" ? starter : int(depthRank) === 1 ? true : null,
    },
    timing: { observedAt: normalizedObservedAt, effectiveAt: clean(effectiveAt) },
    provenance: { source: clean(source), sourceUrl: clean(sourceUrl) },
    metadata: { ...(metadata || {}) },
  };
}

export function isNFLAvailabilitySignal(value) {
  return Boolean(value && value.contract === NFL_AVAILABILITY_SIGNAL_CONTRACT && value.version === NFL_AVAILABILITY_SIGNAL_VERSION && Number.isInteger(value.season) && Number.isInteger(value.week) && typeof value.team === "string");
}
