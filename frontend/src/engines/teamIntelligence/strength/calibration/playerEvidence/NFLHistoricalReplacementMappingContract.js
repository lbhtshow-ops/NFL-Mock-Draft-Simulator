const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;

export const NFL_REPLACEMENT_EVIDENCE_TYPES = Object.freeze({
  EXPLICIT_DEPTH_CHART: "EXPLICIT_DEPTH_CHART",
  EXPLICIT_STARTER_ANNOUNCEMENT: "EXPLICIT_STARTER_ANNOUNCEMENT",
  PREGAME_ROLE_EVIDENCE: "PREGAME_ROLE_EVIDENCE",
  PRIOR_USAGE: "PRIOR_USAGE",
});

export function createNFLHistoricalReplacementMapping(input = {}) {
  const evidenceType = Object.values(NFL_REPLACEMENT_EVIDENCE_TYPES).includes(input.evidenceType)
    ? input.evidenceType : null;

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-REPLACEMENT-MAPPING-1.0.0",
    unavailablePlayerId: clean(input.unavailablePlayerId),
    replacementPlayerId: clean(input.replacementPlayerId),
    team: clean(input.team),
    position: clean(input.position),
    season: Number.isInteger(input.season) ? input.season : null,
    week: Number.isInteger(input.week) ? input.week : null,
    gameId: clean(input.gameId),
    asOf: clean(input.asOf),
    evidenceType,
    confidence: Number.isFinite(input.confidence) ? input.confidence : null,
    provenance: input.provenance ?? null,
    inferredFromRosterOrder: false,
  });
}

export function validateNFLHistoricalReplacementMapping(mapping) {
  const errors = [];
  if (!mapping?.unavailablePlayerId) errors.push("UNAVAILABLE_PLAYER_REQUIRED");
  if (!mapping?.replacementPlayerId) errors.push("REPLACEMENT_PLAYER_REQUIRED");
  if (mapping?.unavailablePlayerId === mapping?.replacementPlayerId) errors.push("REPLACEMENT_MUST_DIFFER");
  if (!mapping?.team) errors.push("TEAM_REQUIRED");
  if (!mapping?.position) errors.push("POSITION_REQUIRED");
  if (!mapping?.evidenceType) errors.push("EXPLICIT_REPLACEMENT_EVIDENCE_REQUIRED");
  if (mapping?.inferredFromRosterOrder) errors.push("ROSTER_ORDER_INFERENCE_FORBIDDEN");
  return Object.freeze({valid: errors.length === 0, errors: Object.freeze(errors)});
}
