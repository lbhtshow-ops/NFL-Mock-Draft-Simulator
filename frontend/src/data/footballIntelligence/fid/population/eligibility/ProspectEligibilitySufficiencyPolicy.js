import { PROSPECT_ELIGIBILITY_STATES } from "../../constants/prospectProfileConstants.js";
import { createProspectEligibilitySufficiencyInput } from "./ProspectEligibilitySufficiencyInputContract.js";
import { createProspectEligibilitySufficiencyResult } from "./ProspectEligibilitySufficiencyResultContract.js";
import { PROSPECT_ELIGIBILITY_PROPOSITION } from "./prospectEligibilityPolicyConstants.js";

const blocker = (code, message, refs = []) => Object.freeze({ code, message, refs });
export function evaluateProspectEligibilitySufficiency(input = {}) {
  const decision = createProspectEligibilitySufficiencyInput(input); const blockers = [];
  if (!decision.validation.valid) blockers.push(blocker("INVALID_OR_UNSCOPED_PROPOSITION", "Prospect, draft cycle, review time, and decision identity are required."));
  const authorized = Boolean(decision.review.reviewerRef && decision.review.reviewerAuthorized && decision.review.reviewedAt && decision.review.decision === "APPROVE");
  if (!authorized) blockers.push(blocker("AUTHORIZED_HUMAN_REVIEW_REQUIRED", "Explicit authorized human approval is required."));
  if (!decision.decisionRationale) blockers.push(blocker("DECISION_RATIONALE_REQUIRED", "A traceable decision rationale is required."));
  const required = decision.requiredInputIds;
  const suppliedRequired = required.map((ref) => decision.evidenceInputs.find((entry) => entry.inputId === ref)).filter(Boolean);
  const missing = required.filter((ref) => !decision.evidenceInputs.some((entry) => entry.inputId === ref && entry.satisfied));
  const conflicting = [...new Set([...decision.conflictingInputRefs, ...decision.evidenceInputs.filter((entry) => entry.conflicting).map((entry) => entry.inputId)])];
  if (missing.length) blockers.push(blocker("REQUIRED_INPUTS_MISSING", "Every policy-defined input must be satisfied.", missing));
  if (conflicting.length) blockers.push(blocker("REQUIRED_INPUTS_CONFLICT", "A material eligibility input remains conflicting.", conflicting));
  const governed = decision.evidenceInputs.length > 0 && decision.evidenceInputs.every((entry) => entry.approvedSource && entry.verifiedEvidence && entry.sourceRef && entry.evidenceArtifactRef);
  if (!governed) blockers.push(blocker("GOVERNED_EVIDENCE_REQUIRED", "All relied-upon evidence must have an approved source and verified artifact."));
  if (decision.evidenceInputs.some((entry) => entry.prospectRef && entry.prospectRef !== decision.prospectRef) || decision.evidenceInputs.some((entry) => entry.draftCycleRef && entry.draftCycleRef !== decision.draftCycleRef)) blockers.push(blocker("EVIDENCE_SCOPE_MISMATCH", "Evidence must match the prospect and draft cycle."));
  const types = new Set(decision.evidenceInputs.map((entry) => entry.inputType));
  const sourceRefs = [...new Set([...decision.sourceRefs, ...decision.evidenceInputs.map((entry) => entry.sourceRef).filter(Boolean)])];
  const evidenceArtifactRefs = [...new Set([...decision.evidenceArtifactRefs, ...decision.evidenceInputs.map((entry) => entry.evidenceArtifactRef).filter(Boolean)])];
  const recordedObservationRefs = [...new Set([...decision.recordedObservationRefs, ...decision.evidenceInputs.map((entry) => entry.recordedObservationRef).filter(Boolean)])];
  if (decision.evidencePathway === "DIRECT_OFFICIAL_RULING" && (!types.has("DIRECT_RULING") || !decision.rulingRef || !recordedObservationRefs.length)) blockers.push(blocker("DIRECT_RULING_INCOMPLETE", "A player- and cycle-specific direct ruling, observation, and ruling reference are required."));
  if (decision.evidencePathway === "SPECIAL_RULING" && (!types.has("SPECIAL_RULING") || decision.basisType !== "SPECIAL_RULING" || !decision.rulingRef)) blockers.push(blocker("SPECIAL_RULING_INCOMPLETE", "A governed special ruling and SPECIAL_RULING basis are required."));
  if (decision.evidencePathway === "RULE_PLUS_PLAYER_FACTS" && (!types.has("GENERAL_RULE") || !types.has("PLAYER_FACT") || !decision.ruleRef || !decision.ruleEffectiveAt || !decision.analyticalObservationRefs.length)) blockers.push(blocker("RULE_APPLICATION_INCOMPLETE", "A governed rule, all required player facts, effective scope, and traceable analysis are required."));
  if (decision.evidencePathway === "EXHAUSTED_OR_AUTOMATIC_STATUS" && (!types.has("AUTOMATIC_STATUS") || !["AUTOMATIC", "GRADUATE", "EXHAUSTED_ELIGIBILITY"].includes(decision.basisType))) blockers.push(blocker("AUTOMATIC_STATUS_INCOMPLETE", "Prospect- and cycle-specific governed automatic, graduate, or exhausted status is required."));
  if (decision.evidencePathway === "UNSUPPORTED" || [...types].every((type) => ["DECLARATION", "CLASS_YEAR", "AFFILIATION", "POSITION", "MEASUREMENT", "PROJECTION", "OTHER"].includes(type))) blockers.push(blocker("UNSUPPORTED_EVIDENCE_PATHWAY", "The supplied evidence cannot independently establish eligibility."));
  if (![PROSPECT_ELIGIBILITY_STATES.ELIGIBLE, PROSPECT_ELIGIBILITY_STATES.NOT_ELIGIBLE].includes(decision.eligibilityState)) blockers.push(blocker("NON_FINAL_ELIGIBILITY_STATE", "PENDING, DISPUTED, UNKNOWN, and NOT_APPLICABLE are not Population-sufficient."));
  const populationSufficient = blockers.length === 0;
  const sufficiencyState = populationSufficient ? "SUFFICIENT" : decision.eligibilityState === "PENDING" ? "PENDING" : decision.eligibilityState === "DISPUTED" ? "DISPUTED" : decision.evidencePathway === "UNSUPPORTED" ? "UNSUPPORTED" : "INSUFFICIENT";
  return createProspectEligibilitySufficiencyResult({ resultId: `prospect-eligibility-result:${decision.decisionId ?? "invalid"}`, decisionRef: decision.decisionId, proposition: PROSPECT_ELIGIBILITY_PROPOSITION, prospectRef: decision.prospectRef, draftCycleRef: decision.draftCycleRef, reviewedForTime: decision.reviewedForTime, eligibilityState: decision.eligibilityState, basisType: decision.basisType, evidencePathway: decision.evidencePathway, sourceRefs, evidenceArtifactRefs, recordedObservationRefs, analyticalObservationRefs: decision.analyticalObservationRefs, rulingRef: decision.rulingRef, ruleRef: decision.ruleRef, requiredInputs: required, satisfiedInputs: suppliedRequired.filter((entry) => entry.satisfied).map((entry) => entry.inputId), missingInputs: missing, conflictingInputs: conflicting, limitations: decision.limitations, decisionRationale: decision.decisionRationale, review: decision.review, sufficiencyState, populationSufficient, blockers });
}
export default Object.freeze({ evaluateProspectEligibilitySufficiency });
