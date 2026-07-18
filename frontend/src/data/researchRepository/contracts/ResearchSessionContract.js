import { RESEARCH_SOURCE_CLASSES } from "../constants/researchSourceConstants.js";
import {
  RESEARCH_SESSION_CONTRACT_NAME,
  RESEARCH_SESSION_CONTRACT_VERSION,
  RESEARCH_SESSION_REVIEW_TYPES,
  RESEARCH_SESSION_SCHEMA_VERSION,
  RESEARCH_SESSION_SCOPE_STATES,
  RESEARCH_SESSION_STATUSES,
  RESEARCH_SESSION_SUBJECT_TYPES,
  RESEARCH_SESSION_TYPES,
  RESEARCH_SESSION_VERIFICATION_STATES,
} from "../constants/researchSessionConstants.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validationResult(checkedAt = null) {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: optionalString(checkedAt),
    contractVersion: RESEARCH_SESSION_CONTRACT_VERSION,
    schemaVersion: RESEARCH_SESSION_SCHEMA_VERSION,
  };
}

function validationEntry(code, path, message) {
  return { code, path, message };
}

function addValidation(validation, field, code, path, message) {
  const entry = validationEntry(code, path, message);
  const exists = validation[field].some(
    (item) =>
      item.code === entry.code &&
      item.path === entry.path &&
      item.message === entry.message
  );
  if (!exists) validation[field].push(entry);
  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addValidation(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addValidation(validation, "warnings", code, path, message);
}

function mergeValidation(target, source) {
  source.errors.forEach((entry) =>
    addError(target, entry.code, entry.path, entry.message)
  );
  source.warnings.forEach((entry) =>
    addWarning(target, entry.code, entry.path, entry.message)
  );
  return target;
}

function normalizeString(value, path, validation, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) {
      addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    }
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`);
    return null;
  }
  return value.trim();
}

function normalizeEnum(value, allowed, path, validation, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) {
      addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    }
    return null;
  }
  if (!Object.values(allowed).includes(value)) {
    addError(validation, "UNRECOGNIZED_ENUM_VALUE", path, `${path} is not a recognized value.`);
    return null;
  }
  return value;
}

function normalizeBoolean(value, path, validation) {
  if (value == null) return null;
  if (typeof value !== "boolean") {
    addError(validation, "INVALID_BOOLEAN", path, `${path} must be a boolean or null.`);
    return null;
  }
  return value;
}

function normalizeDate(value, path, validation) {
  const normalized = normalizeString(value, path, validation);
  if (normalized === null) return null;
  if (Number.isNaN(Date.parse(normalized))) {
    addError(validation, "INVALID_DATE", path, `${path} must be a recognizable date string or null.`);
    return null;
  }
  return normalized;
}

function normalizeArray(value, path, validation, normalizer) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  return value.map((entry, index) => normalizer(entry, index));
}

function normalizeScalarArray(
  value,
  path,
  validation,
  { allowed = null, invalidCode = "INVALID_REFERENCE" } = {}
) {
  const normalized = [];
  const seen = new Set();
  normalizeArray(value, path, validation, (entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addError(validation, invalidCode, `${path}[${index}]`, `${path} values must be non-empty strings.`);
      return null;
    }
    const item = entry.trim();
    if (allowed && !Object.values(allowed).includes(item)) {
      addError(validation, invalidCode, `${path}[${index}]`, `${item} is not recognized for ${path}.`);
      return null;
    }
    if (seen.has(item)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${item}.`);
      return null;
    }
    seen.add(item);
    normalized.push(item);
    return item;
  });
  return normalized;
}

function normalizeStructuredArray(value, path, validation, normalizer) {
  const normalized = [];
  const seen = new Set();
  normalizeArray(value, path, validation, (entry, index) => {
    if (!isObject(entry)) {
      addError(validation, "INVALID_NESTED_STRUCTURE", `${path}[${index}]`, `${path} entries must be objects.`);
      return null;
    }
    const item = normalizer(entry, index);
    const identity = JSON.stringify(item);
    if (seen.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", path, `Exact duplicate object removed from ${path}.`);
      return null;
    }
    seen.add(identity);
    normalized.push(item);
    return item;
  });
  return normalized;
}

function normalizeNested(value, path, validation, normalizer) {
  if (value == null) return normalizer({});
  if (!isObject(value)) {
    addError(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`);
    return normalizer({});
  }
  return normalizer(value);
}

function compareDates(start, end, path, validation) {
  if (start && end && Date.parse(start) > Date.parse(end)) {
    addError(validation, "INVALID_DATE_ORDER", path, `${path} start must not be after end.`);
  }
}

function normalizeSession(input, checkedAt = null) {
  const validation = validationResult(checkedAt);
  const session = isObject(input) ? input : {};
  if (!isObject(input)) {
    addError(validation, "INVALID_RESEARCH_SESSION_INPUT", "", "Research session input must be an object.");
  }

  const normalized = {
    contract: RESEARCH_SESSION_CONTRACT_NAME,
    contractVersion: RESEARCH_SESSION_CONTRACT_VERSION,
    schemaVersion: RESEARCH_SESSION_SCHEMA_VERSION,
    sessionId: normalizeString(session.sessionId, "sessionId", validation, { required: true }),
    title: normalizeString(session.title, "title", validation, { required: true }),
    description: normalizeString(session.description, "description", validation),
    sessionType: normalizeEnum(session.sessionType, RESEARCH_SESSION_TYPES, "sessionType", validation, { required: true }),
    status: normalizeEnum(session.status, RESEARCH_SESSION_STATUSES, "status", validation, { required: true }),
    subjects: normalizeStructuredArray(session.subjects, "subjects", validation, (subject, index) => ({
      subjectRef: normalizeString(subject.subjectRef, `subjects[${index}].subjectRef`, validation, { required: true }),
      subjectType: normalizeEnum(subject.subjectType, RESEARCH_SESSION_SUBJECT_TYPES, `subjects[${index}].subjectType`, validation, { required: true }),
      label: normalizeString(subject.label, `subjects[${index}].label`, validation),
      notes: normalizeString(subject.notes, `subjects[${index}].notes`, validation),
    })),
    scope: normalizeNested(session.scope, "scope", validation, (scope) => ({
      state: normalizeEnum(scope.state, RESEARCH_SESSION_SCOPE_STATES, "scope.state", validation, { required: true }),
      objectives: normalizeScalarArray(scope.objectives, "scope.objectives", validation, { invalidCode: "INVALID_SCOPE_VALUE" }),
      inclusionCriteria: normalizeScalarArray(scope.inclusionCriteria, "scope.inclusionCriteria", validation, { invalidCode: "INVALID_SCOPE_VALUE" }),
      exclusionCriteria: normalizeScalarArray(scope.exclusionCriteria, "scope.exclusionCriteria", validation, { invalidCode: "INVALID_SCOPE_VALUE" }),
      dateRange: normalizeNested(scope.dateRange, "scope.dateRange", validation, (dateRange) => ({
        start: normalizeDate(dateRange.start, "scope.dateRange.start", validation),
        end: normalizeDate(dateRange.end, "scope.dateRange.end", validation),
      })),
      sourceClasses: normalizeScalarArray(scope.sourceClasses, "scope.sourceClasses", validation, {
        allowed: RESEARCH_SOURCE_CLASSES,
        invalidCode: "INVALID_SOURCE_CLASS",
      }),
      domains: normalizeScalarArray(scope.domains, "scope.domains", validation, { invalidCode: "INVALID_DOMAIN" }),
      limitations: normalizeScalarArray(scope.limitations, "scope.limitations", validation, { invalidCode: "INVALID_SCOPE_VALUE" }),
      notes: normalizeString(scope.notes, "scope.notes", validation),
    })),
    researchers: normalizeStructuredArray(session.researchers, "researchers", validation, (researcher, index) => ({
      researcherRef: normalizeString(researcher.researcherRef, `researchers[${index}].researcherRef`, validation, { required: true }),
      role: normalizeString(researcher.role, `researchers[${index}].role`, validation),
      startedAt: normalizeDate(researcher.startedAt, `researchers[${index}].startedAt`, validation),
      endedAt: normalizeDate(researcher.endedAt, `researchers[${index}].endedAt`, validation),
      notes: normalizeString(researcher.notes, `researchers[${index}].notes`, validation),
    })),
    sourceRefs: normalizeScalarArray(session.sourceRefs, "sourceRefs", validation),
    researchPlan: normalizeNested(session.researchPlan, "researchPlan", validation, (plan) => ({
      methodology: normalizeString(plan.methodology, "researchPlan.methodology", validation),
      plannedSourceRefs: normalizeScalarArray(plan.plannedSourceRefs, "researchPlan.plannedSourceRefs", validation),
      plannedActivities: normalizeScalarArray(plan.plannedActivities, "researchPlan.plannedActivities", validation, { invalidCode: "INVALID_ACTIVITY" }),
      samplingStrategy: normalizeString(plan.samplingStrategy, "researchPlan.samplingStrategy", validation),
      verificationPlan: normalizeString(plan.verificationPlan, "researchPlan.verificationPlan", validation),
      notes: normalizeString(plan.notes, "researchPlan.notes", validation),
    })),
    execution: normalizeNested(session.execution, "execution", validation, (execution) => ({
      startedAt: normalizeDate(execution.startedAt, "execution.startedAt", validation),
      completedAt: normalizeDate(execution.completedAt, "execution.completedAt", validation),
      activitiesCompleted: normalizeScalarArray(execution.activitiesCompleted, "execution.activitiesCompleted", validation, { invalidCode: "INVALID_ACTIVITY" }),
      deviations: normalizeScalarArray(execution.deviations, "execution.deviations", validation, { invalidCode: "INVALID_DEVIATION" }),
      notes: normalizeString(execution.notes, "execution.notes", validation),
    })),
    artifactRefs: normalizeNested(session.artifactRefs, "artifactRefs", validation, (artifacts) => ({
      recordedObservationRefs: normalizeScalarArray(artifacts.recordedObservationRefs, "artifactRefs.recordedObservationRefs", validation),
      analyticalObservationRefs: normalizeScalarArray(artifacts.analyticalObservationRefs, "artifactRefs.analyticalObservationRefs", validation),
      evidenceArtifactRefs: normalizeScalarArray(artifacts.evidenceArtifactRefs, "artifactRefs.evidenceArtifactRefs", validation),
      otherArtifactRefs: normalizeScalarArray(artifacts.otherArtifactRefs, "artifactRefs.otherArtifactRefs", validation),
    })),
    verification: normalizeNested(session.verification, "verification", validation, (verification) => ({
      state: normalizeEnum(verification.state, RESEARCH_SESSION_VERIFICATION_STATES, "verification.state", validation, { required: true }),
      verifiedBy: normalizeString(verification.verifiedBy, "verification.verifiedBy", validation),
      verifiedAt: normalizeDate(verification.verifiedAt, "verification.verifiedAt", validation),
      limitations: normalizeScalarArray(verification.limitations, "verification.limitations", validation, { invalidCode: "INVALID_VERIFICATION_LIMITATION" }),
      notes: normalizeString(verification.notes, "verification.notes", validation),
    })),
    review: normalizeNested(session.review, "review", validation, (review) => ({
      required: normalizeBoolean(review.required, "review.required", validation),
      reviewTypes: normalizeScalarArray(review.reviewTypes, "review.reviewTypes", validation, {
        allowed: RESEARCH_SESSION_REVIEW_TYPES,
        invalidCode: "INVALID_REVIEW_TYPE",
      }),
      reviewerRefs: normalizeScalarArray(review.reviewerRefs, "review.reviewerRefs", validation),
      completedAt: normalizeDate(review.completedAt, "review.completedAt", validation),
      outcome: normalizeString(review.outcome, "review.outcome", validation),
      notes: normalizeString(review.notes, "review.notes", validation),
    })),
    provenance: normalizeNested(session.provenance, "provenance", validation, (provenance) => ({
      createdBy: normalizeString(provenance.createdBy, "provenance.createdBy", validation),
      createdAt: normalizeDate(provenance.createdAt, "provenance.createdAt", validation),
      updatedBy: normalizeString(provenance.updatedBy, "provenance.updatedBy", validation),
      updatedAt: normalizeDate(provenance.updatedAt, "provenance.updatedAt", validation),
    })),
    metadata: normalizeNested(session.metadata, "metadata", validation, (metadata) => ({
      tags: normalizeScalarArray(metadata.tags, "metadata.tags", validation, { invalidCode: "INVALID_TAG" }),
      externalRefs: normalizeScalarArray(metadata.externalRefs, "metadata.externalRefs", validation),
      notes: normalizeString(metadata.notes, "metadata.notes", validation),
    })),
    validation: null,
  };

  compareDates(normalized.scope.dateRange.start, normalized.scope.dateRange.end, "scope.dateRange", validation);
  compareDates(normalized.execution.startedAt, normalized.execution.completedAt, "execution", validation);
  normalized.researchers.forEach((researcher, index) =>
    compareDates(researcher.startedAt, researcher.endedAt, `researchers[${index}]`, validation)
  );

  const reviewTypes = normalized.review.reviewTypes;
  if (reviewTypes.includes(RESEARCH_SESSION_REVIEW_TYPES.NONE) && reviewTypes.length > 1) {
    addError(validation, "CONFLICTING_REVIEW_TYPES", "review.reviewTypes", "NONE cannot coexist with another review type.");
  }
  if (
    normalized.review.required === true &&
    !reviewTypes.some((type) => type !== RESEARCH_SESSION_REVIEW_TYPES.NONE)
  ) {
    addError(validation, "REQUIRED_REVIEW_TYPE_MISSING", "review.reviewTypes", "Required review needs at least one review type other than NONE.");
  }
  if (normalized.review.completedAt && normalized.review.reviewerRefs.length === 0) {
    addWarning(validation, "REVIEW_COMPLETED_WITHOUT_REVIEWER", "review.reviewerRefs", "A completed review has no reviewer references.");
  }

  const activeStatuses = [
    RESEARCH_SESSION_STATUSES.IN_PROGRESS,
    RESEARCH_SESSION_STATUSES.PAUSED,
    RESEARCH_SESSION_STATUSES.COMPLETED,
  ];
  if (activeStatuses.includes(normalized.status) && !normalized.execution.startedAt) {
    addError(validation, "LIFECYCLE_STARTED_AT_REQUIRED", "execution.startedAt", `${normalized.status} requires execution.startedAt.`);
  }
  if (activeStatuses.includes(normalized.status) && normalized.researchers.length === 0) {
    addError(validation, "LIFECYCLE_RESEARCHER_REQUIRED", "researchers", `${normalized.status} requires at least one researcher.`);
  }
  if (normalized.status === RESEARCH_SESSION_STATUSES.COMPLETED) {
    if (!normalized.execution.completedAt) {
      addError(validation, "COMPLETED_AT_REQUIRED", "execution.completedAt", "COMPLETED requires execution.completedAt.");
    }
    if (normalized.subjects.length === 0) {
      addError(validation, "COMPLETED_SUBJECT_REQUIRED", "subjects", "COMPLETED requires at least one subject.");
    }
    if (normalized.sourceRefs.length === 0) {
      addError(validation, "COMPLETED_SOURCE_REQUIRED", "sourceRefs", "COMPLETED requires at least one source reference.");
    }
    const artifactCount = Object.values(normalized.artifactRefs).reduce((sum, refs) => sum + refs.length, 0);
    if (artifactCount === 0) {
      addWarning(validation, "COMPLETED_WITHOUT_ARTIFACTS", "artifactRefs", "Completed session contains no artifact references.");
    }
  }
  if (
    normalized.status === RESEARCH_SESSION_STATUSES.CANCELLED &&
    !normalized.execution.notes &&
    !normalized.metadata.notes
  ) {
    addWarning(validation, "CANCELLATION_REASON_NOT_RECORDED", "execution.notes", "Cancelled session has no recorded reason.");
  }
  if (
    normalized.status === RESEARCH_SESSION_STATUSES.ARCHIVED &&
    !normalized.provenance.updatedAt &&
    !normalized.review.completedAt
  ) {
    addError(validation, "ARCHIVE_DATE_REQUIRED", "provenance.updatedAt", "ARCHIVED requires provenance.updatedAt or review.completedAt.");
  }

  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

export function createResearchSession(input = {}, { checkedAt = null } = {}) {
  return normalizeSession(input, checkedAt);
}

export function createUnavailableResearchSession(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {};
  const reason = normalizeString(supplied.reason, "reason", validationResult());
  const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeSession(
    { ...supplied, metadata: { ...metadata, notes: metadata.notes ?? reason } },
    checkedAt
  );
  const unavailable = validationResult(checkedAt);
  addError(unavailable, "RESEARCH_SESSION_UNAVAILABLE", "", reason || "No usable research session record is available.");
  result.validation = mergeValidation(result.validation, unavailable);
  return result;
}

export function validateResearchSession(
  value,
  { checkedAt = value?.validation?.checkedAt ?? null } = {}
) {
  return normalizeSession(value, checkedAt).validation;
}

export function isResearchSession(value) {
  return Boolean(
    isObject(value) &&
      value.contract === RESEARCH_SESSION_CONTRACT_NAME &&
      value.contractVersion === RESEARCH_SESSION_CONTRACT_VERSION &&
      value.schemaVersion === RESEARCH_SESSION_SCHEMA_VERSION &&
      Array.isArray(value.subjects) &&
      isObject(value.scope) &&
      Array.isArray(value.researchers) &&
      Array.isArray(value.sourceRefs) &&
      isObject(value.researchPlan) &&
      isObject(value.execution) &&
      isObject(value.artifactRefs) &&
      isObject(value.verification) &&
      isObject(value.review) &&
      isObject(value.provenance) &&
      isObject(value.metadata) &&
      isObject(value.validation)
  );
}

export function isCompletedResearchSession(value) {
  return Boolean(
    isResearchSession(value) &&
      value.status === RESEARCH_SESSION_STATUSES.COMPLETED &&
      validateResearchSession(value).valid
  );
}

export function isVerifiedResearchSession(value) {
  const verifiedStates = [
    RESEARCH_SESSION_VERIFICATION_STATES.VERIFIED,
    RESEARCH_SESSION_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS,
  ];
  return Boolean(
    isResearchSession(value) &&
      verifiedStates.includes(value.verification.state) &&
      validateResearchSession(value).valid
  );
}

export default Object.freeze({
  RESEARCH_SESSION_CONTRACT_NAME,
  RESEARCH_SESSION_CONTRACT_VERSION,
  RESEARCH_SESSION_SCHEMA_VERSION,
  createResearchSession,
  createUnavailableResearchSession,
  validateResearchSession,
  isResearchSession,
  isCompletedResearchSession,
  isVerifiedResearchSession,
});
