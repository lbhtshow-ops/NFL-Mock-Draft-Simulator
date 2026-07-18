import researchRepository, {
  ANALYTICAL_BASIS_TYPES,
  ANALYTICAL_CONFIDENCE_LEVELS,
  ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
  ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
  ANALYTICAL_OBSERVATION_SCOPES,
  ANALYTICAL_OBSERVATION_TYPES,
  ANALYTICAL_RELATIONSHIP_TYPES,
  ANALYTICAL_REVIEW_OUTCOMES,
  ANALYTICAL_VERIFICATION_STATES,
  createAnalyticalObservation,
  createUnavailableAnalyticalObservation,
  isAnalyticalObservation,
  isConflictingAnalyticalObservation,
  isRejectedAnalyticalObservation,
  isReviewedAnalyticalObservation,
  validateAnalyticalObservation,
} from "../index.js";

const SUITE = "AnalyticalObservationContractDiagnostics";

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function same(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message, { actual, expected });
}

function hasCode(validation, code, field = "errors") {
  return (validation?.[field] || []).some((entry) => entry.code === code);
}

function basis(ref = "observation-001", description = null) {
  return { basisType: ANALYTICAL_BASIS_TYPES.RECORDED_OBSERVATION, ref, description, notes: null };
}

function relationship(type = ANALYTICAL_RELATIONSHIP_TYPES.RELATED_TO, target = "analysis-002") {
  return { relationshipType: type, targetAnalysisRef: target, description: null, notes: null };
}

function baseInput(overrides = {}) {
  return {
    analysisId: "analysis-001",
    sessionRef: null,
    sourceRefs: [],
    recordedObservationRefs: ["observation-001"],
    relatedAnalysisRefs: [],
    analysisType: ANALYTICAL_OBSERVATION_TYPES.INTERPRETATION,
    scope: ANALYTICAL_OBSERVATION_SCOPES.SINGLE_OBSERVATION,
    title: "Documented interpretation",
    statement: {
      text: "The recorded materials demonstrate a recurring difference.",
      summary: null,
      language: "en",
      translatedText: null,
      qualifiers: [],
      limitations: [],
      notes: null,
    },
    basis: [],
    evaluator: {
      evaluatorRef: "evaluator-001",
      evaluatorLabel: "Evaluator One",
      role: "researcher",
      organizationRef: null,
      methodologyRef: null,
      declaredConflicts: { disclosed: null, subjectRefs: [], organizationRefs: [], description: null },
      notes: null,
    },
    confidence: { level: ANALYTICAL_CONFIDENCE_LEVELS.MODERATE, rationale: null, limitations: [], notes: null },
    relationships: [],
    verification: { state: ANALYTICAL_VERIFICATION_STATES.UNVERIFIED },
    review: { required: false, reviewerRefs: [], requestedChanges: [] },
    provenance: { createdBy: "evaluator-001", createdAt: "2026-01-01" },
    metadata: { tags: ["analysis"], externalRefs: [], relatedSubjectRefs: [], notes: null },
    ...overrides,
  };
}

function reviewedInput(overrides = {}) {
  return baseInput({
    confidence: { level: ANALYTICAL_CONFIDENCE_LEVELS.HIGH, rationale: "Multiple records align.", limitations: [] },
    verification: {
      state: ANALYTICAL_VERIFICATION_STATES.REVIEWED,
      reviewedBy: "reviewer-001",
      reviewedAt: "2026-01-02",
      method: "Independent reading",
      limitations: [],
    },
    ...overrides,
  });
}

function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      keys.add(key);
      keysDeep(entry, keys);
    });
  }
  return keys;
}

const CASES = [
  ["valid-reviewed-interpretation", () => {
    const result = createAnalyticalObservation(reviewedInput());
    assert(result.validation.valid && isReviewedAnalyticalObservation(result), "Reviewed interpretation failed.");
  }],
  ["valid-unverified-analysis", () => {
    const result = createAnalyticalObservation(baseInput());
    assert(result.validation.valid && !isReviewedAnalyticalObservation(result), "Unverified analysis failed.");
  }],
  ["valid-recorded-observation-basis", () => {
    assert(createAnalyticalObservation(baseInput({ recordedObservationRefs: ["observation-001", "observation-002"] })).validation.valid, "Recorded references failed.");
  }],
  ["valid-source-only-analysis", () => {
    const result = createAnalyticalObservation(baseInput({ recordedObservationRefs: [], sourceRefs: ["source-001"], scope: ANALYTICAL_OBSERVATION_SCOPES.SINGLE_SOURCE }));
    assert(result.validation.valid, "Source-based analysis failed.");
  }],
  ["valid-session-based-analysis", () => {
    const result = createAnalyticalObservation(baseInput({ recordedObservationRefs: [], sessionRef: "session-001", scope: ANALYTICAL_OBSERVATION_SCOPES.SESSION_LEVEL }));
    assert(result.validation.valid, "Session-based analysis failed.");
  }],
  ["valid-comparison-multiple-bases", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.COMPARISON, scope: ANALYTICAL_OBSERVATION_SCOPES.MULTIPLE_OBSERVATIONS, recordedObservationRefs: ["observation-001", "observation-002"] }));
    assert(result.validation.valid && !hasCode(result.validation, "COMPARISON_BASIS_PLURALITY_LOW", "warnings"), "Comparison failed.");
  }],
  ["comparison-insufficient-bases-warning", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.COMPARISON }));
    assert(result.validation.valid && hasCode(result.validation, "COMPARISON_BASIS_PLURALITY_LOW", "warnings"), "Comparison warning failed.");
  }],
  ["valid-pattern-identification", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.PATTERN_IDENTIFICATION, recordedObservationRefs: ["observation-001", "observation-002"] }));
    assert(result.validation.valid, "Pattern identification failed.");
  }],
  ["pattern-insufficient-plurality-warning", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.PATTERN_IDENTIFICATION }));
    assert(result.validation.valid && hasCode(result.validation, "PATTERN_BASIS_PLURALITY_LOW", "warnings"), "Pattern warning failed.");
  }],
  ["valid-qualified-causal-hypothesis", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.CAUSAL_HYPOTHESIS, statement: { text: "The timing may explain the recorded change.", qualifiers: ["Provisional"], limitations: [] } }));
    assert(result.validation.valid, "Qualified causal hypothesis failed.");
  }],
  ["causal-hypothesis-missing-qualification", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.CAUSAL_HYPOTHESIS }));
    assert(hasCode(result.validation, "CAUSAL_QUALIFICATION_REQUIRED"), "Unqualified causal claim accepted.");
  }],
  ["valid-technical-assessment", () => {
    assert(createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.TECHNICAL_ASSESSMENT })).validation.valid, "Technical assessment failed.");
  }],
  ["valid-contextual-assessment", () => {
    assert(createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.CONTEXTUAL_ASSESSMENT })).validation.valid, "Contextual assessment failed.");
  }],
  ["valid-methodological-assessment", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.METHODOLOGICAL_ASSESSMENT, evaluator: { evaluatorRef: "evaluator-001", methodologyRef: "method-001" } }));
    assert(result.validation.valid && !hasCode(result.validation, "METHODOLOGY_CONTEXT_MISSING", "warnings"), "Methodological assessment failed.");
  }],
  ["methodological-context-warning", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.METHODOLOGICAL_ASSESSMENT }));
    assert(result.validation.valid && hasCode(result.validation, "METHODOLOGY_CONTEXT_MISSING", "warnings"), "Methodology warning failed.");
  }],
  ["valid-source-critique", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.SOURCE_CRITIQUE, recordedObservationRefs: [], sourceRefs: ["source-001"] }));
    assert(result.validation.valid, "Source critique failed.");
  }],
  ["source-critique-missing-source-basis", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.SOURCE_CRITIQUE }));
    assert(hasCode(result.validation, "SOURCE_CRITIQUE_BASIS_REQUIRED"), "Source critique without source accepted.");
  }],
  ["valid-contradiction-analysis", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.CONTRADICTION, relatedAnalysisRefs: ["analysis-002"], relationships: [relationship(ANALYTICAL_RELATIONSHIP_TYPES.CONTRADICTS)] }));
    assert(result.validation.valid && isConflictingAnalyticalObservation(result), "Contradiction failed.");
  }],
  ["contradiction-missing-conflicting-reference", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.CONTRADICTION }));
    assert(hasCode(result.validation, "CONTRADICTION_REFERENCE_REQUIRED"), "Unanchored contradiction accepted.");
  }],
  ["valid-other-analysis", () => {
    assert(createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.OTHER })).validation.valid, "OTHER analysis failed.");
  }],
  ["valid-unknown-analysis-warning", () => {
    const result = createAnalyticalObservation(baseInput({ analysisType: ANALYTICAL_OBSERVATION_TYPES.UNKNOWN }));
    assert(result.validation.valid && hasCode(result.validation, "UNKNOWN_ANALYSIS_TYPE", "warnings"), "UNKNOWN warning failed.");
  }],
  ["unknown-analysis-type", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ analysisType: "UNRECOGNIZED" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown analysis type accepted.");
  }],
  ["unknown-scope", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ scope: "UNRECOGNIZED" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown scope accepted.");
  }],
  ["unknown-confidence-level", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ confidence: { level: "UNRECOGNIZED" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown confidence accepted.");
  }],
  ["unknown-verification-state", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ verification: { state: "UNRECOGNIZED" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown verification accepted.");
  }],
  ["unknown-relationship-type", () => {
    const result = createAnalyticalObservation(baseInput({ relationships: [relationship("UNRECOGNIZED")] }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown relationship accepted.");
  }],
  ["unknown-review-outcome", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: false, outcome: "UNRECOGNIZED" } }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown review outcome accepted.");
  }],
  ["unknown-basis-type", () => {
    const result = createAnalyticalObservation(baseInput({ basis: [{ basisType: "UNRECOGNIZED", description: "Material" }] }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown basis type accepted.");
  }],
  ["missing-analysis-id", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ analysisId: null })).validation, "MISSING_REQUIRED_REFERENCE"), "Missing ID accepted.");
  }],
  ["missing-statement-text", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ statement: {} })).validation, "MISSING_REQUIRED_FIELD"), "Missing statement accepted.");
  }],
  ["missing-evaluator", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ evaluator: {} })).validation, "EVALUATOR_REQUIRED"), "Missing evaluator accepted.");
  }],
  ["missing-analytical-basis", () => {
    const result = createAnalyticalObservation(baseInput({ sessionRef: null, sourceRefs: [], recordedObservationRefs: [], basis: [] }));
    assert(hasCode(result.validation, "ANALYTICAL_BASIS_REQUIRED"), "Missing basis accepted.");
  }],
  ["invalid-source-reference", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ sourceRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid source reference accepted.");
  }],
  ["invalid-recorded-observation-reference", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ recordedObservationRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid observation reference accepted.");
  }],
  ["invalid-related-analysis-reference", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ relatedAnalysisRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid analysis reference accepted.");
  }],
  ["invalid-evaluator-reference", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ evaluator: { evaluatorRef: "", evaluatorLabel: "Named evaluator" } })).validation, "INVALID_REFERENCE"), "Invalid evaluator reference accepted.");
  }],
  ["invalid-basis-structure", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ basis: ["observation-001"] })).validation, "INVALID_NESTED_STRUCTURE"), "Invalid basis accepted.");
  }],
  ["basis-missing-ref-and-description", () => {
    const result = createAnalyticalObservation(baseInput({ basis: [{ basisType: ANALYTICAL_BASIS_TYPES.OTHER }] }));
    assert(hasCode(result.validation, "BASIS_REFERENCE_OR_DESCRIPTION_REQUIRED"), "Empty basis accepted.");
  }],
  ["invalid-relationship-structure", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ relationships: ["analysis-002"] })).validation, "INVALID_NESTED_STRUCTURE"), "Invalid relationship accepted.");
  }],
  ["relationship-missing-target", () => {
    const result = createAnalyticalObservation(baseInput({ relationships: [{ relationshipType: ANALYTICAL_RELATIONSHIP_TYPES.RELATED_TO }] }));
    assert(hasCode(result.validation, "MISSING_REQUIRED_REFERENCE"), "Targetless relationship accepted.");
  }],
  ["self-reference-related-analyses", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ relatedAnalysisRefs: ["analysis-001"] })).validation, "SELF_REFERENCE"), "Related self-reference accepted.");
  }],
  ["self-reference-relationship-target", () => {
    assert(hasCode(createAnalyticalObservation(baseInput({ relationships: [relationship(ANALYTICAL_RELATIONSHIP_TYPES.RELATED_TO, "analysis-001")] })).validation, "SELF_REFERENCE"), "Relationship self-reference accepted.");
  }],
  ["duplicate-scalar-references", () => {
    const result = createAnalyticalObservation(baseInput({ recordedObservationRefs: ["observation-001", " observation-001 "] }));
    same(result.recordedObservationRefs, ["observation-001"], "Reference duplicates remain.");
    assert(hasCode(result.validation, "DUPLICATE_NORMALIZED_VALUE", "warnings"), "Duplicate warning missing.");
  }],
  ["duplicate-qualifiers-limitations", () => {
    const result = createAnalyticalObservation(baseInput({ statement: { text: "Analysis", qualifiers: ["Provisional", " Provisional "], limitations: ["Limited sample", "Limited sample"] } }));
    assert(result.statement.qualifiers.length === 1 && result.statement.limitations.length === 1, "Statement duplicates remain.");
  }],
  ["exact-duplicate-basis", () => {
    const item = basis();
    const result = createAnalyticalObservation(baseInput({ basis: [item, { ...item }] }));
    assert(result.basis.length === 1 && hasCode(result.validation, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Basis duplicates remain.");
  }],
  ["exact-duplicate-relationship", () => {
    const item = relationship();
    const result = createAnalyticalObservation(baseInput({ relationships: [item, { ...item }] }));
    assert(result.relationships.length === 1 && hasCode(result.validation, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Relationship duplicates remain.");
  }],
  ["translation-preserves-original", () => {
    const result = createAnalyticalObservation(baseInput({ statement: { text: "Original analysis", translatedText: "Translated analysis" } }));
    assert(result.statement.text === "Original analysis" && result.statement.translatedText === "Translated analysis", "Translation altered original.");
  }],
  ["summary-not-inferred", () => {
    assert(createAnalyticalObservation(baseInput({ statement: { text: "Detailed analysis" } })).statement.summary === null, "Summary inferred.");
  }],
  ["direction-not-inferred", () => {
    assert(!keysDeep(createAnalyticalObservation(baseInput())).has("direction"), "Direction inferred.");
  }],
  ["strength-not-inferred", () => {
    assert(!keysDeep(createAnalyticalObservation(baseInput())).has("strength"), "Strength inferred.");
  }],
  ["ontology-not-parsed-from-text", () => {
    const result = createAnalyticalObservation(baseInput({ statement: { text: "Free-form concepts remain authored text." } }));
    const keys = keysDeep(result);
    assert(!keys.has("traits") && !keys.has("concepts") && result.statement.text.includes("concepts"), "Text was parsed into ontology.");
  }],
  ["high-confidence-rationale-warning", () => {
    const result = createAnalyticalObservation(baseInput({ confidence: { level: ANALYTICAL_CONFIDENCE_LEVELS.HIGH } }));
    assert(result.validation.valid && hasCode(result.validation, "HIGH_CONFIDENCE_RATIONALE_MISSING", "warnings"), "Confidence warning failed.");
  }],
  ["confidence-does-not-imply-verification", () => {
    const result = createAnalyticalObservation(baseInput({ confidence: { level: ANALYTICAL_CONFIDENCE_LEVELS.VERY_HIGH, rationale: "Declared rationale" } }));
    assert(result.verification.state === ANALYTICAL_VERIFICATION_STATES.UNVERIFIED && !isReviewedAnalyticalObservation(result), "Confidence implied verification.");
  }],
  ["verification-does-not-imply-confidence", () => {
    const result = createAnalyticalObservation(reviewedInput({ confidence: { level: ANALYTICAL_CONFIDENCE_LEVELS.UNSPECIFIED } }));
    assert(result.validation.valid && result.confidence.level === ANALYTICAL_CONFIDENCE_LEVELS.UNSPECIFIED, "Verification changed confidence.");
  }],
  ["numeric-confidence-absent", () => {
    const result = createAnalyticalObservation(baseInput({ confidence: { level: ANALYTICAL_CONFIDENCE_LEVELS.MODERATE, score: 90 } }));
    assert(!Object.hasOwn(result.confidence, "score") && hasCode(result.validation, "NUMERIC_CONFIDENCE_NOT_PERMITTED"), "Numeric confidence was not rejected and omitted.");
  }],
  ["reviewed-state-missing-reviewer", () => {
    const result = createAnalyticalObservation(baseInput({ verification: { state: ANALYTICAL_VERIFICATION_STATES.REVIEWED, reviewedAt: "2026-01-02" } }));
    assert(hasCode(result.validation, "VERIFICATION_REVIEWER_REQUIRED"), "Reviewed reviewer requirement missing.");
  }],
  ["reviewed-state-missing-date", () => {
    const result = createAnalyticalObservation(baseInput({ verification: { state: ANALYTICAL_VERIFICATION_STATES.REVIEWED, reviewedBy: "reviewer-001" } }));
    assert(hasCode(result.validation, "VERIFICATION_REVIEW_DATE_REQUIRED"), "Reviewed date requirement missing.");
  }],
  ["reviewed-with-limitations-missing-limitations", () => {
    const result = createAnalyticalObservation(baseInput({ verification: { state: ANALYTICAL_VERIFICATION_STATES.REVIEWED_WITH_LIMITATIONS, reviewedBy: "reviewer-001", reviewedAt: "2026-01-02" } }));
    assert(hasCode(result.validation, "VERIFICATION_LIMITATIONS_REQUIRED"), "Verification limitations requirement missing.");
  }],
  ["rejected-state-remains-valid", () => {
    const result = createAnalyticalObservation(baseInput({ verification: { state: ANALYTICAL_VERIFICATION_STATES.REJECTED, reviewedBy: "reviewer-001", reviewedAt: "2026-01-02" } }));
    assert(result.validation.valid && isRejectedAnalyticalObservation(result), "Rejected analysis invalidated or lost.");
  }],
  ["required-review-may-be-pending", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: true, reviewerRefs: [], requestedChanges: [] } }));
    assert(result.validation.valid, "Pending required review invalidated.");
  }],
  ["completed-review-missing-reviewer", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: true, completedAt: "2026-01-02", outcome: ANALYTICAL_REVIEW_OUTCOMES.ACCEPTED } }));
    assert(hasCode(result.validation, "COMPLETED_REVIEWER_REQUIRED"), "Completed review reviewer requirement missing.");
  }],
  ["completed-review-no-decision", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: ANALYTICAL_REVIEW_OUTCOMES.NO_DECISION } }));
    assert(hasCode(result.validation, "COMPLETED_REVIEW_OUTCOME_REQUIRED"), "NO_DECISION completed review accepted.");
  }],
  ["accepted-with-limitations-missing-details", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: ANALYTICAL_REVIEW_OUTCOMES.ACCEPTED_WITH_LIMITATIONS } }));
    assert(hasCode(result.validation, "ACCEPTED_LIMITATIONS_REQUIRED"), "Accepted limitations without details accepted.");
  }],
  ["revision-requested-missing-changes", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: ANALYTICAL_REVIEW_OUTCOMES.REVISION_REQUESTED } }));
    assert(hasCode(result.validation, "REQUESTED_CHANGES_REQUIRED"), "Revision without changes accepted.");
  }],
  ["review-does-not-imply-verification", () => {
    const result = createAnalyticalObservation(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: ANALYTICAL_REVIEW_OUTCOMES.ACCEPTED } }));
    assert(result.validation.valid && result.verification.state === ANALYTICAL_VERIFICATION_STATES.UNVERIFIED, "Review implied verification.");
  }],
  ["verification-does-not-imply-review-outcome", () => {
    const result = createAnalyticalObservation(reviewedInput());
    assert(result.review.outcome === null && result.review.completedAt === null, "Verification inferred review outcome.");
  }],
  ["review-does-not-rewrite-statement", () => {
    const text = "Original analytical statement.";
    const result = createAnalyticalObservation(baseInput({ statement: { text }, review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: ANALYTICAL_REVIEW_OUTCOMES.REVISION_REQUESTED, requestedChanges: ["Clarify scope"] } }));
    assert(result.statement.text === text, "Review rewrote statement.");
  }],
  ["disclosed-conflict-missing-details-warning", () => {
    const result = createAnalyticalObservation(baseInput({ evaluator: { evaluatorRef: "evaluator-001", declaredConflicts: { disclosed: true } } }));
    assert(result.validation.valid && hasCode(result.validation, "DISCLOSED_CONFLICT_DETAILS_MISSING", "warnings"), "Conflict warning failed.");
  }],
  ["conflict-not-inferred-from-organization", () => {
    const result = createAnalyticalObservation(baseInput({ evaluator: { evaluatorRef: "evaluator-001", organizationRef: "organization-001" } }));
    assert(result.evaluator.declaredConflicts.disclosed === null && result.evaluator.declaredConflicts.organizationRefs.length === 0, "Conflict inferred.");
  }],
  ["shared-recorded-observation-across-analyses", () => {
    const first = createAnalyticalObservation(baseInput({ analysisId: "analysis-001" }));
    const second = createAnalyticalObservation(baseInput({ analysisId: "analysis-002" }));
    assert(first.validation.valid && second.validation.valid && first.recordedObservationRefs[0] === second.recordedObservationRefs[0], "Shared observation reference failed.");
  }],
  ["multiple-observations-support-analysis", () => {
    const result = createAnalyticalObservation(baseInput({ recordedObservationRefs: ["observation-001", "observation-002", "observation-003"], scope: ANALYTICAL_OBSERVATION_SCOPES.MULTIPLE_OBSERVATIONS }));
    assert(result.validation.valid && result.recordedObservationRefs.length === 3, "Multiple observation basis failed.");
  }],
  ["conflicts-preserved-unresolved", () => {
    const result = createAnalyticalObservation(baseInput({ relationships: [relationship(ANALYTICAL_RELATIONSHIP_TYPES.SUPPORTS), relationship(ANALYTICAL_RELATIONSHIP_TYPES.CONTRADICTS)] }));
    assert(result.validation.valid && result.relationships.length === 2 && isConflictingAnalyticalObservation(result), "Conflicts were resolved or lost.");
  }],
  ["no-evaluation-or-evidence-fields", () => {
    const keys = keysDeep(createAnalyticalObservation(baseInput()));
    const forbidden = ["evidenceRole", "evidenceStrength", "trait", "traits", "component", "components", "score", "grade", "projection", "recommendation", "ranking", "conclusion", "intelligence"];
    assert(forbidden.every((key) => !keys.has(key)), "Evaluation or evidence field exists.");
  }],
  ["dates-not-invented", () => {
    const result = createAnalyticalObservation(baseInput({ provenance: {}, verification: { state: ANALYTICAL_VERIFICATION_STATES.UNVERIFIED } }));
    assert(result.provenance.createdAt === null && result.verification.reviewedAt === null && result.review.completedAt === null && result.validation.checkedAt === null, "Date invented.");
  }],
  ["sources-not-inferred", () => {
    const result = createAnalyticalObservation(baseInput({ sourceRefs: [] }));
    assert(result.sourceRefs.length === 0, "Source inferred.");
  }],
  ["observations-not-inferred", () => {
    const result = createAnalyticalObservation(baseInput({ recordedObservationRefs: [], sourceRefs: ["source-001"] }));
    assert(result.recordedObservationRefs.length === 0, "Observation inferred.");
  }],
  ["evaluators-not-inferred", () => {
    const result = createAnalyticalObservation(baseInput({ evaluator: {} }));
    assert(result.evaluator.evaluatorRef === null && result.evaluator.evaluatorLabel === null && hasCode(result.validation, "EVALUATOR_REQUIRED"), "Evaluator inferred.");
  }],
  ["confidence-not-inferred", () => {
    const result = createAnalyticalObservation(baseInput({ confidence: {} }));
    assert(result.confidence.level === null && hasCode(result.validation, "MISSING_REQUIRED_FIELD"), "Confidence inferred.");
  }],
  ["verification-not-inferred", () => {
    const result = createAnalyticalObservation(baseInput({ verification: {} }));
    assert(result.verification.state === null && hasCode(result.validation, "MISSING_REQUIRED_FIELD"), "Verification inferred.");
  }],
  ["relationships-not-inferred", () => {
    const result = createAnalyticalObservation(baseInput({ relatedAnalysisRefs: ["analysis-002"], relationships: [] }));
    assert(result.relationships.length === 0, "Relationship inferred.");
  }],
  ["factory-input-immutability", () => {
    const input = reviewedInput();
    const before = JSON.stringify(input);
    createAnalyticalObservation(input);
    assert(JSON.stringify(input) === before, "Factory mutated input.");
  }],
  ["validator-input-immutability", () => {
    const input = reviewedInput();
    const before = JSON.stringify(input);
    validateAnalyticalObservation(input);
    assert(JSON.stringify(input) === before, "Validator mutated input.");
  }],
  ["stable-repeated-normalization", () => {
    same(createAnalyticalObservation(reviewedInput()), createAnalyticalObservation(reviewedInput()), "Repeated normalization unstable.");
  }],
  ["type-guards", () => {
    const reviewed = createAnalyticalObservation(reviewedInput());
    const rejected = createAnalyticalObservation(baseInput({ verification: { state: ANALYTICAL_VERIFICATION_STATES.REJECTED, reviewedBy: "reviewer-001", reviewedAt: "2026-01-02" } }));
    const conflicting = createAnalyticalObservation(baseInput({ relationships: [relationship(ANALYTICAL_RELATIONSHIP_TYPES.CONTRADICTS)] }));
    assert(isAnalyticalObservation(reviewed) && isReviewedAnalyticalObservation(reviewed), "Reviewed guards failed.");
    assert(isRejectedAnalyticalObservation(rejected) && isConflictingAnalyticalObservation(conflicting) && !isAnalyticalObservation({}), "Other guards failed.");
  }],
  ["unavailable-analysis-factory", () => {
    const result = createUnavailableAnalyticalObservation({ analysisId: "missing-001", sessionRef: "session-001", title: "Unavailable", statement: { text: "Original analytical statement." }, evaluator: { evaluatorRef: "evaluator-001" }, reason: "Not found." });
    assert(isAnalyticalObservation(result) && !result.validation.valid && result.analysisId === "missing-001" && result.sessionRef === "session-001", "Unavailable shape failed.");
    assert(result.title === "Unavailable" && result.statement.text === "Original analytical statement." && result.evaluator.evaluatorRef === "evaluator-001" && result.metadata.notes === "Not found.", "Unavailable values lost.");
    assert(result.confidence.level === null && result.verification.state === null && result.relationships.length === 0 && hasCode(result.validation, "ANALYTICAL_OBSERVATION_UNAVAILABLE"), "Unavailable fields invented.");
  }],
  ["research-source-exports-intact", () => {
    assert(["createResearchSource", "validateResearchSource", "isResearchSource"].every((name) => typeof researchRepository[name] === "function"), "Source exports regressed.");
  }],
  ["research-session-exports-intact", () => {
    assert(["createResearchSession", "validateResearchSession", "isResearchSession"].every((name) => typeof researchRepository[name] === "function"), "Session exports regressed.");
  }],
  ["recorded-observation-exports-intact", () => {
    assert(["createRecordedObservation", "validateRecordedObservation", "isRecordedObservation"].every((name) => typeof researchRepository[name] === "function"), "Recorded exports regressed.");
  }],
  ["analytical-observation-export-surface", () => {
    const names = ["createAnalyticalObservation", "createUnavailableAnalyticalObservation", "validateAnalyticalObservation", "isAnalyticalObservation", "isReviewedAnalyticalObservation", "isRejectedAnalyticalObservation", "isConflictingAnalyticalObservation"];
    assert(names.every((name) => typeof researchRepository[name] === "function"), "Analytical API incomplete.");
    assert(Object.isFrozen(ANALYTICAL_OBSERVATION_TYPES) && Object.isFrozen(ANALYTICAL_OBSERVATION_SCOPES) && Object.isFrozen(ANALYTICAL_CONFIDENCE_LEVELS) && Object.isFrozen(ANALYTICAL_VERIFICATION_STATES) && Object.isFrozen(ANALYTICAL_RELATIONSHIP_TYPES) && Object.isFrozen(ANALYTICAL_REVIEW_OUTCOMES) && Object.isFrozen(ANALYTICAL_BASIS_TYPES), "Analytical constants not frozen.");
  }],
  ["diagnostic-runners-excluded", () => {
    assert(Object.keys(researchRepository).every((key) => !key.toLowerCase().includes("diagnostic")), "Diagnostic runner exported.");
  }],
];

export function runAnalyticalObservationContractDiagnostics({ throwOnFailure = false } = {}) {
  const cases = CASES.map(([id, execute]) => {
    try {
      execute();
      return { id, passed: true, message: `${id} passed.`, details: null };
    } catch (error) {
      return { id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null };
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: ANALYTICAL_OBSERVATION_CONTRACT_VERSION,
    schemaVersion: ANALYTICAL_OBSERVATION_SCHEMA_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
  };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runAnalyticalObservationContractDiagnostics });
