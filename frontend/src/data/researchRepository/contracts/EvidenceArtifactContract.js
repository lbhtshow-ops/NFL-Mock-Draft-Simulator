import {
  EVIDENCE_APPLICABILITY_STATES,
  EVIDENCE_ARTIFACT_CONTRACT_NAME,
  EVIDENCE_ARTIFACT_CONTRACT_VERSION,
  EVIDENCE_ARTIFACT_SCHEMA_VERSION,
  EVIDENCE_ARTIFACT_STATES,
  EVIDENCE_BASIS_TYPES,
  EVIDENCE_CONFLICT_STATES,
  EVIDENCE_DIRECTIONS,
  EVIDENCE_REVIEW_OUTCOMES,
  EVIDENCE_ROLES,
  EVIDENCE_STRENGTHS,
  EVIDENCE_TARGET_TYPES,
  EVIDENCE_VERIFICATION_STATES,
} from "../constants/evidenceArtifactConstants.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createValidation(checkedAt = null) {
  return {
    valid: true, errors: [], warnings: [], checkedAt: optionalString(checkedAt),
    contractVersion: EVIDENCE_ARTIFACT_CONTRACT_VERSION,
    schemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
  };
}

function addValidation(validation, field, code, path, message) {
  const entry = { code, path, message };
  if (!validation[field].some((item) => item.code === code && item.path === path && item.message === message)) {
    validation[field].push(entry);
  }
  validation.valid = validation.errors.length === 0;
}

function addError(validation, code, path, message) {
  addValidation(validation, "errors", code, path, message);
}

function addWarning(validation, code, path, message) {
  addValidation(validation, "warnings", code, path, message);
}

function mergeValidation(target, source) {
  source.errors.forEach((entry) => addError(target, entry.code, entry.path, entry.message));
  source.warnings.forEach((entry) => addWarning(target, entry.code, entry.path, entry.message));
  return target;
}

function normalizeString(value, path, validation, { required = false } = {}) {
  if (value == null) {
    if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_STRING", path, `${path} must be a non-empty string or null.`);
    return null;
  }
  return value.trim();
}

function normalizeReference(value, path, validation, { required = false } = {}) {
  if (value == null) {
    if (required) addError(validation, "MISSING_REQUIRED_REFERENCE", path, `${path} is required.`);
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    addError(validation, "INVALID_REFERENCE", path, `${path} must be a non-empty identifier or null.`);
    return null;
  }
  return value.trim();
}

function normalizeEnum(value, allowed, path, validation, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) addError(validation, "MISSING_REQUIRED_FIELD", path, `${path} is required.`);
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

function normalizeScalarArray(value, path, validation, { invalidCode = "INVALID_REFERENCE" } = {}) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      addError(validation, invalidCode, `${path}[${index}]`, `${path} values must be non-empty strings.`);
      return;
    }
    const item = entry.trim();
    if (seen.has(item)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_VALUE", path, `Duplicate value removed from ${path}: ${item}.`);
      return;
    }
    seen.add(item);
    result.push(item);
  });
  return result;
}

function normalizeNested(value, path, validation, normalizer) {
  if (value == null) return normalizer({});
  if (!isObject(value)) {
    addError(validation, "INVALID_NESTED_STRUCTURE", path, `${path} must be an object or null.`);
    return normalizer({});
  }
  return normalizer(value);
}

function normalizeStructuredArray(value, path, validation, normalizer) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    addError(validation, "INVALID_ARRAY", path, `${path} must be an array.`);
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      addError(validation, "INVALID_NESTED_STRUCTURE", `${path}[${index}]`, `${path} entries must be objects.`);
      return;
    }
    const item = normalizer(entry, index);
    const identity = JSON.stringify(item);
    if (seen.has(identity)) {
      addWarning(validation, "DUPLICATE_NORMALIZED_OBJECT", path, `Exact duplicate object removed from ${path}.`);
      return;
    }
    seen.add(identity);
    result.push(item);
  });
  return result;
}

const PROHIBITED_BASIS_FIELDS = ["weight", "multiplier", "score", "grade", "probability", "percentage"];

function normalizeArtifact(input, checkedAt = null) {
  const validation = createValidation(checkedAt);
  const artifact = isObject(input) ? input : {};
  if (!isObject(input)) addError(validation, "INVALID_EVIDENCE_ARTIFACT_INPUT", "", "Evidence artifact input must be an object.");

  const normalized = {
    contract: EVIDENCE_ARTIFACT_CONTRACT_NAME,
    contractVersion: EVIDENCE_ARTIFACT_CONTRACT_VERSION,
    schemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
    evidenceId: normalizeReference(artifact.evidenceId, "evidenceId", validation, { required: true }),
    sessionRef: normalizeReference(artifact.sessionRef, "sessionRef", validation),
    sourceRefs: normalizeScalarArray(artifact.sourceRefs, "sourceRefs", validation),
    recordedObservationRefs: normalizeScalarArray(artifact.recordedObservationRefs, "recordedObservationRefs", validation),
    analyticalObservationRefs: normalizeScalarArray(artifact.analyticalObservationRefs, "analyticalObservationRefs", validation),
    relatedEvidenceRefs: normalizeScalarArray(artifact.relatedEvidenceRefs, "relatedEvidenceRefs", validation),
    state: normalizeEnum(artifact.state, EVIDENCE_ARTIFACT_STATES, "state", validation, { required: true }),
    title: normalizeString(artifact.title, "title", validation),
    summary: normalizeString(artifact.summary, "summary", validation),
    classification: normalizeNested(artifact.classification, "classification", validation, (classification) => ({
      domains: normalizeScalarArray(classification.domains, "classification.domains", validation, { invalidCode: "INVALID_DOMAIN" }),
      categories: normalizeScalarArray(classification.categories, "classification.categories", validation, { invalidCode: "INVALID_CATEGORY" }),
      role: normalizeEnum(classification.role, EVIDENCE_ROLES, "classification.role", validation, { required: true }),
      direction: normalizeEnum(classification.direction, EVIDENCE_DIRECTIONS, "classification.direction", validation, { required: true }),
      strength: normalizeEnum(classification.strength, EVIDENCE_STRENGTHS, "classification.strength", validation, { required: true }),
      applicability: normalizeEnum(classification.applicability, EVIDENCE_APPLICABILITY_STATES, "classification.applicability", validation, { required: true }),
      tags: normalizeScalarArray(classification.tags, "classification.tags", validation, { invalidCode: "INVALID_TAG" }),
      notes: normalizeString(classification.notes, "classification.notes", validation),
    })),
    basis: normalizeStructuredArray(artifact.basis, "basis", validation, (basis, index) => {
      PROHIBITED_BASIS_FIELDS.forEach((field) => {
        if (Object.hasOwn(basis, field)) addError(validation, "PROHIBITED_NUMERIC_BASIS_FIELD", `basis[${index}].${field}`, `${field} is not permitted in an evidence basis.`);
      });
      return {
        basisType: normalizeEnum(basis.basisType, EVIDENCE_BASIS_TYPES, `basis[${index}].basisType`, validation, { required: true }),
        ref: normalizeReference(basis.ref, `basis[${index}].ref`, validation),
        description: normalizeString(basis.description, `basis[${index}].description`, validation),
        contribution: normalizeString(basis.contribution, `basis[${index}].contribution`, validation),
        notes: normalizeString(basis.notes, `basis[${index}].notes`, validation),
      };
    }),
    targets: normalizeStructuredArray(artifact.targets, "targets", validation, (target, index) => ({
      targetType: normalizeEnum(target.targetType, EVIDENCE_TARGET_TYPES, `targets[${index}].targetType`, validation, { required: true }),
      targetRef: normalizeReference(target.targetRef, `targets[${index}].targetRef`, validation),
      label: normalizeString(target.label, `targets[${index}].label`, validation),
      relationship: normalizeString(target.relationship, `targets[${index}].relationship`, validation),
      notes: normalizeString(target.notes, `targets[${index}].notes`, validation),
    })),
    assessment: normalizeNested(artifact.assessment, "assessment", validation, (assessment) => ({
      rationale: normalizeString(assessment.rationale, "assessment.rationale", validation),
      limitations: normalizeScalarArray(assessment.limitations, "assessment.limitations", validation, { invalidCode: "INVALID_LIMITATION" }),
      assumptions: normalizeScalarArray(assessment.assumptions, "assessment.assumptions", validation, { invalidCode: "INVALID_ASSUMPTION" }),
      sourceAgreement: normalizeString(assessment.sourceAgreement, "assessment.sourceAgreement", validation),
      independenceNotes: normalizeString(assessment.independenceNotes, "assessment.independenceNotes", validation),
      applicabilityRationale: normalizeString(assessment.applicabilityRationale, "assessment.applicabilityRationale", validation),
      notes: normalizeString(assessment.notes, "assessment.notes", validation),
    })),
    conflicts: normalizeNested(artifact.conflicts, "conflicts", validation, (conflicts) => ({
      state: normalizeEnum(conflicts.state, EVIDENCE_CONFLICT_STATES, "conflicts.state", validation, { required: true }),
      conflictingEvidenceRefs: normalizeScalarArray(conflicts.conflictingEvidenceRefs, "conflicts.conflictingEvidenceRefs", validation),
      conflictingAnalysisRefs: normalizeScalarArray(conflicts.conflictingAnalysisRefs, "conflicts.conflictingAnalysisRefs", validation),
      description: normalizeString(conflicts.description, "conflicts.description", validation),
      resolutionRef: normalizeReference(conflicts.resolutionRef, "conflicts.resolutionRef", validation),
      notes: normalizeString(conflicts.notes, "conflicts.notes", validation),
    })),
    verification: normalizeNested(artifact.verification, "verification", validation, (verification) => ({
      state: normalizeEnum(verification.state, EVIDENCE_VERIFICATION_STATES, "verification.state", validation, { required: true }),
      verifiedBy: normalizeReference(verification.verifiedBy, "verification.verifiedBy", validation),
      verifiedAt: normalizeDate(verification.verifiedAt, "verification.verifiedAt", validation),
      method: normalizeString(verification.method, "verification.method", validation),
      limitations: normalizeScalarArray(verification.limitations, "verification.limitations", validation, { invalidCode: "INVALID_LIMITATION" }),
      notes: normalizeString(verification.notes, "verification.notes", validation),
    })),
    review: normalizeNested(artifact.review, "review", validation, (review) => ({
      required: normalizeBoolean(review.required, "review.required", validation),
      reviewerRefs: normalizeScalarArray(review.reviewerRefs, "review.reviewerRefs", validation),
      completedAt: normalizeDate(review.completedAt, "review.completedAt", validation),
      outcome: normalizeEnum(review.outcome, EVIDENCE_REVIEW_OUTCOMES, "review.outcome", validation),
      requestedChanges: normalizeScalarArray(review.requestedChanges, "review.requestedChanges", validation, { invalidCode: "INVALID_REQUESTED_CHANGE" }),
      notes: normalizeString(review.notes, "review.notes", validation),
    })),
    provenance: normalizeNested(artifact.provenance, "provenance", validation, (provenance) => ({
      createdBy: normalizeReference(provenance.createdBy, "provenance.createdBy", validation),
      createdAt: normalizeDate(provenance.createdAt, "provenance.createdAt", validation),
      updatedBy: normalizeReference(provenance.updatedBy, "provenance.updatedBy", validation),
      updatedAt: normalizeDate(provenance.updatedAt, "provenance.updatedAt", validation),
      supersedesEvidenceRef: normalizeReference(provenance.supersedesEvidenceRef, "provenance.supersedesEvidenceRef", validation),
      supersededByEvidenceRef: normalizeReference(provenance.supersededByEvidenceRef, "provenance.supersededByEvidenceRef", validation),
    })),
    metadata: normalizeNested(artifact.metadata, "metadata", validation, (metadata) => ({
      tags: normalizeScalarArray(metadata.tags, "metadata.tags", validation, { invalidCode: "INVALID_TAG" }),
      externalRefs: normalizeScalarArray(metadata.externalRefs, "metadata.externalRefs", validation),
      relatedSubjectRefs: normalizeScalarArray(metadata.relatedSubjectRefs, "metadata.relatedSubjectRefs", validation),
      notes: normalizeString(metadata.notes, "metadata.notes", validation),
    })),
    validation: null,
  };

  normalized.basis.forEach((basis, index) => {
    if (!basis.ref && !basis.description) addError(validation, "BASIS_REFERENCE_OR_DESCRIPTION_REQUIRED", `basis[${index}]`, "Basis requires a reference or description.");
  });
  normalized.targets.forEach((target, index) => {
    if (!target.targetRef && !target.label) addError(validation, "TARGET_REFERENCE_OR_LABEL_REQUIRED", `targets[${index}]`, "Target requires a reference or label.");
  });
  if (!normalized.summary && !normalized.assessment.rationale) addError(validation, "EVIDENCE_DESCRIPTION_REQUIRED", "summary", "Evidence requires a summary or assessment rationale.");
  const basisCount = normalized.sourceRefs.length + normalized.recordedObservationRefs.length +
    normalized.analyticalObservationRefs.length + normalized.basis.length + (normalized.sessionRef ? 1 : 0);
  if (basisCount === 0) addError(validation, "EVIDENCE_BASIS_REQUIRED", "basis", "At least one evidence basis is required.");

  const id = normalized.evidenceId;
  if (id && normalized.relatedEvidenceRefs.includes(id)) addError(validation, "SELF_REFERENCE", "relatedEvidenceRefs", "Evidence cannot reference itself.");
  if (id && normalized.conflicts.conflictingEvidenceRefs.includes(id)) addError(validation, "SELF_REFERENCE", "conflicts.conflictingEvidenceRefs", "Evidence cannot conflict with itself.");
  if (id && normalized.provenance.supersedesEvidenceRef === id) addError(validation, "SELF_REFERENCE", "provenance.supersedesEvidenceRef", "Evidence cannot supersede itself.");
  if (id && normalized.provenance.supersededByEvidenceRef === id) addError(validation, "SELF_REFERENCE", "provenance.supersededByEvidenceRef", "Evidence cannot be superseded by itself.");
  if (normalized.provenance.supersedesEvidenceRef && normalized.provenance.supersedesEvidenceRef === normalized.provenance.supersededByEvidenceRef) {
    addError(validation, "CONFLICTING_SUPERSESSION_REFERENCES", "provenance", "supersedesEvidenceRef and supersededByEvidenceRef cannot match.");
  }

  const classification = normalized.classification;
  if (classification.role === EVIDENCE_ROLES.DIRECT && normalized.targets.length === 0) addWarning(validation, "DIRECT_TARGET_MISSING", "targets", "DIRECT evidence normally identifies a target.");
  if (classification.role === EVIDENCE_ROLES.DISCOVERY_ONLY && normalized.state === EVIDENCE_ARTIFACT_STATES.ACTIVE) addWarning(validation, "ACTIVE_DISCOVERY_ONLY", "state", "DISCOVERY_ONLY evidence is ACTIVE.");
  if (classification.role === EVIDENCE_ROLES.VALIDATION && normalized.relatedEvidenceRefs.length === 0 &&
      normalized.analyticalObservationRefs.length === 0 && normalized.recordedObservationRefs.length === 0 &&
      normalized.targets.length === 0 && normalized.basis.length === 0) {
    addError(validation, "VALIDATION_TARGET_REQUIRED", "targets", "VALIDATION evidence requires a referenced or described validation target.");
  }
  const explicitConflictRefs = normalized.conflicts.conflictingEvidenceRefs.length + normalized.conflicts.conflictingAnalysisRefs.length;
  if (classification.role === EVIDENCE_ROLES.CONFLICT &&
      ![EVIDENCE_CONFLICT_STATES.PRESENT, EVIDENCE_CONFLICT_STATES.UNRESOLVED].includes(normalized.conflicts.state) && explicitConflictRefs === 0) {
    addError(validation, "CONFLICT_METADATA_REQUIRED", "conflicts", "CONFLICT evidence requires conflict metadata.");
  }
  if (classification.role === EVIDENCE_ROLES.EXCLUSIONARY && !normalized.assessment.rationale &&
      normalized.assessment.limitations.length === 0 && !classification.notes) {
    addError(validation, "EXCLUSION_EXPLANATION_REQUIRED", "assessment.rationale", "EXCLUSIONARY evidence requires rationale or limitations.");
  }
  if ((classification.direction === EVIDENCE_DIRECTIONS.NOT_APPLICABLE) !==
      (classification.applicability === EVIDENCE_APPLICABILITY_STATES.NOT_APPLICABLE)) {
    addWarning(validation, "NOT_APPLICABLE_CLASSIFICATION_MISMATCH", "classification", "NOT_APPLICABLE direction and applicability normally pair.");
  }
  if (classification.role === EVIDENCE_ROLES.UNKNOWN) addWarning(validation, "UNKNOWN_EVIDENCE_ROLE", "classification.role", "Evidence role is explicitly unknown.");
  if (classification.direction === EVIDENCE_DIRECTIONS.UNKNOWN) addWarning(validation, "UNKNOWN_EVIDENCE_DIRECTION", "classification.direction", "Evidence direction is explicitly unknown.");
  if (classification.applicability === EVIDENCE_APPLICABILITY_STATES.UNKNOWN) addWarning(validation, "UNKNOWN_EVIDENCE_APPLICABILITY", "classification.applicability", "Evidence applicability is explicitly unknown.");

  const conflicts = normalized.conflicts;
  if (conflicts.state === EVIDENCE_CONFLICT_STATES.NONE && (explicitConflictRefs > 0 || conflicts.resolutionRef)) {
    addError(validation, "CONFLICT_NONE_METADATA_MISMATCH", "conflicts", "Conflict state NONE cannot contain conflict or resolution references.");
  }
  if ([EVIDENCE_CONFLICT_STATES.PRESENT, EVIDENCE_CONFLICT_STATES.UNRESOLVED].includes(conflicts.state) &&
      explicitConflictRefs === 0 && !conflicts.description) {
    addError(validation, "CONFLICT_DETAILS_REQUIRED", "conflicts", `${conflicts.state} requires conflict references or a description.`);
  }
  if (conflicts.state === EVIDENCE_CONFLICT_STATES.RESOLVED_EXTERNALLY && !conflicts.resolutionRef) {
    addError(validation, "EXTERNAL_RESOLUTION_REFERENCE_REQUIRED", "conflicts.resolutionRef", "RESOLVED_EXTERNALLY requires resolutionRef.");
  }
  if (conflicts.state === EVIDENCE_CONFLICT_STATES.UNKNOWN) addWarning(validation, "UNKNOWN_CONFLICT_STATE", "conflicts.state", "Conflict state is explicitly unknown.");

  const verification = normalized.verification;
  const reviewedStates = [EVIDENCE_VERIFICATION_STATES.VERIFIED, EVIDENCE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS, EVIDENCE_VERIFICATION_STATES.REJECTED];
  if (reviewedStates.includes(verification.state)) {
    if (!verification.verifiedBy) addError(validation, "VERIFIER_REQUIRED", "verification.verifiedBy", `${verification.state} requires verifiedBy.`);
    if (!verification.verifiedAt) addError(validation, "VERIFICATION_DATE_REQUIRED", "verification.verifiedAt", `${verification.state} requires verifiedAt.`);
  }
  if (verification.state === EVIDENCE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS && verification.limitations.length === 0 && !verification.notes) {
    addError(validation, "VERIFICATION_LIMITATIONS_REQUIRED", "verification.limitations", "VERIFIED_WITH_LIMITATIONS requires limitations or notes.");
  }

  const review = normalized.review;
  if (review.completedAt) {
    if (review.reviewerRefs.length === 0) addError(validation, "COMPLETED_REVIEWER_REQUIRED", "review.reviewerRefs", "Completed review requires a reviewer.");
    if (!review.outcome || review.outcome === EVIDENCE_REVIEW_OUTCOMES.NO_DECISION) addError(validation, "COMPLETED_REVIEW_OUTCOME_REQUIRED", "review.outcome", "Completed review requires a decision outcome.");
  }
  if (review.outcome === EVIDENCE_REVIEW_OUTCOMES.ACCEPTED_WITH_LIMITATIONS && review.requestedChanges.length === 0 && !review.notes) {
    addError(validation, "ACCEPTED_LIMITATIONS_REQUIRED", "review", "ACCEPTED_WITH_LIMITATIONS requires notes or requested changes.");
  }
  if (review.outcome === EVIDENCE_REVIEW_OUTCOMES.REVISION_REQUESTED && review.requestedChanges.length === 0) {
    addError(validation, "REQUESTED_CHANGES_REQUIRED", "review.requestedChanges", "REVISION_REQUESTED requires requested changes.");
  }

  if (normalized.state === EVIDENCE_ARTIFACT_STATES.ACTIVE && verification.state === EVIDENCE_VERIFICATION_STATES.UNVERIFIED) addWarning(validation, "ACTIVE_UNVERIFIED", "verification.state", "ACTIVE evidence is unverified.");
  if (normalized.state === EVIDENCE_ARTIFACT_STATES.RESTRICTED && normalized.assessment.limitations.length === 0 &&
      !normalized.assessment.notes && !classification.notes && !normalized.metadata.notes) {
    addWarning(validation, "RESTRICTED_EXPLANATION_MISSING", "assessment.limitations", "RESTRICTED evidence has no limitation or usage explanation.");
  }
  if (normalized.state === EVIDENCE_ARTIFACT_STATES.SUPERSEDED && !normalized.provenance.supersededByEvidenceRef) {
    addError(validation, "SUPERSEDED_BY_REFERENCE_REQUIRED", "provenance.supersededByEvidenceRef", "SUPERSEDED evidence requires supersededByEvidenceRef.");
  }
  if (normalized.state === EVIDENCE_ARTIFACT_STATES.ARCHIVED && !normalized.provenance.updatedAt && !normalized.review.completedAt) {
    addError(validation, "ARCHIVE_DATE_REQUIRED", "provenance.updatedAt", "ARCHIVED evidence requires provenance.updatedAt or review.completedAt.");
  }

  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

export function createEvidenceArtifact(input = {}, { checkedAt = null } = {}) {
  return normalizeArtifact(input, checkedAt);
}

export function createUnavailableEvidenceArtifact(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {};
  const reason = optionalString(supplied.reason);
  const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeArtifact({ ...supplied, metadata: { ...metadata, notes: metadata.notes ?? reason } }, checkedAt);
  const unavailable = createValidation(checkedAt);
  addError(unavailable, "EVIDENCE_ARTIFACT_UNAVAILABLE", "", reason || "No usable evidence artifact is available.");
  result.validation = mergeValidation(result.validation, unavailable);
  return result;
}

export function validateEvidenceArtifact(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizeArtifact(value, checkedAt).validation;
}

export function isEvidenceArtifact(value) {
  return Boolean(isObject(value) && value.contract === EVIDENCE_ARTIFACT_CONTRACT_NAME &&
    value.contractVersion === EVIDENCE_ARTIFACT_CONTRACT_VERSION && value.schemaVersion === EVIDENCE_ARTIFACT_SCHEMA_VERSION &&
    Array.isArray(value.sourceRefs) && Array.isArray(value.recordedObservationRefs) &&
    Array.isArray(value.analyticalObservationRefs) && Array.isArray(value.relatedEvidenceRefs) &&
    isObject(value.classification) && Array.isArray(value.basis) && Array.isArray(value.targets) &&
    isObject(value.assessment) && isObject(value.conflicts) && isObject(value.verification) &&
    isObject(value.review) && isObject(value.provenance) && isObject(value.metadata) && isObject(value.validation));
}

function isValidArtifact(value) {
  return isEvidenceArtifact(value) && validateEvidenceArtifact(value).valid;
}

export function isActiveEvidenceArtifact(value) {
  return Boolean(isValidArtifact(value) && value.state === EVIDENCE_ARTIFACT_STATES.ACTIVE);
}

export function isVerifiedEvidenceArtifact(value) {
  return Boolean(isValidArtifact(value) && [EVIDENCE_VERIFICATION_STATES.VERIFIED, EVIDENCE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS].includes(value.verification.state));
}

export function isDirectEvidenceArtifact(value) {
  return Boolean(isValidArtifact(value) && value.classification.role === EVIDENCE_ROLES.DIRECT);
}

export function isConflictingEvidenceArtifact(value) {
  return Boolean(isValidArtifact(value) && (
    value.classification.role === EVIDENCE_ROLES.CONFLICT ||
    value.classification.direction === EVIDENCE_DIRECTIONS.CONTRADICTORY ||
    [EVIDENCE_CONFLICT_STATES.PRESENT, EVIDENCE_CONFLICT_STATES.UNRESOLVED].includes(value.conflicts.state) ||
    value.conflicts.conflictingEvidenceRefs.length > 0 || value.conflicts.conflictingAnalysisRefs.length > 0));
}

export function isSupersededEvidenceArtifact(value) {
  return Boolean(isValidArtifact(value) && value.state === EVIDENCE_ARTIFACT_STATES.SUPERSEDED);
}

export default Object.freeze({
  EVIDENCE_ARTIFACT_CONTRACT_NAME, EVIDENCE_ARTIFACT_CONTRACT_VERSION, EVIDENCE_ARTIFACT_SCHEMA_VERSION,
  createEvidenceArtifact, createUnavailableEvidenceArtifact, validateEvidenceArtifact, isEvidenceArtifact,
  isActiveEvidenceArtifact, isVerifiedEvidenceArtifact, isDirectEvidenceArtifact,
  isConflictingEvidenceArtifact, isSupersededEvidenceArtifact,
});
