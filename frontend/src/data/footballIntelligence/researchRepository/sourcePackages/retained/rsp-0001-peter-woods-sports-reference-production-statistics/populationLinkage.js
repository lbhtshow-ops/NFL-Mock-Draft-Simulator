import { createEvidencePopulationLink } from "../../../evidenceLinkage/EvidencePopulationLinkContract.js";
import { runEvidencePopulationLinkWorkflow } from "../../../evidenceLinkage/EvidencePopulationLinkWorkflow.js";
import { researchSource } from "./sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact, reviewerDeclaration } from "./evidenceReview.js";
import { packageAssessment } from "./packageManifest.js";
import { populationWorkflow, populationResult, pendingPopulationLinkDeclaration } from "./populationLinkDeclaration.js";

if (!packageAssessment.packageApproved) throw new Error("RSP-0001 Population authorization requires an approved package.");
export const populationAuthorizationDecision = Object.freeze({ reviewerRef: reviewerDeclaration.reviewerRef, reviewerAuthorized: true, reviewedAt: reviewerDeclaration.reviewedAt, decision: "APPROVE", category: "PRODUCTION", limitations: Object.freeze(["Authorization applies only to RSP-0001 Production evidence.", "The legacy-2026 versus target-2027 conflict remains unresolved.", "No non-Production evidence category is authorized."]) });
export const populationLinkageDeclaration = Object.freeze({ ...pendingPopulationLinkDeclaration, linkRevision: 2, populationUseDecision: populationAuthorizationDecision.decision, reviewer: { reviewerRef: populationAuthorizationDecision.reviewerRef, reviewedAt: populationAuthorizationDecision.reviewedAt, authorized: populationAuthorizationDecision.reviewerAuthorized, notes: populationAuthorizationDecision.limitations.join(" ") }, provenance: { ...pendingPopulationLinkDeclaration.provenance, updatedBy: populationAuthorizationDecision.reviewerRef, updatedAt: populationAuthorizationDecision.reviewedAt }, lifecycle: { state: "APPROVED", revision: 2 } });
export const populationLink = createEvidencePopulationLink(populationLinkageDeclaration);
export const populationLinkageAssessment = runEvidencePopulationLinkWorkflow({ ...populationLinkageDeclaration, populationWorkflow, populationResult, researchSources: [researchSource], researchSessions: [researchSession], recordedObservations, analyticalObservations: [], evidenceArtifacts: [evidenceArtifact] });

export default Object.freeze({ populationAuthorizationDecision, populationLinkageDeclaration, populationLink, populationLinkageAssessment });
