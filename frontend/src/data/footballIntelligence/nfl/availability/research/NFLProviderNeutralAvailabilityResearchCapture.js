import researchRepository from "../../../../researchRepository/index.js";

export const NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID =
  "research-source:lbht-nfl-availability-multisignal";

export const NFL_PROVIDER_NEUTRAL_AVAILABILITY_DOMAIN =
  "NFL_PLAYER_AVAILABILITY";

export const NFL_PROVIDER_NEUTRAL_AVAILABILITY_RECORD_TYPE =
  "NFL_MULTI_SIGNAL_AVAILABILITY";

export const NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR =
  "lbht-sports-intelligence-acquisition";

export const NFL_PROVIDER_NEUTRAL_AVAILABILITY_VERIFIER =
  "lbht-automated-source-normalization";

const token = (value) =>
  encodeURIComponent(String(value ?? "unknown").trim().toLowerCase());

const clean = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

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

function gameTypeToken(value) {
  return token(value || "UNKNOWN");
}

export function getNFLProviderNeutralAvailabilitySessionId(
  season,
  gameType,
  week
) {
  return `research-session:nfl-multisignal-availability:${Number(
    season
  )}:${gameTypeToken(gameType)}:${Number(week)}`;
}

export function getNFLProviderNeutralAvailabilityEvidenceId(
  season,
  gameType,
  week,
  team
) {
  return `evidence:nfl-multisignal-availability:${Number(
    season
  )}:${gameTypeToken(gameType)}:${Number(week)}:${token(team)}`;
}

function playerRef(signal) {
  const id =
    signal?.player?.playerId || signal?.player?.providerPlayerId;

  return id
    ? `nfl-player:${token(id)}`
    : `nfl-player-name:${token(signal?.player?.playerName)}`;
}

function teamRef(team) {
  return `nfl-team:${token(team)}`;
}

/*
 * Acquisition-only timestamps are intentionally excluded when the provider
 * supplies no content timestamp. This preserves idempotency for identical
 * snapshots while content changes remain content-addressed.
 */
export function normalizedNFLProviderNeutralAvailabilitySignalSnapshot(
  signal = {}
) {
  return {
    contract: signal.contract || null,
    version: signal.version || null,
    signalClass: signal.signalClass || null,
    authority: signal.authority ?? null,
    season: signal.season ?? null,
    week: signal.week ?? null,
    gameType: signal.gameType || null,
    team: signal.team || null,
    player: signal.player || null,
    availability: signal.availability || null,
    transaction: signal.transaction || null,
    role: signal.role || null,
    effectiveAt: clean(signal?.timing?.effectiveAt),
    provenance: signal.provenance || {},
    metadata: signal.metadata || {},
  };
}

function signalFingerprint(signal) {
  return stableHash(
    JSON.stringify(
      normalizedNFLProviderNeutralAvailabilitySignalSnapshot(signal)
    )
  );
}

function teamFingerprint(signals) {
  const ordered = signals
    .map(normalizedNFLProviderNeutralAvailabilitySignalSnapshot)
    .sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right))
    );

  return stableHash(JSON.stringify(ordered));
}

export function createNFLProviderNeutralAvailabilityResearchSource({
  checkedAt = new Date().toISOString(),
} = {}) {
  return researchRepository.createResearchSource({
    sourceId: NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID,
    name: "LBHT NFL Availability Multi-Signal Evidence",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.APPROVED,
    description:
      "Provider-neutral normalized NFL roster, transaction, role/depth, gameday, and official availability signals.",
    domains: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_DOMAIN],
    permittedRoles: [
      researchRepository.RESEARCH_ROLES.RECORDED_OBSERVATION,
      researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE,
    ],
    prohibitedRoles: [],
    independenceGroup: "MULTI_SOURCE",
    methodology: {
      available: true,
      publicDescription:
        "LBHT preserves provider provenance and distinct evidence classes before canonical football-intelligence resolution.",
      methodologyRef: null,
    },
    access: {
      type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.LICENSED,
      location: "PROVIDER_SPECIFIC_PROVENANCE_ON_EACH_SIGNAL",
      requiresAuthentication: false,
    },
    usageRestrictions: {
      rawContentStorageAllowed: false,
      quotationAllowed: false,
      derivedFactsAllowed: true,
      redistributionAllowed: false,
      attributionRequired: true,
      notes:
        "Persist normalized observations and per-signal provenance; provider-specific raw payloads remain outside this capture boundary.",
    },
    conflicts: { disclosed: false, subjects: [], organizations: [] },
    verificationRequirements: [
      researchRepository.RESEARCH_VERIFICATION_REQUIREMENTS.AUTOMATED,
    ],
    provenance: {
      createdBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      createdAt: checkedAt,
      updatedBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      updatedAt: checkedAt,
    },
    metadata: {
      tags: [
        "nfl",
        "availability",
        "multi-signal",
        "provider-neutral",
        "dynamic-evidence",
      ],
    },
  });
}

function createObservation(signal, checkedAt) {
  const snapshot =
    normalizedNFLProviderNeutralAvailabilitySignalSnapshot(signal);
  const fingerprint = signalFingerprint(signal);
  const pRef = playerRef(signal);
  const occurredAt =
    clean(signal?.timing?.effectiveAt) ||
    clean(signal?.timing?.observedAt) ||
    checkedAt;

  const observationId = [
    "observation:nfl-multisignal-availability",
    signal.season,
    gameTypeToken(signal.gameType),
    signal.week,
    token(signal.team),
    token(pRef),
    token(signal.signalClass),
    fingerprint,
  ].join(":");

  return researchRepository.createRecordedObservation({
    observationId,
    sessionRef: getNFLProviderNeutralAvailabilitySessionId(
      signal.season,
      signal.gameType,
      signal.week
    ),
    sourceRefs: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID],
    observationType: researchRepository.RECORDED_OBSERVATION_TYPES.STATUS,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.IMPORTED_DATA,
    subjects: [
      {
        subjectRef: pRef,
        subjectType: "NFL_PLAYER",
        role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY,
        label: signal?.player?.playerName || null,
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
      field: "availability_signal",
      recordType: NFL_PROVIDER_NEUTRAL_AVAILABILITY_RECORD_TYPE,
      valueText: JSON.stringify(snapshot),
      effectiveAt: occurredAt,
    },
    verification: {
      state:
        researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES
          .VERIFIED_WITH_LIMITATIONS,
      verifiedBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_VERIFIER,
      verifiedAt: checkedAt,
      method: "AUTOMATED_PROVIDER_NORMALIZATION",
      limitations: [
        "Provider evidence is preserved as published; LBHT resolution remains a separate layer.",
      ],
    },
    provenance: {
      recordedBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      recordedAt: checkedAt,
      createdBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      createdAt: checkedAt,
    },
    metadata: {
      tags: [
        "nfl-multisignal-availability",
        `signal:${signal.signalClass}`,
        `authority:${signal.authority ?? "UNKNOWN"}`,
        `provider:${signal?.provenance?.source || signal?.metadata?.provider || "UNKNOWN"}`,
        `season:${signal.season}`,
        `game-type:${String(signal.gameType || "UNKNOWN").toUpperCase()}`,
        `week:${signal.week}`,
        `team:${signal.team}`,
      ],
    },
  });
}

function createSession({
  season,
  gameType,
  week,
  observationRefs,
  evidenceRefs,
  checkedAt,
}) {
  return researchRepository.createResearchSession({
    sessionId: getNFLProviderNeutralAvailabilitySessionId(
      season,
      gameType,
      week
    ),
    title: `NFL Multi-Signal Availability Acquisition — ${season} ${String(
      gameType || "UNKNOWN"
    ).toUpperCase()} Week ${week}`,
    description:
      "Governed acquisition of distinct provider-neutral NFL availability evidence classes.",
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
      objectives: [
        "Persist canonical provider-neutral availability signals without collapsing evidence classes or owning prediction logic.",
      ],
      inclusionCriteria: [
        `NFL season ${season}`,
        `NFL game type ${String(gameType || "UNKNOWN").toUpperCase()}`,
        `NFL week ${week}`,
      ],
      exclusionCriteria: [
        "Application prediction logic",
        "Provider-specific reasoning",
        "Pick'em reasoning",
      ],
      sourceClasses: [
        researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER,
      ],
      domains: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_DOMAIN],
      limitations: ["Availability is time-sensitive."],
    },
    researchers: [
      {
        researcherRef: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
        role: "AUTOMATED_ACQUISITION",
        startedAt: checkedAt,
      },
    ],
    sourceRefs: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID],
    researchPlan: {
      methodology:
        "Normalize each provider signal into a distinct immutable recorded observation while preserving original provider provenance.",
      plannedSourceRefs: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID],
      plannedActivities: [
        "Acquire sustainable provider feeds",
        "Normalize canonical signals",
        "Upsert governed evidence",
      ],
      verificationPlan:
        "Contract diagnostics, provenance preservation, idempotency, and provider-independence checks.",
    },
    execution: {
      startedAt: checkedAt,
      activitiesCompleted: [
        "Provider acquisition attempted",
        "Signal normalization performed",
      ],
    },
    artifactRefs: {
      recordedObservationRefs: observationRefs,
      analyticalObservationRefs: [],
      evidenceArtifactRefs: evidenceRefs,
      otherArtifactRefs: [],
    },
    verification: {
      state:
        researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.IN_PROGRESS,
      limitations: ["Session remains open while weekly evidence can change."],
    },
    review: {
      required: false,
      reviewTypes: [researchRepository.RESEARCH_SESSION_REVIEW_TYPES.NONE],
    },
    provenance: {
      createdBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      createdAt: checkedAt,
      updatedBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      updatedAt: checkedAt,
    },
    metadata: {
      tags: [
        "nfl-multisignal-availability",
        "provider-neutral",
        `season:${season}`,
        `game-type:${String(gameType || "UNKNOWN").toUpperCase()}`,
        `week:${week}`,
      ],
    },
  });
}

function createArtifact({
  season,
  gameType,
  week,
  team,
  signals,
  observationRefs,
  checkedAt,
}) {
  const hash = teamFingerprint(signals);
  const sourceUrls = [
    ...new Set(signals.map((signal) => signal?.provenance?.sourceUrl).filter(Boolean)),
  ];
  const providerSources = [
    ...new Set(
      signals
        .map(
          (signal) =>
            signal?.provenance?.source || signal?.metadata?.provider || null
        )
        .filter(Boolean)
    ),
  ].sort();
  const classes = [
    ...new Set(signals.map((signal) => signal.signalClass).filter(Boolean)),
  ].sort();

  return researchRepository.createEvidenceArtifact({
    evidenceId: getNFLProviderNeutralAvailabilityEvidenceId(
      season,
      gameType,
      week,
      team
    ),
    sessionRef: getNFLProviderNeutralAvailabilitySessionId(
      season,
      gameType,
      week
    ),
    sourceRefs: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID],
    recordedObservationRefs: observationRefs,
    analyticalObservationRefs: [],
    relatedEvidenceRefs: [],
    state: researchRepository.EVIDENCE_ARTIFACT_STATES.ACTIVE,
    title: `${team} NFL Multi-Signal Availability Evidence — ${season} ${String(
      gameType || "UNKNOWN"
    ).toUpperCase()} Week ${week}`,
    summary: `Current index of ${signals.length} normalized availability signals across ${
      classes.join(", ") || "no signal classes"
    }.`,
    classification: {
      domains: [NFL_PROVIDER_NEUTRAL_AVAILABILITY_DOMAIN],
      categories: ["PLAYER_AVAILABILITY", "MULTI_SIGNAL"],
      role: researchRepository.EVIDENCE_ROLES.DIRECT,
      direction: researchRepository.EVIDENCE_DIRECTIONS.NEUTRAL,
      strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED,
      applicability:
        researchRepository.EVIDENCE_APPLICABILITY_STATES.APPLICABLE,
      tags: [
        "nfl-multisignal-availability",
        "provider-neutral",
        `season:${season}`,
        `game-type:${String(gameType || "UNKNOWN").toUpperCase()}`,
        `week:${week}`,
        `team:${team}`,
        ...classes.map((value) => `signal:${value}`),
        ...providerSources.map((value) => `provider:${value}`),
      ],
      notes:
        "Current index only; superseded observations remain preserved.",
    },
    basis: [
      {
        basisType: researchRepository.EVIDENCE_BASIS_TYPES.RESEARCH_SOURCE,
        ref: NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID,
        contribution:
          "Provider-neutral capture boundary; exact external provider provenance is preserved on each signal.",
      },
    ],
    targets: [
      {
        targetType: researchRepository.EVIDENCE_TARGET_TYPES.SUBJECT,
        targetRef: teamRef(team),
        label: team,
        relationship: "CURRENT_MULTI_SIGNAL_AVAILABILITY_EVIDENCE",
      },
    ],
    assessment: {
      rationale:
        "Preserves distinct evidence classes and exact provider provenance for downstream canonical resolution.",
      limitations: [
        "Absence of an official injury report does not imply healthy status.",
        "Roster and depth evidence do not constitute medical evidence.",
      ],
      assumptions: [],
    },
    conflicts: {
      state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE,
    },
    verification: {
      state:
        researchRepository.EVIDENCE_VERIFICATION_STATES
          .VERIFIED_WITH_LIMITATIONS,
      verifiedBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_VERIFIER,
      verifiedAt: checkedAt,
      method: "AUTOMATED_PROVIDER_NORMALIZATION",
      limitations: [
        "Normalization verification is not independent medical verification.",
      ],
    },
    review: {
      required: false,
      outcome: researchRepository.EVIDENCE_REVIEW_OUTCOMES.NO_DECISION,
    },
    provenance: {
      createdBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      createdAt: checkedAt,
      updatedBy: NFL_PROVIDER_NEUTRAL_AVAILABILITY_ACTOR,
      updatedAt: checkedAt,
    },
    metadata: {
      tags: ["nfl-multisignal-availability-current-index", "provider-neutral"],
      externalRefs: [...sourceUrls, `content-hash:${hash}`],
      relatedSubjectRefs: [teamRef(team)],
      providerSources,
    },
  });
}

export function createNFLProviderNeutralAvailabilityResearchBundle(
  signals = [],
  { checkedAt = new Date().toISOString() } = {}
) {
  const canonical = (Array.isArray(signals) ? signals : []).filter(
    (signal) =>
      signal?.season &&
      signal?.week &&
      signal?.gameType &&
      signal?.team &&
      signal?.signalClass
  );

  const source = createNFLProviderNeutralAvailabilityResearchSource({
    checkedAt,
  });

  const groups = new Map();

  for (const signal of canonical) {
    const key = `${signal.season}:${String(signal.gameType).toUpperCase()}:${
      signal.week
    }:${signal.team}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(signal);
  }

  const observations = [];
  const artifacts = [];
  const sessions = new Map();

  for (const group of groups.values()) {
    const { season, gameType, week, team } = group[0];
    const groupObservations = group.map((signal) =>
      createObservation(signal, checkedAt)
    );

    observations.push(...groupObservations);

    const artifact = createArtifact({
      season,
      gameType,
      week,
      team,
      signals: group,
      observationRefs: groupObservations.map(
        (observation) => observation.observationId
      ),
      checkedAt,
    });

    artifacts.push(artifact);

    const key = `${season}:${String(gameType).toUpperCase()}:${week}`;
    const state = sessions.get(key) || {
      season,
      gameType,
      week,
      observationRefs: [],
      evidenceRefs: [],
    };

    state.observationRefs.push(
      ...groupObservations.map((observation) => observation.observationId)
    );
    state.evidenceRefs.push(artifact.evidenceId);
    sessions.set(key, state);
  }

  return {
    source,
    observations,
    artifacts,
    sessions: [...sessions.values()].map((state) =>
      createSession({ ...state, checkedAt })
    ),
    summary: {
      signalCount: canonical.length,
      observationCount: observations.length,
      artifactCount: artifacts.length,
      sessionCount: sessions.size,
      teamWeekCount: groups.size,
      signalClasses: [
        ...new Set(canonical.map((signal) => signal.signalClass)),
      ].sort(),
      providerSources: [
        ...new Set(
          canonical
            .map(
              (signal) =>
                signal?.provenance?.source ||
                signal?.metadata?.provider ||
                null
            )
            .filter(Boolean)
        ),
      ].sort(),
    },
  };
}
