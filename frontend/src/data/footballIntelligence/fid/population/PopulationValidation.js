import { createFiisIntakeRequest } from "../intake/core/FiisIntakeRequestContract.js";
import { POPULATION_EVIDENCE_STATUSES, POPULATION_READINESS_STATES, POPULATION_VALIDATION_STATUSES } from "./populationConstants.js";
import { isPopulationWorkflow } from "./PopulationWorkflow.js";
import { createPopulationResult } from "./PopulationResultContract.js";

function check(id, checkType, passed, code, message, details = {}) { return { validationId: id, checkType, status: passed ? "PASSED" : "FAILED", code, message, paths: details.paths ?? [], sourceRefs: details.sourceRefs ?? [], evidenceRefs: details.evidenceRefs ?? [] }; }
function blocker(id, blockerType, code, message, paths = []) { return { blockerId: id, blockerType, code, message, paths, sourceRefs: [], evidenceRefs: [] }; }

export function validatePopulationReadiness(workflow, { resultId = null, producedAt = null, eligibilitySufficiencyResult = null } = {}) {
  const workflowValid = isPopulationWorkflow(workflow); const sourcesPresent = workflowValid && workflow.sourceMetadata.length > 0;
  const eligibilityRequired = workflowValid && workflow.requiredEvidenceCategories.includes("ELIGIBILITY");
  const eligibilityScopeMatches = Boolean(eligibilitySufficiencyResult?.populationSufficient === true && eligibilitySufficiencyResult.draftCycleRef === workflow?.cycleRef && (workflow?.subjectRefs.includes(eligibilitySufficiencyResult.prospectRef) || workflow?.candidateRef === eligibilitySufficiencyResult.prospectRef));
  const suppliedCategories = new Set(workflowValid ? workflow.evidenceDeclarations.filter((entry) => [POPULATION_EVIDENCE_STATUSES.SUFFICIENT, POPULATION_EVIDENCE_STATUSES.DECLARED].includes(entry.status) && (entry.category !== "ELIGIBILITY" || eligibilityScopeMatches)).map((entry) => entry.category) : []);
  const missingCategories = workflowValid ? workflow.requiredEvidenceCategories.filter((category) => !suppliedCategories.has(category)) : [];
  const recordsValid = workflowValid && workflow.populationRecords.length > 0 && workflow.populationRecords.every((entry) => entry.validation.valid);
  const fiisInput = workflowValid && workflow.fiisIntakeRequestInput ? createFiisIntakeRequest(workflow.fiisIntakeRequestInput) : null;
  const fiisInputValid = Boolean(fiisInput?.validation.valid);
  const validations = [
    check("population-check:workflow", "WORKFLOW_IDENTITY", workflowValid, workflowValid ? "WORKFLOW_VALID" : "WORKFLOW_INVALID", workflowValid ? "Population Workflow is valid." : "Population Workflow is invalid."),
    check("population-check:sources", "SOURCE_METADATA", sourcesPresent, sourcesPresent ? "SOURCES_DECLARED" : "SOURCES_MISSING", sourcesPresent ? "Source metadata is declared." : "At least one source is required."),
    check("population-check:evidence", "EVIDENCE_COVERAGE", missingCategories.length === 0, missingCategories.length ? "EVIDENCE_MISSING" : "EVIDENCE_COVERED", missingCategories.length ? `Missing evidence categories: ${missingCategories.join(", ")}.` : "Required evidence categories are covered.", { paths: missingCategories.map((category) => `requiredEvidenceCategories.${category}`) }),
    ...(eligibilityRequired ? [check("population-check:eligibility-policy", "EVIDENCE_COVERAGE", eligibilityScopeMatches, eligibilityScopeMatches ? "ELIGIBILITY_POLICY_SUFFICIENT" : "ELIGIBILITY_POLICY_INSUFFICIENT", eligibilityScopeMatches ? "Eligibility is substantively sufficient for the workflow prospect and draft cycle." : "ELIGIBILITY requires a substantively sufficient policy result for the same prospect and draft cycle.", { paths: ["eligibilitySufficiencyResult"] })] : []),
    check("population-check:records", "REFERENCE_INTEGRITY", recordsValid, recordsValid ? "RECORDS_VALID" : "RECORDS_INVALID", recordsValid ? "Population records are declaratively valid." : "At least one valid population record is required."),
    check("population-check:fiis", "FIIS_INPUT_SHAPE", fiisInputValid, fiisInputValid ? "FIIS_INPUT_VALID" : "FIIS_INPUT_INVALID", fiisInputValid ? "FIIS Intake Request input validates." : "FIIS Intake Request input is missing or invalid."),
    check("population-check:boundary", "BOUNDARY_SAFETY", true, "NO_EXTERNAL_EFFECTS", "Population validation performs no persistence, promotion, or runtime integration."),
  ];
  const blockers = [];
  if (!workflowValid) blockers.push(blocker("population-blocker:workflow", "INVALID_RECORD", "WORKFLOW_INVALID", "Population Workflow is invalid.", ["workflow"]));
  if (!sourcesPresent) blockers.push(blocker("population-blocker:sources", "MISSING_SOURCE", "SOURCES_MISSING", "Source metadata is required.", ["sourceMetadata"]));
  missingCategories.forEach((category) => blockers.push(blocker(`population-blocker:evidence:${category}`, "MISSING_EVIDENCE", "EVIDENCE_MISSING", `${category} evidence is required.`, [`requiredEvidenceCategories.${category}`])));
  if (!recordsValid) blockers.push(blocker("population-blocker:records", "INVALID_RECORD", "RECORDS_INVALID", "A valid population record is required.", ["populationRecords"]));
  if (!fiisInputValid) blockers.push(blocker("population-blocker:fiis", "FIIS_INPUT_INVALID", "FIIS_INPUT_INVALID", "A valid FIIS Intake Request input is required.", ["fiisIntakeRequestInput"]));
  const readiness = blockers.length ? POPULATION_READINESS_STATES.BLOCKED : POPULATION_READINESS_STATES.READY_FOR_FIIS_INTAKE;
  const status = blockers.length ? POPULATION_VALIDATION_STATUSES.BLOCKED : POPULATION_VALIDATION_STATUSES.PASSED;
  return createPopulationResult({ resultId: resultId ?? `population-result:${workflow?.workflowId ?? "unavailable"}`, resultRevision: 1, workflowRef: workflow?.workflowId ?? "population-workflow:unavailable", workflowRevision: workflow?.workflowRevision ?? 1, status, readiness, validationResults: validations, blockers, warnings: fiisInput?.validation.warnings ?? [], sourceRefs: workflowValid ? workflow.sourceMetadata.map((entry) => entry.sourceRef) : [], evidenceRefs: workflowValid ? workflow.evidenceDeclarations.flatMap((entry) => entry.evidenceRefs) : [], populationRecordRefs: workflowValid ? workflow.populationRecords.map((entry) => entry.populationRecordId) : [], fiisIntakeRequestInput: fiisInput, fiisIntakeRequestValid: fiisInputValid, persistencePerformed: false, promotionPerformed: false, runtimeIntegrationPerformed: false, producedAt, notes: "Governed population readiness declaration only." });
}

export default Object.freeze({ validatePopulationReadiness });
