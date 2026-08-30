import researchRepository from "../../../researchRepository/index.js";
import { firstProspectCohortFixtures } from "../../fid/population/fixtures/firstProspectCohortFixtures.js";

export const peterWoodsLegacyResearchReference = Object.freeze({
  sourceRef: "src/data/footballIntelligence/metadata/researchRecords.js#prospectIds.PETER_WOODS",
  prospectId: "2026-peter-woods",
});

export const peterWoodsPopulationFixture = firstProspectCohortFixtures.find(
  (entry) => entry.subject.slug === "peter-woods"
);

export function createPeterWoodsResearchMigrationFixture(legacyRecord) {
  if (!legacyRecord || legacyRecord.prospectId !== peterWoodsLegacyResearchReference.prospectId) {
    throw new TypeError("The Peter Woods legacy research record is required.");
  }

  const source = researchRepository.createResearchSource({
    sourceId: "research-source:peter-woods:legacy-metadata",
    name: "Peter Woods legacy research metadata record",
    sourceClass: researchRepository.RESEARCH_SOURCE_CLASSES.INTERNAL_LBHT_RESEARCH,
    status: researchRepository.RESEARCH_SOURCE_STATUSES.CANDIDATE,
    access: { type: researchRepository.RESEARCH_SOURCE_ACCESS_TYPES.INTERNAL },
  });
  const session = researchRepository.createResearchSession({
    sessionId: "research-session:peter-woods:legacy-migration",
    title: "Peter Woods legacy research metadata migration",
    sessionType: researchRepository.RESEARCH_SESSION_TYPES.SOURCE_REVIEW,
    status: researchRepository.RESEARCH_SESSION_STATUSES.PLANNED,
    sourceRefs: [source.sourceId],
    scope: { state: researchRepository.RESEARCH_SESSION_SCOPE_STATES.DEFINED },
    verification: { state: researchRepository.RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED },
    review: { required: true, reviewTypes: [researchRepository.RESEARCH_SESSION_REVIEW_TYPES.PEER_REVIEW] },
  });
  const recordedObservation = researchRepository.createRecordedObservation({
    observationId: "recorded-observation:peter-woods:legacy-metadata",
    sessionRef: session.sessionId,
    sourceRefs: [source.sourceId],
    observationType: researchRepository.RECORDED_OBSERVATION_TYPES.DOCUMENTED_FACT,
    origin: researchRepository.RECORDED_OBSERVATION_ORIGINS.RESEARCHER_RECORDED,
    title: "Legacy research metadata declaration",
    description: legacyRecord.notes,
    temporal: { type: researchRepository.RECORDED_OBSERVATION_TEMPORAL_TYPES.DATE_ONLY, occurredAt: legacyRecord.lastUpdated },
    spatial: { type: researchRepository.RECORDED_OBSERVATION_SPATIAL_TYPES.NOT_APPLICABLE },
    record: { field: "legacyResearchMetadata", valueText: JSON.stringify(legacyRecord) },
    verification: { state: researchRepository.RECORDED_OBSERVATION_VERIFICATION_STATES.UNVERIFIED },
    provenance: { recordedBy: legacyRecord.verifiedBy },
  });
  const analyticalObservation = researchRepository.createAnalyticalObservation({
    analysisId: "analytical-observation:peter-woods:migration-readiness",
    sessionRef: session.sessionId,
    sourceRefs: [source.sourceId],
    recordedObservationRefs: [recordedObservation.observationId],
    analysisType: researchRepository.ANALYTICAL_OBSERVATION_TYPES.INTERPRETATION,
    scope: researchRepository.ANALYTICAL_OBSERVATION_SCOPES.SINGLE_OBSERVATION,
    statement: { text: "The legacy record preserves research-administration metadata but does not contain governed football observations." },
    evaluator: { evaluatorLabel: "Sprint 36 migration diagnostic" },
    confidence: { level: researchRepository.ANALYTICAL_CONFIDENCE_LEVELS.MODERATE },
    verification: { state: researchRepository.ANALYTICAL_VERIFICATION_STATES.UNVERIFIED },
    review: { required: true },
  });
  const evidenceArtifact = researchRepository.createEvidenceArtifact({
    evidenceId: "evidence-artifact:peter-woods:legacy-metadata",
    sessionRef: session.sessionId,
    sourceRefs: [source.sourceId],
    recordedObservationRefs: [recordedObservation.observationId],
    analyticalObservationRefs: [analyticalObservation.analysisId],
    state: researchRepository.EVIDENCE_ARTIFACT_STATES.DRAFT,
    summary: "Legacy metadata supports the existence and provenance of the research record only.",
    classification: { role: researchRepository.EVIDENCE_ROLES.CONTEXTUAL, direction: researchRepository.EVIDENCE_DIRECTIONS.NEUTRAL, strength: researchRepository.EVIDENCE_STRENGTHS.UNSPECIFIED, applicability: researchRepository.EVIDENCE_APPLICABILITY_STATES.UNKNOWN },
    targets: [{ targetType: researchRepository.EVIDENCE_TARGET_TYPES.CONCEPT, targetRef: peterWoodsPopulationFixture.subject.legacyProspectId }],
    conflicts: { state: researchRepository.EVIDENCE_CONFLICT_STATES.NONE },
    verification: { state: researchRepository.EVIDENCE_VERIFICATION_STATES.UNVERIFIED },
    review: { required: true },
  });

  return Object.freeze({
    subject: peterWoodsPopulationFixture.subject,
    legacyReference: peterWoodsLegacyResearchReference,
    legacyRecord: structuredClone(legacyRecord),
    populationFixture: peterWoodsPopulationFixture,
    governed: Object.freeze({ source, session, recordedObservation, analyticalObservation, evidenceArtifact }),
    effects: Object.freeze({ persistencePerformed: false, promotionPerformed: false, runtimeIntegrationPerformed: false, canonicalFidRecordCreated: false }),
  });
}

export default Object.freeze({ peterWoodsLegacyResearchReference, peterWoodsPopulationFixture, createPeterWoodsResearchMigrationFixture });
