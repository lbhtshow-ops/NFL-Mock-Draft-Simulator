import fidApi from "../../../../fid/index.js";
import { createEvidencePopulationLink } from "../../../evidenceLinkage/EvidencePopulationLinkContract.js";
import { firstProspectCohortFixtures } from "../../../../fid/population/fixtures/firstProspectCohortFixtures.js";
import { researchSource } from "./sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact } from "./evidenceReview.js";
import { subjectRef } from "./recordedObservations.js";

const populationFixture = firstProspectCohortFixtures.find((entry) => entry.subject.slug === "peter-woods");
export const populationWorkflow = fidApi.createPopulationWorkflow(populationFixture.workflowInput);
export const populationResult = fidApi.validatePopulationReadiness(populationWorkflow, { resultId: "population-result:rsp-0001:comparison", producedAt: "2026-07-18" });
export const pendingPopulationLinkDeclaration = Object.freeze({ linkId: "evidence-population-link:rsp-0001:production", linkRevision: 1, subjectRef, cycleRef: populationWorkflow.cycleRef, populationWorkflowRef: populationWorkflow.workflowId, researchSourceRef: researchSource.sourceId, researchSessionRef: researchSession.sessionId, recordedObservationRefs: recordedObservations.map((entry) => entry.observationId), analyticalObservationRefs: [], evidenceArtifactRefs: [evidenceArtifact.evidenceId], populationEvidenceCategory: fidApi.POPULATION_EVIDENCE_CATEGORIES.PRODUCTION, repositoryEvidenceState: evidenceArtifact.verification.state, populationUseDecision: "PENDING", reviewer: { reviewerRef: null, reviewedAt: null, authorized: false }, provenance: { createdBy: null, createdAt: "2026-07-18" }, lifecycle: { state: "DRAFT", revision: 1 }, duplicateLinkRefs: [], conflictingSourceRefs: [] });
export const pendingPopulationLink = createEvidencePopulationLink(pendingPopulationLinkDeclaration);

export default Object.freeze({ populationWorkflow, populationResult, pendingPopulationLinkDeclaration, pendingPopulationLink });
