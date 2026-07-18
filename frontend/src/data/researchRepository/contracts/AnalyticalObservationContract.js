import {
  ANALYTICAL_BASIS_TYPES,
  ANALYTICAL_CONFIDENCE_LEVELS,
  ANALYTICAL_OBSERVATION_CONTRACT_NAME,
  ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
  ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
  ANALYTICAL_OBSERVATION_SCOPES,
  ANALYTICAL_OBSERVATION_TYPES,
  ANALYTICAL_RELATIONSHIP_TYPES,
  ANALYTICAL_REVIEW_OUTCOMES,
  ANALYTICAL_VERIFICATION_STATES,
} from "../constants/analyticalObservationConstants.js";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createValidation(checkedAt = null) {
  return {
    valid: true,
    errors: [],
    warnings: [],
    checkedAt: optionalString(checkedAt),
    contractVersion: ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
    schemaVersion: ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
  };
}

function addValidation(validation, field, code, path, message) {
  const entry = { code, path, message };
  const exists = validation[field].some(
    (item) => item.code === code && item.path === path && item.message === message
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

function normalizeAnalysis(input, checkedAt = null) {
  const validation = createValidation(checkedAt);
  const analysis = isObject(input) ? input : {};
  if (!isObject(input)) {
    addError(validation, "INVALID_ANALYTICAL_OBSERVATION_INPUT", "", "Analytical observation input must be an object.");
  }

  const normalized = {
    contract: ANALYTICAL_OBSERVATION_CONTRACT_NAME,
    contractVersion: ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
    schemaVersion: ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
    analysisId: normalizeReference(analysis.analysisId, "analysisId", validation, { required: true }),
    sessionRef: normalizeReference(analysis.sessionRef, "sessionRef", validation),
    sourceRefs: normalizeScalarArray(analysis.sourceRefs, "sourceRefs", validation),
    recordedObservationRefs: normalizeScalarArray(analysis.recordedObservationRefs, "recordedObservationRefs", validation),
    relatedAnalysisRefs: normalizeScalarArray(analysis.relatedAnalysisRefs, "relatedAnalysisRefs", validation),
    analysisType: normalizeEnum(analysis.analysisType, ANALYTICAL_OBSERVATION_TYPES, "analysisType", validation, { required: true }),
    scope: normalizeEnum(analysis.scope, ANALYTICAL_OBSERVATION_SCOPES, "scope", validation, { required: true }),
    title: normalizeString(analysis.title, "title", validation),
    statement: normalizeNested(analysis.statement, "statement", validation, (statement) => ({
      text: normalizeString(statement.text, "statement.text", validation, { required: true }),
      summary: normalizeString(statement.summary, "statement.summary", validation),
      language: normalizeString(statement.language, "statement.language", validation),
      translatedText: normalizeString(statement.translatedText, "statement.translatedText", validation),
      qualifiers: normalizeScalarArray(statement.qualifiers, "statement.qualifiers", validation, { invalidCode: "INVALID_QUALIFIER" }),
      limitations: normalizeScalarArray(statement.limitations, "statement.limitations", validation, { invalidCode: "INVALID_LIMITATION" }),
      notes: normalizeString(statement.notes, "statement.notes", validation),
    })),
    basis: normalizeStructuredArray(analysis.basis, "basis", validation, (basis, index) => ({
      basisType: normalizeEnum(basis.basisType, ANALYTICAL_BASIS_TYPES, `basis[${index}].basisType`, validation, { required: true }),
      ref: normalizeReference(basis.ref, `basis[${index}].ref`, validation),
      description: normalizeString(basis.description, `basis[${index}].description`, validation),
      notes: normalizeString(basis.notes, `basis[${index}].notes`, validation),
    })),
    evaluator: normalizeNested(analysis.evaluator, "evaluator", validation, (evaluator) => ({
      evaluatorRef: normalizeReference(evaluator.evaluatorRef, "evaluator.evaluatorRef", validation),
      evaluatorLabel: normalizeString(evaluator.evaluatorLabel, "evaluator.evaluatorLabel", validation),
      role: normalizeString(evaluator.role, "evaluator.role", validation),
      organizationRef: normalizeReference(evaluator.organizationRef, "evaluator.organizationRef", validation),
      methodologyRef: normalizeReference(evaluator.methodologyRef, "evaluator.methodologyRef", validation),
      declaredConflicts: normalizeNested(evaluator.declaredConflicts, "evaluator.declaredConflicts", validation, (conflicts) => ({
        disclosed: normalizeBoolean(conflicts.disclosed, "evaluator.declaredConflicts.disclosed", validation),
        subjectRefs: normalizeScalarArray(conflicts.subjectRefs, "evaluator.declaredConflicts.subjectRefs", validation),
        organizationRefs: normalizeScalarArray(conflicts.organizationRefs, "evaluator.declaredConflicts.organizationRefs", validation),
        description: normalizeString(conflicts.description, "evaluator.declaredConflicts.description", validation),
      })),
      notes: normalizeString(evaluator.notes, "evaluator.notes", validation),
    })),
    confidence: normalizeNested(analysis.confidence, "confidence", validation, (confidence) => ({
      level: normalizeEnum(confidence.level, ANALYTICAL_CONFIDENCE_LEVELS, "confidence.level", validation, { required: true }),
      rationale: normalizeString(confidence.rationale, "confidence.rationale", validation),
      limitations: normalizeScalarArray(confidence.limitations, "confidence.limitations", validation, { invalidCode: "INVALID_LIMITATION" }),
      notes: normalizeString(confidence.notes, "confidence.notes", validation),
    })),
    relationships: normalizeStructuredArray(analysis.relationships, "relationships", validation, (relationship, index) => ({
      relationshipType: normalizeEnum(relationship.relationshipType, ANALYTICAL_RELATIONSHIP_TYPES, `relationships[${index}].relationshipType`, validation, { required: true }),
      targetAnalysisRef: normalizeReference(relationship.targetAnalysisRef, `relationships[${index}].targetAnalysisRef`, validation, { required: true }),
      description: normalizeString(relationship.description, `relationships[${index}].description`, validation),
      notes: normalizeString(relationship.notes, `relationships[${index}].notes`, validation),
    })),
    verification: normalizeNested(analysis.verification, "verification", validation, (verification) => ({
      state: normalizeEnum(verification.state, ANALYTICAL_VERIFICATION_STATES, "verification.state", validation, { required: true }),
      reviewedBy: normalizeReference(verification.reviewedBy, "verification.reviewedBy", validation),
      reviewedAt: normalizeDate(verification.reviewedAt, "verification.reviewedAt", validation),
      method: normalizeString(verification.method, "verification.method", validation),
      limitations: normalizeScalarArray(verification.limitations, "verification.limitations", validation, { invalidCode: "INVALID_LIMITATION" }),
      notes: normalizeString(verification.notes, "verification.notes", validation),
    })),
    review: normalizeNested(analysis.review, "review", validation, (review) => ({
      required: normalizeBoolean(review.required, "review.required", validation),
      reviewerRefs: normalizeScalarArray(review.reviewerRefs, "review.reviewerRefs", validation),
      completedAt: normalizeDate(review.completedAt, "review.completedAt", validation),
      outcome: normalizeEnum(review.outcome, ANALYTICAL_REVIEW_OUTCOMES, "review.outcome", validation),
      requestedChanges: normalizeScalarArray(review.requestedChanges, "review.requestedChanges", validation, { invalidCode: "INVALID_REQUESTED_CHANGE" }),
      notes: normalizeString(review.notes, "review.notes", validation),
    })),
    provenance: normalizeNested(analysis.provenance, "provenance", validation, (provenance) => ({
      createdBy: normalizeReference(provenance.createdBy, "provenance.createdBy", validation),
      createdAt: normalizeDate(provenance.createdAt, "provenance.createdAt", validation),
      updatedBy: normalizeReference(provenance.updatedBy, "provenance.updatedBy", validation),
      updatedAt: normalizeDate(provenance.updatedAt, "provenance.updatedAt", validation),
    })),
    metadata: normalizeNested(analysis.metadata, "metadata", validation, (metadata) => ({
      tags: normalizeScalarArray(metadata.tags, "metadata.tags", validation, { invalidCode: "INVALID_TAG" }),
      externalRefs: normalizeScalarArray(metadata.externalRefs, "metadata.externalRefs", validation),
      relatedSubjectRefs: normalizeScalarArray(metadata.relatedSubjectRefs, "metadata.relatedSubjectRefs", validation),
      notes: normalizeString(metadata.notes, "metadata.notes", validation),
    })),
    validation: null,
  };

  normalized.basis.forEach((basis, index) => {
    if (!basis.ref && !basis.description) {
      addError(validation, "BASIS_REFERENCE_OR_DESCRIPTION_REQUIRED", `basis[${index}]`, "Basis requires a reference or description.");
    }
  });
  if (!normalized.evaluator.evaluatorRef && !normalized.evaluator.evaluatorLabel) {
    addError(validation, "EVALUATOR_REQUIRED", "evaluator", "An evaluator reference or label is required.");
  }
  const basisCount = normalized.recordedObservationRefs.length + normalized.sourceRefs.length +
    normalized.basis.length + (normalized.sessionRef ? 1 : 0);
  if (basisCount === 0) {
    addError(validation, "ANALYTICAL_BASIS_REQUIRED", "basis", "At least one analytical basis is required.");
  }
  if (normalized.analysisId && normalized.relatedAnalysisRefs.includes(normalized.analysisId)) {
    addError(validation, "SELF_REFERENCE", "relatedAnalysisRefs", "An analysis cannot reference itself.");
  }
  normalized.relationships.forEach((relationship, index) => {
    if (normalized.analysisId && relationship.targetAnalysisRef === normalized.analysisId) {
      addError(validation, "SELF_REFERENCE", `relationships[${index}].targetAnalysisRef`, "An analysis cannot target itself.");
    }
  });

  const conflicts = normalized.evaluator.declaredConflicts;
  if (conflicts.disclosed === true && conflicts.subjectRefs.length === 0 &&
      conflicts.organizationRefs.length === 0 && !conflicts.description) {
    addWarning(validation, "DISCLOSED_CONFLICT_DETAILS_MISSING", "evaluator.declaredConflicts", "A disclosed conflict has no details.");
  }
  if ([ANALYTICAL_CONFIDENCE_LEVELS.HIGH, ANALYTICAL_CONFIDENCE_LEVELS.VERY_HIGH].includes(normalized.confidence.level) &&
      !normalized.confidence.rationale) {
    addWarning(validation, "HIGH_CONFIDENCE_RATIONALE_MISSING", "confidence.rationale", "High confidence has no rationale.");
  }
  if (isObject(analysis.confidence) && typeof analysis.confidence.score === "number") {
    addError(validation, "NUMERIC_CONFIDENCE_NOT_PERMITTED", "confidence.score", "Analytical confidence must not include a numeric score.");
  }

  const state = normalized.verification.state;
  const reviewedStates = [
    ANALYTICAL_VERIFICATION_STATES.REVIEWED,
    ANALYTICAL_VERIFICATION_STATES.REVIEWED_WITH_LIMITATIONS,
    ANALYTICAL_VERIFICATION_STATES.REJECTED,
  ];
  if (reviewedStates.includes(state)) {
    if (!normalized.verification.reviewedBy) addError(validation, "VERIFICATION_REVIEWER_REQUIRED", "verification.reviewedBy", `${state} requires reviewedBy.`);
    if (!normalized.verification.reviewedAt) addError(validation, "VERIFICATION_REVIEW_DATE_REQUIRED", "verification.reviewedAt", `${state} requires reviewedAt.`);
  }
  if (state === ANALYTICAL_VERIFICATION_STATES.REVIEWED_WITH_LIMITATIONS &&
      normalized.verification.limitations.length === 0 && !normalized.verification.notes) {
    addError(validation, "VERIFICATION_LIMITATIONS_REQUIRED", "verification.limitations", "REVIEWED_WITH_LIMITATIONS requires limitations or notes.");
  }

  const review = normalized.review;
  if (review.completedAt) {
    if (review.reviewerRefs.length === 0) addError(validation, "COMPLETED_REVIEWER_REQUIRED", "review.reviewerRefs", "A completed review requires a reviewer.");
    if (!review.outcome || review.outcome === ANALYTICAL_REVIEW_OUTCOMES.NO_DECISION) {
      addError(validation, "COMPLETED_REVIEW_OUTCOME_REQUIRED", "review.outcome", "A completed review requires a decision outcome.");
    }
  }
  if (review.outcome === ANALYTICAL_REVIEW_OUTCOMES.ACCEPTED_WITH_LIMITATIONS &&
      review.requestedChanges.length === 0 && !review.notes) {
    addError(validation, "ACCEPTED_LIMITATIONS_REQUIRED", "review", "ACCEPTED_WITH_LIMITATIONS requires notes or requested changes.");
  }
  if (review.outcome === ANALYTICAL_REVIEW_OUTCOMES.REVISION_REQUESTED && review.requestedChanges.length === 0) {
    addError(validation, "REQUESTED_CHANGES_REQUIRED", "review.requestedChanges", "REVISION_REQUESTED requires requested changes.");
  }

  const type = normalized.analysisType;
  const plurality = normalized.recordedObservationRefs.length + normalized.sourceRefs.length + normalized.basis.length;
  if (type === ANALYTICAL_OBSERVATION_TYPES.COMPARISON &&
      basisCount + normalized.metadata.relatedSubjectRefs.length < 2) {
    addWarning(validation, "COMPARISON_BASIS_PLURALITY_LOW", "basis", "COMPARISON normally references at least two bases or related subjects.");
  }
  if (type === ANALYTICAL_OBSERVATION_TYPES.PATTERN_IDENTIFICATION && plurality < 2) {
    addWarning(validation, "PATTERN_BASIS_PLURALITY_LOW", "basis", "PATTERN_IDENTIFICATION normally references multiple observations, sources, or basis records.");
  }
  if (type === ANALYTICAL_OBSERVATION_TYPES.CAUSAL_HYPOTHESIS &&
      normalized.statement.qualifiers.length === 0 && normalized.statement.limitations.length === 0) {
    addError(validation, "CAUSAL_QUALIFICATION_REQUIRED", "statement.qualifiers", "CAUSAL_HYPOTHESIS requires a qualifier or limitation.");
  }
  if (type === ANALYTICAL_OBSERVATION_TYPES.METHODOLOGICAL_ASSESSMENT &&
      !normalized.evaluator.methodologyRef && !normalized.basis.some((item) => item.description)) {
    addWarning(validation, "METHODOLOGY_CONTEXT_MISSING", "evaluator.methodologyRef", "METHODOLOGICAL_ASSESSMENT has no methodology reference or basis description.");
  }
  if (type === ANALYTICAL_OBSERVATION_TYPES.SOURCE_CRITIQUE &&
      normalized.sourceRefs.length === 0 &&
      !normalized.basis.some((item) => item.basisType === ANALYTICAL_BASIS_TYPES.SOURCE_MATERIAL)) {
    addError(validation, "SOURCE_CRITIQUE_BASIS_REQUIRED", "sourceRefs", "SOURCE_CRITIQUE requires a source reference or source-material basis.");
  }
  const contradiction = normalized.relationships.some(
    (item) => item.relationshipType === ANALYTICAL_RELATIONSHIP_TYPES.CONTRADICTS
  );
  if (type === ANALYTICAL_OBSERVATION_TYPES.CONTRADICTION &&
      !contradiction && normalized.relatedAnalysisRefs.length === 0) {
    addError(validation, "CONTRADICTION_REFERENCE_REQUIRED", "relationships", "CONTRADICTION requires a contradictory relationship or related analysis reference.");
  }
  if (type === ANALYTICAL_OBSERVATION_TYPES.UNKNOWN) {
    addWarning(validation, "UNKNOWN_ANALYSIS_TYPE", "analysisType", "Analysis type is explicitly unknown.");
  }

  validation.valid = validation.errors.length === 0;
  normalized.validation = validation;
  return normalized;
}

export function createAnalyticalObservation(input = {}, { checkedAt = null } = {}) {
  return normalizeAnalysis(input, checkedAt);
}

export function createUnavailableAnalyticalObservation(input = {}, { checkedAt = null } = {}) {
  const supplied = isObject(input) ? input : {};
  const reason = optionalString(supplied.reason);
  const metadata = isObject(supplied.metadata) ? supplied.metadata : {};
  const result = normalizeAnalysis({
    ...supplied,
    metadata: { ...metadata, notes: metadata.notes ?? reason },
  }, checkedAt);
  const unavailable = createValidation(checkedAt);
  addError(unavailable, "ANALYTICAL_OBSERVATION_UNAVAILABLE", "", reason || "No usable analytical observation is available.");
  result.validation = mergeValidation(result.validation, unavailable);
  return result;
}

export function validateAnalyticalObservation(value, { checkedAt = value?.validation?.checkedAt ?? null } = {}) {
  return normalizeAnalysis(value, checkedAt).validation;
}

export function isAnalyticalObservation(value) {
  return Boolean(
    isObject(value) && value.contract === ANALYTICAL_OBSERVATION_CONTRACT_NAME &&
      value.contractVersion === ANALYTICAL_OBSERVATION_CONTRACT_VERSION &&
      value.schemaVersion === ANALYTICAL_OBSERVATION_SCHEMA_VERSION &&
      Array.isArray(value.sourceRefs) && Array.isArray(value.recordedObservationRefs) &&
      Array.isArray(value.relatedAnalysisRefs) && isObject(value.statement) &&
      Array.isArray(value.basis) && isObject(value.evaluator) && isObject(value.confidence) &&
      Array.isArray(value.relationships) && isObject(value.verification) &&
      isObject(value.review) && isObject(value.provenance) &&
      isObject(value.metadata) && isObject(value.validation)
  );
}

export function isReviewedAnalyticalObservation(value) {
  const states = [ANALYTICAL_VERIFICATION_STATES.REVIEWED, ANALYTICAL_VERIFICATION_STATES.REVIEWED_WITH_LIMITATIONS];
  return Boolean(isAnalyticalObservation(value) && states.includes(value.verification.state) && validateAnalyticalObservation(value).valid);
}

export function isRejectedAnalyticalObservation(value) {
  return Boolean(
    isAnalyticalObservation(value) && validateAnalyticalObservation(value).valid &&
      (value.verification.state === ANALYTICAL_VERIFICATION_STATES.REJECTED ||
        (value.review.completedAt && value.review.outcome === ANALYTICAL_REVIEW_OUTCOMES.REJECTED))
  );
}

export function isConflictingAnalyticalObservation(value) {
  return Boolean(
    isAnalyticalObservation(value) && validateAnalyticalObservation(value).valid &&
      (value.analysisType === ANALYTICAL_OBSERVATION_TYPES.CONTRADICTION ||
        value.relationships.some((item) => item.relationshipType === ANALYTICAL_RELATIONSHIP_TYPES.CONTRADICTS))
  );
}

export default Object.freeze({
  ANALYTICAL_OBSERVATION_CONTRACT_NAME,
  ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
  ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
  createAnalyticalObservation,
  createUnavailableAnalyticalObservation,
  validateAnalyticalObservation,
  isAnalyticalObservation,
  isReviewedAnalyticalObservation,
  isRejectedAnalyticalObservation,
  isConflictingAnalyticalObservation,
});
