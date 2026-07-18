export const PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME = "ProspectIntakeArchitectureSpecification";
export const PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION = "FID-PROSPECT-INTAKE-ARCHITECTURE-1.0.0";
export const PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION = "FID-PROSPECT-INTAKE-ARCHITECTURE-SCHEMA-1.0.0";
export const PROSPECT_INTAKE_CANDIDATE_CONTRACT_NAME = "ProspectIntakeCandidate";
export const PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION = "FID-PROSPECT-INTAKE-CANDIDATE-1.0.0";
export const PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION = "FID-PROSPECT-INTAKE-CANDIDATE-SCHEMA-1.0.0";

export const PROSPECT_INTAKE_STAGES = Object.freeze({
  DISCOVERED: "DISCOVERED", IDENTITY_REVIEW: "IDENTITY_REVIEW", RESEARCH_COLLECTION: "RESEARCH_COLLECTION",
  EVIDENCE_REVIEW: "EVIDENCE_REVIEW", FACT_REVIEW: "FACT_REVIEW", HUMAN_VERIFICATION: "HUMAN_VERIFICATION",
  PROMOTION_READY: "PROMOTION_READY", PROMOTION_APPROVED: "PROMOTION_APPROVED", PROMOTION_DEFERRED: "PROMOTION_DEFERRED",
  PROMOTION_REJECTED: "PROMOTION_REJECTED", PROMOTED: "PROMOTED", ARCHIVED: "ARCHIVED", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_STATUSES = Object.freeze({
  OPEN: "OPEN", IN_REVIEW: "IN_REVIEW", BLOCKED: "BLOCKED", DEFERRED: "DEFERRED", APPROVED: "APPROVED",
  REJECTED: "REJECTED", COMPLETED: "COMPLETED", ARCHIVED: "ARCHIVED", UNKNOWN: "UNKNOWN", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_DISCOVERY_ORIGINS = Object.freeze({
  NATIONAL_WATCHLIST: "NATIONAL_WATCHLIST", TEAM_MEDIA_GUIDE: "TEAM_MEDIA_GUIDE", SCHOOL_ROSTER: "SCHOOL_ROSTER",
  AWARD_LIST: "AWARD_LIST", PRODUCTION_LEADER: "PRODUCTION_LEADER", TRANSFER_ACTIVITY: "TRANSFER_ACTIVITY",
  SCOUTING_SOURCE: "SCOUTING_SOURCE", ANALYST_RANKING: "ANALYST_RANKING", EVENT_ROSTER: "EVENT_ROSTER",
  HUMAN_SUBMISSION: "HUMAN_SUBMISSION", MANUAL_RESEARCH: "MANUAL_RESEARCH", OTHER: "OTHER", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_IDENTITY_OUTCOMES = Object.freeze({
  NOT_STARTED: "NOT_STARTED", IN_PROGRESS: "IN_PROGRESS", MATCH_PROPOSED: "MATCH_PROPOSED", MATCH_CONFIRMED: "MATCH_CONFIRMED",
  CONFLICTED: "CONFLICTED", INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE", REJECTED: "REJECTED", DEFERRED: "DEFERRED", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_RESEARCH_CATEGORIES = Object.freeze({
  IDENTITY: "IDENTITY", ROSTER: "ROSTER", SCHOOL: "SCHOOL", POSITION: "POSITION", CLASS_YEAR: "CLASS_YEAR",
  ELIGIBILITY: "ELIGIBILITY", DECLARATION: "DECLARATION", MEASUREMENTS: "MEASUREMENTS", ATHLETIC_TESTING: "ATHLETIC_TESTING",
  PRODUCTION: "PRODUCTION", USAGE: "USAGE", AWARDS: "AWARDS", RECOGNITION: "RECOGNITION", INJURY_CONTEXT: "INJURY_CONTEXT",
  TRANSFER_HISTORY: "TRANSFER_HISTORY", DISCIPLINARY_CONTEXT: "DISCIPLINARY_CONTEXT", SCOUTING_REPORTS: "SCOUTING_REPORTS",
  CONSENSUS_RANKINGS: "CONSENSUS_RANKINGS", DRAFT_PROJECTIONS: "DRAFT_PROJECTIONS", BACKGROUND: "BACKGROUND", OTHER: "OTHER",
});
export const PROSPECT_INTAKE_EVIDENCE_STATES = Object.freeze({
  NOT_REVIEWED: "NOT_REVIEWED", INSUFFICIENT: "INSUFFICIENT", PARTIAL: "PARTIAL", SUFFICIENT_FOR_IDENTITY: "SUFFICIENT_FOR_IDENTITY",
  SUFFICIENT_FOR_PLAYER_PROFILE: "SUFFICIENT_FOR_PLAYER_PROFILE", SUFFICIENT_FOR_PROSPECT_PROFILE: "SUFFICIENT_FOR_PROSPECT_PROFILE",
  SUFFICIENT_FOR_LIMITED_PROMOTION: "SUFFICIENT_FOR_LIMITED_PROMOTION", SUFFICIENT_FOR_FULL_PROMOTION: "SUFFICIENT_FOR_FULL_PROMOTION",
  CONFLICTED: "CONFLICTED", UNAVAILABLE: "UNAVAILABLE", DEFERRED: "DEFERRED", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_REVIEW_TYPES = Object.freeze({
  IDENTITY_REVIEW: "IDENTITY_REVIEW", EVIDENCE_REVIEW: "EVIDENCE_REVIEW", FACTUAL_REVIEW: "FACTUAL_REVIEW",
  ELIGIBILITY_REVIEW: "ELIGIBILITY_REVIEW", DECLARATION_REVIEW: "DECLARATION_REVIEW",
  PROMOTION_READINESS_REVIEW: "PROMOTION_READINESS_REVIEW", FINAL_PROMOTION_APPROVAL: "FINAL_PROMOTION_APPROVAL",
});
export const PROSPECT_INTAKE_REVIEW_STATUSES = Object.freeze({ NOT_STARTED: "NOT_STARTED", IN_PROGRESS: "IN_PROGRESS", COMPLETED: "COMPLETED", DEFERRED: "DEFERRED", BLOCKED: "BLOCKED", UNSPECIFIED: "UNSPECIFIED" });
export const PROSPECT_INTAKE_REVIEW_OUTCOMES = Object.freeze({ APPROVED: "APPROVED", REJECTED: "REJECTED", DEFERRED: "DEFERRED", CONFLICTED: "CONFLICTED", INSUFFICIENT: "INSUFFICIENT", NO_CONCLUSION: "NO_CONCLUSION", UNSPECIFIED: "UNSPECIFIED" });
export const PROSPECT_INTAKE_BLOCKER_TYPES = Object.freeze({
  IDENTITY_CONFLICT: "IDENTITY_CONFLICT", DUPLICATE_CANDIDATE_CONCERN: "DUPLICATE_CANDIDATE_CONCERN", MISSING_CORE_IDENTITY: "MISSING_CORE_IDENTITY",
  SCHOOL_CONFLICT: "SCHOOL_CONFLICT", POSITION_CONFLICT: "POSITION_CONFLICT", CLASS_YEAR_CONFLICT: "CLASS_YEAR_CONFLICT",
  ELIGIBILITY_UNCLEAR: "ELIGIBILITY_UNCLEAR", DECLARATION_UNCLEAR: "DECLARATION_UNCLEAR", INSUFFICIENT_SOURCES: "INSUFFICIENT_SOURCES",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE", CONFLICTING_EVIDENCE: "CONFLICTING_EVIDENCE", SOURCE_QUALITY_CONCERN: "SOURCE_QUALITY_CONCERN",
  VERIFICATION_PENDING: "VERIFICATION_PENDING", LEGAL_OR_POLICY_REVIEW: "LEGAL_OR_POLICY_REVIEW", TECHNICAL_BLOCKER: "TECHNICAL_BLOCKER",
  OTHER: "OTHER", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_BLOCKER_STATUSES = Object.freeze({ OPEN: "OPEN", RESOLVED: "RESOLVED", WAIVED: "WAIVED", DEFERRED: "DEFERRED", REJECTED: "REJECTED", UNSPECIFIED: "UNSPECIFIED" });
export const PROSPECT_INTAKE_READINESS_STATES = Object.freeze({
  NOT_ASSESSED: "NOT_ASSESSED", NOT_READY: "NOT_READY", PARTIALLY_READY: "PARTIALLY_READY", READY_FOR_ENTITY_PROMOTION: "READY_FOR_ENTITY_PROMOTION",
  READY_FOR_PERSON_PROMOTION: "READY_FOR_PERSON_PROMOTION", READY_FOR_PLAYER_PROMOTION: "READY_FOR_PLAYER_PROMOTION", READY_FOR_PROSPECT_PROMOTION: "READY_FOR_PROSPECT_PROMOTION",
  READY_FOR_RELATIONSHIP_PROMOTION: "READY_FOR_RELATIONSHIP_PROMOTION", READY_FOR_LIMITED_PROMOTION: "READY_FOR_LIMITED_PROMOTION",
  READY_FOR_FULL_PROMOTION: "READY_FOR_FULL_PROMOTION", BLOCKED: "BLOCKED", DEFERRED: "DEFERRED", UNSPECIFIED: "UNSPECIFIED",
});
export const PROSPECT_INTAKE_READINESS_SCOPES = Object.freeze({ FOOTBALL_ENTITY: "FOOTBALL_ENTITY", PERSON_PROFILE: "PERSON_PROFILE", PLAYER_PROFILE: "PLAYER_PROFILE", PROSPECT_PROFILE: "PROSPECT_PROFILE", FOOTBALL_RELATIONSHIP: "FOOTBALL_RELATIONSHIP", LIMITED_PROMOTION: "LIMITED_PROMOTION", FULL_PROMOTION: "FULL_PROMOTION" });
export const PROSPECT_INTAKE_PROMOTION_TARGET_TYPES = Object.freeze({ FOOTBALL_ENTITY: "FOOTBALL_ENTITY", PERSON_PROFILE: "PERSON_PROFILE", PLAYER_PROFILE: "PLAYER_PROFILE", PROSPECT_PROFILE: "PROSPECT_PROFILE", FOOTBALL_RELATIONSHIP: "FOOTBALL_RELATIONSHIP" });
export const PROSPECT_INTAKE_PROMOTION_ACTIONS = Object.freeze({ CREATE: "CREATE", APPEND_REVISION: "APPEND_REVISION", DEFER: "DEFER", REJECT: "REJECT", NO_ACTION: "NO_ACTION", UNSPECIFIED: "UNSPECIFIED" });
export const PROSPECT_INTAKE_VERIFICATION_STATES = Object.freeze({ UNVERIFIED: "UNVERIFIED", REVIEWED: "REVIEWED", VERIFIED: "VERIFIED", CONFLICTED: "CONFLICTED", UNSPECIFIED: "UNSPECIFIED" });
export const PROSPECT_INTAKE_LIFECYCLE_STATES = Object.freeze({ OPEN: "OPEN", CLOSED: "CLOSED", ARCHIVED: "ARCHIVED", REOPENED: "REOPENED", UNSPECIFIED: "UNSPECIFIED" });

const PROHIBITED_EXTENSION_KEYS = new Set([
  "scraperfunction", "browserautomation", "apiclient", "credentials", "apikey", "databaseclient", "supabaseclient", "sql",
  "executablerepositoryoperation", "automaticpromotion", "hydration", "synchronization", "identityresolutionfunction", "fuzzymatching",
  "graphtraversal", "evaluationengine", "playergrade", "ranking", "projection", "recommendation", "prediction", "decision", "simulatorready",
]);
const CANDIDATE_KEYS = new Set([
  "contract", "contractVersion", "schemaVersion", "intakeId", "cycleRef", "candidateRef", "candidateLabel", "stage", "status",
  "discoveryContext", "identityReview", "researchPlan", "researchSourceRefs", "researchSessionRefs", "recordedObservationRefs",
  "analyticalObservationRefs", "evidenceArtifactRefs", "identityEvidenceRefs", "playerEvidenceRefs", "prospectEvidenceRefs",
  "eligibilityEvidenceRefs", "declarationEvidenceRefs", "schoolEvidenceRefs", "positionEvidenceRefs", "measurementEvidenceRefs",
  "productionEvidenceRefs", "recognitionEvidenceRefs", "scoutingEvidenceRefs", "evidenceSufficiencyDeclarations", "blockerRecords",
  "reviewRecords", "readinessDeclaration", "promotionPlan", "promotionDecisionRefs", "proposedEntityRef", "proposedPersonProfileRef",
  "proposedPlayerProfileRef", "proposedProspectProfileRef", "proposedRelationshipRefs", "workflowHistory", "sourceRefs", "evidenceRefs",
  "verification", "provenance", "lifecycle", "version", "workflowRevision", "notes", "extensions", "validation",
]);

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validationShape(contractVersion = PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION, schemaVersion = PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION) { return { valid: true, errors: [], warnings: [], checkedAt: null, contractVersion, schemaVersion }; }
function add(validation, field, code, path, message) { if (!validation[field].some((entry) => entry.code === code && entry.path === path)) validation[field].push({ code, path, message }); validation.valid = validation.errors.length === 0; }
function error(validation, code, path, message) { add(validation, "errors", code, path, message); }
function warning(validation, code, path, message) { add(validation, "warnings", code, path, message); }
function string(value, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (typeof value !== "string" || !value.trim()) { error(validation, "INVALID_STRING", path, `${path} must be a non-empty unresolved string or null.`); return null; } return value.trim(); }
function date(value, path, validation) { const result = string(value, path, validation); if (result && Number.isNaN(Date.parse(result))) { error(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`); return null; } return result; }
function integer(value, path, validation) { if (value == null) return null; if (!Number.isInteger(value) || value < 1) { error(validation, "INVALID_VERSION", path, `${path} must be a positive integer or null.`); return null; } return value; }
function boolean(value, path, validation) { if (value == null) return null; if (typeof value !== "boolean") { error(validation, "INVALID_BOOLEAN", path, `${path} must be boolean or null.`); return null; } return value; }
function enumValue(value, allowed, path, validation, required = false) { if (value == null) { if (required) error(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`); return null; } if (!Object.values(allowed).includes(value)) { error(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not recognized.`); return null; } return value; }
function refs(value, path, validation) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_REFERENCE_COLLECTION", path, `${path} must be an array of unresolved strings.`); return []; } const result = []; const seen = new Set(); value.forEach((entry, index) => { const item = string(entry, `${path}[${index}]`, validation); if (!item) return; if (seen.has(item)) { warning(validation, "DUPLICATE_NORMALIZED_REFERENCE", path, `Duplicate unresolved reference removed: ${item}.`); return; } seen.add(item); result.push(item); }); return result; }
function strings(value, path, validation) { return refs(value, path, validation); }
function objectOrNull(value, path, validation, factory) { if (value == null) return null; if (!isObject(value)) { error(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`); return null; } const result = factory(value); if (!result.validation.valid) error(validation, "INVALID_NESTED_RECORD", path, `${path} is invalid.`); return result; }
function records(value, path, validation, factory, idKey) { if (value == null) return []; if (!Array.isArray(value)) { error(validation, "INVALID_RECORD_COLLECTION", path, `${path} must be an array.`); return []; } const result = value.map((entry, index) => { const normalized = factory(entry); if (!normalized.validation.valid) error(validation, "INVALID_NESTED_RECORD", `${path}[${index}]`, `${path}[${index}] is invalid.`); return normalized; }); const ids = result.map((entry) => entry[idKey]).filter(Boolean); if (new Set(ids).size !== ids.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", path, `${path} contains duplicate ${idKey} values.`); return result; }
function basicVerification(value, path, validation) { if (value == null) return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; if (!isObject(value)) { error(validation, "INVALID_VERIFICATION", path, `${path} must be an object or null.`); return { state: null, reviewedBy: null, reviewedAt: null, notes: null }; } return { state: enumValue(value.state, PROSPECT_INTAKE_VERIFICATION_STATES, `${path}.state`, validation), reviewedBy: string(value.reviewedBy, `${path}.reviewedBy`, validation), reviewedAt: date(value.reviewedAt, `${path}.reviewedAt`, validation), notes: string(value.notes, `${path}.notes`, validation) }; }
function extensionValue(value, path, validation) { if (value == null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value; if (Array.isArray(value)) return value.map((entry, index) => extensionValue(entry, `${path}[${index}]`, validation)); if (!isObject(value)) { error(validation, "INVALID_EXTENSION_VALUE", path, `${path} contains an unsupported or executable value.`); return null; } return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => { const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, ""); if (PROHIBITED_EXTENSION_KEYS.has(normalized) || typeof entry === "function") { error(validation, "PROHIBITED_INTAKE_EXTENSION", `${path}.${key}`, `${key} is outside Prospect Intake ownership.`); return []; } return [[key, extensionValue(entry, `${path}.${key}`, validation)]]; })); }
function extensions(value, path, validation) { if (value == null) return {}; if (!isObject(value)) { error(validation, "INVALID_EXTENSIONS", path, `${path} must be an object or null.`); return {}; } return extensionValue(value, path, validation); }
function finish(validation) { validation.valid = validation.errors.length === 0; return validation; }

export function createProspectIntakeDiscoveryContext(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_DISCOVERY_CONTEXT", "", "Discovery context must be an object.");
  const result = { origin: enumValue(value.origin, PROSPECT_INTAKE_DISCOVERY_ORIGINS, "origin", validation), discoveredAt: date(value.discoveredAt, "discoveredAt", validation), submittedLabel: string(value.submittedLabel, "submittedLabel", validation), submittedSchool: string(value.submittedSchool, "submittedSchool", validation), submittedPosition: string(value.submittedPosition, "submittedPosition", validation), submittedClass: string(value.submittedClass, "submittedClass", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeDiscoveryContext(value) { return createProspectIntakeDiscoveryContext(value).validation; }

export function createProspectIntakeIdentityReview(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_IDENTITY_REVIEW", "", "Identity review must be an object.");
  const result = { reviewId: string(value.reviewId, "reviewId", validation), outcome: enumValue(value.outcome, PROSPECT_INTAKE_IDENTITY_OUTCOMES, "outcome", validation), reviewerRef: string(value.reviewerRef, "reviewerRef", validation), reviewedAt: date(value.reviewedAt, "reviewedAt", validation), candidateName: string(value.candidateName, "candidateName", validation), aliases: strings(value.aliases, "aliases", validation), school: string(value.school, "school", validation), rosterIdentifier: string(value.rosterIdentifier, "rosterIdentifier", validation), providerIdentifierRefs: refs(value.providerIdentifierRefs, "providerIdentifierRefs", validation), dateOfBirth: date(value.dateOfBirth, "dateOfBirth", validation), position: string(value.position, "position", validation), classYear: integer(value.classYear, "classYear", validation), playerPersonDistinctionReviewed: boolean(value.playerPersonDistinctionReviewed, "playerPersonDistinctionReviewed", validation), duplicateCandidateConcern: boolean(value.duplicateCandidateConcern, "duplicateCandidateConcern", validation), sameNameConcern: boolean(value.sameNameConcern, "sameNameConcern", validation), transferConcern: boolean(value.transferConcern, "transferConcern", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), conflicts: strings(value.conflicts, "conflicts", validation), notes: string(value.notes, "notes", validation), verification: basicVerification(value.verification, "verification", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeIdentityReview(value) { return createProspectIntakeIdentityReview(value).validation; }

export function createProspectIntakeResearchPlan(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_RESEARCH_PLAN", "", "Research plan must be an object.");
  const categoryList = (entry, path) => { const values = strings(entry, path, validation); values.forEach((category, index) => { if (!Object.values(PROSPECT_INTAKE_RESEARCH_CATEGORIES).includes(category)) error(validation, "UNKNOWN_RESEARCH_CATEGORY", `${path}[${index}]`, `${category} is not recognized.`); }); return values; };
  const result = { planId: string(value.planId, "planId", validation), requiredCategories: categoryList(value.requiredCategories, "requiredCategories"), optionalCategories: categoryList(value.optionalCategories, "optionalCategories"), unavailableCategories: categoryList(value.unavailableCategories, "unavailableCategories"), deferredCategories: categoryList(value.deferredCategories, "deferredCategories"), assignedReviewerRefs: refs(value.assignedReviewerRefs, "assignedReviewerRefs", validation), sourceRequirements: strings(value.sourceRequirements, "sourceRequirements", validation), completionDeclared: boolean(value.completionDeclared, "completionDeclared", validation), declaredByRef: string(value.declaredByRef, "declaredByRef", validation), declaredAt: date(value.declaredAt, "declaredAt", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeResearchPlan(value) { return createProspectIntakeResearchPlan(value).validation; }

export function createProspectIntakeEvidenceSufficiency(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_EVIDENCE_SUFFICIENCY", "", "Evidence sufficiency must be an object.");
  const result = { declarationId: string(value.declarationId, "declarationId", validation, true), scope: string(value.scope, "scope", validation, true), state: enumValue(value.state, PROSPECT_INTAKE_EVIDENCE_STATES, "state", validation, true), reviewerRef: string(value.reviewerRef, "reviewerRef", validation), reviewedAt: date(value.reviewedAt, "reviewedAt", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), rationale: string(value.rationale, "rationale", validation), limitations: strings(value.limitations, "limitations", validation), unresolvedConflicts: strings(value.unresolvedConflicts, "unresolvedConflicts", validation), verification: basicVerification(value.verification, "verification", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeEvidenceSufficiency(value) { return createProspectIntakeEvidenceSufficiency(value).validation; }

export function createProspectIntakeReviewRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_REVIEW_RECORD", "", "Review record must be an object.");
  const result = { reviewId: string(value.reviewId, "reviewId", validation, true), reviewType: enumValue(value.reviewType, PROSPECT_INTAKE_REVIEW_TYPES, "reviewType", validation, true), reviewerRef: string(value.reviewerRef, "reviewerRef", validation), status: enumValue(value.status, PROSPECT_INTAKE_REVIEW_STATUSES, "status", validation), outcome: enumValue(value.outcome, PROSPECT_INTAKE_REVIEW_OUTCOMES, "outcome", validation), reviewedAt: date(value.reviewedAt, "reviewedAt", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), findings: strings(value.findings, "findings", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), limitations: strings(value.limitations, "limitations", validation), notes: string(value.notes, "notes", validation), verification: basicVerification(value.verification, "verification", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeReviewRecord(value) { return createProspectIntakeReviewRecord(value).validation; }

export function createProspectIntakeBlockerRecord(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_BLOCKER_RECORD", "", "Blocker record must be an object.");
  const openedAt = date(value.openedAt, "openedAt", validation); const resolvedAt = date(value.resolvedAt, "resolvedAt", validation); if (openedAt && resolvedAt && Date.parse(openedAt) > Date.parse(resolvedAt)) error(validation, "INVALID_DATE_RANGE", "resolvedAt", "resolvedAt cannot precede openedAt.");
  const result = { blockerId: string(value.blockerId, "blockerId", validation, true), blockerType: enumValue(value.blockerType, PROSPECT_INTAKE_BLOCKER_TYPES, "blockerType", validation, true), status: enumValue(value.status, PROSPECT_INTAKE_BLOCKER_STATUSES, "status", validation, true), openedAt, resolvedAt, openedByRef: string(value.openedByRef, "openedByRef", validation), resolvedByRef: string(value.resolvedByRef, "resolvedByRef", validation), reason: string(value.reason, "reason", validation), resolution: string(value.resolution, "resolution", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeBlockerRecord(value) { return createProspectIntakeBlockerRecord(value).validation; }

export function createProspectIntakeReadinessDeclaration(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_READINESS_DECLARATION", "", "Readiness declaration must be an object.");
  const result = { declarationId: string(value.declarationId, "declarationId", validation, true), scope: enumValue(value.scope, PROSPECT_INTAKE_READINESS_SCOPES, "scope", validation, true), state: enumValue(value.state, PROSPECT_INTAKE_READINESS_STATES, "state", validation, true), reviewerRef: string(value.reviewerRef, "reviewerRef", validation), reviewedAt: date(value.reviewedAt, "reviewedAt", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), rationale: string(value.rationale, "rationale", validation), limitations: strings(value.limitations, "limitations", validation), verification: basicVerification(value.verification, "verification", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeReadinessDeclaration(value) { return createProspectIntakeReadinessDeclaration(value).validation; }

export function createProspectIntakePromotionTarget(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_TARGET", "", "Promotion target must be an object.");
  const result = { targetId: string(value.targetId, "targetId", validation, true), targetType: enumValue(value.targetType, PROSPECT_INTAKE_PROMOTION_TARGET_TYPES, "targetType", validation, true), targetRef: string(value.targetRef, "targetRef", validation), readinessState: enumValue(value.readinessState, PROSPECT_INTAKE_READINESS_STATES, "readinessState", validation), requiredEvidenceRefs: refs(value.requiredEvidenceRefs, "requiredEvidenceRefs", validation), requiredSourceRefs: refs(value.requiredSourceRefs, "requiredSourceRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), proposedAction: enumValue(value.proposedAction, PROSPECT_INTAKE_PROMOTION_ACTIONS, "proposedAction", validation), reviewStatus: enumValue(value.reviewStatus, PROSPECT_INTAKE_REVIEW_STATUSES, "reviewStatus", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakePromotionTarget(value) { return createProspectIntakePromotionTarget(value).validation; }

export function createProspectIntakePromotionPlan(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_PROMOTION_PLAN", "", "Promotion plan must be an object.");
  const targets = records(value.targets, "targets", validation, createProspectIntakePromotionTarget, "targetId");
  const result = { planId: string(value.planId, "planId", validation, true), targets, createdByRef: string(value.createdByRef, "createdByRef", validation), createdAt: date(value.createdAt, "createdAt", validation), reviewRefs: refs(value.reviewRefs, "reviewRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakePromotionPlan(value) { return createProspectIntakePromotionPlan(value).validation; }

export function createProspectIntakeWorkflowTransition(input = {}) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_WORKFLOW_TRANSITION", "", "Workflow transition must be an object.");
  const fromStage = enumValue(value.fromStage, PROSPECT_INTAKE_STAGES, "fromStage", validation); const toStage = enumValue(value.toStage, PROSPECT_INTAKE_STAGES, "toStage", validation); const fromStatus = enumValue(value.fromStatus, PROSPECT_INTAKE_STATUSES, "fromStatus", validation); const toStatus = enumValue(value.toStatus, PROSPECT_INTAKE_STATUSES, "toStatus", validation);
  if (toStage == null && toStatus == null) error(validation, "MISSING_TRANSITION_TARGET", "", "A transition must declare a target stage or status.");
  const result = { transitionId: string(value.transitionId, "transitionId", validation, true), fromStage, toStage, fromStatus, toStatus, reason: string(value.reason, "reason", validation), actorRef: string(value.actorRef, "actorRef", validation), occurredAt: date(value.occurredAt, "occurredAt", validation), sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation), reviewRefs: refs(value.reviewRefs, "reviewRefs", validation), blockerRefs: refs(value.blockerRefs, "blockerRefs", validation), notes: string(value.notes, "notes", validation), validation };
  finish(validation); return result;
}
export function validateProspectIntakeWorkflowTransition(value) { return createProspectIntakeWorkflowTransition(value).validation; }

function normalizeCandidate(input) {
  const validation = validationShape(); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_INTAKE_CANDIDATE", "", "Intake candidate must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_INTAKE_CANDIDATE_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Candidate contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Candidate contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Candidate schema version does not match.");
  const unknownKeys = Object.keys(value).filter((key) => !CANDIDATE_KEYS.has(key)); if (unknownKeys.length) error(validation, "UNSUPPORTED_INTAKE_FIELD", unknownKeys[0], `${unknownKeys[0]} is not owned by Prospect Intake.`);
  const intakeId = string(value.intakeId, "intakeId", validation, true); const lifecycleValue = value.lifecycle == null ? {} : value.lifecycle; if (!isObject(lifecycleValue)) error(validation, "INVALID_LIFECYCLE", "lifecycle", "lifecycle must be an object or null.");
  const lifecycleInput = isObject(lifecycleValue) ? lifecycleValue : {}; const openedAt = date(lifecycleInput.openedAt, "lifecycle.openedAt", validation); const closedAt = date(lifecycleInput.closedAt, "lifecycle.closedAt", validation); if (openedAt && closedAt && Date.parse(openedAt) > Date.parse(closedAt)) error(validation, "INVALID_DATE_RANGE", "lifecycle.closedAt", "closedAt cannot precede openedAt.");
  const replacesIntakeRef = string(lifecycleInput.replacesIntakeRef, "lifecycle.replacesIntakeRef", validation); const replacedByIntakeRef = string(lifecycleInput.replacedByIntakeRef, "lifecycle.replacedByIntakeRef", validation); if (intakeId && (replacesIntakeRef === intakeId || replacedByIntakeRef === intakeId)) error(validation, "SELF_INTAKE_REFERENCE", "lifecycle", "An intake candidate cannot replace itself."); if (replacesIntakeRef && replacedByIntakeRef && replacesIntakeRef === replacedByIntakeRef) error(validation, "CONFLICTING_VERSION_REFERENCES", "lifecycle", "Replacement references must differ.");
  const reviewRecords = records(value.reviewRecords, "reviewRecords", validation, createProspectIntakeReviewRecord, "reviewId"); const blockerRecords = records(value.blockerRecords, "blockerRecords", validation, createProspectIntakeBlockerRecord, "blockerId"); const workflowHistory = records(value.workflowHistory, "workflowHistory", validation, createProspectIntakeWorkflowTransition, "transitionId");
  const allLocalIds = [...reviewRecords.map((entry) => entry.reviewId), ...blockerRecords.map((entry) => entry.blockerId), ...workflowHistory.map((entry) => entry.transitionId)].filter(Boolean); if (new Set(allLocalIds).size !== allLocalIds.length) error(validation, "DUPLICATE_LOCAL_RECORD_ID", "", "Workflow-local record identifiers must be unique across collections.");
  const result = {
    contract: PROSPECT_INTAKE_CANDIDATE_CONTRACT_NAME, contractVersion: PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION, schemaVersion: PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION,
    intakeId, cycleRef: string(value.cycleRef, "cycleRef", validation, true), candidateRef: string(value.candidateRef, "candidateRef", validation), candidateLabel: string(value.candidateLabel, "candidateLabel", validation), stage: enumValue(value.stage, PROSPECT_INTAKE_STAGES, "stage", validation, true), status: enumValue(value.status, PROSPECT_INTAKE_STATUSES, "status", validation, true),
    discoveryContext: objectOrNull(value.discoveryContext, "discoveryContext", validation, createProspectIntakeDiscoveryContext), identityReview: objectOrNull(value.identityReview, "identityReview", validation, createProspectIntakeIdentityReview), researchPlan: objectOrNull(value.researchPlan, "researchPlan", validation, createProspectIntakeResearchPlan),
    researchSourceRefs: refs(value.researchSourceRefs, "researchSourceRefs", validation), researchSessionRefs: refs(value.researchSessionRefs, "researchSessionRefs", validation), recordedObservationRefs: refs(value.recordedObservationRefs, "recordedObservationRefs", validation), analyticalObservationRefs: refs(value.analyticalObservationRefs, "analyticalObservationRefs", validation), evidenceArtifactRefs: refs(value.evidenceArtifactRefs, "evidenceArtifactRefs", validation), identityEvidenceRefs: refs(value.identityEvidenceRefs, "identityEvidenceRefs", validation), playerEvidenceRefs: refs(value.playerEvidenceRefs, "playerEvidenceRefs", validation), prospectEvidenceRefs: refs(value.prospectEvidenceRefs, "prospectEvidenceRefs", validation), eligibilityEvidenceRefs: refs(value.eligibilityEvidenceRefs, "eligibilityEvidenceRefs", validation), declarationEvidenceRefs: refs(value.declarationEvidenceRefs, "declarationEvidenceRefs", validation), schoolEvidenceRefs: refs(value.schoolEvidenceRefs, "schoolEvidenceRefs", validation), positionEvidenceRefs: refs(value.positionEvidenceRefs, "positionEvidenceRefs", validation), measurementEvidenceRefs: refs(value.measurementEvidenceRefs, "measurementEvidenceRefs", validation), productionEvidenceRefs: refs(value.productionEvidenceRefs, "productionEvidenceRefs", validation), recognitionEvidenceRefs: refs(value.recognitionEvidenceRefs, "recognitionEvidenceRefs", validation), scoutingEvidenceRefs: refs(value.scoutingEvidenceRefs, "scoutingEvidenceRefs", validation),
    evidenceSufficiencyDeclarations: records(value.evidenceSufficiencyDeclarations, "evidenceSufficiencyDeclarations", validation, createProspectIntakeEvidenceSufficiency, "declarationId"), blockerRecords, reviewRecords, readinessDeclaration: records(value.readinessDeclaration, "readinessDeclaration", validation, createProspectIntakeReadinessDeclaration, "declarationId"), promotionPlan: objectOrNull(value.promotionPlan, "promotionPlan", validation, createProspectIntakePromotionPlan), promotionDecisionRefs: refs(value.promotionDecisionRefs, "promotionDecisionRefs", validation), proposedEntityRef: string(value.proposedEntityRef, "proposedEntityRef", validation), proposedPersonProfileRef: string(value.proposedPersonProfileRef, "proposedPersonProfileRef", validation), proposedPlayerProfileRef: string(value.proposedPlayerProfileRef, "proposedPlayerProfileRef", validation), proposedProspectProfileRef: string(value.proposedProspectProfileRef, "proposedProspectProfileRef", validation), proposedRelationshipRefs: refs(value.proposedRelationshipRefs, "proposedRelationshipRefs", validation), workflowHistory, sourceRefs: refs(value.sourceRefs, "sourceRefs", validation), evidenceRefs: refs(value.evidenceRefs, "evidenceRefs", validation),
    verification: basicVerification(value.verification, "verification", validation), provenance: value.provenance == null ? { createdBy: null, createdAt: null, updatedBy: null, updatedAt: null } : (() => { if (!isObject(value.provenance)) { error(validation, "INVALID_PROVENANCE", "provenance", "provenance must be an object or null."); return { createdBy: null, createdAt: null, updatedBy: null, updatedAt: null }; } return { createdBy: string(value.provenance.createdBy, "provenance.createdBy", validation), createdAt: date(value.provenance.createdAt, "provenance.createdAt", validation), updatedBy: string(value.provenance.updatedBy, "provenance.updatedBy", validation), updatedAt: date(value.provenance.updatedAt, "provenance.updatedAt", validation) }; })(), lifecycle: { state: enumValue(lifecycleInput.state, PROSPECT_INTAKE_LIFECYCLE_STATES, "lifecycle.state", validation), openedAt, closedAt, archivedAt: date(lifecycleInput.archivedAt, "lifecycle.archivedAt", validation), replacesIntakeRef, replacedByIntakeRef }, version: integer(value.version, "version", validation), workflowRevision: integer(value.workflowRevision, "workflowRevision", validation), notes: string(value.notes, "notes", validation), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}

export function createProspectIntakeCandidate(input = {}) { return normalizeCandidate(input); }
export function createUnavailableProspectIntakeCandidate(input = {}) { const supplied = isObject(input) ? input : {}; const result = normalizeCandidate(supplied); error(result.validation, "INTAKE_CANDIDATE_UNAVAILABLE", "", string(supplied.reason, "reason", result.validation) ?? "No usable intake candidate is available."); return result; }
export function validateProspectIntakeCandidate(value) { return normalizeCandidate(value).validation; }
export function isProspectIntakeCandidate(value) { return Boolean(isObject(value) && value.contract === PROSPECT_INTAKE_CANDIDATE_CONTRACT_NAME && value.contractVersion === PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION && value.schemaVersion === PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION && validateProspectIntakeCandidate(value).valid); }

export function createProspectIntakeArchitectureSpecification(input = {}) {
  const validation = validationShape(PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION); const value = isObject(input) ? input : {}; if (!isObject(input)) error(validation, "INVALID_ARCHITECTURE_SPECIFICATION", "", "Architecture specification must be an object.");
  if (Object.hasOwn(value, "contract") && value.contract !== PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME) error(validation, "CONTRACT_MISMATCH", "contract", "Architecture contract identity does not match.");
  if (Object.hasOwn(value, "contractVersion") && value.contractVersion !== PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION) error(validation, "CONTRACT_VERSION_MISMATCH", "contractVersion", "Architecture contract version does not match.");
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION) error(validation, "SCHEMA_VERSION_MISMATCH", "schemaVersion", "Architecture schema version does not match.");
  const result = {
    contract: PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME, contractVersion: PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, schemaVersion: PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION,
    role: "GOVERNS_MOVEMENT_TOWARD_CANONICAL_DATA", stageVocabulary: Object.values(PROSPECT_INTAKE_STAGES), statusVocabulary: Object.values(PROSPECT_INTAKE_STATUSES),
    stageOwnership: { workflowDeclarations: "PROSPECT_INTAKE", researchRecords: "RESEARCH_REPOSITORY", canonicalFacts: "FID_CONTRACTS", persistence: "FUTURE_EXPLICIT_OPERATION", evaluation: "OUTSIDE_PROSPECT_INTAKE", simulatorUse: "OUTSIDE_PROSPECT_INTAKE" },
    transitionPolicy: { explicitRecordsRequired: true, linearProgressionRequired: false, backwardMovementAllowed: true, stageChangeWithoutStatusChangeAllowed: true, statusChangeWithoutStageChangeAllowed: true, inferredFromDates: false, inferredFromEvidenceCounts: false, inferredFromLatestActivity: false },
    reviewPolicy: { humanReviewSupported: true, reviewAutomaticallyTransitions: false, identityConfirmationCreatesCanonicalIdentity: false, evidenceSufficiencyCalculated: false },
    promotionPolicy: { plansAreNonExecutable: true, partialPromotionSupported: true, approvalCreatesRecords: false, approvalPersistsRecords: false, approvalTriggersEvaluation: false, approvalImpliesSimulatorReadiness: false },
    versionModel: { architectureContractVersionDistinct: true, architectureSchemaVersionDistinct: true, candidateVersionDistinct: true, workflowRevisionDistinct: true, futurePersistenceEnvelopeRevisionDistinct: true, fidTargetRecordRevisionDistinct: true },
    separationModel: { researchRepositoryOwnsResearch: true, fidContractsOwnCanonicalFacts: true, intakeOwnsWorkflowDeclarationsOnly: true, identityResolutionImplemented: false, persistenceImplemented: false, evaluationImplemented: false, rankingImplemented: false, simulatorLoadingImplemented: false },
    firstUseCompatibility: { intendedCycleLabel: "2027 NFL Draft", cycleRefRemainsUnresolved: true, futureCyclesSupported: true, incompleteCandidatesSupported: true, changesPreserveHistory: true, realCandidatesIncluded: false },
    expectedStageOutputs: [
      { stage: "DISCOVERED", output: "DISCOVERY_CONTEXT" }, { stage: "IDENTITY_REVIEW", output: "IDENTITY_REVIEW_DECLARATION" },
      { stage: "RESEARCH_COLLECTION", output: "RESEARCH_PLAN_AND_UNRESOLVED_REFS" }, { stage: "EVIDENCE_REVIEW", output: "EVIDENCE_SUFFICIENCY_DECLARATIONS" },
      { stage: "FACT_REVIEW", output: "REVIEW_RECORDS" }, { stage: "HUMAN_VERIFICATION", output: "HUMAN_REVIEW_DECLARATIONS" },
      { stage: "PROMOTION_READY", output: "SCOPE_SPECIFIC_READINESS" }, { stage: "PROMOTION_APPROVED", output: "NON_EXECUTABLE_PROMOTION_PLAN" },
      { stage: "PROMOTION_DEFERRED", output: "DEFERRAL_TRANSITION" }, { stage: "PROMOTION_REJECTED", output: "REJECTION_TRANSITION" },
      { stage: "PROMOTED", output: "UNRESOLVED_PROMOTION_DECISION_REFS" }, { stage: "ARCHIVED", output: "ARCHIVAL_TRANSITION" },
    ],
    metadata: value.metadata == null ? { tags: [], notes: null } : (() => { if (!isObject(value.metadata)) { error(validation, "INVALID_METADATA", "metadata", "metadata must be an object or null."); return { tags: [], notes: null }; } return { tags: strings(value.metadata.tags, "metadata.tags", validation), notes: string(value.metadata.notes, "metadata.notes", validation) }; })(), extensions: extensions(value.extensions, "extensions", validation), validation,
  };
  finish(validation); return result;
}
export function validateProspectIntakeArchitectureSpecification(value) { return createProspectIntakeArchitectureSpecification(value).validation; }
export function isProspectIntakeArchitectureSpecification(value) { return Boolean(isObject(value) && value.contract === PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME && value.contractVersion === PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION && value.schemaVersion === PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION && validateProspectIntakeArchitectureSpecification(value).valid); }

export default Object.freeze({
  PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_NAME, PROSPECT_INTAKE_ARCHITECTURE_CONTRACT_VERSION, PROSPECT_INTAKE_ARCHITECTURE_SCHEMA_VERSION,
  PROSPECT_INTAKE_CANDIDATE_CONTRACT_NAME, PROSPECT_INTAKE_CANDIDATE_CONTRACT_VERSION, PROSPECT_INTAKE_CANDIDATE_SCHEMA_VERSION,
  PROSPECT_INTAKE_STAGES, PROSPECT_INTAKE_STATUSES, PROSPECT_INTAKE_DISCOVERY_ORIGINS, PROSPECT_INTAKE_IDENTITY_OUTCOMES,
  PROSPECT_INTAKE_RESEARCH_CATEGORIES, PROSPECT_INTAKE_EVIDENCE_STATES, PROSPECT_INTAKE_REVIEW_TYPES, PROSPECT_INTAKE_REVIEW_STATUSES,
  PROSPECT_INTAKE_REVIEW_OUTCOMES, PROSPECT_INTAKE_BLOCKER_TYPES, PROSPECT_INTAKE_BLOCKER_STATUSES, PROSPECT_INTAKE_READINESS_STATES,
  PROSPECT_INTAKE_READINESS_SCOPES, PROSPECT_INTAKE_PROMOTION_TARGET_TYPES, PROSPECT_INTAKE_PROMOTION_ACTIONS,
  PROSPECT_INTAKE_VERIFICATION_STATES, PROSPECT_INTAKE_LIFECYCLE_STATES,
  createProspectIntakeDiscoveryContext, validateProspectIntakeDiscoveryContext, createProspectIntakeIdentityReview, validateProspectIntakeIdentityReview,
  createProspectIntakeResearchPlan, validateProspectIntakeResearchPlan, createProspectIntakeEvidenceSufficiency, validateProspectIntakeEvidenceSufficiency,
  createProspectIntakeReviewRecord, validateProspectIntakeReviewRecord, createProspectIntakeBlockerRecord, validateProspectIntakeBlockerRecord,
  createProspectIntakeReadinessDeclaration, validateProspectIntakeReadinessDeclaration, createProspectIntakePromotionTarget, validateProspectIntakePromotionTarget,
  createProspectIntakePromotionPlan, validateProspectIntakePromotionPlan, createProspectIntakeWorkflowTransition, validateProspectIntakeWorkflowTransition,
  createProspectIntakeCandidate, createUnavailableProspectIntakeCandidate, validateProspectIntakeCandidate, isProspectIntakeCandidate,
  createProspectIntakeArchitectureSpecification, validateProspectIntakeArchitectureSpecification, isProspectIntakeArchitectureSpecification,
});
