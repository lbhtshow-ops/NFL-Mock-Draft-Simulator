import researchRepository from "../../../../researchRepository/index.js";

export const NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID = "research-source:sportradar-nfl-availability-multisignal";
export const NFL_MULTI_SIGNAL_AVAILABILITY_DOMAIN = "NFL_PLAYER_AVAILABILITY";
export const NFL_MULTI_SIGNAL_AVAILABILITY_RECORD_TYPE = "NFL_MULTI_SIGNAL_AVAILABILITY";
export const NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR = "lbht-sports-intelligence-acquisition";
export const NFL_MULTI_SIGNAL_AVAILABILITY_VERIFIER = "lbht-automated-source-normalization";

const token = (v) => encodeURIComponent(String(v ?? "unknown").trim().toLowerCase());
const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
function stableHash(text) {
  let first = 2166136261, second = 2246822519;
  const input = String(text || "");
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    first ^= code; first = Math.imul(first, 16777619);
    second ^= code + i; second = Math.imul(second, 3266489917);
  }
  return `${(first >>> 0).toString(16).padStart(8,"0")}${(second >>> 0).toString(16).padStart(8,"0")}`;
}

function gameTypeToken(gameType) {
  const value = String(gameType ?? "UNKNOWN").trim().toUpperCase();
  return token(value || "UNKNOWN");
}

export function getNFLMultiSignalAvailabilitySessionId(season, gameType, week) {
  return `research-session:nfl-multisignal-availability:${Number(season)}:${gameTypeToken(gameType)}:${Number(week)}`;
}
export function getNFLMultiSignalAvailabilityEvidenceId(season, gameType, week, team) {
  return `evidence:nfl-multisignal-availability:${Number(season)}:${gameTypeToken(gameType)}:${Number(week)}:${token(team)}`;
}
function playerRef(signal) {
  const id = signal?.player?.playerId || signal?.player?.providerPlayerId;
  return id ? `nfl-player:${token(id)}` : `nfl-player-name:${token(signal?.player?.playerName)}`;
}
function teamRef(team) { return `nfl-team:${token(team)}`; }

// Deliberately excludes acquisition-time observedAt when the provider supplies no content timestamp.
// This makes identical roster/depth snapshots idempotent while content changes create new observations.
export function normalizedNFLAvailabilitySignalSnapshot(signal = {}) {
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
    effectiveAt: signal?.timing?.effectiveAt || null,
    provenance: signal.provenance || null,
    metadata: signal.metadata || {},
  };
}
function signalFingerprint(signal) { return stableHash(JSON.stringify(normalizedNFLAvailabilitySignalSnapshot(signal))); }
function teamFingerprint(signals) {
  const ordered = signals.map(normalizedNFLAvailabilitySignalSnapshot)
    .sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return stableHash(JSON.stringify(ordered));
}

export function createNFLMultiSignalAvailabilityResearchSource({ checkedAt = new Date().toISOString() } = {}) {
  return researchRepository.createResearchSource({
    sourceId: NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID,
    name: "Sportradar NFL Availability Multi-Signal",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.APPROVED,
    description: "Normalized Sportradar NFL roster, transaction, depth-chart, and official injury-report signals.",
    domains: [NFL_MULTI_SIGNAL_AVAILABILITY_DOMAIN],
    permittedRoles: [researchRepository.RESEARCH_ROLES.RECORDED_OBSERVATION, researchRepository.RESEARCH_ROLES.DIRECT_EVIDENCE],
    prohibitedRoles: [], independenceGroup: "SPORTRADAR",
    methodology: { available: true, publicDescription: "LBHT preserves distinct provider signal classes before canonical football-intelligence resolution.", methodologyRef: "https://developer.sportradar.com/football/reference/nfl-overview" },
    access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.RESTRICTED, location: "https://api.sportradar.com/nfl/official/", requiresAuthentication: true },
    usageRestrictions: { rawContentStorageAllowed: false, quotationAllowed: false, derivedFactsAllowed: true, redistributionAllowed: false, attributionRequired: true, notes: "Persist normalized observations and provenance, not raw API payloads." },
    conflicts: { disclosed: false, subjects: [], organizations: [] },
    verificationRequirements: [researchRepository.RESEARCH_VERIFICATION_REQUIREMENTS.AUTOMATED],
    provenance: { createdBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, createdAt: checkedAt, updatedBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, updatedAt: checkedAt },
    metadata: { tags: ["nfl","availability","multi-signal","sportradar","dynamic-evidence"] },
  });
}

function createObservation(signal, checkedAt) {
  const snapshot = normalizedNFLAvailabilitySignalSnapshot(signal);
  const fingerprint = signalFingerprint(signal);
  const pRef = playerRef(signal);
  const occurredAt = clean(signal?.timing?.effectiveAt) || clean(signal?.timing?.observedAt) || checkedAt;
  const observationId = ["observation:nfl-multisignal-availability", signal.season, gameTypeToken(signal.gameType), signal.week, token(signal.team), token(pRef), token(signal.signalClass), fingerprint].join(":");
  return researchRepository.createRecordedObservation({
    observationId, sessionRef: getNFLMultiSignalAvailabilitySessionId(signal.season, signal.gameType, signal.week), sourceRefs: [NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID],
    observationType: researchRepository.RECORDED_OBSERVATION_TYPES.STATUS,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.IMPORTED_DATA,
    title: `${signal.team} ${signal?.player?.playerName || pRef} ${signal.signalClass}`,
    description: `Provider-recorded NFL availability signal ${signal.signalClass}.`,
    subjects: [
      { subjectRef: pRef, subjectType: "NFL_PLAYER", role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.PRIMARY, label: signal?.player?.playerName || null },
      { subjectRef: teamRef(signal.team), subjectType: "NFL_TEAM", role: researchRepository.RECORDED_OBSERVATION_SUBJECT_ROLES.SECONDARY, label: signal.team },
    ],
    temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.INSTANT, occurredAt, precision: researchRepository.RECORDED_OBSERVATION_PRECISION_LEVELS.EXACT, timezone: "UTC" },
    spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE },
    record: { field: "availability_signal", valueText: JSON.stringify(snapshot), recordType: NFL_MULTI_SIGNAL_AVAILABILITY_RECORD_TYPE, effectiveAt: occurredAt },
    verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS, verifiedBy: NFL_MULTI_SIGNAL_AVAILABILITY_VERIFIER, verifiedAt: checkedAt, method: "AUTOMATED_PROVIDER_NORMALIZATION", limitations: ["Provider evidence is preserved as published; LBHT resolution remains a separate layer."] },
    provenance: { recordedBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, recordedAt: checkedAt, createdBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, createdAt: checkedAt },
    metadata: { tags: ["nfl-player-availability","multi-signal",`signal:${signal.signalClass}`,`authority:${signal.authority}`,`season:${signal.season}`,`game-type:${String(signal.gameType || "UNKNOWN").toUpperCase()}`,`week:${signal.week}`,`team:${signal.team}`,`provider:${signal?.provenance?.source || "unknown"}`], externalRefs: [signal?.provenance?.sourceUrl].filter(Boolean) },
  });
}

function createSession({ season, gameType, week, observationRefs, evidenceRefs, checkedAt }) {
  return researchRepository.createResearchSession({
    sessionId: getNFLMultiSignalAvailabilitySessionId(season, gameType, week), title: `NFL Multi-Signal Availability Acquisition — ${season} ${String(gameType || "UNKNOWN").toUpperCase()} Week ${week}`,
    description: "Governed acquisition of distinct roster, transaction, depth-chart, and official injury-report evidence.",
    sessionType: researchRepository.RESEARCH_SESSION_TYPES.DATA_REVIEW, status: researchRepository.RESEARCH_SESSION_STATUSES.IN_PROGRESS,
    subjects: [{ subjectRef: `nfl-season:${season}`, subjectType: researchRepository.RESEARCH_SESSION_SUBJECT_TYPES.SEASON, label: `NFL ${season}` }],
    scope: { state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.DEFINED, objectives: ["Persist provider availability signals without collapsing evidence classes or owning prediction logic."], inclusionCriteria: [`NFL season ${season}`,`NFL game type ${String(gameType || "UNKNOWN").toUpperCase()}`,`NFL week ${week}`], exclusionCriteria: ["Application prediction logic","FID ownership"], sourceClasses: [researchRepository.RESEARCH_SOURCE_CLASSES.STATISTICAL_PROVIDER], domains: [NFL_MULTI_SIGNAL_AVAILABILITY_DOMAIN], limitations: ["Availability is time-sensitive."] },
    researchers: [{ researcherRef: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, role: "AUTOMATED_ACQUISITION", startedAt: checkedAt }], sourceRefs: [NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID],
    researchPlan: { methodology: "Normalize each provider signal into a distinct immutable recorded observation.", plannedSourceRefs: [NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID], plannedActivities: ["Acquire provider feeds","Normalize signals","Upsert governed evidence"], verificationPlan: "Contract diagnostics, provenance preservation, and idempotency checks." },
    execution: { startedAt: checkedAt, activitiesCompleted: ["Provider acquisition attempted","Signal normalization performed"] },
    artifactRefs: { recordedObservationRefs: observationRefs, analyticalObservationRefs: [], evidenceArtifactRefs: evidenceRefs, otherArtifactRefs: [] },
    verification: { state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.IN_PROGRESS, limitations: ["Session remains open while weekly evidence can change."] },
    review: { required: false, reviewTypes: [researchRepository.RESEARCH_SESSION_REVIEW_TYPES.NONE] },
    provenance: { createdBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, createdAt: checkedAt, updatedBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, updatedAt: checkedAt },
    metadata: { tags: ["nfl-multisignal-availability",`season:${season}`,`game-type:${String(gameType || "UNKNOWN").toUpperCase()}`,`week:${week}`] },
  });
}

function createArtifact({ season, gameType, week, team, signals, observationRefs, checkedAt }) {
  const hash = teamFingerprint(signals);
  const sourceUrls = [...new Set(signals.map(s => s?.provenance?.sourceUrl).filter(Boolean))];
  const classes = [...new Set(signals.map(s => s.signalClass).filter(Boolean))].sort();
  return researchRepository.createEvidenceArtifact({
    evidenceId: getNFLMultiSignalAvailabilityEvidenceId(season, gameType, week, team), sessionRef: getNFLMultiSignalAvailabilitySessionId(season, gameType, week), sourceRefs: [NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID],
    recordedObservationRefs: observationRefs, analyticalObservationRefs: [], relatedEvidenceRefs: [], state: researchRepository.EVIDENCE_ARTIFACT_STATES.ACTIVE,
    title: `${team} NFL Multi-Signal Availability Evidence — ${season} ${String(gameType || "UNKNOWN").toUpperCase()} Week ${week}`,
    summary: `Current index of ${signals.length} normalized availability signals across ${classes.join(", ") || "no signal classes"}.`,
    classification: { domains: [NFL_MULTI_SIGNAL_AVAILABILITY_DOMAIN], categories: ["PLAYER_AVAILABILITY","MULTI_SIGNAL"], role: researchRepository.EVIDENCE_ROLES.DIRECT, direction: researchRepository.EVIDENCE_DIRECTIONS.NEUTRAL, strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED, applicability: researchRepository.EVIDENCE_APPLICABILITY_STATES.APPLICABLE, tags: ["nfl-multisignal-availability",`season:${season}`,`game-type:${String(gameType || "UNKNOWN").toUpperCase()}`,`week:${week}`,`team:${team}`,...classes.map(c=>`signal:${c}`)], notes: "Current index only; superseded observations remain preserved." },
    basis: [{ basisType: researchRepository.EVIDENCE_BASIS_TYPES.RESEARCH_SOURCE, ref: NFL_MULTI_SIGNAL_AVAILABILITY_SOURCE_ID, contribution: "Provider source for normalized availability signals." }],
    targets: [{ targetType: researchRepository.EVIDENCE_TARGET_TYPES.SUBJECT, targetRef: teamRef(team), label: team, relationship: "CURRENT_MULTI_SIGNAL_AVAILABILITY_EVIDENCE" }],
    assessment: { rationale: "Preserves distinct provider signals for downstream canonical resolution.", limitations: ["Absence of an official injury report does not imply healthy status."], assumptions: [] },
    conflicts: { state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE },
    verification: { state: researchRepository.EVIDENCE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS, verifiedBy: NFL_MULTI_SIGNAL_AVAILABILITY_VERIFIER, verifiedAt: checkedAt, method: "AUTOMATED_PROVIDER_NORMALIZATION", limitations: ["Normalization verification is not independent medical verification."] },
    review: { required: false, outcome: researchRepository.EVIDENCE_REVIEW_OUTCOMES.NO_DECISION },
    provenance: { createdBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, createdAt: checkedAt, updatedBy: NFL_MULTI_SIGNAL_AVAILABILITY_ACTOR, updatedAt: checkedAt },
    metadata: { tags: ["nfl-multisignal-availability-current-index"], externalRefs: [...sourceUrls,`content-hash:${hash}`], relatedSubjectRefs: [teamRef(team)] },
  });
}

export function createNFLMultiSignalAvailabilityResearchBundle(signals = [], { checkedAt = new Date().toISOString() } = {}) {
  const canonical = (Array.isArray(signals) ? signals : []).filter(s => s?.season && s?.week && s?.gameType && s?.team && s?.signalClass);
  const source = createNFLMultiSignalAvailabilityResearchSource({ checkedAt });
  const groups = new Map();
  for (const signal of canonical) {
    const key = `${signal.season}:${String(signal.gameType).toUpperCase()}:${signal.week}:${signal.team}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(signal);
  }
  const observations = [], artifacts = [], sessions = new Map();
  for (const group of groups.values()) {
    const { season, gameType, week, team } = group[0];
    const obs = group.map(s => createObservation(s, checkedAt)); observations.push(...obs);
    const artifact = createArtifact({ season, gameType, week, team, signals: group, observationRefs: obs.map(o=>o.observationId), checkedAt }); artifacts.push(artifact);
    const key = `${season}:${String(gameType).toUpperCase()}:${week}`; const state = sessions.get(key) || { season, gameType, week, observationRefs: [], evidenceRefs: [] };
    state.observationRefs.push(...obs.map(o=>o.observationId)); state.evidenceRefs.push(artifact.evidenceId); sessions.set(key,state);
  }
  return { source, observations, artifacts, sessions: [...sessions.values()].map(s => createSession({ ...s, checkedAt })), summary: { signalCount: canonical.length, observationCount: observations.length, artifactCount: artifacts.length, sessionCount: sessions.size, teamWeekCount: groups.size, signalClasses: [...new Set(canonical.map(s=>s.signalClass))].sort() } };
}
