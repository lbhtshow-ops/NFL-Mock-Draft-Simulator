import { runEvidenceReviewWorkflow } from "../../../evidenceReview/EvidenceReviewWorkflow.js";
import { researchSource } from "./sourceIntake.js";
import { researchSession as pendingResearchSession } from "./researchSession.js";
import { recordedObservations as pendingRecordedObservations, subjectRef } from "./recordedObservations.js";
import { analyticalObservations } from "./analyticalObservations.js";
import { evidenceArtifact as pendingEvidenceArtifact } from "./evidenceArtifact.js";

export const reviewerDeclaration = Object.freeze({ reviewerRef: "reviewer:repository-owner", reviewerAuthorized: true, reviewedAt: "2026-07-18" });
const common = { ...reviewerDeclaration, decision: "APPROVE", sourceRef: researchSource.sourceId, sessionRef: pendingResearchSession.sessionId, subjectRef, artifactLocationRef: researchSource.access.location, rejectionReasons: [], blockerReasons: [], requestedChanges: [], conflicts: [], limitations: [], duplicateReviewRefs: [], provenance: { createdBy: reviewerDeclaration.reviewerRef, createdAt: reviewerDeclaration.reviewedAt }, lifecycle: { state: "CLOSED", revision: 1 } };

export const sessionReview = runEvidenceReviewWorkflow({ ...common, reviewId: "evidence-review:rsp-0002:session", reviewRevision: 1, reviewScope: "RESEARCH_SESSION", targetRef: pendingResearchSession.sessionId, supportingObservationRefs: [], supportingAnalysisRefs: [], verificationFindings: ["The session used only the declared Clemson profile and remained within objective official-profile facts."], notes: "Source lineage, exclusions, locators, and preserved unknowns reviewed.", researchSource, researchSession: pendingResearchSession, recordedObservations: pendingRecordedObservations, analyticalObservations, evidenceArtifacts: [pendingEvidenceArtifact] });
export const researchSession = sessionReview.result.derivedRecords.researchSession;

export const observationReviews = Object.freeze(pendingRecordedObservations.map((observation, index) => runEvidenceReviewWorkflow({ ...common, reviewId: `evidence-review:rsp-0002:observation-${index + 1}`, reviewRevision: 1, reviewScope: "RECORDED_OBSERVATION", targetRef: observation.observationId, supportingObservationRefs: [observation.observationId], supportingAnalysisRefs: [], verificationFindings: [`The value matched the declared ${observation.spatial.documentLocator.section} locator: ${observation.spatial.documentLocator.notes}.`], notes: "Objective published value verified without analytical interpretation.", researchSource, researchSession, recordedObservations: pendingRecordedObservations, analyticalObservations, evidenceArtifacts: [pendingEvidenceArtifact] })));
export const recordedObservations = Object.freeze(observationReviews.map((entry) => entry.result.derivedRecords.recordedObservation));

export const artifactReview = runEvidenceReviewWorkflow({ ...common, reviewId: "evidence-review:rsp-0002:artifact", reviewRevision: 1, reviewScope: "EVIDENCE_ARTIFACT", targetRef: pendingEvidenceArtifact.evidenceId, supportingObservationRefs: recordedObservations.map((entry) => entry.observationId), supportingAnalysisRefs: [], verificationFindings: ["Source, session, eight observations, subject, and five category references are consistent."], notes: "Approved only for the five declared official-profile evidence categories; no analytical scope is authorized.", researchSource, researchSession, recordedObservations, analyticalObservations, evidenceArtifacts: [pendingEvidenceArtifact] });
export const evidenceArtifact = artifactReview.result.derivedRecords.evidenceArtifact;
export const evidenceReviewDecisions = Object.freeze([sessionReview.decision, ...observationReviews.map((entry) => entry.decision), artifactReview.decision]);
export const evidenceReviewState = Object.freeze({ state: "VERIFIED", reviewerRef: reviewerDeclaration.reviewerRef, reviewerAuthorized: true, reviewedAt: reviewerDeclaration.reviewedAt, decisionRefs: Object.freeze(evidenceReviewDecisions.map((entry) => entry.reviewId)) });

export default Object.freeze({ reviewerDeclaration, sessionReview, observationReviews, artifactReview, researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions, evidenceReviewState });
