export const HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS = Object.freeze({
  CANONICAL_EVALUATION_INPUT: "CANONICAL_EVALUATION_INPUT",
  SNAP_PARTICIPATION: "SNAP_PARTICIPATION",
  DEPTH_CHART: "DEPTH_CHART",
  STARTER_DESIGNATION: "STARTER_DESIGNATION",
  EXPLICIT_REPLACEMENT: "EXPLICIT_REPLACEMENT",
});

export const HISTORICAL_PLAYER_EVIDENCE_USE = Object.freeze({
  CALIBER_INPUT: "CALIBER_INPUT",
  REPLACEMENT_CORROBORATION: "REPLACEMENT_CORROBORATION",
  POSTGAME_PARTICIPATION_ONLY: "POSTGAME_PARTICIPATION_ONLY",
});

export function qualifyHistoricalPlayerEvidenceSource(source = {}) {
  const hasProvenance = Boolean(source.provider && source.sourceRef);
  const hasIdentity = Boolean(source.playerIdentityKey);
  const hasSeasonWeekTeam = Boolean(source.seasonWeekTeamJoin === true);
  const hasAsOf = Boolean(source.asOfTimestamp === true);
  const pregameSafe = source.pregameSafe === true;
  const sourceClass = source.sourceClass ?? null;

  const caliberQualified =
    sourceClass === HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS.CANONICAL_EVALUATION_INPUT &&
    hasProvenance && hasIdentity && hasSeasonWeekTeam && hasAsOf && pregameSafe;

  const replacementPregameQualified =
    [HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS.DEPTH_CHART,
     HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS.STARTER_DESIGNATION,
     HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS.EXPLICIT_REPLACEMENT].includes(sourceClass) &&
    hasProvenance && hasIdentity && hasSeasonWeekTeam && hasAsOf && pregameSafe;

  const postgameParticipationQualified =
    sourceClass === HISTORICAL_PLAYER_EVIDENCE_SOURCE_CLASS.SNAP_PARTICIPATION &&
    hasProvenance && hasIdentity && hasSeasonWeekTeam;

  return Object.freeze({
    contractVersion: "FIE-NFL-HISTORICAL-PLAYER-EVIDENCE-ACQUISITION-1.0.0",
    caliberQualified,
    replacementPregameQualified,
    postgameParticipationQualified,
    snapCountsMayDeterminePregameReplacement: false,
    currentRatingBackfillAllowed: false,
    rosterOrderGuessAllowed: false,
    nameGuessAllowed: false,
  });
}
