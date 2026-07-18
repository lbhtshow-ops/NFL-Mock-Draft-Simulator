import {
  PROSPECT_PROMOTION_WORKFLOW_MODES,
  PROSPECT_PROMOTION_WORKFLOW_TARGET_CONTRACTS,
  PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_ORDER,
  PROSPECT_PROMOTION_WORKFLOW_ACTIONS,
  PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_PAYLOAD_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_PERSISTENCE_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES,
  PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS,
  PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS,
} from "./prospectPromotionWorkflowConstants.js";
import {
  createProspectPromotionWorkflow,
  createProspectPromotionTargetProposal,
  createProspectPromotionRecordIdentityInput,
  createProspectPromotionPersistenceInput,
  createProspectPromotionDependencyDeclaration,
  createProspectPromotionValidationRecord,
  createProspectPromotionWorkflowError,
  createProspectPromotionWorkflowAuditRecord,
  createProspectPromotionPlannedOperation,
  createProspectPromotionWorkflowDryRunPlanResult,
  isProspectPromotionWorkflowDryRunPlan,
} from "./ProspectPromotionWorkflowContract.js";
import {
  PROSPECT_PROMOTION_TARGET_DECISIONS,
  PROSPECT_PROMOTION_CLAIM_DECISIONS,
} from "./prospectPromotionDecisionConstants.js";
import { isProspectPromotionDecision } from "./ProspectPromotionDecisionContract.js";

const AUTHORIZING_TARGET_DECISIONS = new Set([
  PROSPECT_PROMOTION_TARGET_DECISIONS.APPROVED,
  PROSPECT_PROMOTION_TARGET_DECISIONS.PARTIALLY_APPROVED,
]);
const AUTHORIZING_CLAIM_DECISIONS = new Set([
  PROSPECT_PROMOTION_CLAIM_DECISIONS.APPROVED,
  PROSPECT_PROMOTION_CLAIM_DECISIONS.PARTIALLY_APPROVED,
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function addError(errors, code, message, path = null, targetProposalRef = null, operationRef = null, details = null) {
  const entry = createProspectPromotionWorkflowError({ code, message, path, targetProposalRef, operationRef, details });
  if (!errors.some((current) => current.code === entry.code && current.path === entry.path && current.targetProposalRef === entry.targetProposalRef)) errors.push(entry);
  return entry;
}
function validationRecord(status, code, message, path = null, targetProposalRef = null, operationRef = null) {
  return createProspectPromotionValidationRecord({ validationId: null, scope: "PROSPECT_PROMOTION_WORKFLOW", status, code, message, path, targetProposalRef, operationRef, sourceRefs: [], evidenceRefs: [], notes: null });
}
function auditRecord(eventType, workflow, decision, options, targetProposalRefs = [], operationRefs = [], reason = null) {
  return createProspectPromotionWorkflowAuditRecord({ auditId: null, eventType, actorRef: options.actorRef ?? null, occurredAt: options.occurredAt ?? null, workflowRef: workflow.workflowId, decisionRef: decision?.decisionId ?? workflow.promotionDecisionRef, targetProposalRefs, operationRefs, validationRefs: [], errorRefs: [], reason, notes: null });
}
function compareProposals(left, right) {
  const rank = (entry) => PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_ORDER[entry.targetType] ?? Number.MAX_SAFE_INTEGER;
  return rank(left) - rank(right) || left.targetProposalId.localeCompare(right.targetProposalId);
}
function duplicateValues(values) { const seen = new Set(); const duplicates = new Set(); values.filter(Boolean).forEach((value) => { if (seen.has(value)) duplicates.add(value); seen.add(value); }); return [...duplicates]; }

export function validateProspectPromotionWorkflowPlannerInput(input = {}) {
  const errors = []; const warnings = []; const value = isObject(input) ? input : {};
  if (!isObject(input)) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, "Planner input must be an object.", "");
  const workflow = createProspectPromotionWorkflow(value.workflow);
  if (!workflow.validation.valid) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, "A valid explicit Promotion Workflow is required.", "workflow");
  const promotionDecision = value.promotionDecision;
  if (!isProspectPromotionDecision(promotionDecision)) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PROMOTION_DECISION, "A normalized valid Promotion Decision is required.", "promotionDecision");
  const normalizeArray = (entry, path, factory) => {
    if (!Array.isArray(entry)) { addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, `${path} must be an explicitly supplied array.`, path); return []; }
    return entry.map((item, index) => { const normalized = factory(item); if (!normalized.validation.valid) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, `${path}[${index}] is invalid.`, `${path}[${index}]`); return normalized; });
  };
  const targetProposals = normalizeArray(value.targetProposals, "targetProposals", createProspectPromotionTargetProposal);
  const recordIdentityInputs = normalizeArray(value.recordIdentityInputs, "recordIdentityInputs", createProspectPromotionRecordIdentityInput);
  const persistenceInputs = normalizeArray(value.persistenceInputs, "persistenceInputs", createProspectPromotionPersistenceInput);
  const dependencyDeclarations = normalizeArray(value.dependencyDeclarations, "dependencyDeclarations", createProspectPromotionDependencyDeclaration);
  const options = isObject(value.options) ? { planId: typeof value.options.planId === "string" && value.options.planId.trim() ? value.options.planId.trim() : null, actorRef: typeof value.options.actorRef === "string" && value.options.actorRef.trim() ? value.options.actorRef.trim() : null, occurredAt: typeof value.options.occurredAt === "string" && value.options.occurredAt.trim() ? value.options.occurredAt.trim() : null } : { planId: null, actorRef: null, occurredAt: null };
  if (!options.planId) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, "options.planId must be explicitly supplied.", "options.planId");
  if (options.occurredAt && Number.isNaN(Date.parse(options.occurredAt))) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, "options.occurredAt must be a recognizable date or null.", "options.occurredAt");
  duplicateValues(targetProposals.map((entry) => entry.targetProposalId)).forEach((id) => addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.DUPLICATE_TARGET_PROPOSAL, `Duplicate targetProposalId: ${id}.`, "targetProposals", id));
  duplicateValues(targetProposals.map((entry) => entry.operationId)).forEach((id) => addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.DUPLICATE_OPERATION_ID, `Duplicate operationId: ${id}.`, "targetProposals", null, id));
  duplicateValues(recordIdentityInputs.map((entry) => entry.targetProposalRef)).forEach((id) => addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, `Multiple Record Identity Inputs target ${id}.`, "recordIdentityInputs", id));
  duplicateValues(persistenceInputs.map((entry) => entry.targetProposalRef)).forEach((id) => addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PERSISTENCE_INPUT, `Multiple Persistence Inputs target ${id}.`, "persistenceInputs", id));
  duplicateValues(dependencyDeclarations.map((entry) => entry.dependencyId)).forEach((id) => addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_WORKFLOW, `Duplicate dependencyId: ${id}.`, "dependencyDeclarations"));
  if (promotionDecision && workflow.promotionDecisionRef && promotionDecision.decisionId !== workflow.promotionDecisionRef) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PROMOTION_DECISION, "Workflow promotionDecisionRef does not match the supplied decision.", "workflow.promotionDecisionRef");
  if (promotionDecision && workflow.promotionDecisionRevision != null && promotionDecision.decisionRevision !== workflow.promotionDecisionRevision) addError(errors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PROMOTION_DECISION, "Workflow promotionDecisionRevision does not match the supplied decision.", "workflow.promotionDecisionRevision");
  return { valid: errors.length === 0, errors, warnings, normalized: { workflow, promotionDecision, targetProposals, recordIdentityInputs, persistenceInputs, dependencyDeclarations, options } };
}

function validateDependencies(proposals, declarations, perTargetErrors, validationRecords) {
  const proposalById = new Map(proposals.map((entry) => [entry.targetProposalId, entry]));
  const declarationById = new Map(declarations.map((entry) => [entry.dependencyId, entry]));
  const edges = new Map(proposals.map((entry) => [entry.targetProposalId, new Set()]));
  declarations.forEach((entry) => {
    if (!proposalById.has(entry.targetProposalRef)) return;
    if (entry.dependencyTargetProposalRef) {
      if (!proposalById.has(entry.dependencyTargetProposalRef)) {
        addError(perTargetErrors.get(entry.targetProposalRef), PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_DEPENDENCY, `Missing planned dependency ${entry.dependencyTargetProposalRef}.`, "dependencyDeclarations", entry.targetProposalRef);
      } else if (entry.dependencyTargetProposalRef === entry.targetProposalRef) {
        addError(perTargetErrors.get(entry.targetProposalRef), PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.SELF_DEPENDENCY, "A target cannot depend on itself.", "dependencyDeclarations", entry.targetProposalRef);
      } else {
        const dependencyProposal = proposalById.get(entry.dependencyTargetProposalRef);
        if (dependencyProposal.proposedAction === PROSPECT_PROMOTION_WORKFLOW_ACTIONS.NO_ACTION) {
          addError(perTargetErrors.get(entry.targetProposalRef), PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_DEPENDENCY, "NO_ACTION does not satisfy an internal planned dependency.", "dependencyDeclarations", entry.targetProposalRef);
        }
        edges.get(entry.targetProposalRef).add(entry.dependencyTargetProposalRef);
      }
    }
  });
  proposals.forEach((proposal) => proposal.dependencyRefs.forEach((dependencyId) => {
    const declaration = declarationById.get(dependencyId);
    if (!declaration || declaration.targetProposalRef !== proposal.targetProposalId) addError(perTargetErrors.get(proposal.targetProposalId), PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_DEPENDENCY, `Dependency declaration ${dependencyId} is missing or targets another proposal.`, "dependencyRefs", proposal.targetProposalId);
  }));
  const state = new Map(); const stack = [];
  const visit = (id) => {
    if (state.get(id) === "visiting") { const cycleStart = stack.indexOf(id); const cycle = [...stack.slice(cycleStart), id]; cycle.forEach((targetId) => addError(perTargetErrors.get(targetId), PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CYCLIC_DEPENDENCY, `Dependency cycle detected: ${cycle.join(" -> ")}.`, "dependencyDeclarations", targetId)); return; }
    if (state.get(id) === "visited") return;
    state.set(id, "visiting"); stack.push(id); (edges.get(id) ?? []).forEach(visit); stack.pop(); state.set(id, "visited");
  };
  proposals.forEach((entry) => visit(entry.targetProposalId));
  const hasCycle = [...perTargetErrors.values()].some((errors) => errors.some((entry) => entry.code === PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CYCLIC_DEPENDENCY));
  validationRecords.push(validationRecord(hasCycle ? PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES.FAILED : PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES.PASSED, hasCycle ? PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CYCLIC_DEPENDENCY : "DEPENDENCY_GRAPH_VALID", hasCycle ? "Dependency graph contains a cycle." : "Dependency graph is structurally acyclic.", "dependencyDeclarations"));
  return edges;
}

function deterministicOrder(proposals, edges) {
  const ids = new Set(proposals.map((entry) => entry.targetProposalId)); const indegree = new Map([...ids].map((id) => [id, 0])); const dependents = new Map([...ids].map((id) => [id, new Set()]));
  edges.forEach((dependencies, targetId) => dependencies.forEach((dependencyId) => { if (ids.has(targetId) && ids.has(dependencyId)) { indegree.set(targetId, (indegree.get(targetId) ?? 0) + 1); dependents.get(dependencyId).add(targetId); } }));
  const byId = new Map(proposals.map((entry) => [entry.targetProposalId, entry])); const ready = proposals.filter((entry) => indegree.get(entry.targetProposalId) === 0).sort(compareProposals); const ordered = [];
  while (ready.length) { const next = ready.shift(); ordered.push(next); dependents.get(next.targetProposalId).forEach((id) => { indegree.set(id, indegree.get(id) - 1); if (indegree.get(id) === 0) { ready.push(byId.get(id)); ready.sort(compareProposals); } }); }
  return ordered.length === proposals.length ? ordered : proposals.slice().sort(compareProposals);
}

function authorizationFor(proposal, decision, targetErrors) {
  const targetDecision = decision.targetDecisions.find((entry) => entry.targetDecisionId === proposal.promotionDecisionTargetRef);
  if (!targetDecision || targetDecision.targetType !== proposal.targetType) {
    addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.TARGET_NOT_AUTHORIZED, "Target proposal does not match an explicit Promotion Decision target.", "promotionDecisionTargetRef", proposal.targetProposalId);
    return { targetDecision: null, authorizationStatus: PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES.NOT_AUTHORIZED, claimAuthorizationStatus: PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES.NOT_AUTHORIZED };
  }
  if (!AUTHORIZING_TARGET_DECISIONS.has(targetDecision.decision)) {
    addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.DECISION_NOT_AUTHORIZING, `Target decision ${targetDecision.decision} does not authorize a planned operation.`, "promotionDecisionTargetRef", proposal.targetProposalId);
  }
  if (proposal.proposedAction !== PROSPECT_PROMOTION_WORKFLOW_ACTIONS.NO_ACTION && targetDecision.proposedAction !== proposal.proposedAction) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.TARGET_NOT_AUTHORIZED, "Proposed action does not match the explicit Promotion Decision action.", "proposedAction", proposal.targetProposalId);
  let claimStatus = proposal.authorizedClaimRefs.length ? PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES.AUTHORIZED : PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES.NO_CLAIMS;
  proposal.authorizedClaimRefs.forEach((claimRef) => {
    const claim = decision.claimDecisions.find((entry) => entry.claimDecisionId === claimRef);
    if (!targetDecision.approvedClaimRefs.includes(claimRef) || !claim || !AUTHORIZING_CLAIM_DECISIONS.has(claim.decision)) {
      addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CLAIM_NOT_AUTHORIZED, `Claim ${claimRef} is not explicitly approved for this target.`, "authorizedClaimRefs", proposal.targetProposalId); claimStatus = PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES.NOT_AUTHORIZED;
    } else if (claim.targetType && claim.targetType !== proposal.targetType) {
      addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CLAIM_TARGET_MISMATCH, `Claim ${claimRef} is approved for another target type.`, "authorizedClaimRefs", proposal.targetProposalId); claimStatus = PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES.TARGET_MISMATCH;
    }
  });
  const authorizationStatus = targetDecision.decision === PROSPECT_PROMOTION_TARGET_DECISIONS.PARTIALLY_APPROVED ? PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES.PARTIALLY_AUTHORIZED : PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES.AUTHORIZED;
  return { targetDecision, authorizationStatus, claimAuthorizationStatus: claimStatus };
}

function validatePlanningMetadata(proposal, identity, persistence, targetErrors) {
  const expectedContract = PROSPECT_PROMOTION_WORKFLOW_TARGET_CONTRACTS[proposal.targetType];
  if (!proposal.targetContract) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_TARGET_CONTRACT, "Target contract must be explicitly supplied.", "targetContract", proposal.targetProposalId);
  else if (proposal.targetContract !== expectedContract) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CONTRACT_TARGET_MISMATCH, `Target contract must be ${expectedContract}.`, "targetContract", proposal.targetProposalId);
  if (!proposal.targetContractVersion || !proposal.targetSchemaVersion) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_TARGET_CONTRACT, "Contract and schema versions must be explicitly supplied.", "targetContractVersion", proposal.targetProposalId);
  if (!proposal.proposedPayload) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_PAYLOAD, "Caller-supplied proposedPayload is required.", "proposedPayload", proposal.targetProposalId);
  if (!identity || !identity.logicalRecordId) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_RECORD_ID, "Explicit logical record ID is required.", "recordIdentityInputs", proposal.targetProposalId);
  if (!identity || !identity.persistenceId) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_PERSISTENCE_ID, "Explicit persistence ID is required.", "recordIdentityInputs", proposal.targetProposalId);
  if (!persistence) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PERSISTENCE_INPUT, "Matching explicit persistence input is required.", "persistenceInputs", proposal.targetProposalId);
  if (identity && proposal.targetRecordId && identity.logicalRecordId !== proposal.targetRecordId) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_RECORD_ID, "Target proposal record ID disagrees with Record Identity Input.", "targetRecordId", proposal.targetProposalId);
  if (identity && proposal.targetPersistenceId && identity.persistenceId !== proposal.targetPersistenceId) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_PERSISTENCE_ID, "Target proposal persistence ID disagrees with Record Identity Input.", "targetPersistenceId", proposal.targetProposalId);
  if (identity && proposal.targetRecordRevision != null && identity.revision !== proposal.targetRecordRevision) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_REVISION, "Target proposal revision disagrees with Record Identity Input.", "targetRecordRevision", proposal.targetProposalId);
  if (persistence && (persistence.recordId !== identity?.logicalRecordId || persistence.persistenceId !== identity?.persistenceId || persistence.revision !== identity?.revision)) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PERSISTENCE_INPUT, "Persistence input must agree with Record Identity Input.", "persistenceInputs", proposal.targetProposalId);
  if (persistence && (persistence.contract !== proposal.targetContract || persistence.contractVersion !== proposal.targetContractVersion || persistence.schemaVersion !== proposal.targetSchemaVersion)) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PERSISTENCE_INPUT, "Persistence contract declarations must agree with the Target Proposal.", "persistenceInputs", proposal.targetProposalId);
  if (persistence?.payload && proposal.proposedPayload && JSON.stringify(persistence.payload) !== JSON.stringify(proposal.proposedPayload)) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_PERSISTENCE_INPUT, "Persistence payload declaration must agree with the caller-supplied Target Proposal payload.", "persistenceInputs.payload", proposal.targetProposalId);
  if (proposal.proposedPayload?.contract && proposal.proposedPayload.contract !== proposal.targetContract) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.CONTRACT_TARGET_MISMATCH, "Payload contract identity disagrees with Target Proposal.", "proposedPayload.contract", proposal.targetProposalId);
  if (proposal.proposedAction === PROSPECT_PROMOTION_WORKFLOW_ACTIONS.CREATE && identity?.revision !== 1) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_REVISION, "CREATE requires explicit revision 1.", "recordIdentityInputs.revision", proposal.targetProposalId);
  if (proposal.proposedAction === PROSPECT_PROMOTION_WORKFLOW_ACTIONS.APPEND_REVISION) {
    if (!identity || identity.revision == null || identity.revision <= 1) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.INVALID_REVISION, "APPEND_REVISION requires an explicit revision greater than 1.", "recordIdentityInputs.revision", proposal.targetProposalId);
    if (!identity?.predecessorPersistenceId && !identity?.priorRecordRef && !persistence?.supersedesRef && !persistence?.predecessorRefs.length) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.MISSING_PREDECESSOR, "APPEND_REVISION requires an explicit predecessor declaration.", "recordIdentityInputs", proposal.targetProposalId);
  }
}

function envelopeFor(proposal, identity, persistence) {
  return {
    preparationStatus: PROSPECT_PROMOTION_WORKFLOW_PERSISTENCE_STATUSES.REQUIRES_PERSISTENCE_VALIDATION,
    repositoryPreconditionStatus: PROSPECT_PROMOTION_WORKFLOW_PERSISTENCE_STATUSES.REQUIRES_REPOSITORY_PRECONDITION_CHECK,
    persistenceId: persistence.persistenceId, recordId: persistence.recordId, contract: persistence.contract,
    contractVersion: persistence.contractVersion, schemaVersion: persistence.schemaVersion, entityRef: persistence.entityRef,
    subjectRef: persistence.subjectRef, recordType: persistence.recordType, recordVersion: persistence.recordVersion,
    revision: persistence.revision, lifecycleState: persistence.lifecycleState, verificationState: persistence.verificationState,
    effectiveFrom: persistence.effectiveFrom, effectiveTo: persistence.effectiveTo, recordedAt: persistence.recordedAt,
    persistedAt: null, replacedByRef: persistence.replacedByRef, supersedesRef: persistence.supersedesRef,
    sourceRecordRefs: persistence.sourceRecordRefs, promotionRefs: persistence.promotionRefs,
    payloadChecksum: persistence.payloadChecksum, payload: proposal.proposedPayload, metadata: persistence.metadata,
    predecessorRefs: persistence.predecessorRefs, replacementRefs: persistence.replacementRefs,
    identityDeclaration: { targetProposalRef: proposal.targetProposalId, targetType: identity.targetType, logicalRecordId: identity.logicalRecordId, persistenceId: identity.persistenceId, revision: identity.revision },
    stored: false, persisted: false, committed: false, repositoryValidated: false,
  };
}

export function createProspectPromotionWorkflowDryRunPlan(input = {}) {
  const checked = validateProspectPromotionWorkflowPlannerInput(input); const { workflow, promotionDecision: decision, targetProposals, recordIdentityInputs, persistenceInputs, dependencyDeclarations, options } = checked.normalized;
  const errors = [...checked.errors]; const warnings = [...checked.warnings]; const validationRecords = [];
  const perTargetErrors = new Map(targetProposals.map((entry) => [entry.targetProposalId, []]));
  const identityByTarget = new Map(recordIdentityInputs.map((entry) => [entry.targetProposalRef, entry]));
  const persistenceByTarget = new Map(persistenceInputs.map((entry) => [entry.targetProposalRef, entry]));
  const authorizationByTarget = new Map();
  targetProposals.forEach((proposal) => {
    const targetErrors = perTargetErrors.get(proposal.targetProposalId);
    if (!proposal.operationId && proposal.proposedAction !== PROSPECT_PROMOTION_WORKFLOW_ACTIONS.NO_ACTION) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.DUPLICATE_OPERATION_ID, "Caller-supplied operationId is required for a planned operation.", "operationId", proposal.targetProposalId);
    if (!Object.values(PROSPECT_PROMOTION_WORKFLOW_ACTIONS).includes(proposal.proposedAction)) addError(targetErrors, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.UNSUPPORTED_ACTION, "Target proposal action is unsupported for Sprint 22.", "proposedAction", proposal.targetProposalId);
    if (decision && isProspectPromotionDecision(decision)) authorizationByTarget.set(proposal.targetProposalId, authorizationFor(proposal, decision, targetErrors));
    else authorizationByTarget.set(proposal.targetProposalId, { targetDecision: null, authorizationStatus: PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES.NOT_AUTHORIZED, claimAuthorizationStatus: PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES.NOT_AUTHORIZED });
    if (proposal.proposedAction !== PROSPECT_PROMOTION_WORKFLOW_ACTIONS.NO_ACTION) validatePlanningMetadata(proposal, identityByTarget.get(proposal.targetProposalId), persistenceByTarget.get(proposal.targetProposalId), targetErrors);
  });
  const edges = validateDependencies(targetProposals, dependencyDeclarations, perTargetErrors, validationRecords);
  perTargetErrors.forEach((entries) => errors.push(...entries));
  const executable = targetProposals.filter((entry) => entry.proposedAction !== PROSPECT_PROMOTION_WORKFLOW_ACTIONS.NO_ACTION);
  const orderedCandidates = deterministicOrder(executable, edges); const orderedOperations = []; const skippedTargets = []; const blockedTargets = [];
  targetProposals.filter((entry) => entry.proposedAction === PROSPECT_PROMOTION_WORKFLOW_ACTIONS.NO_ACTION).forEach((entry) => skippedTargets.push(entry.targetProposalId));
  orderedCandidates.forEach((proposal) => {
    const targetErrors = perTargetErrors.get(proposal.targetProposalId); const authorization = authorizationByTarget.get(proposal.targetProposalId);
    if (targetErrors.length) { blockedTargets.push(proposal.targetProposalId); return; }
    const identity = identityByTarget.get(proposal.targetProposalId); const persistence = persistenceByTarget.get(proposal.targetProposalId);
    const preconditions = [
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.FID_CONTRACT_VALIDATION,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.PERSISTENCE_ENVELOPE_VALIDATION,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.REPOSITORY_AVAILABILITY,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.PERSISTENCE_ID_UNIQUENESS,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.RECORD_REVISION_SEQUENCE,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.AUTHORIZATION_STILL_CURRENT,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.DECISION_NOT_SUPERSEDED,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.BLOCKERS_REVIEWED,
      PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.HUMAN_EXECUTION_APPROVAL,
    ];
    if (proposal.proposedAction === PROSPECT_PROMOTION_WORKFLOW_ACTIONS.APPEND_REVISION) preconditions.push(PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.PRIOR_RECORD_EXISTS);
    if ((edges.get(proposal.targetProposalId)?.size ?? 0) > 0) preconditions.push(PROSPECT_PROMOTION_WORKFLOW_PRECONDITIONS.DEPENDENCIES_EXIST);
    const operation = createProspectPromotionPlannedOperation({
      operationId: proposal.operationId, order: orderedOperations.length + 1, targetProposalRef: proposal.targetProposalId,
      targetType: proposal.targetType, proposedAction: proposal.proposedAction, authorizationStatus: authorization.authorizationStatus,
      claimAuthorizationStatus: authorization.claimAuthorizationStatus,
      dependencyStatus: (edges.get(proposal.targetProposalId)?.size ?? 0) > 0 ? PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_STATUSES.SATISFIED : PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_STATUSES.NOT_REQUIRED,
      payloadPlanningStatus: PROSPECT_PROMOTION_WORKFLOW_PAYLOAD_STATUSES.FID_CONTRACT_VALIDATION_REQUIRED,
      persistencePlanningStatus: PROSPECT_PROMOTION_WORKFLOW_PERSISTENCE_STATUSES.REQUIRES_REPOSITORY_PRECONDITION_CHECK,
      recordIdentityInputs: identity, proposedEnvelope: envelopeFor(proposal, identity, persistence), preconditions,
      warnings: ["Workflow planning passed; factual FID and persistence validation remain required."], errors: [],
      readyForFutureExecution: true, notes: proposal.notes,
    });
    orderedOperations.push(operation);
    validationRecords.push(validationRecord(PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES.REQUIRED_LATER, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.FID_VALIDATION_REQUIRED, "Full factual FID validation is required later.", "proposedPayload", proposal.targetProposalId, proposal.operationId));
    validationRecords.push(validationRecord(PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES.REQUIRED_LATER, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES.REPOSITORY_PRECONDITION_REQUIRED, "Repository preconditions require future verification without a Sprint 22 read.", "proposedEnvelope", proposal.targetProposalId, proposal.operationId));
  });
  const mode = workflow.mode; const hasErrors = errors.length > 0;
  const status = hasErrors ? (blockedTargets.length ? PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES.BLOCKED : PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES.INVALID) : mode === PROSPECT_PROMOTION_WORKFLOW_MODES.VALIDATION_ONLY ? PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES.VALIDATION_COMPLETE : mode === PROSPECT_PROMOTION_WORKFLOW_MODES.PLAN_ONLY ? PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES.PLAN_COMPLETE : PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES.DRY_RUN_COMPLETE;
  const auditEvents = [auditRecord(PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS.VALIDATION_STARTED, workflow, decision, options, targetProposals.map((entry) => entry.targetProposalId)), auditRecord(PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS.VALIDATION_COMPLETED, workflow, decision, options, targetProposals.map((entry) => entry.targetProposalId), orderedOperations.map((entry) => entry.operationId), hasErrors ? "Workflow validation completed with structured errors." : "Workflow validation completed without local planning errors."), auditRecord(hasErrors ? PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS.DRY_RUN_FAILED : PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS.DRY_RUN_COMPLETED, workflow, decision, options, targetProposals.map((entry) => entry.targetProposalId), orderedOperations.map((entry) => entry.operationId), "No repository read or write occurred.")];
  return createProspectPromotionWorkflowDryRunPlanResult({
    planId: options.planId, workflowRef: workflow.workflowId, decisionRef: decision?.decisionId ?? workflow.promotionDecisionRef,
    status, orderedOperations, skippedTargets, blockedTargets, validationRecords,
    preconditions: [...new Set(orderedOperations.flatMap((entry) => entry.preconditions))], warnings, errors, auditEvents,
    summary: { mode, targetProposalCount: targetProposals.length, plannedOperationCount: orderedOperations.length, skippedTargetCount: skippedTargets.length, blockedTargetCount: blockedTargets.length, errorCount: errors.length, deterministicOrdering: true, factualPayloadsGenerated: false, repositoryReadsPerformed: false, repositoryWritesPerformed: false, rollbackPerformed: false, crossProcessIdempotencyClaimed: false },
    runtimeImplemented: true, repositoryWritePerformed: false,
  });
}

export default Object.freeze({
  validateProspectPromotionWorkflowPlannerInput,
  createProspectPromotionWorkflowDryRunPlan,
  isProspectPromotionWorkflowDryRunPlan,
});
