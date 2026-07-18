import {
  PROSPECT_PROMOTION_WORKFLOW_CONTRACT_NAME,
  PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION,
  PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION,
  PROSPECT_PROMOTION_WORKFLOW_MODES,
  PROSPECT_PROMOTION_WORKFLOW_STATUSES,
  PROSPECT_PROMOTION_WORKFLOW_TARGET_TYPES,
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
  PROSPECT_PROMOTION_WORKFLOW_VERIFICATION_STATES,
  PROSPECT_PROMOTION_WORKFLOW_LIFECYCLE_STATES,
} from "./prospectPromotionWorkflowConstants.js";

const PROHIBITED_EXTENSION_KEYS = new Set([
  "repositoryfunction", "repositoryfunctions", "createversioncallback", "createversioncallbacks", "databaseclient", "supabaseclient",
  "apiclient", "credentials", "apikey", "sql", "persistenceexecution", "promotionexecution", "rollbackcallback",
  "rollbackcallbacks", "retrycallback", "retrycallbacks", "hydration", "synchronization", "identityresolution", "fuzzymatching",
  "graphtraversal", "evaluationengine", "evaluationengines", "score", "scores", "grade", "grades", "ranking", "rankings",
  "projection", "projections", "recommendation", "recommendations", "prediction", "predictions", "schemefit", "teamfit",
  "draftvalue", "simulatorready", "draftv3ready",
]);

const PROHIBITED_PAYLOAD_KEYS = new Set([
  ...PROHIBITED_EXTENSION_KEYS, "workflowid", "operationid", "repositorywriteperformed", "readyforfutureexecution",
  "authorizationstatus", "dependencystatus", "persistenceplanningstatus", "payloadplanningstatus",
]);

const WORKFLOW_KEYS = new Set([
  "contract", "contractVersion", "schemaVersion", "workflowId", "workflowRevision", "cycleRef", "intakeCandidateRef",
  "promotionDecisionRef", "promotionDecisionRevision", "mode", "status", "targetOperations", "dependencyDeclarations",
  "recordIdentityInputs", "persistenceInputs", "validationRecords", "errorRecords", "auditHistory", "sourceRefs",
  "evidenceRefs", "reviewRefs", "blockerRefs", "verification", "provenance", "lifecycle", "notes", "extensions", "validation",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape() { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION, schemaVersion: PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION }; }
function add(validation, field, code, path, message) { if (!validation[field].some((entry) => entry.code === code && entry.path === path)) validation[field].push({ code, path, message }); validation.valid = validation.errors.length === 0; }
function error(validation, code, path, message) { add(validation, "errors", code, path, message); }
function warning(validation, code, path, message) { add(validation, "warnings", code, path, message); }
function finish(validation) { validation.valid = validation.errors.length === 0; return validation; }
function string(value, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty unresolved string or null.`); return null; } return value.trim(); }
function date(value, path, validation) { const result = string(value, path, validation); if (result && Number.isNaN(Date.parse(result))) { error(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; } return result; }
function integer(value, path, validation) { if (value == null) return null; if (!Number.isInteger(value) || value < 1) { error(validation, "INVALID_REVISION", path, `${path} must be a positive integer or null.`); return null; } return value; }
function boolean(value, path, validation) { if (value == null) return null; if (typeof value !== "boolean") { error(validation, "INVALID_BOOLEAN", path, `${path} must be boolean or null.`); return null; } return value; }
function enumValue(value, allowed, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (!Object.values(allowed).includes(value)) { error(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; } return value; }
function refs(value, path, validation) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array of unresolved strings.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const item = string(entry, `${path}[${index}]`, validation); if (!item) return; if (seen.has(item)) { warning(validation, "DUPLICATE_NORMALIZED_REFERENCE", path, `Duplicate unresolved reference removed: ${item}.`); return; } seen.add(item); result.push(item); }); return result; }
function strings(value, path, validation) { return refs(value, path, validation); }
function safeValue(value, path, validation, prohibited = PROHIBITED_EXTENSION_KEYS) { if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value; if (Array.isArray(value)) return value.map((entry, index) => safeValue(entry, `${path}[${index}]`, validation, prohibited)); if (!isObject(value)) { error(validation, "INVALID_STRUCTURED_VALUE", path, `${path} contains an unsupported or executable value.`); return null; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); if (prohibited.has(normalized) || typeof entry === "function") { error(validation, "PROHIBITED_PROMOTION_WORKFLOW_FIELD", `${path}.${key}`, `${key} is outside Promotion Workflow ownership.`); return []; } return [[key, safeValue(entry, `${path}.${key}`, validation, prohibited)]]; })); }
function extensions(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_EXTENSIONS", path, `${path} must be an object or null.`); return {}; } return safeValue(value, path, validation); }
function payload(value, path, validation) { if (value == null) return null; if (!isObject(value)) { error(validation, "INVALID_PAYLOAD_SHAPE", path, `${path} must be a plain object or null.`); return null; } return safeValue(value, path, validation, PROHIBITED_PAYLOAD_KEYS); }
function verification(value, path, validation) { if (value == null) return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; if (!isObject(value)) { error(validation, "INVALID_VERIFICATION", path, `${path} must be an object or null.`); return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; } return { state: enumValue(value.state, PROSPECT_PROMOTION_WORKFLOW_VERIFICATION_STATES, `${path}.state`, validation), reviewedBy: string(value.reviewedBy, `${path}.reviewedBy`, validation), reviewedAt: date(value.reviewedAt, `${path}.reviewedAt`, validation), notes: string(value.notes, `${path}.notes`, validation) }; }
function metadata(value, path, validation) { if (value == null) return { tags: [], notes: null, namespace: null, attributes: {} }; if (!isObject(value)) { error(validation, "INVALID_METADATA", path, `${path} must be an object or null.`); return { tags: [], notes: null, namespace: null, attributes: {} }; } return { tags: strings(value.tags, `${path}.tags`, validation), notes: string(value.notes, `${path}.notes`, validation), namespace: string(value.namespace, `${path}.namespace`, validation), attributes: isObject(value.attributes) ? safeValue(value.attributes, `${path}.attributes`, validation) : {} }; }
function records(value, path, validation, factory, idKey) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_RECORD_COLLECTION", path, `${path} must be an array.`); return []; } const result = value.map((entry, index) => { const normalized = factory(entry); if (!normalized.validation.valid) error(validation, "INVALID_NESTED_RECORD", `${path}[${index}]`, `${path}[${index}] is invalid.`); return normalized; }); const ids = result.map((entry) => entry[idKey]).filter(Boolean); if (new Set(ids).size !== ids.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", path, `${path} contains duplicate ${idKey} values.`); return result; }

export function createProspectPromotionTargetProposal(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_TARGET_PROPOSAL", "", "Target Proposal must be an object.");
  const result = {
    targetProposalId: string(value.targetProposalId, "targetProposalId", validation, true), operationId: string(value.operationId, "operationId", validation),
    promotionDecisionTargetRef: string(value.promotionDecisionTargetRef, "promotionDecisionTargetRef", validation, true),
    targetType: enumValue(value.targetType, PROSPECT_PROMOTION_WORKFLOW_TARGET_TYPES, "targetType", validation, true),
    proposedAction: enumValue(value.proposedAction, PROSPECT_PROMOTION_WORKFLOW_ACTIONS, "proposedAction", validation, true),
    targetRecordRef: string(value.targetRecordRef, "targetRecordRef", validation), targetRecordId: string(value.targetRecordId, "targetRecordId", validation),
    targetPersistenceId: string(value.targetPersistenceId, "targetPersistenceId", validation), targetRecordRevision: integer(value.targetRecordRevision, "targetRecordRevision", validation),
    targetContract: string(value.targetContract, "targetContract", validation), targetContractVersion: string(value.targetContractVersion, "targetContractVersion", validation),
    targetSchemaVersion: string(value.targetSchemaVersion, "targetSchemaVersion", validation), proposedPayload: payload(value.proposedPayload, "proposedPayload", validation),
    authorizedClaimRefs: refs(value.authorizedClaimRefs, "authorizedClaimRefs", validation), excludedClaimRefs: refs(value.excludedClaimRefs, "excludedClaimRefs", validation),
    sourceClaimRefs: refs(value.sourceClaimRefs, "sourceClaimRefs", validation), fieldMappings: isObject(value.fieldMappings) ? safeValue(value.fieldMappings, "fieldMappings", validation, PROHIBITED_PAYLOAD_KEYS) : {},
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation),
    dependencyRefs: refs(value.dependencyRefs, "dependencyRefs", validation), predecessorRefs: refs(value.predecessorRefs, "predecessorRefs", validation),
    replacementRefs: refs(value.replacementRefs, "replacementRefs", validation), validationStatus: enumValue(value.validationStatus, PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES, "validationStatus", validation),
    notes: string(value.notes, "notes", validation), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionTargetProposal(value) { return createProspectPromotionTargetProposal(value).validation; }

export function createProspectPromotionRecordIdentityInput(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_RECORD_IDENTITY_INPUT", "", "Record Identity Input must be an object.");
  const result = {
    recordIdentityInputId: string(value.recordIdentityInputId, "recordIdentityInputId", validation, true), targetProposalRef: string(value.targetProposalRef, "targetProposalRef", validation, true),
    targetType: enumValue(value.targetType, PROSPECT_PROMOTION_WORKFLOW_TARGET_TYPES, "targetType", validation, true),
    logicalRecordId: string(value.logicalRecordId, "logicalRecordId", validation), persistenceId: string(value.persistenceId, "persistenceId", validation),
    revision: integer(value.revision, "revision", validation), predecessorPersistenceId: string(value.predecessorPersistenceId, "predecessorPersistenceId", validation),
    priorRecordRef: string(value.priorRecordRef, "priorRecordRef", validation), replacementRef: string(value.replacementRef, "replacementRef", validation),
    externalExistingRecord: boolean(value.externalExistingRecord, "externalExistingRecord", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionRecordIdentityInput(value) { return createProspectPromotionRecordIdentityInput(value).validation; }

export function createProspectPromotionPersistenceInput(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PERSISTENCE_INPUT", "", "Persistence Input must be an object.");
  const effectiveFrom = date(value.effectiveFrom, "effectiveFrom", validation); const effectiveTo = date(value.effectiveTo, "effectiveTo", validation); if (effectiveFrom && effectiveTo && Date.parse(effectiveFrom) > Date.parse(effectiveTo)) error(validation, "INVALID_EFFECTIVE_DATE_ORDER", "effectiveTo", "effectiveTo cannot precede effectiveFrom.");
  const persistenceId = string(value.persistenceId, "persistenceId", validation); const replacedByRef = string(value.replacedByRef, "replacedByRef", validation); const supersedesRef = string(value.supersedesRef, "supersedesRef", validation);
  if (persistenceId && (replacedByRef === persistenceId || supersedesRef === persistenceId)) error(validation, "SELF_PERSISTENCE_REFERENCE", "persistenceInput", "Persistence input cannot replace or supersede itself.");
  const result = {
    persistenceInputId: string(value.persistenceInputId, "persistenceInputId", validation, true), targetProposalRef: string(value.targetProposalRef, "targetProposalRef", validation, true),
    persistenceId, recordId: string(value.recordId, "recordId", validation), revision: integer(value.revision, "revision", validation),
    contract: string(value.contract, "contract", validation), contractVersion: string(value.contractVersion, "contractVersion", validation),
    schemaVersion: string(value.schemaVersion, "schemaVersion", validation), entityRef: string(value.entityRef, "entityRef", validation),
    subjectRef: string(value.subjectRef, "subjectRef", validation), recordType: string(value.recordType, "recordType", validation),
    recordVersion: string(value.recordVersion, "recordVersion", validation), payload: payload(value.payload, "payload", validation),
    lifecycleState: string(value.lifecycleState, "lifecycleState", validation), verificationState: string(value.verificationState, "verificationState", validation),
    effectiveFrom, effectiveTo, recordedAt: date(value.recordedAt, "recordedAt", validation), persistedAt: date(value.persistedAt, "persistedAt", validation),
    replacedByRef, supersedesRef, sourceRecordRefs: refs(value.sourceRecordRefs, "sourceRecordRefs", validation), promotionRefs: refs(value.promotionRefs, "promotionRefs", validation),
    payloadChecksum: string(value.payloadChecksum, "payloadChecksum", validation), metadata: metadata(value.metadata, "metadata", validation),
    predecessorRefs: refs(value.predecessorRefs, "predecessorRefs", validation), replacementRefs: refs(value.replacementRefs, "replacementRefs", validation),
    extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionPersistenceInput(value) { return createProspectPromotionPersistenceInput(value).validation; }

export function createProspectPromotionDependencyDeclaration(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_DEPENDENCY_DECLARATION", "", "Dependency Declaration must be an object.");
  const targetProposalRef = string(value.targetProposalRef, "targetProposalRef", validation, true); const dependencyTargetProposalRef = string(value.dependencyTargetProposalRef, "dependencyTargetProposalRef", validation); const externalExistingRecordRef = string(value.externalExistingRecordRef, "externalExistingRecordRef", validation);
  if (Boolean(dependencyTargetProposalRef) === Boolean(externalExistingRecordRef)) error(validation, "INVALID_DEPENDENCY_TARGET", "", "Declare exactly one planned target dependency or external existing-record reference.");
  if (targetProposalRef && dependencyTargetProposalRef === targetProposalRef) error(validation, "SELF_DEPENDENCY", "dependencyTargetProposalRef", "A target proposal cannot depend on itself.");
  const result = { dependencyId: string(value.dependencyId, "dependencyId", validation, true), targetProposalRef, dependencyTargetProposalRef, externalExistingRecordRef, required: boolean(value.required, "required", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}

export function validateProspectPromotionDependencyDeclaration(value) { return createProspectPromotionDependencyDeclaration(value).validation; }

export function createProspectPromotionValidationRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_VALIDATION_RECORD", "", "Validation Record must be an object.");
  const result = { validationId: string(value.validationId, "validationId", validation), scope: string(value.scope, "scope", validation), status: enumValue(value.status, PROSPECT_PROMOTION_WORKFLOW_VALIDATION_STATUSES, "status", validation), code: string(value.code, "code", validation), message: string(value.message, "message", validation), path: string(value.path, "path", validation), targetProposalRef: string(value.targetProposalRef, "targetProposalRef", validation), operationRef: string(value.operationRef, "operationRef", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}

export function validateProspectPromotionValidationRecord(value) { return createProspectPromotionValidationRecord(value).validation; }

export function createProspectPromotionWorkflowError(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_WORKFLOW_ERROR", "", "Workflow Error must be an object.");
  const result = { errorId: string(value.errorId, "errorId", validation), code: enumValue(value.code, PROSPECT_PROMOTION_WORKFLOW_ERROR_CODES, "code", validation, true), message: string(value.message, "message", validation, true), path: string(value.path, "path", validation), targetProposalRef: string(value.targetProposalRef, "targetProposalRef", validation), operationRef: string(value.operationRef, "operationRef", validation), details: value.details == null ? null : safeValue(value.details, "details", validation), validation };
  finish(validation); return result;
}

export function validateProspectPromotionWorkflowError(value) { return createProspectPromotionWorkflowError(value).validation; }

export function createProspectPromotionWorkflowAuditRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_WORKFLOW_AUDIT", "", "Workflow Audit Record must be an object.");
  const result = { auditId: string(value.auditId, "auditId", validation), eventType: enumValue(value.eventType, PROSPECT_PROMOTION_WORKFLOW_AUDIT_EVENTS, "eventType", validation, true), actorRef: string(value.actorRef, "actorRef", validation), occurredAt: date(value.occurredAt, "occurredAt", validation), workflowRef: string(value.workflowRef, "workflowRef", validation), decisionRef: string(value.decisionRef, "decisionRef", validation), targetProposalRefs: refs(value.targetProposalRefs, "targetProposalRefs", validation), operationRefs: refs(value.operationRefs, "operationRefs", validation), validationRefs: refs(value.validationRefs, "validationRefs", validation), errorRefs: refs(value.errorRefs, "errorRefs", validation), reason: string(value.reason, "reason", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}

export function validateProspectPromotionWorkflowAuditRecord(value) { return createProspectPromotionWorkflowAuditRecord(value).validation; }

export function createProspectPromotionPlannedOperation(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PLANNED_OPERATION", "", "Planned Operation must be an object.");
  const result = {
    operationId: string(value.operationId, "operationId", validation, true), order: integer(value.order, "order", validation),
    targetProposalRef: string(value.targetProposalRef, "targetProposalRef", validation, true), targetType: enumValue(value.targetType, PROSPECT_PROMOTION_WORKFLOW_TARGET_TYPES, "targetType", validation, true),
    proposedAction: enumValue(value.proposedAction, PROSPECT_PROMOTION_WORKFLOW_ACTIONS, "proposedAction", validation, true),
    authorizationStatus: enumValue(value.authorizationStatus, PROSPECT_PROMOTION_WORKFLOW_AUTHORIZATION_STATUSES, "authorizationStatus", validation),
    claimAuthorizationStatus: enumValue(value.claimAuthorizationStatus, PROSPECT_PROMOTION_WORKFLOW_CLAIM_AUTHORIZATION_STATUSES, "claimAuthorizationStatus", validation),
    dependencyStatus: enumValue(value.dependencyStatus, PROSPECT_PROMOTION_WORKFLOW_DEPENDENCY_STATUSES, "dependencyStatus", validation),
    payloadPlanningStatus: enumValue(value.payloadPlanningStatus, PROSPECT_PROMOTION_WORKFLOW_PAYLOAD_STATUSES, "payloadPlanningStatus", validation),
    persistencePlanningStatus: enumValue(value.persistencePlanningStatus, PROSPECT_PROMOTION_WORKFLOW_PERSISTENCE_STATUSES, "persistencePlanningStatus", validation),
    recordIdentityInputs: value.recordIdentityInputs == null ? null : safeValue(value.recordIdentityInputs, "recordIdentityInputs", validation),
    proposedEnvelope: value.proposedEnvelope == null ? null : safeValue(value.proposedEnvelope, "proposedEnvelope", validation),
    preconditions: strings(value.preconditions, "preconditions", validation), warnings: strings(value.warnings, "warnings", validation),
    errors: Array.isArray(value.errors) ? value.errors.map((entry) => createProspectPromotionWorkflowError(entry)) : [],
    readyForFutureExecution: boolean(value.readyForFutureExecution, "readyForFutureExecution", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionPlannedOperation(value) { return createProspectPromotionPlannedOperation(value).validation; }

export function createProspectPromotionWorkflowDryRunPlanResult(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_DRY_RUN_PLAN", "", "Dry-Run Plan must be an object.");
  const orderedOperations = records(value.orderedOperations, "orderedOperations", validation, createProspectPromotionPlannedOperation, "operationId");
  const result = {
    planId: string(value.planId, "planId", validation, true), workflowRef: string(value.workflowRef, "workflowRef", validation),
    decisionRef: string(value.decisionRef, "decisionRef", validation), status: enumValue(value.status, PROSPECT_PROMOTION_WORKFLOW_PLAN_STATUSES, "status", validation, true),
    orderedOperations, skippedTargets: refs(value.skippedTargets, "skippedTargets", validation), blockedTargets: refs(value.blockedTargets, "blockedTargets", validation),
    validationRecords: Array.isArray(value.validationRecords) ? value.validationRecords.map((entry) => createProspectPromotionValidationRecord(entry)) : [],
    preconditions: strings(value.preconditions, "preconditions", validation), warnings: strings(value.warnings, "warnings", validation),
    errors: Array.isArray(value.errors) ? value.errors.map((entry) => createProspectPromotionWorkflowError(entry)) : [],
    auditEvents: Array.isArray(value.auditEvents) ? value.auditEvents.map((entry) => createProspectPromotionWorkflowAuditRecord(entry)) : [],
    summary: value.summary == null ? {} : safeValue(value.summary, "summary", validation),
    runtimeImplemented: boolean(value.runtimeImplemented, "runtimeImplemented", validation), repositoryWritePerformed: boolean(value.repositoryWritePerformed, "repositoryWritePerformed", validation),
    validation,
  };
  if (result.repositoryWritePerformed === true) error(validation, "PROHIBITED_REPOSITORY_WRITE", "repositoryWritePerformed", "Sprint 22 dry-run plans cannot report a repository write.");
  finish(validation); return result;
}

export function validateProspectPromotionWorkflowDryRunPlan(value) { return createProspectPromotionWorkflowDryRunPlanResult(value).validation; }
export function isProspectPromotionWorkflowDryRunPlan(value) { return Boolean(isObject(value) && value.runtimeImplemented === true && value.repositoryWritePerformed === false && validateProspectPromotionWorkflowDryRunPlan(value).valid); }

function normalizeWorkflow(input) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_WORKFLOW", "", "Prospect Promotion Workflow must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_PROMOTION_WORKFLOW_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Promotion Workflow contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Promotion Workflow contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Promotion Workflow schema version does not match.");
  const unknownKeys = Object.keys(value).filter((key) => !WORKFLOW_KEYS.has(key)); if (unknownKeys.length) error(validation, "UNSUPPORTED_PROMOTION_WORKFLOW_FIELD", unknownKeys[0], `${unknownKeys[0]} is outside Promotion Workflow ownership.`);
  const workflowId = string(value.workflowId, "workflowId", validation, true);
  const targetOperations = records(value.targetOperations, "targetOperations", validation, createProspectPromotionTargetProposal, "targetProposalId");
  const dependencyDeclarations = records(value.dependencyDeclarations, "dependencyDeclarations", validation, createProspectPromotionDependencyDeclaration, "dependencyId");
  const recordIdentityInputs = records(value.recordIdentityInputs, "recordIdentityInputs", validation, createProspectPromotionRecordIdentityInput, "recordIdentityInputId");
  const persistenceInputs = records(value.persistenceInputs, "persistenceInputs", validation, createProspectPromotionPersistenceInput, "persistenceInputId");
  const operationIds = targetOperations.map((entry) => entry.operationId).filter(Boolean); if (new Set(operationIds).size !== operationIds.length) error(validation, "DUPLICATE_OPERATION_ID", "targetOperations", "Target proposals contain duplicate operationId values.");
  const lifecycleValue = value.lifecycle == null ? {} : value.lifecycle; if (!isObject(lifecycleValue)) error(validation, "INVALID_LIFECYCLE", "lifecycle", "lifecycle must be an object or null."); const lifecycleInput = isObject(lifecycleValue) ? lifecycleValue : {};
  const openedAt = date(lifecycleInput.openedAt, "lifecycle.openedAt", validation); const closedAt = date(lifecycleInput.closedAt, "lifecycle.closedAt", validation); if (openedAt && closedAt && Date.parse(openedAt) > Date.parse(closedAt)) error(validation, "INVALID_LIFECYCLE_DATE_ORDER", "lifecycle.closedAt", "closedAt cannot precede openedAt.");
  const priorWorkflowRef = string(lifecycleInput.priorWorkflowRef, "lifecycle.priorWorkflowRef", validation); const replacementWorkflowRef = string(lifecycleInput.replacementWorkflowRef, "lifecycle.replacementWorkflowRef", validation); if (workflowId && (priorWorkflowRef === workflowId || replacementWorkflowRef === workflowId)) error(validation, "SELF_WORKFLOW_REFERENCE", "lifecycle", "Workflow cannot precede or replace itself.");
  const provenanceValue = value.provenance == null ? {} : value.provenance; if (!isObject(provenanceValue)) error(validation, "INVALID_PROVENANCE", "provenance", "provenance must be an object or null."); const provenanceInput = isObject(provenanceValue) ? provenanceValue : {};
  const result = {
    contract: PROSPECT_PROMOTION_WORKFLOW_CONTRACT_NAME, contractVersion: PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION, schemaVersion: PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION,
    workflowId, workflowRevision: integer(value.workflowRevision, "workflowRevision", validation), cycleRef: string(value.cycleRef, "cycleRef", validation, true),
    intakeCandidateRef: string(value.intakeCandidateRef, "intakeCandidateRef", validation, true), promotionDecisionRef: string(value.promotionDecisionRef, "promotionDecisionRef", validation, true),
    promotionDecisionRevision: integer(value.promotionDecisionRevision, "promotionDecisionRevision", validation), mode: enumValue(value.mode, PROSPECT_PROMOTION_WORKFLOW_MODES, "mode", validation, true),
    status: enumValue(value.status, PROSPECT_PROMOTION_WORKFLOW_STATUSES, "status", validation, true), targetOperations, dependencyDeclarations, recordIdentityInputs, persistenceInputs,
    validationRecords: Array.isArray(value.validationRecords) ? value.validationRecords.map((entry) => createProspectPromotionValidationRecord(entry)) : [],
    errorRecords: Array.isArray(value.errorRecords) ? value.errorRecords.map((entry) => createProspectPromotionWorkflowError(entry)) : [],
    auditHistory: Array.isArray(value.auditHistory) ? value.auditHistory.map((entry) => createProspectPromotionWorkflowAuditRecord(entry)) : [],
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewRefs: refs(value.reviewRefs, "reviewRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation),
    verification: verification(value.verification, "verification", validation), provenance: { createdBy: string(provenanceInput.createdBy, "provenance.createdBy", validation), createdAt: date(provenanceInput.createdAt, "provenance.createdAt", validation), updatedBy: string(provenanceInput.updatedBy, "provenance.updatedBy", validation), updatedAt: date(provenanceInput.updatedAt, "provenance.updatedAt", validation) },
    lifecycle: { state: enumValue(lifecycleInput.state, PROSPECT_PROMOTION_WORKFLOW_LIFECYCLE_STATES, "lifecycle.state", validation), openedAt, closedAt, archivedAt: date(lifecycleInput.archivedAt, "lifecycle.archivedAt", validation), priorWorkflowRef, replacementWorkflowRef },
    notes: string(value.notes, "notes", validation), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function createProspectPromotionWorkflow(input = {}) { return normalizeWorkflow(input); }
export function createUnavailableProspectPromotionWorkflow(input = {}) { const supplied = isObject(input) ? input : {}; const { reason, ...workflowInput } = supplied; const result = normalizeWorkflow(workflowInput); error(result.validation, "PROSPECT_PROMOTION_WORKFLOW_UNAVAILABLE", "", typeof reason === "string" && reason.trim() ? reason.trim() : "No usable Prospect Promotion Workflow is available."); return result; }
export function validateProspectPromotionWorkflow(value) { return normalizeWorkflow(value).validation; }
export function isProspectPromotionWorkflow(value) { return Boolean(isObject(value) && value.contract === PROSPECT_PROMOTION_WORKFLOW_CONTRACT_NAME && value.contractVersion === PROSPECT_PROMOTION_WORKFLOW_CONTRACT_VERSION && value.schemaVersion === PROSPECT_PROMOTION_WORKFLOW_SCHEMA_VERSION && validateProspectPromotionWorkflow(value).valid); }

export default Object.freeze({
  createProspectPromotionTargetProposal, validateProspectPromotionTargetProposal,
  createProspectPromotionRecordIdentityInput, validateProspectPromotionRecordIdentityInput,
  createProspectPromotionPersistenceInput, validateProspectPromotionPersistenceInput,
  createProspectPromotionDependencyDeclaration, validateProspectPromotionDependencyDeclaration,
  createProspectPromotionValidationRecord, validateProspectPromotionValidationRecord,
  createProspectPromotionWorkflowError, validateProspectPromotionWorkflowError,
  createProspectPromotionWorkflowAuditRecord, validateProspectPromotionWorkflowAuditRecord,
  createProspectPromotionPlannedOperation, validateProspectPromotionPlannedOperation,
  createProspectPromotionWorkflowDryRunPlanResult, validateProspectPromotionWorkflowDryRunPlan,
  isProspectPromotionWorkflowDryRunPlan, createProspectPromotionWorkflow,
  createUnavailableProspectPromotionWorkflow, validateProspectPromotionWorkflow, isProspectPromotionWorkflow,
});
