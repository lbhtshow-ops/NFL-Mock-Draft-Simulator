import { isProspectIdentityAuthorityDecision } from "./ProspectIdentityAuthorityDecision.js";
import { createProspectIdentifierContext, isProspectIdentifierContext } from "./ProspectIdentifierContext.js";
import { createProspectIdentifierConventionAssessment } from "./ProspectIdentifierConventionAssessment.js";
import { deepFreeze } from "./ProspectIdentityDryRunRequest.js";
import { CANONICAL_PROSPECT_IDENTIFIER_CONVENTION } from "./CanonicalProspectIdentifierConvention.js";

const unique = (values) => [...new Set(values.filter(Boolean))];
const invalid = (decision, context) => createProspectIdentifierConventionAssessment({ assessmentId: "identifier-assessment:invalid-input", authorityDecisionRef: decision?.decisionId ?? "unavailable-authority-decision", requestRef: context?.requestId ?? "unavailable-request", operationRef: context?.operationId ?? "unavailable-operation", status: "CONVENTION_BLOCKED", unresolvedLayers: ["VALID_AUTHORITY_DECISION_AND_IDENTIFIER_CONTEXT"], requiredNextActions: ["SUPPLY_VALID_IMMUTABLE_AUTHORITY_DECISION_AND_IDENTIFIER_CONTEXT"] });

export function evaluateCanonicalProspectIdentifierConvention(authorityDecision, identifierContextInput) {
  if (!isProspectIdentityAuthorityDecision(authorityDecision)) return invalid(authorityDecision, identifierContextInput);
  const context = createProspectIdentifierContext(identifierContextInput); if (!isProspectIdentifierContext(context)) return invalid(authorityDecision, context);
  if (authorityDecision.decision === "NOT_APPLICABLE") return createProspectIdentifierConventionAssessment({ assessmentId: `identifier-assessment:${context.contextId}`, authorityDecisionRef: authorityDecision.decisionId, requestRef: context.requestId, operationRef: context.operationId, status: "NOT_APPLICABLE", requiredIdentifierLayers: context.requestedIdentifierLayers, requiredNextActions: [] });
  const known = new Set(CANONICAL_PROSPECT_IDENTIFIER_CONVENTION.identifierLayers.map((item) => item.identifierType)); const unresolved = context.requestedIdentifierLayers.filter((item) => !known.has(item));
  const conflation = [];
  if (context.existingCanonicalReferences.some((ref) => [context.requestId, context.operationId, context.batchId].includes(ref))) conflation.push("OPERATION_IDENTIFIER_AS_CANONICAL_IDENTITY");
  if (context.existingCanonicalReferences.some((ref) => context.existingPersistenceReferences.includes(ref))) conflation.push("PERSISTENCE_IDENTIFIER_AS_CANONICAL_IDENTITY");
  if (context.legacyIdentifierReferences.some((item) => ["LEGACY_RUNTIME_IDENTIFIER", "DEVELOPMENT_FIXTURE_IDENTIFIER", "UI_SLUG", "PROHIBITED_AS_CANONICAL", "UNRESOLVED"].includes(item.classification) && context.existingCanonicalReferences.includes(item.reference))) conflation.push("LEGACY_OR_APPLICATION_IDENTIFIER_AS_CANONICAL_IDENTITY");
  const collisions = [...context.collisionClasses]; const blockingCollision = collisions.some((item) => ["EXACT_IDENTIFIER_COLLISION", "NAMESPACE_COLLISION", "PERSISTENCE_IDENTIFIER_COLLISION", "CROSS_REQUEST_COLLISION"].includes(item));
  const reviewCollision = collisions.some((item) => ["SEMANTIC_IDENTITY_COLLISION", "LEGACY_IDENTIFIER_COLLISION"].includes(item));
  const cycleCompliant = context.draftCycleSeparatedFromStableIdentity; const persistenceCompliant = context.persistenceSeparatedFromCanonicalIdentity;
  const authorityAllowsAssessment = ["REUSE_EXISTING_IDENTITY", "ISSUE_NEW_IDENTITY"].includes(authorityDecision.decision) && !authorityDecision.blocked;
  let status = "CONVENTION_SATISFIED"; const actions = [];
  if (unresolved.length || conflation.length || blockingCollision || !context.namespaceApproved || !persistenceCompliant) { status = "CONVENTION_BLOCKED"; actions.push("RESOLVE_IDENTIFIER_CONVENTION_BLOCKERS"); }
  else if (!authorityAllowsAssessment || reviewCollision || context.legacyIdentifierReferences.some((item) => item.classification === "UNRESOLVED")) { status = "CONVENTION_REVIEW_REQUIRED"; actions.push("COMPLETE_AUTHORITY_COLLISION_OR_LEGACY_REVIEW"); }
  if (context.draftCycleConflict || !cycleCompliant) { status = authorityDecision.decision === "REUSE_EXISTING_IDENTITY" ? "CONVENTION_REVIEW_REQUIRED" : "CONVENTION_BLOCKED"; actions.push("KEEP_STABLE_IDENTITY_AND_RESOLVE_DRAFT_CYCLE_SEPARATELY"); }
  const eligible = status === "CONVENTION_SATISFIED" && authorityDecision.decision === "ISSUE_NEW_IDENTITY" && authorityDecision.issuanceEligibility === true;
  return createProspectIdentifierConventionAssessment({ assessmentId: `identifier-assessment:${context.contextId}`, authorityDecisionRef: authorityDecision.decisionId, requestRef: context.requestId, operationRef: context.operationId, status, requiredIdentifierLayers: context.requestedIdentifierLayers, satisfiedLayers: context.requestedIdentifierLayers.filter((item) => known.has(item)), unresolvedLayers: unresolved, prohibitedLayerConflation: unique(conflation), draftCycleCompliance: { separatedFromStableIdentity: cycleCompliant, conflictPresent: context.draftCycleConflict, reclassificationAuthorized: false }, persistenceSeparation: { separatedFromCanonicalIdentity: persistenceCompliant, persistenceReferences: context.existingPersistenceReferences, storageKeyIsPublicIdentity: false }, legacyConflicts: context.legacyIdentifierReferences.filter((item) => item.classification !== "CANONICAL_CANDIDATE"), collisionConcerns: collisions, requiredNextActions: unique(actions), canonicalReferencesToReuse: authorityDecision.decision === "REUSE_EXISTING_IDENTITY" ? unique([authorityDecision.canonicalIdentityRef, ...context.existingCanonicalReferences]) : [], deprecatedIdentifierReference: context.deprecatedIdentifierReference, survivingCanonicalReference: context.survivingCanonicalReference, eligibleForFutureIssuanceRequest: eligible });
}

export function evaluateCanonicalProspectIdentifierConventionBatch(authorityDecisions = [], identifierContexts = []) {
  if (!Array.isArray(authorityDecisions) || !Array.isArray(identifierContexts) || authorityDecisions.length !== identifierContexts.length) return deepFreeze({ status: "CONVENTION_BLOCKED", assessments: [], collisionIndexes: [], blockers: [{ code: "BATCH_INPUT_MISMATCH" }], executionAuthorized: false });
  const refs = identifierContexts.map((context) => context?.existingCanonicalReferences ?? []); const collisionIndexes = new Set();
  for (let i = 0; i < refs.length; i += 1) for (let j = i + 1; j < refs.length; j += 1) if (refs[i].some((ref) => refs[j].includes(ref))) { collisionIndexes.add(i); collisionIndexes.add(j); }
  const contexts = identifierContexts.map((context, index) => ({ ...context, collisionClasses: unique([...(context?.collisionClasses ?? []), collisionIndexes.has(index) ? "CROSS_REQUEST_COLLISION" : null]) }));
  const assessments = authorityDecisions.map((decision, index) => evaluateCanonicalProspectIdentifierConvention(decision, contexts[index])); const status = assessments.some((item) => item.status === "CONVENTION_BLOCKED") ? "CONVENTION_BLOCKED" : assessments.some((item) => item.status === "CONVENTION_REVIEW_REQUIRED") ? "CONVENTION_REVIEW_REQUIRED" : assessments.every((item) => item.status === "NOT_APPLICABLE") ? "NOT_APPLICABLE" : "CONVENTION_SATISFIED";
  return deepFreeze({ status, assessments, collisionIndexes: [...collisionIndexes], blockers: assessments.filter((item) => item.status === "CONVENTION_BLOCKED").map((item) => ({ requestRef: item.requestRef, collisionConcerns: item.collisionConcerns })), noPartialExecution: true, inputOrderSelectsWinner: false, executionAuthorized: false });
}
export default Object.freeze({ evaluateCanonicalProspectIdentifierConvention, evaluateCanonicalProspectIdentifierConventionBatch });
