import {
  NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION,
  NFL_TEAM_ORGANIZATIONAL_ROLES,
} from "./NFLTeamOrganizationalEvidenceContract.js";

const asTime = (value) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

function isEffectiveAt(observation, asOf) {
  const anchor = asTime(asOf);
  if (anchor === null) return observation.effectiveTo == null;

  const from = asTime(observation.effectiveFrom);
  const to = asTime(observation.effectiveTo);
  if (from !== null && from > anchor) return false;
  if (to !== null && to <= anchor) return false;
  return true;
}

function sourcePriority(entry) {
  switch (entry?.sourceType) {
    case "OFFICIAL_CLUB":
      return 4;
    case "NFL_LEAGUE":
      return 3;
    case "PRIMARY_SOURCE":
      return 2;
    case "SECONDARY_REFERENCE":
      return 1;
    default:
      return 0;
  }
}

function compareEvidence(left, right) {
  const leftEffective = asTime(left?.effectiveFrom) ?? 0;
  const rightEffective = asTime(right?.effectiveFrom) ?? 0;
  if (leftEffective !== rightEffective) return rightEffective - leftEffective;

  const sourceDelta = sourcePriority(right) - sourcePriority(left);
  if (sourceDelta !== 0) return sourceDelta;

  const leftVerified = asTime(left?.verifiedAt) ?? 0;
  const rightVerified = asTime(right?.verifiedAt) ?? 0;
  if (leftVerified !== rightVerified) return rightVerified - leftVerified;

  const leftObserved = asTime(left?.observedAt) ?? 0;
  const rightObserved = asTime(right?.observedAt) ?? 0;
  if (leftObserved !== rightObserved) return rightObserved - leftObserved;

  return (right?.confidence ?? -1) - (left?.confidence ?? -1);
}

function hasOfficialNonGmIdentity(observation, observations, asOf) {
  if (
    observation?.role !== NFL_TEAM_ORGANIZATIONAL_ROLES.GENERAL_MANAGER ||
    observation?.sourceType !== "SECONDARY_REFERENCE"
  ) {
    return false;
  }

  const displayName = String(observation?.displayName || "").trim().toLowerCase();
  if (!displayName) return false;

  return observations.some((candidate) => {
    if (
      candidate === observation ||
      candidate?.classification !== NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION.FACT ||
      candidate?.sourceType !== "OFFICIAL_CLUB" ||
      !isEffectiveAt(candidate, asOf)
    ) {
      return false;
    }

    if (String(candidate?.displayName || "").trim().toLowerCase() !== displayName) {
      return false;
    }

    if (candidate.role === NFL_TEAM_ORGANIZATIONAL_ROLES.GENERAL_MANAGER) {
      return false;
    }

    return !/general manager/i.test(candidate?.title || "");
  });
}

function canonicalFactCandidates(observations, asOf) {
  return observations.filter(
    (entry) =>
      entry.classification === NFL_TEAM_ORGANIZATIONAL_CLASSIFICATION.FACT &&
      isEffectiveAt(entry, asOf) &&
      !hasOfficialNonGmIdentity(entry, observations, asOf)
  );
}

function latestFact(observations, role, asOf) {
  return (
    canonicalFactCandidates(observations, asOf)
      .filter((entry) => entry.role === role)
      .sort(compareEvidence)[0] || null
  );
}

function projectRole(observation) {
  if (!observation) return null;
  return Object.freeze({
    role: observation.role,
    title: observation.title,
    displayName: observation.displayName,
    entityType: observation.entityType,
    personRef: observation.personRef,
    authorityScopes: observation.authorityScopes,
    reportsToRole: observation.reportsToRole,
    effectiveFrom: observation.effectiveFrom,
    effectiveTo: observation.effectiveTo,
    confidence: observation.confidence,
    verifiedAt: observation.verifiedAt,
    sourceId: observation.sourceId,
    sourceType: observation.sourceType,
  });
}

function canonicalFacts(observations, asOf) {
  const byIdentity = new Map();
  for (const entry of canonicalFactCandidates(observations, asOf)) {
    const key = `${entry.role}::${String(entry.displayName || "").trim().toLowerCase()}`;
    const previous = byIdentity.get(key);
    if (!previous || compareEvidence(entry, previous) < 0) {
      byIdentity.set(key, entry);
    }
  }
  return Object.freeze([...byIdentity.values()].sort((a, b) => {
    const roleOrder = String(a.role).localeCompare(String(b.role));
    return roleOrder || String(a.displayName).localeCompare(String(b.displayName));
  }));
}

function buildRoleGroups(facts) {
  const groups = {};
  for (const fact of facts) {
    if (!groups[fact.role]) groups[fact.role] = [];
    groups[fact.role].push(projectRole(fact));
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(groups).map(([role, entries]) => [role, Object.freeze(entries)])
    )
  );
}

const roleMap = Object.freeze({
  principalOwner: NFL_TEAM_ORGANIZATIONAL_ROLES.PRINCIPAL_OWNER,
  ownershipGroup: NFL_TEAM_ORGANIZATIONAL_ROLES.OWNERSHIP_GROUP,
  chairman: NFL_TEAM_ORGANIZATIONAL_ROLES.CHAIRMAN,
  president: NFL_TEAM_ORGANIZATIONAL_ROLES.PRESIDENT,
  chiefExecutiveOfficer: NFL_TEAM_ORGANIZATIONAL_ROLES.CHIEF_EXECUTIVE_OFFICER,
  presidentFootballOperations: NFL_TEAM_ORGANIZATIONAL_ROLES.PRESIDENT_FOOTBALL_OPERATIONS,
  executiveVpFootballOperations:
    NFL_TEAM_ORGANIZATIONAL_ROLES.EXECUTIVE_VP_FOOTBALL_OPERATIONS,
  generalManager: NFL_TEAM_ORGANIZATIONAL_ROLES.GENERAL_MANAGER,
  assistantGeneralManager: NFL_TEAM_ORGANIZATIONAL_ROLES.ASSISTANT_GENERAL_MANAGER,
  playerPersonnelExecutive: NFL_TEAM_ORGANIZATIONAL_ROLES.PLAYER_PERSONNEL_EXECUTIVE,
  collegeScoutingExecutive: NFL_TEAM_ORGANIZATIONAL_ROLES.COLLEGE_SCOUTING_EXECUTIVE,
  proScoutingExecutive: NFL_TEAM_ORGANIZATIONAL_ROLES.PRO_SCOUTING_EXECUTIVE,
  headCoach: NFL_TEAM_ORGANIZATIONAL_ROLES.HEAD_COACH,
  offensiveCoordinator: NFL_TEAM_ORGANIZATIONAL_ROLES.OFFENSIVE_COORDINATOR,
  defensiveCoordinator: NFL_TEAM_ORGANIZATIONAL_ROLES.DEFENSIVE_COORDINATOR,
  specialTeamsCoordinator: NFL_TEAM_ORGANIZATIONAL_ROLES.SPECIAL_TEAMS_COORDINATOR,
  offensivePlayCaller: NFL_TEAM_ORGANIZATIONAL_ROLES.OFFENSIVE_PLAY_CALLER,
  defensivePlayCaller: NFL_TEAM_ORGANIZATIONAL_ROLES.DEFENSIVE_PLAY_CALLER,
});

export function synthesizeNFLTeamOrganizationalIntelligence(evidence) {
  const observations = evidence?.observations || [];
  const asOf = evidence?.asOf || null;

  const leadership = Object.freeze(
    Object.fromEntries(
      Object.entries(roleMap).map(([key, role]) => [
        key,
        projectRole(latestFact(observations, role, asOf)),
      ])
    )
  );

  const facts = canonicalFacts(observations, asOf);
  const roleGroups = buildRoleGroups(facts);

  const decisionMakers = Object.freeze(
    facts
      .filter((entry) => entry.authorityScopes.length > 0)
      .map(projectRole)
  );

  return Object.freeze({
    intelligenceVersion: "FIE-NFL-TEAM-ORGANIZATIONAL-INTELLIGENCE-1.1.0",
    status: evidence?.status || "UNAVAILABLE",
    team: evidence?.team || null,
    asOf,
    leadership,
    roleGroups,
    decisionMakers,
    observations: Object.freeze([...observations]),
    scoring: Object.freeze({
      organizationalStrength: null,
      decisionQuality: null,
      draftAdjustment: null,
    }),
  });
}

export default { synthesizeNFLTeamOrganizationalIntelligence };
