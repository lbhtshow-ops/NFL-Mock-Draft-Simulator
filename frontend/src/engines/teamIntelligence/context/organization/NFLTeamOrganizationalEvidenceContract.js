export const NFL_TEAM_ORGANIZATIONAL_EVIDENCE_CONTRACT = "NFLTeamOrganizationalEvidence";
export const NFL_TEAM_ORGANIZATIONAL_EVIDENCE_VERSION = "FIE-NFL-TEAM-ORGANIZATIONAL-EVIDENCE-1.0.0";

export const NFL_TEAM_ORGANIZATIONAL_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
});

export const NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION = Object.freeze({
  FACT: "FACT",
  OBSERVATION: "OBSERVATION",
  ANALYST_INTERPRETATION: "ANALYST_INTERPRETATION",
  HISTORICAL_PRIOR: "HISTORICAL_PRIOR",
});

export const NFL_TEAM_ORGANIZATIONAL_DOMAINS = Object.freeze({
  OWNERSHIP: "OWNERSHIP",
  EXECUTIVE_LEADERSHIP: "EXECUTIVE_LEADERSHIP",
  FOOTBALL_OPERATIONS: "FOOTBALL_OPERATIONS",
  COACHING: "COACHING",
});

export const NFL_TEAM_ORGANIZATIONAL_ROLES = Object.freeze({
  PRINCIPAL_OWNER: "PRINCIPAL_OWNER",
  OWNERSHIP_GROUP: "OWNERSHIP_GROUP",
  CHAIRMAN: "CHAIRMAN",
  PRESIDENT: "PRESIDENT",
  CHIEF_EXECUTIVE_OFFICER: "CHIEF_EXECUTIVE_OFFICER",
  PRESIDENT_FOOTBALL_OPERATIONS: "PRESIDENT_FOOTBALL_OPERATIONS",
  EXECUTIVE_VP_FOOTBALL_OPERATIONS: "EXECUTIVE_VP_FOOTBALL_OPERATIONS",
  GENERAL_MANAGER: "GENERAL_MANAGER",
  ASSISTANT_GENERAL_MANAGER: "ASSISTANT_GENERAL_MANAGER",
  PLAYER_PERSONNEL_EXECUTIVE: "PLAYER_PERSONNEL_EXECUTIVE",
  COLLEGE_SCOUTING_EXECUTIVE: "COLLEGE_SCOUTING_EXECUTIVE",
  PRO_SCOUTING_EXECUTIVE: "PRO_SCOUTING_EXECUTIVE",
  HEAD_COACH: "HEAD_COACH",
  OFFENSIVE_COORDINATOR: "OFFENSIVE_COORDINATOR",
  DEFENSIVE_COORDINATOR: "DEFENSIVE_COORDINATOR",
  SPECIAL_TEAMS_COORDINATOR: "SPECIAL_TEAMS_COORDINATOR",
  OFFENSIVE_PLAY_CALLER: "OFFENSIVE_PLAY_CALLER",
  DEFENSIVE_PLAY_CALLER: "DEFENSIVE_PLAY_CALLER",
  FOOTBALL_OPERATIONS_EXECUTIVE: "FOOTBALL_OPERATIONS_EXECUTIVE",
  PERSONNEL_ADVISOR: "PERSONNEL_ADVISOR",
  SCOUTING_EXECUTIVE: "SCOUTING_EXECUTIVE",
  OTHER_FOOTBALL_DECISION_MAKER: "OTHER_FOOTBALL_DECISION_MAKER",
});

export const NFL_TEAM_ORGANIZATIONAL_AUTHORITY = Object.freeze({
  OWNERSHIP: "OWNERSHIP",
  BUSINESS: "BUSINESS",
  FOOTBALL_OPERATIONS: "FOOTBALL_OPERATIONS",
  PERSONNEL: "PERSONNEL",
  DRAFT: "DRAFT",
  ROSTER: "ROSTER",
  COACHING: "COACHING",
  SCHEME: "SCHEME",
  PLAY_CALLING: "PLAY_CALLING",
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
  const role = clean(input.role);
  const sourceId = clean(input.sourceId);
  const displayName = clean(input.displayName ?? input.personName ?? input.entityName);

  if (!domain || !role || !sourceId || !displayName) return null;

  const classification = Object.values(NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION).includes(
    input.classification
  )
    ? input.classification
    : NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION.OBSERVATION;

  return Object.freeze({
    domain,
    role,
    title: clean(input.title),
    displayName,
    entityType: clean(input.entityType) || "PERSON",
    personRef: clean(input.personRef),
    classification,
    authorityScopes: cleanArray(input.authorityScopes),
    reportsToRole: clean(input.reportsToRole),
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

export function createNFLTeamOrganizationalEvidence(input = {}) {
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
    contract: NFL_TEAM_ORGANIZATIONAL_EVIDENCE_CONTRACT,
    contractVersion: NFL_TEAM_ORGANIZATIONAL_EVIDENCE_VERSION,
    team: clean(input.team)?.toUpperCase() || null,
    season: Number.isInteger(input.season) ? input.season : null,
    asOf: clean(input.asOf),
    status:
      observations.length > 0
        ? NFL_TEAM_ORGANIZATIONAL_STATUS.AVAILABLE
        : NFL_TEAM_ORGANIZATIONAL_STATUS.UNAVAILABLE,
    observations,
    provenance: Object.freeze({ sourceIds, sourceTypes }),
    freshness: Object.freeze({
      asOf: clean(input.asOf),
      latestVerifiedAt: verifiedAtValues.at(-1) || null,
    }),
  });
}

export default {
  NFL_TEAM_ORGANIZATIONAL_EVIDENCE_CONTRACT,
  NFL_TEAM_ORGANIZATIONAL_EVIDENCE_VERSION,
  NFL_TEAM_ORGANIZATIONAL_STATUS,
  NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION,
  NFL_TEAM_ORGANIZATIONAL_DOMAINS,
  NFL_TEAM_ORGANIZATIONAL_ROLES,
  NFL_TEAM_ORGANIZATIONAL_AUTHORITY,
  createNFLTeamOrganizationalEvidence,
};
