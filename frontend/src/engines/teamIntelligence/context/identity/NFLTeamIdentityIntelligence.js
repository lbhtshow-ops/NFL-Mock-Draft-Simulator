import {
  NFL_TEAM_IDENTITY_CLASSIFICATION,
  NFL_TEAM_IDENTITY_SUBJECTS,
} from "./NFLTeamIdentityEvidenceContract.js";

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

function classificationPriority(entry) {
  switch (entry?.classification) {
    case NFL_TEAM_IDENTITY_CLASSIFICATION.FACT:
      return 4;
    case NFL_TEAM_IDENTITY_CLASSIFICATION.OBSERVATION:
      return 3;
    case NFL_TEAM_IDENTITY_CLASSIFICATION.ANALYST_INTERPRETATION:
      return 2;
    case NFL_TEAM_IDENTITY_CLASSIFICATION.HISTORICAL_PRIOR:
      return 1;
    default:
      return 0;
  }
}

function sourcePriority(entry) {
  switch (entry?.sourceType) {
    case "OFFICIAL_CLUB":
      return 5;
    case "NFL_LEAGUE":
      return 4;
    case "PRIMARY_SOURCE":
      return 3;
    case "CANONICAL_DATASET":
      return 2;
    case "SECONDARY_REFERENCE":
      return 1;
    default:
      return 0;
  }
}

function compareEvidence(left, right) {
  const classificationDelta = classificationPriority(right) - classificationPriority(left);
  if (classificationDelta !== 0) return classificationDelta;

  const sourceDelta = sourcePriority(right) - sourcePriority(left);
  if (sourceDelta !== 0) return sourceDelta;

  const leftEffective = asTime(left?.effectiveFrom) ?? 0;
  const rightEffective = asTime(right?.effectiveFrom) ?? 0;
  if (leftEffective !== rightEffective) return rightEffective - leftEffective;

  const leftVerified = asTime(left?.verifiedAt) ?? 0;
  const rightVerified = asTime(right?.verifiedAt) ?? 0;
  if (leftVerified !== rightVerified) return rightVerified - leftVerified;

  const leftObserved = asTime(left?.observedAt) ?? 0;
  const rightObserved = asTime(right?.observedAt) ?? 0;
  if (leftObserved !== rightObserved) return rightObserved - leftObserved;

  return (right?.confidence ?? -1) - (left?.confidence ?? -1);
}

function projectObservation(observation) {
  if (!observation) return null;
  return Object.freeze({
    domain: observation.domain,
    subject: observation.subject,
    value: observation.value,
    classification: observation.classification,
    tags: observation.tags,
    confidence: observation.confidence,
    effectiveFrom: observation.effectiveFrom,
    effectiveTo: observation.effectiveTo,
    verifiedAt: observation.verifiedAt,
    sourceId: observation.sourceId,
    sourceType: observation.sourceType,
  });
}

function resolveSubject(observations, subject, asOf) {
  const candidates = observations
    .filter((entry) => entry.subject === subject && isEffectiveAt(entry, asOf))
    .sort(compareEvidence);
  return projectObservation(candidates[0] || null);
}

function resolveMany(observations, subjects, asOf) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(subjects).map(([key, subject]) => [
        key,
        resolveSubject(observations, subject, asOf),
      ])
    )
  );
}

const offenseSubjects = Object.freeze({
  system: NFL_TEAM_IDENTITY_SUBJECTS.OFFENSIVE_SYSTEM,
  passGame: NFL_TEAM_IDENTITY_SUBJECTS.PASS_GAME_IDENTITY,
  runGame: NFL_TEAM_IDENTITY_SUBJECTS.RUN_GAME_IDENTITY,
  formationPersonnel: NFL_TEAM_IDENTITY_SUBJECTS.FORMATION_PERSONNEL_IDENTITY,
  motion: NFL_TEAM_IDENTITY_SUBJECTS.MOTION_IDENTITY,
  playActionRpo: NFL_TEAM_IDENTITY_SUBJECTS.PLAY_ACTION_RPO_IDENTITY,
  playCalling: NFL_TEAM_IDENTITY_SUBJECTS.OFFENSIVE_PLAY_CALLING,
});

const defenseSubjects = Object.freeze({
  system: NFL_TEAM_IDENTITY_SUBJECTS.DEFENSIVE_SYSTEM,
  front: NFL_TEAM_IDENTITY_SUBJECTS.DEFENSIVE_FRONT,
  coverage: NFL_TEAM_IDENTITY_SUBJECTS.COVERAGE_IDENTITY,
  pressure: NFL_TEAM_IDENTITY_SUBJECTS.PRESSURE_IDENTITY,
  subpackage: NFL_TEAM_IDENTITY_SUBJECTS.SUBPACKAGE_IDENTITY,
  playCalling: NFL_TEAM_IDENTITY_SUBJECTS.DEFENSIVE_PLAY_CALLING,
});

const teamBuildingSubjects = Object.freeze({
  philosophy: NFL_TEAM_IDENTITY_SUBJECTS.TEAM_BUILDING_PHILOSOPHY,
  draftPhilosophy: NFL_TEAM_IDENTITY_SUBJECTS.DRAFT_PHILOSOPHY,
  rosterConstruction: NFL_TEAM_IDENTITY_SUBJECTS.ROSTER_CONSTRUCTION_PHILOSOPHY,
  development: NFL_TEAM_IDENTITY_SUBJECTS.DEVELOPMENT_PHILOSOPHY,
});

const continuitySubjects = Object.freeze({
  staff: NFL_TEAM_IDENTITY_SUBJECTS.STAFF_CONTINUITY,
  system: NFL_TEAM_IDENTITY_SUBJECTS.SYSTEM_CONTINUITY,
});

export function synthesizeNFLTeamIdentityIntelligence(evidence) {
  const observations = evidence?.observations || [];
  const asOf = evidence?.asOf || null;

  return Object.freeze({
    intelligenceVersion: "FIE-NFL-TEAM-IDENTITY-INTELLIGENCE-1.0.0",
    status: evidence?.status || "UNAVAILABLE",
    team: evidence?.team || null,
    season: evidence?.season ?? null,
    asOf,
    offense: resolveMany(observations, offenseSubjects, asOf),
    defense: resolveMany(observations, defenseSubjects, asOf),
    personnel: Object.freeze({
      preferences: resolveSubject(
        observations,
        NFL_TEAM_IDENTITY_SUBJECTS.PERSONNEL_PREFERENCES,
        asOf
      ),
    }),
    teamBuilding: resolveMany(observations, teamBuildingSubjects, asOf),
    continuity: resolveMany(observations, continuitySubjects, asOf),
    observations: Object.freeze([...observations]),
    scoring: Object.freeze({
      identityStrength: null,
      schemeQuality: null,
      teamStrengthAdjustment: null,
      winProbabilityAdjustment: null,
      draftAdjustment: null,
    }),
  });
}

export default { synthesizeNFLTeamIdentityIntelligence };
