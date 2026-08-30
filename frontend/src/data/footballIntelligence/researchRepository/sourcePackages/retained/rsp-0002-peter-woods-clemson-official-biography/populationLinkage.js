import { createEvidencePopulationLink } from "../../../evidenceLinkage/EvidencePopulationLinkContract.js";
import { runEvidencePopulationLinkWorkflow } from "../../../evidenceLinkage/EvidencePopulationLinkWorkflow.js";
import { researchSource } from "./sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact, reviewerDeclaration } from "./evidenceReview.js";
import { packageAssessment } from "./packageManifest.js";
import { populationLinks as pendingPopulationLinks, populationWorkflow, populationResult } from "./populationLinkDeclaration.js";

if (!packageAssessment.packageApproved) throw new Error("RSP-0002 Population authorization requires an approved package.");
export const originalPopulationWorkflowSnapshot = JSON.stringify(populationWorkflow);
export const originalPopulationResultSnapshot = JSON.stringify(populationResult);
const limitationsByCategory = Object.freeze({
  IDENTITY: ["Authorization is limited to the published player identity."],
  AFFILIATION: ["Authorization is limited to the published Clemson roster affiliation for Season 2024-25."],
  POSITION: ["Authorization is limited to the published DL position label."],
  CLASS_YEAR: ["Authorization is limited to Clemson's published So. designation and does not resolve the legacy-2026 versus target-2027 cycle conflict or establish eligibility."],
  MEASUREMENTS: ["Authorization is limited to the published 6-3 height and 315 lbs weight values."],
});
export const populationAuthorizationDecisions = Object.freeze(pendingPopulationLinks.map((entry) => Object.freeze({ reviewerRef: reviewerDeclaration.reviewerRef, reviewerAuthorized: true, reviewedAt: reviewerDeclaration.reviewedAt, decision: "APPROVE", category: entry.populationEvidenceCategory, limitations: Object.freeze([...limitationsByCategory[entry.populationEvidenceCategory], "No eligibility, declaration, scouting, analytical, or non-declared category use is authorized."]) })));
export const populationLinkageDeclarations = Object.freeze(pendingPopulationLinks.map((entry, index) => Object.freeze({ ...entry, linkRevision: 2, populationUseDecision: "APPROVE", reviewer: { reviewerRef: reviewerDeclaration.reviewerRef, reviewedAt: reviewerDeclaration.reviewedAt, authorized: true, notes: populationAuthorizationDecisions[index].limitations.join(" ") }, provenance: { ...entry.provenance, updatedBy: reviewerDeclaration.reviewerRef, updatedAt: reviewerDeclaration.reviewedAt }, lifecycle: { state: "APPROVED", revision: 2 } })));
export const populationLinks = Object.freeze(populationLinkageDeclarations.map(createEvidencePopulationLink));
export const populationLinkageAssessments = Object.freeze(populationLinkageDeclarations.map((entry) => runEvidencePopulationLinkWorkflow({ ...entry, populationWorkflow, populationResult, researchSources: [researchSource], researchSessions: [researchSession], recordedObservations, analyticalObservations: [], evidenceArtifacts: [evidenceArtifact] })));

export default Object.freeze({ populationAuthorizationDecisions, populationLinkageDeclarations, populationLinks, populationLinkageAssessments });
