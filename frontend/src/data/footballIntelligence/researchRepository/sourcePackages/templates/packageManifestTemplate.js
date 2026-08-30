// One manifest represents one stable primary source artifact. researchSourceRef resolves that
// artifact through the governed ResearchSource access.location; EvidenceArtifact IDs are separate.
export function createPackageManifestTemplate(overrides = {}) {
  return Object.freeze({ packageId: "REPLACE_WITH_RESEARCH_PACKAGE_ID", packageStandardVersion: "1.0", packageRevision: 1, subjectRef: "REPLACE_WITH_SUBJECT_REFERENCE", cycleRef: "UNKNOWN", researchDomain: "UNKNOWN", createdAt: null, updatedAt: null, status: "DRAFT", ownerRef: "REPLACE_WITH_PACKAGE_OWNER_REFERENCE", researchSourceRef: null, researchSessionRefs: [], recordedObservationRefs: [], analyticalObservationRefs: [], evidenceArtifactRefs: [], evidenceReviewDecisionRefs: [], populationLinkRefs: [], additionalRefs: [], governance: { decision: "PENDING", authorized: false, reviewerRef: null, reviewedAt: null }, provenance: { createdBy: null, createdAt: null }, lifecycle: { state: "DRAFT", revision: 1 }, previousPackageRevisionRef: null, ...overrides });
}
export default Object.freeze({ createPackageManifestTemplate });
