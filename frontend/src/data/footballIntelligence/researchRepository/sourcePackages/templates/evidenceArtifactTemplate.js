export function createEvidenceArtifactTemplate(overrides = {}) {
  return Object.freeze({ evidenceId: "REPLACE_WITH_EVIDENCE_ARTIFACT_ID", sourceRefs: [], sessionRef: null, recordedObservationRefs: [], analyticalObservationRefs: [], subjectRef: "REPLACE_WITH_EXACT_SUBJECT_REFERENCE", artifactLocationRef: null, retainedContentRef: null, state: "DRAFT", review: { required: true, reviewerRefs: [], completedAt: null, outcome: "NO_DECISION" }, verification: { state: "UNVERIFIED", verifiedBy: null, verifiedAt: null }, provenance: { createdBy: null, createdAt: null }, ...overrides });
}
export default Object.freeze({ createEvidenceArtifactTemplate });
