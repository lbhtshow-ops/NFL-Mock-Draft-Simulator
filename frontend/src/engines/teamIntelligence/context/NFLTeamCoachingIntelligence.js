import {
  TEAM_CONTEXT_CLASSIFICATION,
  NFL_TEAM_COACHING_STAFF_ROLES,
} from "./NFLTeamCoachingSchemeEvidenceContract.js";

const asTime = (value) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

function isEffectiveAt(observation, asOf) {
  const anchor = asTime(asOf);
  if (anchor === null) return observation?.effectiveTo == null;
  const from = asTime(observation?.effectiveFrom);
  const to = asTime(observation?.effectiveTo);
  if (from !== null && from > anchor) return false;
  if (to !== null && to <= anchor) return false;
  return true;
}

function sourcePriority(entry) {
  switch (entry?.sourceType) {
    case "OFFICIAL_CLUB": return 4;
    case "NFL_LEAGUE": return 3;
    case "PRIMARY_SOURCE": return 2;
    case "SECONDARY_REFERENCE": return 1;
    default: return 0;
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

function latest(entries) {
  return [...entries].sort(compareEvidence)[0] || null;
}

function fact(observations, subject, asOf) {
  return latest(
    observations.filter(
      (entry) =>
        entry.subject === subject &&
        entry.classification === TEAM_CONTEXT_CLASSIFICATION.FACT &&
        isEffectiveAt(entry, asOf)
    )
  );
}

function observationDisplayName(entry) {
  if (!entry) return null;
  if (typeof entry.displayName === "string" && entry.displayName.trim()) return entry.displayName.trim();
  if (typeof entry.value === "string" && entry.value.trim()) return entry.value.trim();
  if (typeof entry.value?.displayName === "string" && entry.value.displayName.trim()) {
    return entry.value.displayName.trim();
  }
  return null;
}

function canonicalStaffFacts(observations, asOf) {
  const candidates = observations.filter(
    (entry) =>
      entry.classification === TEAM_CONTEXT_CLASSIFICATION.FACT &&
      isEffectiveAt(entry, asOf) &&
      observationDisplayName(entry)
  );

  const byIdentity = new Map();
  for (const entry of candidates) {
    const role = entry.role || entry.subject;
    const displayName = observationDisplayName(entry);
    const key = `${role}::${displayName.toLowerCase()}`;
    const previous = byIdentity.get(key);
    if (!previous || compareEvidence(entry, previous) < 0) byIdentity.set(key, entry);
  }

  return Object.freeze(
    [...byIdentity.values()].sort((left, right) => {
      const roleDelta = String(left.role || left.subject).localeCompare(
        String(right.role || right.subject)
      );
      return roleDelta || observationDisplayName(left).localeCompare(observationDisplayName(right));
    })
  );
}

function projectStaffMember(entry) {
  if (!entry) return null;
  return Object.freeze({
    role: entry.role || entry.subject,
    subject: entry.subject,
    title: entry.title || null,
    displayName: observationDisplayName(entry),
    classification: entry.classification,
    sourceId: entry.sourceId,
    sourceType: entry.sourceType,
    sourceLabel: entry.sourceLabel || null,
    sourceUri: entry.sourceUri || null,
    observedAt: entry.observedAt || null,
    verifiedAt: entry.verifiedAt || null,
    effectiveFrom: entry.effectiveFrom || null,
    effectiveTo: entry.effectiveTo || null,
    confidence: entry.confidence ?? null,
  });
}

function buildRoleGroups(staffFacts) {
  const groups = {};
  for (const factEntry of staffFacts) {
    const role = factEntry.role || factEntry.subject;
    if (!groups[role]) groups[role] = [];
    groups[role].push(projectStaffMember(factEntry));
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(groups).map(([role, entries]) => [role, Object.freeze(entries)])
    )
  );
}

export function synthesizeNFLTeamCoachingIntelligence(evidence) {
  const observations = (evidence?.observations || []).filter(
    (entry) => entry.domain === "COACHING"
  );
  const asOf = evidence?.asOf || null;
  const staffFacts = canonicalStaffFacts(observations, asOf);

  return Object.freeze({
    intelligenceVersion: "FIE-NFL-TEAM-COACHING-INTELLIGENCE-1.1.0",
    status: observations.length ? "AVAILABLE" : "UNAVAILABLE",
    identity: Object.freeze({
      headCoach: fact(observations, "HEAD_COACH", asOf)?.value ?? null,
      offensiveCoordinator: fact(observations, "OFFENSIVE_COORDINATOR", asOf)?.value ?? null,
      defensiveCoordinator: fact(observations, "DEFENSIVE_COORDINATOR", asOf)?.value ?? null,
      specialTeamsCoordinator:
        fact(observations, "SPECIAL_TEAMS_COORDINATOR", asOf)?.value ?? null,
      offensivePlayCaller: fact(observations, "OFFENSIVE_PLAY_CALLER", asOf)?.value ?? null,
      defensivePlayCaller: fact(observations, "DEFENSIVE_PLAY_CALLER", asOf)?.value ?? null,
    }),
    staff: Object.freeze(staffFacts.map(projectStaffMember)),
    roleGroups: buildRoleGroups(staffFacts),
    continuity:
      latest(observations.filter((entry) => entry.subject === "STAFF_CONTINUITY"))?.value ?? null,
    staffChange:
      latest(observations.filter((entry) => entry.subject === "STAFF_CHANGE"))?.value ?? null,
    provenance: evidence?.provenance || null,
    freshness: evidence?.freshness || null,
    strengthScore: null,
    adjustment: null,
    observations: Object.freeze(observations),
  });
}

export default {
  synthesizeNFLTeamCoachingIntelligence,
  NFL_TEAM_COACHING_STAFF_ROLES,
};
