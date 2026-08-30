import { createResearchSourcePackage } from "../../ResearchSourcePackageContract.js";
import { assessResearchSourcePackage } from "../../ResearchSourcePackageValidation.js";
import { researchSource } from "./sourceIntake.js";
import { subjectRef } from "./recordedObservations.js";
import { analyticalObservationRefs } from "./analyticalObservations.js";
import { researchSession, recordedObservations, evidenceArtifact, evidenceReviewDecisions, reviewerDeclaration } from "./evidenceReview.js";
import { pendingPopulationLink } from "./populationLinkDeclaration.js";

export const packageReviewDecision = Object.freeze({ reviewerRef: reviewerDeclaration.reviewerRef, reviewerAuthorized: true, reviewedAt: reviewerDeclaration.reviewedAt, decision: "APPROVE", findings: Object.freeze(["Approved ResearchSource", "Verified ResearchSession", "Five independently verified RecordedObservations", "Active and verified Production EvidenceArtifact", "One stable primary source artifact lineage"]), populationUseAuthorized: false });
export const packageManifestDeclaration = Object.freeze({ packageId: "research-package:rsp-0001", packageStandardVersion: "1.0", packageRevision: 1, subjectRef, cycleRef: pendingPopulationLink.cycleRef, researchDomain: "PRODUCTION", createdAt: "2026-07-18", updatedAt: "2026-07-18", status: "APPROVED", ownerRef: "reviewer:repository-owner", researchSourceRef: researchSource.sourceId, researchSessionRefs: [researchSession.sessionId], recordedObservationRefs: recordedObservations.map((entry) => entry.observationId), analyticalObservationRefs, evidenceArtifactRefs: [evidenceArtifact.evidenceId], evidenceReviewDecisionRefs: evidenceReviewDecisions.map((entry) => entry.reviewId), populationLinkRefs: [pendingPopulationLink.linkId], additionalRefs: [], governance: { decision: packageReviewDecision.decision, authorized: packageReviewDecision.reviewerAuthorized, reviewerRef: packageReviewDecision.reviewerRef, reviewedAt: packageReviewDecision.reviewedAt, findings: packageReviewDecision.findings }, provenance: { createdBy: null, createdAt: "2026-07-18", updatedBy: packageReviewDecision.reviewerRef, updatedAt: packageReviewDecision.reviewedAt }, lifecycle: { state: "APPROVED", revision: 1 }, previousPackageRevisionRef: null });
export const packageManifest = createResearchSourcePackage(packageManifestDeclaration);
export const packageAssessment = assessResearchSourcePackage(packageManifestDeclaration, { researchSource, researchSessions: [researchSession], recordedObservations, analyticalObservations: [], evidenceArtifacts: [evidenceArtifact], evidenceReviewDecisions, populationLinks: [pendingPopulationLink] });

export default Object.freeze({ packageReviewDecision, packageManifestDeclaration, packageManifest, packageAssessment });
