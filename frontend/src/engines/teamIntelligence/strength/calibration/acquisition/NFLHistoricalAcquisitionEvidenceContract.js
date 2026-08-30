const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;

export function createNFLHistoricalAcquisitionEvidence(input = {}) {
  const retrievedAt = clean(input.retrievedAt);
  const effectiveAt = clean(input.effectiveAt);
  const kickoffAt = clean(input.kickoffAt);
  const safeForPregameCalibration = Boolean(
    effectiveAt && kickoffAt && Date.parse(effectiveAt) < Date.parse(kickoffAt)
  );

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-ACQUISITION-EVIDENCE-1.0.0",
    sourceId: clean(input.sourceId),
    sourceRecordId: clean(input.sourceRecordId),
    domain: clean(input.domain),
    team: clean(input.team),
    opponent: clean(input.opponent),
    playerId: clean(input.playerId),
    season: Number.isInteger(input.season) ? input.season : null,
    week: Number.isInteger(input.week) ? input.week : null,
    gameId: clean(input.gameId),
    retrievedAt,
    effectiveAt,
    kickoffAt,
    safeForPregameCalibration,
    payload: input.payload ?? null,
    provenance: Object.freeze({
      provider: clean(input.provenance?.provider),
      release: clean(input.provenance?.release),
      locator: clean(input.provenance?.locator),
      checksum: clean(input.provenance?.checksum),
    }),
  });
}

export function validateNFLHistoricalAcquisitionEvidence(evidence) {
  const errors = [];
  if (!evidence?.sourceId) errors.push("SOURCE_ID_REQUIRED");
  if (!evidence?.domain) errors.push("DOMAIN_REQUIRED");
  if (!Number.isInteger(evidence?.season)) errors.push("SEASON_REQUIRED");
  if (!evidence?.retrievedAt) errors.push("RETRIEVED_AT_REQUIRED");
  if (!evidence?.effectiveAt) errors.push("EFFECTIVE_AT_REQUIRED");
  if (!evidence?.kickoffAt) errors.push("KICKOFF_AT_REQUIRED");
  if (!evidence?.safeForPregameCalibration) errors.push("NOT_SAFE_FOR_PREGAME_CALIBRATION");
  return Object.freeze({valid: errors.length === 0, errors: Object.freeze(errors)});
}
