export const CALIBRATION_SPLIT = Object.freeze({
  TRAIN: "TRAIN",
  VALIDATION: "VALIDATION",
  HOLDOUT: "HOLDOUT",
});

export const CALIBRATION_OUTCOME_STATUS = Object.freeze({
  FINAL: "FINAL",
  UNAVAILABLE: "UNAVAILABLE",
});

const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
const finite = (v) => Number.isFinite(v) ? v : null;

export function createNFLTeamStrengthCalibrationObservation(input = {}) {
  const kickoffAt = clean(input.kickoffAt);
  const evidenceAsOf = clean(input.evidenceAsOf);
  const leakageSafe = Boolean(
    kickoffAt && evidenceAsOf &&
    Date.parse(evidenceAsOf) < Date.parse(kickoffAt)
  );

  const outcome = input.outcome?.status === CALIBRATION_OUTCOME_STATUS.FINAL
    ? Object.freeze({
        status: CALIBRATION_OUTCOME_STATUS.FINAL,
        teamPoints: finite(input.outcome.teamPoints),
        opponentPoints: finite(input.outcome.opponentPoints),
        pointDifferential:
          finite(input.outcome.teamPoints) !== null &&
          finite(input.outcome.opponentPoints) !== null
            ? input.outcome.teamPoints - input.outcome.opponentPoints
            : null,
        won: typeof input.outcome.won === "boolean" ? input.outcome.won : null,
      })
    : Object.freeze({
        status: CALIBRATION_OUTCOME_STATUS.UNAVAILABLE,
        teamPoints: null,
        opponentPoints: null,
        pointDifferential: null,
        won: null,
      });

  return Object.freeze({
    contractVersion: "FIE-NFL-TEAM-STRENGTH-CALIBRATION-OBSERVATION-1.0.0",
    observationId: clean(input.observationId),
    gameId: clean(input.gameId),
    team: clean(input.team),
    opponent: clean(input.opponent),
    season: Number.isInteger(input.season) ? input.season : null,
    week: Number.isInteger(input.week) ? input.week : null,
    kickoffAt,
    evidenceAsOf,
    leakageSafe,
    split: Object.values(CALIBRATION_SPLIT).includes(input.split) ? input.split : null,
    evidence: Object.freeze({
      playerCaliber: input.evidence?.playerCaliber ?? null,
      rosterDepth: input.evidence?.rosterDepth ?? null,
      availabilityImpact: input.evidence?.availabilityImpact ?? null,
      unitState: input.evidence?.unitState ?? null,
      performance: input.evidence?.performance ?? null,
      recentForm: input.evidence?.recentForm ?? null,
      coaching: input.evidence?.coaching ?? null,
      scheme: input.evidence?.scheme ?? null,
    }),
    outcome,
    provenance: Object.freeze({
      evidenceSourceIds: Object.freeze([...(input.provenance?.evidenceSourceIds ?? [])]),
      outcomeSourceIds: Object.freeze([...(input.provenance?.outcomeSourceIds ?? [])]),
    }),
  });
}

export function validateNFLTeamStrengthCalibrationObservation(observation) {
  const errors = [];
  if (!observation?.observationId) errors.push("OBSERVATION_ID_REQUIRED");
  if (!observation?.gameId) errors.push("GAME_ID_REQUIRED");
  if (!observation?.team) errors.push("TEAM_REQUIRED");
  if (!observation?.opponent) errors.push("OPPONENT_REQUIRED");
  if (!Number.isInteger(observation?.season)) errors.push("SEASON_REQUIRED");
  if (!Number.isInteger(observation?.week)) errors.push("WEEK_REQUIRED");
  if (!observation?.kickoffAt) errors.push("KICKOFF_REQUIRED");
  if (!observation?.evidenceAsOf) errors.push("EVIDENCE_AS_OF_REQUIRED");
  if (!observation?.leakageSafe) errors.push("FUTURE_DATA_LEAKAGE");
  if (!observation?.split) errors.push("SPLIT_REQUIRED");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
