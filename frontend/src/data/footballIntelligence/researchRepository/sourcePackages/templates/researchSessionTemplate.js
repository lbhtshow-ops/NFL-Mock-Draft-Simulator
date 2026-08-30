export function createResearchSessionTemplate(overrides = {}) {
  return Object.freeze({ sessionId: "REPLACE_WITH_RESEARCH_SESSION_ID", researcherRef: "REPLACE_WITH_RESEARCHER_REFERENCE", purpose: null, scope: { state: "UNKNOWN", description: null }, subjectRefs: ["REPLACE_WITH_SUBJECT_REFERENCE"], sourceRefs: [], artifactRefs: [], researchDate: null, notes: null, status: "PLANNED", verification: { state: "UNVERIFIED" }, provenance: { createdBy: null, createdAt: null }, ...overrides });
}
export default Object.freeze({ createResearchSessionTemplate });
