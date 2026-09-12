export const NFL_TEAM_IDENTITY_EVIDENCE_CONTRACT = "NFLTeamIdentityEvidence";
export const NFL_TEAM_IDENTITY_EVIDENCE_VERSION = "FIE-NFL-TEAM-IDENTITY-EVIDENCE-1.0.0";

export const NFL_TEAM_IDENTITY_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
});

export const NFL_TEAM_IDENTITY_CLASSIFICATION = Object.freeze({
  FACT: "FACT",
  OBSERVATION: "OBSERVATION",
  ANALYST_INTERPRETATION: "ANALYST_INTERPRETATION",
  HISTORICAL_PRIOR: "HISTORICAL_PRIOR",
});

export const NFL_TEAM_IDENTITY_DOMAINS = Object.freeze({
  OFFENSE: "OFFENSE",
  DEFENSE: "DEFENSE",
  PERSONNEL: "PERSONNEL",
  PLAY_CALLING: "PLAY_CALLING",
  TEAM_BUILDING: "TEAM_BUILDING",
  CONTINUITY: "CONTINUITY",
});

export const NFL_TEAM_IDENTITY_SUBJECTS = Object.freeze({
  OFFENSIVE_SYSTEM: "OFFENSIVE_SYSTEM",
  PASS_GAME_IDENTITY: "PASS_GAME_IDENTITY",
  RUN_GAME_IDENTITY: "RUN_GAME_IDENTITY",
  FORMATION_PERSONNEL_IDENTITY: "FORMATION_PERSONNEL_IDENTITY",
  MOTION_IDENTITY: "MOTION_IDENTITY",
  PLAY_ACTION_RPO_IDENTITY: "PLAY_ACTION_RPO_IDENTITY",
  OFFENSIVE_PLAY_CALLING: "OFFENSIVE_PLAY_CALLING",
  DEFENSIVE_SYSTEM: "DEFENSIVE_SYSTEM",
  DEFENSIVE_FRONT: "DEFENSIVE_FRONT",
  COVERAGE_IDENTITY: "COVERAGE_IDENTITY",
  PRESSURE_IDENTITY: "PRESSURE_IDENTITY",
  SUBPACKAGE_IDENTITY: "SUBPACKAGE_IDENTITY",
  DEFENSIVE_PLAY_CALLING: "DEFENSIVE_PLAY_CALLING",
  PERSONNEL_PREFERENCES: "PERSONNEL_PREFERENCES",
  TEAM_BUILDING_PHILOSOPHY: "TEAM_BUILDING_PHILOSOPHY",
  DRAFT_PHILOSOPHY: "DRAFT_PHILOSOPHY",
  ROSTER_CONSTRUCTION_PHILOSOPHY: "ROSTER_CONSTRUCTION_PHILOSOPHY",
  DEVELOPMENT_PHILOSOPHY: "DEVELOPMENT_PHILOSOPHY",
  STAFF_CONTINUITY: "STAFF_CONTINUITY",
  SYSTEM_CONTINUITY: "SYSTEM_CONTINUITY",
});

const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanArray = (value) =>
  Object.freeze(
    [...new Set((Array.isArray(value) ? value : []).map(clean).filter(Boolean))]
  );

const confidence = (value) =>
  Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;

function normalizeObservation(input = {}) {
  const domain = clean(input.domain);
  const subject = clean(input.subject);
  const sourceId = clean(input.sourceId);
  const value = input.value ?? null;

  if (!domain || !subject || !sourceId || value === null) return null;
  if (!Object.values(NFL_TEAM_IDENTITY_DOMAINS).includes(domain)) return null;
  if (!Object.values(NFL_TEAM_IDENTITY_SUBJECTS).includes(subject)) return null;

  const classification = Object.values(NFL_TEAM_IDENTITY_CLASSIFICATION).includes(
    input.classification
  )
    ? input.classification
    : NFL_TEAM_IDENTITY_CLASSIFICATION.OBSERVATION;

  return Object.freeze({
    domain,
    subject,
    value,
    classification,
    tags: cleanArray(input.tags),
    sourceId,
    sourceType: clean(input.sourceType),
    sourceLabel: clean(input.sourceLabel),
    sourceUri: clean(input.sourceUri),
    observedAt: clean(input.observedAt),
    verifiedAt: clean(input.verifiedAt),
    effectiveFrom: clean(input.effectiveFrom),
    effectiveTo: clean(input.effectiveTo),
    confidence: confidence(input.confidence),
    notes: clean(input.notes),
  });
}

export function createNFLTeamIdentityEvidence(input = {}) {
  const observations = Object.freeze(
    (Array.isArray(input.observations) ? input.observations : [])
      .map(normalizeObservation)
      .filter(Boolean)
  );

  const sourceIds = Object.freeze([...new Set(observations.map((entry) => entry.sourceId))]);
  const sourceTypes = Object.freeze([
    ...new Set(observations.map((entry) => entry.sourceType).filter(Boolean)),
  ]);
  const verifiedAtValues = observations
    .map((entry) => entry.verifiedAt)
    .filter(Boolean)
    .sort();

  return Object.freeze({
    contract: NFL_TEAM_IDENTITY_EVIDENCE_CONTRACT,
    contractVersion: NFL_TEAM_IDENTITY_EVIDENCE_VERSION,
    team: clean(input.team)?.toUpperCase() || null,
    season: Number.isInteger(input.season) ? input.season : null,
    asOf: clean(input.asOf),
    status:
      observations.length > 0
        ? NFL_TEAM_IDENTITY_STATUS.AVAILABLE
        : NFL_TEAM_IDENTITY_STATUS.UNAVAILABLE,
    observations,
    provenance: Object.freeze({ sourceIds, sourceTypes }),
    freshness: Object.freeze({
      asOf: clean(input.asOf),
      latestVerifiedAt: verifiedAtValues.at(-1) || null,
    }),
  });
}

export default {
  NFL_TEAM_IDENTITY_EVIDENCE_CONTRACT,
  NFL_TEAM_IDENTITY_EVIDENCE_VERSION,
  NFL_TEAM_IDENTITY_STATUS,
  NFL_TEAM_IDENTITY_CLASSIFICATION,
  NFL_TEAM_IDENTITY_DOMAINS,
  NFL_TEAM_IDENTITY_SUBJECTS,
  createNFLTeamIdentityEvidence,
};
