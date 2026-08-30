export function createPopulationLinkageTemplate(overrides = {}) {
  return Object.freeze({ linkId: "REPLACE_WITH_POPULATION_LINK_ID", linkRevision: 1, populationWorkflowRef: null, researchSourceRef: null, researchSessionRef: null, recordedObservationRefs: [], analyticalObservationRefs: [], evidenceArtifactRefs: [], subjectRef: "REPLACE_WITH_EXACT_SUBJECT_REFERENCE", cycleRef: "UNKNOWN", populationEvidenceCategory: "UNKNOWN", repositoryEvidenceState: "UNVERIFIED", populationUseDecision: "PENDING", reviewer: { reviewerRef: null, reviewedAt: null, authorized: false }, coverageContribution: false, provenance: { createdBy: null, createdAt: null }, lifecycle: { state: "DRAFT", revision: 1 }, ...overrides });
}
export default Object.freeze({ createPopulationLinkageTemplate });
