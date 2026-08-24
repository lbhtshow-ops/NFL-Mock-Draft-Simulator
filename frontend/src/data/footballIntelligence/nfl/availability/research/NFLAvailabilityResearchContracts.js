export const NFL_AVAILABILITY_RESEARCH_DOMAIN = "NFL_PLAYER_AVAILABILITY";
export const NFL_AVAILABILITY_RESEARCH_RECORD_TYPE = "NFL_PLAYER_AVAILABILITY";
export const NFL_AVAILABILITY_RESEARCH_SOURCE_ID = "research-source:nflverse-injury-reports";
export const NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR = "lbht-sports-intelligence-acquisition";
export const NFL_AVAILABILITY_RESEARCH_VERIFIER = "lbht-automated-source-normalization";

export const NFL_AVAILABILITY_RESEARCH_FIELDS = Object.freeze({
  REPORT_STATUS: "report_status",
  PRACTICE_STATUS: "practice_status",
  PRIMARY_INJURY: "primary_injury",
  SECONDARY_INJURY: "secondary_injury",
  POSITION: "position",
});

function token(value) {
  return encodeURIComponent(String(value ?? "unknown").trim().toLowerCase());
}

export function getNFLAvailabilityResearchSessionId(season, week) {
  return `research-session:nfl-availability:${Number(season)}:${Number(week)}`;
}

export function getNFLAvailabilityResearchEvidenceId(season, week, team) {
  return `evidence:nfl-availability:${Number(season)}:${Number(week)}:${token(team)}`;
}

export function getNFLAvailabilityResearchPlayerRef(record = {}) {
  const id = record?.player?.playerId;
  if (id) return `nfl-player:${token(id)}`;
  return `nfl-player-name:${token(record?.player?.playerName || "unknown")}`;
}

export function getNFLAvailabilityResearchTeamRef(team) {
  return `nfl-team:${token(team)}`;
}

export function getNFLAvailabilityResearchObservationId({
  season,
  week,
  team,
  playerRef,
  field,
  snapshotFingerprint,
} = {}) {
  return [
    "observation:nfl-availability",
    Number(season),
    Number(week),
    token(team),
    token(playerRef),
    token(field),
    token(snapshotFingerprint),
  ].join(":");
}

export default {
  NFL_AVAILABILITY_RESEARCH_DOMAIN,
  NFL_AVAILABILITY_RESEARCH_RECORD_TYPE,
  NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
  NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
  NFL_AVAILABILITY_RESEARCH_VERIFIER,
  NFL_AVAILABILITY_RESEARCH_FIELDS,
  getNFLAvailabilityResearchSessionId,
  getNFLAvailabilityResearchEvidenceId,
  getNFLAvailabilityResearchPlayerRef,
  getNFLAvailabilityResearchTeamRef,
  getNFLAvailabilityResearchObservationId,
};
