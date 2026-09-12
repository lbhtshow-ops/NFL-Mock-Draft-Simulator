export const TEAM_CONTEXT_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
});

export const TEAM_CONTEXT_CLASSIFICATION = Object.freeze({
  FACT: "FACT",
  OBSERVATION: "OBSERVATION",
  ANALYST_INTERPRETATION: "ANALYST_INTERPRETATION",
  HISTORICAL_PRIOR: "HISTORICAL_PRIOR",
});

export const NFL_TEAM_COACHING_STAFF_ROLES = Object.freeze({
  HEAD_COACH: "HEAD_COACH",
  ASSISTANT_HEAD_COACH: "ASSISTANT_HEAD_COACH",
  OFFENSIVE_COORDINATOR: "OFFENSIVE_COORDINATOR",
  DEFENSIVE_COORDINATOR: "DEFENSIVE_COORDINATOR",
  SPECIAL_TEAMS_COORDINATOR: "SPECIAL_TEAMS_COORDINATOR",
  QUARTERBACKS_COACH: "QUARTERBACKS_COACH",
  RUNNING_BACKS_COACH: "RUNNING_BACKS_COACH",
  WIDE_RECEIVERS_COACH: "WIDE_RECEIVERS_COACH",
  TIGHT_ENDS_COACH: "TIGHT_ENDS_COACH",
  OFFENSIVE_LINE_COACH: "OFFENSIVE_LINE_COACH",
  DEFENSIVE_LINE_COACH: "DEFENSIVE_LINE_COACH",
  LINEBACKERS_COACH: "LINEBACKERS_COACH",
  OUTSIDE_LINEBACKERS_COACH: "OUTSIDE_LINEBACKERS_COACH",
  INSIDE_LINEBACKERS_COACH: "INSIDE_LINEBACKERS_COACH",
  DEFENSIVE_BACKS_COACH: "DEFENSIVE_BACKS_COACH",
  SECONDARY_COACH: "SECONDARY_COACH",
  PASSING_GAME_COORDINATOR: "PASSING_GAME_COORDINATOR",
  RUN_GAME_COORDINATOR: "RUN_GAME_COORDINATOR",
  OFFENSIVE_PASSING_GAME_COORDINATOR: "OFFENSIVE_PASSING_GAME_COORDINATOR",
  OFFENSIVE_RUN_GAME_COORDINATOR: "OFFENSIVE_RUN_GAME_COORDINATOR",
  DEFENSIVE_PASSING_GAME_COORDINATOR: "DEFENSIVE_PASSING_GAME_COORDINATOR",
  DEFENSIVE_RUN_GAME_COORDINATOR: "DEFENSIVE_RUN_GAME_COORDINATOR",
  ASSISTANT_OFFENSIVE_COORDINATOR: "ASSISTANT_OFFENSIVE_COORDINATOR",
  ASSISTANT_DEFENSIVE_COORDINATOR: "ASSISTANT_DEFENSIVE_COORDINATOR",
  ASSISTANT_SPECIAL_TEAMS_COORDINATOR: "ASSISTANT_SPECIAL_TEAMS_COORDINATOR",
  OFFENSIVE_ASSISTANT: "OFFENSIVE_ASSISTANT",
  DEFENSIVE_ASSISTANT: "DEFENSIVE_ASSISTANT",
  SPECIAL_TEAMS_ASSISTANT: "SPECIAL_TEAMS_ASSISTANT",
  QUALITY_CONTROL: "QUALITY_CONTROL",
  GAME_MANAGEMENT: "GAME_MANAGEMENT",
  SENIOR_ASSISTANT: "SENIOR_ASSISTANT",
  SPECIALIST: "SPECIALIST",
  OTHER_COACHING_STAFF: "OTHER_COACHING_STAFF",
});

const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const conf = (value) =>
  Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;

function normalizeObservation(input = {}) {
  const domain = clean(input?.domain);
  const subject = clean(input?.subject);
  const sourceId = clean(input?.sourceId);
  if (!domain || !subject || !sourceId) return null;

  const rawValue = input?.value ?? null;
  const inferredDisplayName =
    clean(input?.displayName) ||
    clean(input?.personName) ||
    (typeof rawValue === "string" ? clean(rawValue) : clean(rawValue?.displayName));

  return Object.freeze({
    domain,
    subject,
    value: rawValue,
    role: clean(input?.role),
    title: clean(input?.title) || clean(rawValue?.title),
    displayName: inferredDisplayName,
    classification: Object.values(TEAM_CONTEXT_CLASSIFICATION).includes(input?.classification)
      ? input.classification
      : TEAM_CONTEXT_CLASSIFICATION.OBSERVATION,
    sourceId,
    sourceType: clean(input?.sourceType),
    sourceLabel: clean(input?.sourceLabel),
    sourceUri: clean(input?.sourceUri),
    observedAt: clean(input?.observedAt),
    verifiedAt: clean(input?.verifiedAt),
    effectiveFrom: clean(input?.effectiveFrom),
    effectiveTo: clean(input?.effectiveTo),
    confidence: conf(input?.confidence),
    notes: clean(input?.notes),
  });
}

export function createNFLTeamCoachingSchemeEvidence(input = {}) {
  const observations = Object.freeze(
    (Array.isArray(input.observations) ? input.observations : [])
      .map(normalizeObservation)
      .filter(Boolean)
  );

  const verifiedAtValues = observations
    .map((entry) => entry.verifiedAt)
    .filter(Boolean)
    .sort();

  return Object.freeze({
    contractVersion: "FIE-NFL-TEAM-COACHING-SCHEME-EVIDENCE-1.1.0",
    team: clean(input.team),
    season: Number.isInteger(input.season) ? input.season : null,
    asOf: clean(input.asOf),
    status: observations.length
      ? TEAM_CONTEXT_STATUS.AVAILABLE
      : TEAM_CONTEXT_STATUS.UNAVAILABLE,
    observations,
    provenance: Object.freeze({
      sourceIds: Object.freeze([...new Set(observations.map((entry) => entry.sourceId))]),
      sourceTypes: Object.freeze([
        ...new Set(observations.map((entry) => entry.sourceType).filter(Boolean)),
      ]),
    }),
    freshness: Object.freeze({
      asOf: clean(input.asOf),
      latestVerifiedAt: verifiedAtValues.at(-1) || null,
    }),
  });
}

export default {
  TEAM_CONTEXT_STATUS,
  TEAM_CONTEXT_CLASSIFICATION,
  NFL_TEAM_COACHING_STAFF_ROLES,
  createNFLTeamCoachingSchemeEvidence,
};
