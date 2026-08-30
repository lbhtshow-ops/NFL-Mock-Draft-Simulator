import fidApi from "../../../../fid/index.js";
import { createEvidencePopulationLink } from "../../../evidenceLinkage/EvidencePopulationLinkContract.js";
import { firstProspectCohortFixtures } from "../../../../fid/population/fixtures/firstProspectCohortFixtures.js";
import { researchSource } from "./sourceIntake.js";
import { researchSession, recordedObservations, evidenceArtifact } from "./evidenceReview.js";
import { subjectRef } from "./recordedObservations.js";

const fixture = firstProspectCohortFixtures.find((entry) => entry.subject.slug === "peter-woods");
export const populationWorkflow = fidApi.createPopulationWorkflow(fixture.workflowInput);
export const populationResult = fidApi.validatePopulationReadiness(populationWorkflow, { resultId: "population-result:rsp-0002:comparison", producedAt: "2026-07-18" });
const observationByField = Object.freeze(Object.fromEntries(recordedObservations.map((entry) => [entry.record.field, entry])));
const link = (suffix, category, observations) => createEvidencePopulationLink({ linkId: `evidence-population-link:rsp-0002:${suffix}`, linkRevision: 1, subjectRef, cycleRef: populationWorkflow.cycleRef, populationWorkflowRef: populationWorkflow.workflowId, researchSourceRef: researchSource.sourceId, researchSessionRef: researchSession.sessionId, recordedObservationRefs: observations.map((entry) => entry.observationId), analyticalObservationRefs: [], evidenceArtifactRefs: [evidenceArtifact.evidenceId], populationEvidenceCategory: category, repositoryEvidenceState: evidenceArtifact.verification.state, populationUseDecision: "PENDING", reviewer: { reviewerRef: null, reviewedAt: null, authorized: false }, provenance: { createdBy: null, createdAt: "2026-07-18" }, lifecycle: { state: "DRAFT", revision: 1 }, duplicateLinkRefs: [], conflictingSourceRefs: [] });
export const populationLinks = Object.freeze([
  link("identity", fidApi.POPULATION_EVIDENCE_CATEGORIES.IDENTITY, [observationByField.identity]),
  link("affiliation", fidApi.POPULATION_EVIDENCE_CATEGORIES.AFFILIATION, [observationByField.affiliation]),
  link("position", fidApi.POPULATION_EVIDENCE_CATEGORIES.POSITION, [observationByField.position]),
  link("class-year", fidApi.POPULATION_EVIDENCE_CATEGORIES.CLASS_YEAR, [observationByField.classYear]),
  link("measurements", fidApi.POPULATION_EVIDENCE_CATEGORIES.MEASUREMENTS, [observationByField.height, observationByField.weight]),
]);
export const populationLinkRefs = Object.freeze(populationLinks.map((entry) => entry.linkId));
export default Object.freeze({ populationWorkflow, populationResult, populationLinks, populationLinkRefs });
