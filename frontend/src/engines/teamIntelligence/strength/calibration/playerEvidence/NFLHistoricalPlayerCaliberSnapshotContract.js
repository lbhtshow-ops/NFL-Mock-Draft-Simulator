const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
const finite = (v) => Number.isFinite(v) ? v : null;

export function createNFLHistoricalPlayerCaliberSnapshot(input = {}) {
  const asOf = clean(input.asOf);
  const kickoffAt = clean(input.kickoffAt);
  const asOfMs = asOf ? Date.parse(asOf) : NaN;
  const kickoffMs = kickoffAt ? Date.parse(kickoffAt) : NaN;
  const temporallySafe = Number.isFinite(asOfMs) && Number.isFinite(kickoffMs) && asOfMs < kickoffMs;

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-PLAYER-CALIBER-SNAPSHOT-1.0.0",
    playerId: clean(input.playerId),
    team: clean(input.team),
    position: clean(input.position),
    season: Number.isInteger(input.season) ? input.season : null,
    week: Number.isInteger(input.week) ? input.week : null,
    gameId: clean(input.gameId),
    asOf,
    kickoffAt,
    temporallySafe,
    status: input.status === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE",
    caliber: input.status === "AVAILABLE" ? finite(input.caliber) : null,
    confidence: input.status === "AVAILABLE" ? finite(input.confidence) : null,
    modelVersion: clean(input.modelVersion),
    evidenceVersion: clean(input.evidenceVersion),
    provenance: input.provenance ?? null,
  });
}

export function validateNFLHistoricalPlayerCaliberSnapshot(snapshot) {
  const errors = [];
  if (!snapshot?.playerId) errors.push("PLAYER_ID_REQUIRED");
  if (!snapshot?.team) errors.push("TEAM_REQUIRED");
  if (!snapshot?.position) errors.push("POSITION_REQUIRED");
  if (!Number.isInteger(snapshot?.season)) errors.push("SEASON_REQUIRED");
  if (!Number.isInteger(snapshot?.week)) errors.push("WEEK_REQUIRED");
  if (!snapshot?.gameId) errors.push("GAME_ID_REQUIRED");
  if (!snapshot?.asOf) errors.push("AS_OF_REQUIRED");
  if (!snapshot?.kickoffAt) errors.push("KICKOFF_REQUIRED");
  if (!snapshot?.temporallySafe) errors.push("HISTORICAL_CALIBER_FUTURE_LEAKAGE");
  if (snapshot?.status === "AVAILABLE" && !Number.isFinite(snapshot?.caliber)) errors.push("AVAILABLE_CALIBER_REQUIRED");
  return Object.freeze({valid: errors.length === 0, errors: Object.freeze(errors)});
}
