export function createEvidenceReviewTemplate(overrides = {}) {
  return Object.freeze({ reviewId: "REPLACE_WITH_EVIDENCE_REVIEW_ID", reviewRevision: 1, reviewScope: "REPLACE_WITH_EXACT_REVIEW_SCOPE", targetRef: null, reviewerRef: "REPLACE_WITH_REVIEWER_REFERENCE", reviewerAuthorized: false, decision: "PENDING", reviewedAt: null, verificationFindings: [], requestedChanges: [], rejectionReasons: [], limitations: [], provenance: { createdBy: null, createdAt: null }, lifecycle: { state: "DRAFT", revision: 1 }, ...overrides });
}
export default Object.freeze({ createEvidenceReviewTemplate });
