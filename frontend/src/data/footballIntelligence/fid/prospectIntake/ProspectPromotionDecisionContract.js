import {
  PROSPECT_PROMOTION_DECISION_CONTRACT_NAME,
  PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION,
  PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION,
  PROSPECT_PROMOTION_DECISION_STATUSES,
  PROSPECT_PROMOTION_TARGET_TYPES,
  PROSPECT_PROMOTION_TARGET_DECISIONS,
  PROSPECT_PROMOTION_PROPOSED_ACTIONS,
  PROSPECT_PROMOTION_CLAIM_DECISIONS,
  PROSPECT_PROMOTION_CLAIM_SCOPES,
  PROSPECT_PROMOTION_REVIEW_TYPES,
  PROSPECT_PROMOTION_REVIEW_STATUSES,
  PROSPECT_PROMOTION_REVIEW_OUTCOMES,
  PROSPECT_PROMOTION_DISSENT_POSITIONS,
  PROSPECT_PROMOTION_LIMITATION_SEVERITIES,
  PROSPECT_PROMOTION_LIMITATION_STATUSES,
  PROSPECT_PROMOTION_HISTORY_EVENTS,
  PROSPECT_PROMOTION_VERIFICATION_STATES,
  PROSPECT_PROMOTION_LIFECYCLE_STATES,
} from "./prospectPromotionDecisionConstants.js";

const PROHIBITED_EXTENSION_KEYS = new Set([
  "score", "scores", "grade", "grades", "rating", "ratings", "ranking", "rankings", "evaluation", "evaluations",
  "recommendation", "recommendations", "projection", "projections", "prediction", "predictions", "expectedround",
  "draftrange", "schemefit", "teamfit", "draftvalue", "positionalvalue", "simulatorready", "draftv3ready",
  "repositoryoperation", "repositoryoperations", "promotionexecutionfunction", "promotionexecutionfunctions", "apiclient",
  "databaseclient", "supabaseclient", "credentials", "apikey", "sql", "hydrationfunction", "hydrationfunctions",
  "synchronizationfunction", "synchronizationfunctions", "identityresolutionfunction", "identityresolutionfunctions",
  "graphtraversalfunction", "graphtraversalfunctions", "enginefunction", "enginefunctions",
]);

const DECISION_KEYS = new Set([
  "contract", "contractVersion", "schemaVersion", "decisionId", "decisionRevision", "workflowRevision", "cycleRef",
  "intakeCandidateRef", "watchlistRefs", "watchlistEntryRefs", "identityIntakeRefs", "promotionPlanRefs",
  "promotionDecisionLabel", "status", "targetDecisions", "claimDecisions", "reviewRecords", "dissentRecords",
  "blockerRefs", "limitationRecords", "decisionHistory", "sourceRefs", "researchSourceRefs", "researchSessionRefs",
  "recordedObservationRefs", "analyticalObservationRefs", "evidenceArtifactRefs", "evidenceRefs", "verification",
  "provenance", "lifecycle", "notes", "extensions", "validation",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape() { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion: PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION, schemaVersion: PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION }; }
function add(validation, field, code, path, message) { if (!validation[field].some((entry) => entry.code === code && entry.path === path)) validation[field].push({ code, path, message }); validation.valid = validation.errors.length === 0; }
function error(validation, code, path, message) { add(validation, "errors", code, path, message); }
function warning(validation, code, path, message) { add(validation, "warnings", code, path, message); }
function finish(validation) { validation.valid = validation.errors.length === 0; return validation; }
function string(value, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty unresolved string or null.`); return null; } return value.trim(); }
function date(value, path, validation) { const result = string(value, path, validation); if (result && Number.isNaN(Date.parse(result))) { error(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; } return result; }
function integer(value, path, validation) { if (value == null) return null; if (!Number.isInteger(value) || value < 1) { error(validation, "INVALID_REVISION", path, `${path} must be a positive integer or null.`); return null; } return value; }
function enumValue(value, allowed, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (!Object.values(allowed).includes(value)) { error(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; } return value; }
function refs(value, path, validation) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array of unresolved strings.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const item = string(entry, `${path}[${index}]`, validation); if (!item) return; if (seen.has(item)) { warning(validation, "DUPLICATE_NORMALIZED_REFERENCE", path, `Duplicate unresolved reference removed: ${item}.`); return; } seen.add(item); result.push(item); }); return result; }
function strings(value, path, validation) { return refs(value, path, validation); }
function verification(value, path, validation) { if (value == null) return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; if (!isObject(value)) { error(validation, "INVALID_VERIFICATION", path, `${path} must be an object or null.`); return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; } return { state: enumValue(value.state, PROSPECT_PROMOTION_VERIFICATION_STATES, `${path}.state`, validation), reviewedBy: string(value.reviewedBy, `${path}.reviewedBy`, validation), reviewedAt: date(value.reviewedAt, `${path}.reviewedAt`, validation), notes: string(value.notes, `${path}.notes`, validation) }; }
function safeValue(value, path, validation) { if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value; if (Array.isArray(value)) return value.map((entry, index) => safeValue(entry, `${path}[${index}]`, validation)); if (!isObject(value)) { error(validation, "INVALID_STRUCTURED_VALUE", path, `${path} contains an unsupported or executable value.`); return null; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); if (PROHIBITED_EXTENSION_KEYS.has(normalized) || typeof entry === "function") { error(validation, "PROHIBITED_PROMOTION_DECISION_FIELD", `${path}.${key}`, `${key} is outside Promotion Decision governance ownership.`); return []; } return [[key, safeValue(entry, `${path}.${key}`, validation)]]; })); }
function extensions(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_EXTENSIONS", path, `${path} must be an object or null.`); return {}; } return safeValue(value, path, validation); }
function records(value, path, validation, factory, idKey) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_RECORD_COLLECTION", path, `${path} must be an array.`); return []; } const result = value.map((entry, index) => { const normalized = factory(entry); if (!normalized.validation.valid) error(validation, "INVALID_NESTED_RECORD", `${path}[${index}]`, `${path}[${index}] is invalid.`); return normalized; }); const ids = result.map((entry) => entry[idKey]).filter(Boolean); if (new Set(ids).size !== ids.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", path, `${path} contains duplicate ${idKey} values.`); return result; }
function contradictoryRefs(groups, path, validation) { const ownership = new Map(); Object.entries(groups).forEach(([group, values]) => values.forEach((reference) => { const prior = ownership.get(reference); if (prior && prior !== group) error(validation, "CONTRADICTORY_LOCAL_CLAIM_REFERENCE", path, `${reference} appears in both ${prior} and ${group}.`); else ownership.set(reference, group); })); }

export function createProspectPromotionTargetDecision(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_TARGET_DECISION", "", "Target Decision must be an object.");
  const approvedClaimRefs = refs(value.approvedClaimRefs, "approvedClaimRefs", validation); const deferredClaimRefs = refs(value.deferredClaimRefs, "deferredClaimRefs", validation);
  const rejectedClaimRefs = refs(value.rejectedClaimRefs, "rejectedClaimRefs", validation); const excludedClaimRefs = refs(value.excludedClaimRefs, "excludedClaimRefs", validation); const unresolvedClaimRefs = refs(value.unresolvedClaimRefs, "unresolvedClaimRefs", validation);
  contradictoryRefs({ approvedClaimRefs, deferredClaimRefs, rejectedClaimRefs, excludedClaimRefs, unresolvedClaimRefs }, "claimDecisionRefs", validation);
  const result = {
    targetDecisionId: string(value.targetDecisionId, "targetDecisionId", validation, true), targetType: enumValue(value.targetType, PROSPECT_PROMOTION_TARGET_TYPES, "targetType", validation, true),
    targetRef: string(value.targetRef, "targetRef", validation), proposedAction: enumValue(value.proposedAction, PROSPECT_PROMOTION_PROPOSED_ACTIONS, "proposedAction", validation),
    decision: enumValue(value.decision, PROSPECT_PROMOTION_TARGET_DECISIONS, "decision", validation, true), readinessRef: string(value.readinessRef, "readinessRef", validation),
    promotionPlanTargetRef: string(value.promotionPlanTargetRef, "promotionPlanTargetRef", validation), approvedClaimRefs, deferredClaimRefs, rejectedClaimRefs,
    excludedClaimRefs, unresolvedClaimRefs, requiredSourceRefs: refs(value.requiredSourceRefs, "requiredSourceRefs", validation),
    requiredEvidenceRefs: refs(value.requiredEvidenceRefs, "requiredEvidenceRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation),
    reviewerRefs: refs(value.reviewerRefs, "reviewerRefs", validation), rationale: string(value.rationale, "rationale", validation),
    limitations: strings(value.limitations, "limitations", validation), notes: string(value.notes, "notes", validation),
    verification: verification(value.verification, "verification", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionTargetDecision(value) { return createProspectPromotionTargetDecision(value).validation; }

export function createProspectPromotionClaimDecision(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_CLAIM_DECISION", "", "Claim Decision must be an object.");
  const result = {
    claimDecisionId: string(value.claimDecisionId, "claimDecisionId", validation, true), sourceClaimRef: string(value.sourceClaimRef, "sourceClaimRef", validation, true),
    claimType: string(value.claimType, "claimType", validation), targetType: enumValue(value.targetType, PROSPECT_PROMOTION_TARGET_TYPES, "targetType", validation),
    targetField: string(value.targetField, "targetField", validation), proposedValueDeclaration: value.proposedValueDeclaration == null ? null : safeValue(value.proposedValueDeclaration, "proposedValueDeclaration", validation),
    decision: enumValue(value.decision, PROSPECT_PROMOTION_CLAIM_DECISIONS, "decision", validation, true), decisionScope: enumValue(value.decisionScope, PROSPECT_PROMOTION_CLAIM_SCOPES, "decisionScope", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewerRefs: refs(value.reviewerRefs, "reviewerRefs", validation),
    rationale: string(value.rationale, "rationale", validation), limitations: strings(value.limitations, "limitations", validation),
    conflictRefs: refs(value.conflictRefs, "conflictRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation),
    verification: verification(value.verification, "verification", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionClaimDecision(value) { return createProspectPromotionClaimDecision(value).validation; }

export function createProspectPromotionReviewRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_REVIEW", "", "Promotion Review must be an object.");
  const result = {
    reviewId: string(value.reviewId, "reviewId", validation, true), reviewType: enumValue(value.reviewType, PROSPECT_PROMOTION_REVIEW_TYPES, "reviewType", validation, true),
    reviewerRef: string(value.reviewerRef, "reviewerRef", validation), reviewStatus: enumValue(value.reviewStatus, PROSPECT_PROMOTION_REVIEW_STATUSES, "reviewStatus", validation),
    outcome: enumValue(value.outcome, PROSPECT_PROMOTION_REVIEW_OUTCOMES, "outcome", validation), reviewedAt: date(value.reviewedAt, "reviewedAt", validation),
    targetDecisionRefs: refs(value.targetDecisionRefs, "targetDecisionRefs", validation), claimDecisionRefs: refs(value.claimDecisionRefs, "claimDecisionRefs", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation),
    findings: strings(value.findings, "findings", validation), rationale: string(value.rationale, "rationale", validation), limitations: strings(value.limitations, "limitations", validation),
    notes: string(value.notes, "notes", validation), verification: verification(value.verification, "verification", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionReviewRecord(value) { return createProspectPromotionReviewRecord(value).validation; }

export function createProspectPromotionDissentRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_DISSENT", "", "Promotion Dissent must be an object.");
  const result = {
    dissentId: string(value.dissentId, "dissentId", validation, true), reviewerRef: string(value.reviewerRef, "reviewerRef", validation),
    relatedReviewRef: string(value.relatedReviewRef, "relatedReviewRef", validation), targetDecisionRefs: refs(value.targetDecisionRefs, "targetDecisionRefs", validation),
    claimDecisionRefs: refs(value.claimDecisionRefs, "claimDecisionRefs", validation), position: enumValue(value.position, PROSPECT_PROMOTION_DISSENT_POSITIONS, "position", validation, true),
    rationale: string(value.rationale, "rationale", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation),
    limitations: strings(value.limitations, "limitations", validation), notes: string(value.notes, "notes", validation), recordedAt: date(value.recordedAt, "recordedAt", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionDissentRecord(value) { return createProspectPromotionDissentRecord(value).validation; }

export function createProspectPromotionLimitationRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_LIMITATION", "", "Promotion Limitation must be an object.");
  const result = {
    limitationId: string(value.limitationId, "limitationId", validation, true), scope: string(value.scope, "scope", validation, true),
    description: string(value.description, "description", validation, true), severity: enumValue(value.severity, PROSPECT_PROMOTION_LIMITATION_SEVERITIES, "severity", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation),
    reviewRefs: refs(value.reviewRefs, "reviewRefs", validation), status: enumValue(value.status, PROSPECT_PROMOTION_LIMITATION_STATUSES, "status", validation),
    notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionLimitationRecord(value) { return createProspectPromotionLimitationRecord(value).validation; }

export function createProspectPromotionDecisionHistory(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_DECISION_HISTORY", "", "Promotion Decision History must be an object.");
  const result = {
    historyId: string(value.historyId, "historyId", validation, true), priorDecisionRef: string(value.priorDecisionRef, "priorDecisionRef", validation),
    eventType: enumValue(value.eventType, PROSPECT_PROMOTION_HISTORY_EVENTS, "eventType", validation, true),
    fromStatus: enumValue(value.fromStatus, PROSPECT_PROMOTION_DECISION_STATUSES, "fromStatus", validation), toStatus: enumValue(value.toStatus, PROSPECT_PROMOTION_DECISION_STATUSES, "toStatus", validation),
    actorRef: string(value.actorRef, "actorRef", validation), occurredAt: date(value.occurredAt, "occurredAt", validation), reason: string(value.reason, "reason", validation),
    targetDecisionRefs: refs(value.targetDecisionRefs, "targetDecisionRefs", validation), claimDecisionRefs: refs(value.claimDecisionRefs, "claimDecisionRefs", validation),
    reviewRefs: refs(value.reviewRefs, "reviewRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation),
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), notes: string(value.notes, "notes", validation), validation,
  };
  finish(validation); return result;
}

export function validateProspectPromotionDecisionHistory(value) { return createProspectPromotionDecisionHistory(value).validation; }

function normalizeDecision(input) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROSPECT_PROMOTION_DECISION", "", "Prospect Promotion Decision must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_PROMOTION_DECISION_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Promotion Decision contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Promotion Decision contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Promotion Decision schema version does not match.");
  const unknownKeys = Object.keys(value).filter((key) => !DECISION_KEYS.has(key)); if (unknownKeys.length) error(validation, "UNSUPPORTED_PROMOTION_DECISION_FIELD", unknownKeys[0], `${unknownKeys[0]} is outside Promotion Decision ownership.`);
  const decisionId = string(value.decisionId, "decisionId", validation, true);
  const targetDecisions = records(value.targetDecisions, "targetDecisions", validation, createProspectPromotionTargetDecision, "targetDecisionId");
  const claimDecisions = records(value.claimDecisions, "claimDecisions", validation, createProspectPromotionClaimDecision, "claimDecisionId");
  const reviewRecords = records(value.reviewRecords, "reviewRecords", validation, createProspectPromotionReviewRecord, "reviewId");
  const dissentRecords = records(value.dissentRecords, "dissentRecords", validation, createProspectPromotionDissentRecord, "dissentId");
  const limitationRecords = records(value.limitationRecords, "limitationRecords", validation, createProspectPromotionLimitationRecord, "limitationId");
  const decisionHistory = records(value.decisionHistory, "decisionHistory", validation, createProspectPromotionDecisionHistory, "historyId");
  const allLocalIds = [...targetDecisions.map((entry) => entry.targetDecisionId), ...claimDecisions.map((entry) => entry.claimDecisionId), ...reviewRecords.map((entry) => entry.reviewId), ...dissentRecords.map((entry) => entry.dissentId), ...limitationRecords.map((entry) => entry.limitationId), ...decisionHistory.map((entry) => entry.historyId)].filter(Boolean);
  if (new Set(allLocalIds).size !== allLocalIds.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", "", "Promotion Decision local identifiers must be unique across collections.");
  const lifecycleValue = value.lifecycle == null ? {} : value.lifecycle; if (!isObject(lifecycleValue)) error(validation, "INVALID_LIFECYCLE", "lifecycle", "lifecycle must be an object or null."); const lifecycleInput = isObject(lifecycleValue) ? lifecycleValue : {};
  const openedAt = date(lifecycleInput.openedAt, "lifecycle.openedAt", validation); const closedAt = date(lifecycleInput.closedAt, "lifecycle.closedAt", validation); if (openedAt && closedAt && Date.parse(openedAt) > Date.parse(closedAt)) error(validation, "INVALID_LIFECYCLE_DATE_ORDER", "lifecycle.closedAt", "closedAt cannot precede openedAt.");
  const priorDecisionRef = string(lifecycleInput.priorDecisionRef, "lifecycle.priorDecisionRef", validation); const replacementDecisionRef = string(lifecycleInput.replacementDecisionRef, "lifecycle.replacementDecisionRef", validation);
  if (decisionId && (priorDecisionRef === decisionId || replacementDecisionRef === decisionId)) error(validation, "SELF_PROMOTION_DECISION_REFERENCE", "lifecycle", "A Promotion Decision cannot precede or replace itself.");
  if (priorDecisionRef && replacementDecisionRef && priorDecisionRef === replacementDecisionRef) error(validation, "CONFLICTING_DECISION_REFERENCES", "lifecycle", "Prior and replacement decision references must differ.");
  decisionHistory.forEach((entry, index) => { if (decisionId && entry.priorDecisionRef === decisionId) error(validation, "SELF_PROMOTION_DECISION_REFERENCE", `decisionHistory[${index}].priorDecisionRef`, "Decision history cannot reference the current decision as its predecessor."); });
  const provenanceValue = value.provenance == null ? {} : value.provenance; if (!isObject(provenanceValue)) error(validation, "INVALID_PROVENANCE", "provenance", "provenance must be an object or null."); const provenanceInput = isObject(provenanceValue) ? provenanceValue : {};
  const result = {
    contract: PROSPECT_PROMOTION_DECISION_CONTRACT_NAME, contractVersion: PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION, schemaVersion: PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION,
    decisionId, decisionRevision: integer(value.decisionRevision, "decisionRevision", validation), workflowRevision: integer(value.workflowRevision, "workflowRevision", validation),
    cycleRef: string(value.cycleRef, "cycleRef", validation, true), intakeCandidateRef: string(value.intakeCandidateRef, "intakeCandidateRef", validation, true),
    watchlistRefs: refs(value.watchlistRefs, "watchlistRefs", validation), watchlistEntryRefs: refs(value.watchlistEntryRefs, "watchlistEntryRefs", validation),
    identityIntakeRefs: refs(value.identityIntakeRefs, "identityIntakeRefs", validation), promotionPlanRefs: refs(value.promotionPlanRefs, "promotionPlanRefs", validation),
    promotionDecisionLabel: string(value.promotionDecisionLabel, "promotionDecisionLabel", validation), status: enumValue(value.status, PROSPECT_PROMOTION_DECISION_STATUSES, "status", validation, true),
    targetDecisions, claimDecisions, reviewRecords, dissentRecords, blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), limitationRecords, decisionHistory,
    sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), researchSourceRefs: refs(value.researchSourceRefs, "researchSourceRefs", validation),
    researchSessionRefs: refs(value.researchSessionRefs, "researchSessionRefs", validation), recordedObservationRefs: refs(value.recordedObservationRefs, "recordedObservationRefs", validation),
    analyticalObservationRefs: refs(value.analyticalObservationRefs, "analyticalObservationRefs", validation), evidenceArtifactRefs: refs(value.evidenceArtifactRefs, "evidenceArtifactRefs", validation),
    evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), verification: verification(value.verification, "verification", validation),
    provenance: { createdBy: string(provenanceInput.createdBy, "provenance.createdBy", validation), createdAt: date(provenanceInput.createdAt, "provenance.createdAt", validation), updatedBy: string(provenanceInput.updatedBy, "provenance.updatedBy", validation), updatedAt: date(provenanceInput.updatedAt, "provenance.updatedAt", validation) },
    lifecycle: { state: enumValue(lifecycleInput.state, PROSPECT_PROMOTION_LIFECYCLE_STATES, "lifecycle.state", validation), openedAt, closedAt, archivedAt: date(lifecycleInput.archivedAt, "lifecycle.archivedAt", validation), priorDecisionRef, replacementDecisionRef },
    notes: string(value.notes, "notes", validation), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function createProspectPromotionDecision(input = {}) { return normalizeDecision(input); }
export function createUnavailableProspectPromotionDecision(input = {}) { const supplied = isObject(input) ? input : {}; const { reason, ...decisionInput } = supplied; const result = normalizeDecision(decisionInput); error(result.validation, "PROSPECT_PROMOTION_DECISION_UNAVAILABLE", "", typeof reason === "string" && reason.trim() ? reason.trim() : "No usable Prospect Promotion Decision is available."); return result; }
export function validateProspectPromotionDecision(value) { return normalizeDecision(value).validation; }
export function isProspectPromotionDecision(value) { return Boolean(isObject(value) && value.contract === PROSPECT_PROMOTION_DECISION_CONTRACT_NAME && value.contractVersion === PROSPECT_PROMOTION_DECISION_CONTRACT_VERSION && value.schemaVersion === PROSPECT_PROMOTION_DECISION_SCHEMA_VERSION && validateProspectPromotionDecision(value).valid); }

export default Object.freeze({
  createProspectPromotionTargetDecision, validateProspectPromotionTargetDecision,
  createProspectPromotionClaimDecision, validateProspectPromotionClaimDecision,
  createProspectPromotionReviewRecord, validateProspectPromotionReviewRecord,
  createProspectPromotionDissentRecord, validateProspectPromotionDissentRecord,
  createProspectPromotionLimitationRecord, validateProspectPromotionLimitationRecord,
  createProspectPromotionDecisionHistory, validateProspectPromotionDecisionHistory,
  createProspectPromotionDecision, createUnavailableProspectPromotionDecision,
  validateProspectPromotionDecision, isProspectPromotionDecision,
});
