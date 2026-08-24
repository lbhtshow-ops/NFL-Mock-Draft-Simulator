import researchRepository from "../../../../researchRepository/index.js";

import {
  NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
  NFL_AVAILABILITY_RESEARCH_DOMAIN,
  NFL_AVAILABILITY_RESEARCH_FIELDS,
  NFL_AVAILABILITY_RESEARCH_RECORD_TYPE,
  NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
  NFL_AVAILABILITY_RESEARCH_VERIFIER,
  getNFLAvailabilityResearchEvidenceId,
  getNFLAvailabilityResearchObservationId,
  getNFLAvailabilityResearchPlayerRef,
  getNFLAvailabilityResearchSessionId,
  getNFLAvailabilityResearchTeamRef,
} from "./NFLAvailabilityResearchContracts.js";

function stringOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function dateOrFallback(value, fallback) {
  if (value && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return new Date(fallback).toISOString();
}

function stableHash(text) {
  let first = 2166136261;
  let second = 2246822519;
  const input = String(text || "");

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 16777619);
    second ^= code + index;
    second = Math.imul(second, 3266489917);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function sourceUrlFor(records = []) {
  return records.find((record) => record?.provenance?.sourceUrl)?.provenance?.sourceUrl || null;
}

function normalizedSnapshot(record) {
  return {
    season: record.season,
    week: record.week,
    gameType: record.gameType,
    team: record.team,
    playerId: record?.player?.playerId || null,
    playerName: record?.player?.playerName || null,
    position: record?.player?.position || null,
    primaryInjury: record?.injury?.primary || null,
    secondaryInjury: record?.injury?.secondary || null,
    reportStatus: record?.status?.report || null,
    practiceStatus: record?.status?.practice || null,
    modifiedAt: record?.provenance?.modifiedAt || null,
  };
}

function snapshotFingerprint(record) {
  return stableHash(JSON.stringify(normalizedSnapshot(record)));
}

function teamContentFingerprint(records = []) {
  const ordered = records
    .map(normalizedSnapshot)
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return stableHash(JSON.stringify(ordered));
}

export function createNFLAvailabilityResearchSource({
  sourceUrl = null,
  checkedAt = new Date().toISOString(),
} = {}) {
  return researchRepository.createResearchSource({
    sourceId: NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
    name: "nflverse NFL Injury Reports",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.APPROVED,
    description:
      "Provider dataset used to record NFL practice participation, injury designation, and game-status observations.",
    domains: [NFL_AVAILABILITY_RESEARCH_DOMAIN],
    permittedRoles: [
      researchRepository.RESEARCH_ROLES.RECORDED_OBSERVATION,
      researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE,
    ],
    prohibitedRoles: [],
    independenceGroup: "NFLVERSE",
    methodology: {
      available: true,
      publicDescription:
        "Provider-normalized NFL injury report dataset. LBHT preserves provider values as recorded observations before football-intelligence projection.",
      methodologyRef: "https://github.com/nflverse/nflverse-data",
    },
    access: {
      type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC,
      location: sourceUrl || "https://github.com/nflverse/nflverse-data/releases/tag/injuries",
      requiresAuthentication: false,
    },
    usageRestrictions: {
      rawContentStorageAllowed: false,
      quotationAllowed: false,
      derivedFactsAllowed: true,
      redistributionAllowed: false,
      attributionRequired: true,
      notes: "Store normalized observations and provider provenance, not an unnecessary duplicate raw dataset.",
    },
    conflicts: {
      disclosed: false,
      subjects: [],
      organizations: [],
    },
    verificationRequirements: [researchRepository.RESEARCH_VERIFICATION_REQUIREMENTS.AUTOMATED],
    provenance: {
      createdBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      createdAt: checkedAt,
      updatedBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      updatedAt: checkedAt,
    },
    metadata: {
      tags: ["nfl", "availability", "injury-report", "dynamic-evidence"],
    },
  });
}

export function createNFLAvailabilityResearchSession({
  season,
  week,
  sourceRef = NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
  checkedAt = new Date().toISOString(),
  observationRefs = [],
  evidenceRefs = [],
} = {}) {
  return researchRepository.createResearchSession({
    sessionId: getNFLAvailabilityResearchSessionId(season, week),
    title: `NFL Availability Acquisition — ${season} Week ${week}`,
    description:
      "Automated acquisition session for current NFL player-availability observations. This session records evidence and does not own football entity truth.",
    sessionType: researchRepository.RESEARCH_SESSION_TYPES.DATA_REVIEW,
    status: researchRepository.RESEARCH_SESSION_STATUSES.IN_PROGRESS,
    subjects: [
      {
        subjectRef: `nfl-season:${season}`,
        subjectType: researchRepository.RESEARCH_SESSION_SUBJECT_TYPES.SEASON,
        label: `NFL ${season}`,
      },
    ],
    scope: {
      state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.DEFINED,
      objectives: ["Capture current NFL player availability evidence without promoting it into FID durable persistence."],
      inclusionCriteria: [`NFL season ${season}`, `NFL week ${week}`],
      exclusionCriteria: ["Unattributed availability claims", "Application-owned prediction logic"],
      sourceClasses: [researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER],
      domains: [NFL_AVAILABILITY_RESEARCH_DOMAIN],
      limitations: ["Availability is time-sensitive and may change after acquisition."],
    },
    researchers: [
      {
        researcherRef: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
        role: "AUTOMATED_ACQUISITION",
        startedAt: checkedAt,
      },
    ],
    sourceRefs: [sourceRef],
    researchPlan: {
      methodology: "Normalize provider rows into canonical Research Repository recorded observations.",
      plannedSourceRefs: [sourceRef],
      plannedActivities: ["Acquire provider dataset", "Normalize observations", "Upsert governed evidence"],
      verificationPlan: "Automated contract validation plus source provenance preservation.",
    },
    execution: {
      startedAt: checkedAt,
      activitiesCompleted: ["Provider acquisition attempted", "Canonical normalization performed"],
    },
    artifactRefs: {
      recordedObservationRefs: observationRefs,
      analyticalObservationRefs: [],
      evidenceArtifactRefs: evidenceRefs,
      otherArtifactRefs: [],
    },
    verification: {
      state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.IN_PROGRESS,
      limitations: ["Session remains open while the week is active and reports continue changing."],
    },
    review: {
      required: false,
      reviewTypes: [researchRepository.RESEARCH_SESSION_REVIEW_TYPES.NONE],
    },
    provenance: {
      createdBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      createdAt: checkedAt,
      updatedBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      updatedAt: checkedAt,
    },
    metadata: {
      tags: ["nfl-availability", `season:${season}`, `week:${week}`],
    },
  });
}

function observationForField({ record, field, value, sourceRef, sourceUrl, checkedAt }) {
  if (value === null || value === undefined || value === "") return null;

  const playerRef = getNFLAvailabilityResearchPlayerRef(record);
  const teamRef = getNFLAvailabilityResearchTeamRef(record.team);
  const occurredAt = dateOrFallback(record?.provenance?.modifiedAt, checkedAt);
  const fingerprint = snapshotFingerprint(record);
  const observationType = [
    NFL_AVAILABILITY_RESEARCH_FIELDS.REPORT_STATUS,
    NFL_AVAILABILITY_RESEARCH_FIELDS.PRACTICE_STATUS,
  ].includes(field)
    ? researchRepository.RECORDED_OBSERVATION_TYPES.STATUS
    : researchRepository.RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT;

  return researchRepository.createRecordedObservation({
    observationId: getNFLAvailabilityResearchObservationId({
      season: record.season,
      week: record.week,
      team: record.team,
      playerRef,
      field,
      snapshotFingerprint: fingerprint,
    }),
    sessionRef: getNFLAvailabilityResearchSessionId(record.season, record.week),
    sourceRefs: [sourceRef],
    observationType,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.IMPORTED_DATA,
    title: `${record.team} ${record?.player?.playerName || playerRef} ${field}`,
    description: `Provider-recorded NFL availability field ${field}.`,
    subjects: [
      {
        subjectRef: playerRef,
        subjectType: "NFL_PLAYER",
        role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY,
        label: record?.player?.playerName || null,
      },
      {
        subjectRef: teamRef,
        subjectType: "NFL_TEAM",
        role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.SECONDARY,
        label: record.team,
      },
    ],
    temporal: {
      type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT,
      occurredAt,
      precision: researchRepository.RECORDED_OBSERVATION_PRECISION_LEVELS.EXACT,
      timezone: "UTC",
    },
    spatial: {
      type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE,
    },
    record: {
      field,
      valueText: String(value),
      recordType: NFL_AVAILABILITY_RESEARCH_RECORD_TYPE,
      effectiveAt: occurredAt,
    },
    verification: {
      state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
      verifiedBy: NFL_AVAILABILITY_RESEARCH_VERIFIER,
      verifiedAt: checkedAt,
      method: "AUTOMATED_PROVIDER_NORMALIZATION",
      limitations: ["Provider status is recorded as published and is not independent medical verification."],
    },
    provenance: {
      recordedBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      recordedAt: checkedAt,
      createdBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      createdAt: checkedAt,
    },
    metadata: {
      tags: [
        "nfl-player-availability",
        `season:${record.season}`,
        `week:${record.week}`,
        `team:${record.team}`,
        `field:${field}`,
      ],
      externalRefs: [sourceUrl].filter(Boolean),
    },
  });
}

export function createNFLAvailabilityResearchObservations(record, {
  sourceRef = NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
  sourceUrl = record?.provenance?.sourceUrl || null,
  checkedAt = new Date().toISOString(),
} = {}) {
  const fields = [
    [NFL_AVAILABILITY_RESEARCH_FIELDS.REPORT_STATUS, record?.status?.report],
    [NFL_AVAILABILITY_RESEARCH_FIELDS.PRACTICE_STATUS, record?.status?.practice],
    [NFL_AVAILABILITY_RESEARCH_FIELDS.PRIMARY_INJURY, record?.injury?.primary],
    [NFL_AVAILABILITY_RESEARCH_FIELDS.SECONDARY_INJURY, record?.injury?.secondary],
    [NFL_AVAILABILITY_RESEARCH_FIELDS.POSITION, record?.player?.position],
  ];

  return fields
    .map(([field, value]) => observationForField({ record, field, value, sourceRef, sourceUrl, checkedAt }))
    .filter(Boolean);
}

export function createNFLAvailabilityResearchEvidenceArtifact({
  season,
  week,
  team,
  sourceRef = NFL_AVAILABILITY_RESEARCH_SOURCE_ID,
  sourceUrl = null,
  observationRefs = [],
  contentFingerprint,
  latestModifiedAt = null,
  checkedAt = new Date().toISOString(),
} = {}) {
  return researchRepository.createEvidenceArtifact({
    evidenceId: getNFLAvailabilityResearchEvidenceId(season, week, team),
    sessionRef: getNFLAvailabilityResearchSessionId(season, week),
    sourceRefs: [sourceRef],
    recordedObservationRefs: observationRefs,
    analyticalObservationRefs: [],
    relatedEvidenceRefs: [],
    state: researchRepository.EVIDENCE_ARTIFACT_STATES.ACTIVE,
    title: `${team} NFL Availability Evidence — ${season} Week ${week}`,
    summary: `Current Research Repository evidence index for ${team} player availability in ${season} Week ${week}.`,
    classification: {
      domains: [NFL_AVAILABILITY_RESEARCH_DOMAIN],
      categories: ["PLAYER_AVAILABILITY", "INJURY_REPORT"],
      role: researchRepository.EVIDENCE_ROLES.DIRECT,
      direction: researchRepository.EVIDENCE_DIRECTIONS.NEUTRAL,
      strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED,
      applicability: researchRepository.EVIDENCE_APPLICABILITY_STATES.APPLICABLE,
      tags: ["nfl-availability", `season:${season}`, `week:${week}`, `team:${team}`],
      notes: "Evidence artifact indexes current observations; superseded observations remain preserved in the Research Repository.",
    },
    basis: [
      {
        basisType: researchRepository.EVIDENCE_BASIS_TYPES.RESEARCH_SOURCE,
        ref: sourceRef,
        contribution: "Primary provider source for recorded availability observations.",
      },
    ],
    targets: [
      {
        targetType: researchRepository.EVIDENCE_TARGET_TYPES.SUBJECT,
        targetRef: getNFLAvailabilityResearchTeamRef(team),
        label: team,
        relationship: "CURRENT_AVAILABILITY_EVIDENCE",
      },
    ],
    assessment: {
      rationale: "Artifact groups current provider-recorded availability observations for canonical FIE projection.",
      limitations: ["Availability may change after the acquisition timestamp."],
      assumptions: [],
    },
    conflicts: {
      state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE,
    },
    verification: {
      state: researchRepository.EVIDENCE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
      verifiedBy: NFL_AVAILABILITY_RESEARCH_VERIFIER,
      verifiedAt: checkedAt,
      method: "AUTOMATED_PROVIDER_NORMALIZATION",
      limitations: ["Automated verification confirms source normalization, not independent medical status."],
    },
    review: {
      required: false,
      outcome: researchRepository.EVIDENCE_REVIEW_OUTCOMES.NO_DECISION,
    },
    provenance: {
      createdBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      createdAt: checkedAt,
      updatedBy: NFL_AVAILABILITY_RESEARCH_ACQUISITION_ACTOR,
      updatedAt: checkedAt,
    },
    metadata: {
      tags: ["nfl-availability-current-index"],
      externalRefs: [
        sourceUrl,
        contentFingerprint ? `content-hash:${contentFingerprint}` : null,
        latestModifiedAt ? `latest-modified-at:${latestModifiedAt}` : null,
      ].filter(Boolean),
      relatedSubjectRefs: [getNFLAvailabilityResearchTeamRef(team)],
    },
  });
}

export function createNFLAvailabilityResearchBundle(records = [], {
  checkedAt = new Date().toISOString(),
} = {}) {
  const canonical = Array.isArray(records) ? records : [];
  const sourceUrl = sourceUrlFor(canonical);
  const source = createNFLAvailabilityResearchSource({ sourceUrl, checkedAt });
  const groups = new Map();

  for (const record of canonical) {
    const key = `${record.season}:${record.week}:${record.team}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const observations = [];
  const artifacts = [];
  const sessionsByKey = new Map();

  for (const group of groups.values()) {
    const { season, week, team } = group[0];
    const groupObservations = group.flatMap((record) =>
      createNFLAvailabilityResearchObservations(record, {
        sourceRef: source.sourceId,
        sourceUrl,
        checkedAt,
      })
    );
    observations.push(...groupObservations);

    const latestModifiedAt = group
      .map((record) => stringOrNull(record?.provenance?.modifiedAt))
      .filter((value) => value && !Number.isNaN(Date.parse(value)))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;

    const artifact = createNFLAvailabilityResearchEvidenceArtifact({
      season,
      week,
      team,
      sourceRef: source.sourceId,
      sourceUrl,
      observationRefs: groupObservations.map((item) => item.observationId),
      contentFingerprint: teamContentFingerprint(group),
      latestModifiedAt,
      checkedAt,
    });
    artifacts.push(artifact);

    const sessionKey = `${season}:${week}`;
    const state = sessionsByKey.get(sessionKey) || {
      season,
      week,
      observationRefs: [],
      evidenceRefs: [],
    };
    state.observationRefs.push(...groupObservations.map((item) => item.observationId));
    state.evidenceRefs.push(artifact.evidenceId);
    sessionsByKey.set(sessionKey, state);
  }

  const sessions = [...sessionsByKey.values()].map((state) =>
    createNFLAvailabilityResearchSession({
      ...state,
      sourceRef: source.sourceId,
      checkedAt,
    })
  );

  return {
    source,
    sessions,
    observations,
    artifacts,
    summary: {
      sourceUrl,
      recordCount: canonical.length,
      observationCount: observations.length,
      artifactCount: artifacts.length,
      sessionCount: sessions.length,
      teamWeekCount: groups.size,
    },
  };
}

export default {
  createNFLAvailabilityResearchSource,
  createNFLAvailabilityResearchSession,
  createNFLAvailabilityResearchObservations,
  createNFLAvailabilityResearchEvidenceArtifact,
  createNFLAvailabilityResearchBundle,
};
