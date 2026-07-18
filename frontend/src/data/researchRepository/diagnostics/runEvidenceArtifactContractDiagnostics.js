import researchRepository, {
  EVIDENCE_APPLICABILITY_STATES,
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
  createEvidenceArtifact,
  createUnavailableEvidenceArtifact,
  isActiveEvidenceArtifact,
  isConflictingEvidenceArtifact,
  isDirectEvidenceArtifact,
  isEvidenceArtifact,
  isSupersededEvidenceArtifact,
  isVerifiedEvidenceArtifact,
  validateEvidenceArtifact,
} from "../index.js";

const SUITE = "EvidenceArtifactContractDiagnostics";

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

function classification(role = EVIDENCE_ROLES.SUPPORTING, overrides = {}) {
  return {
    domains: ["research"], categories: ["documented"], role,
    direction: EVIDENCE_DIRECTIONS.POSITIVE, strength: EVIDENCE_STRENGTHS.MODERATE,
    applicability: EVIDENCE_APPLICABILITY_STATES.APPLICABLE, tags: ["evidence"], notes: null,
    ...overrides,
  };
}

function basis(ref = "source-001", type = EVIDENCE_BASIS_TYPES.RESEARCH_SOURCE, overrides = {}) {
  return { basisType: type, ref, description: null, contribution: "Provides documented support.", notes: null, ...overrides };
}

function target(ref = "concept-001", type = EVIDENCE_TARGET_TYPES.CONCEPT) {
  return { targetType: type, targetRef: ref, label: null, relationship: "May inform later use.", notes: null };
}

function baseInput(overrides = {}) {
  return {
    evidenceId: "evidence-001", sessionRef: null, sourceRefs: ["source-001"],
    recordedObservationRefs: [], analyticalObservationRefs: [], relatedEvidenceRefs: [],
    state: EVIDENCE_ARTIFACT_STATES.DRAFT, title: "Structured evidence", summary: "Documented research supports the artifact.",
    classification: classification(), basis: [], targets: [],
    assessment: { rationale: "The referenced material supports this classification.", limitations: [], assumptions: [], sourceAgreement: null, independenceNotes: null, applicabilityRationale: null, notes: null },
    conflicts: { state: EVIDENCE_CONFLICT_STATES.NONE, conflictingEvidenceRefs: [], conflictingAnalysisRefs: [] },
    verification: { state: EVIDENCE_VERIFICATION_STATES.UNVERIFIED, limitations: [] },
    review: { required: false, reviewerRefs: [], requestedChanges: [] },
    provenance: { createdBy: "researcher-001", createdAt: "2026-01-01" },
    metadata: { tags: ["evidence"], externalRefs: [], relatedSubjectRefs: [], notes: null },
    ...overrides,
  };
}

function verifiedDirect(overrides = {}) {
  return baseInput({
    state: EVIDENCE_ARTIFACT_STATES.ACTIVE,
    classification: classification(EVIDENCE_ROLES.DIRECT, { strength: EVIDENCE_STRENGTHS.STRONG }),
    targets: [target()],
    verification: { state: EVIDENCE_VERIFICATION_STATES.VERIFIED, verifiedBy: "reviewer-001", verifiedAt: "2026-01-02", method: "Reference review", limitations: [] },
    ...overrides,
  });
}

function keysDeep(value, keys = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => keysDeep(entry, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => { keys.add(key); keysDeep(entry, keys); });
  return keys;
}

const CASES = [
  ["valid-verified-active-direct", () => { const r = createEvidenceArtifact(verifiedDirect()); assert(r.validation.valid && isActiveEvidenceArtifact(r) && isVerifiedEvidenceArtifact(r) && isDirectEvidenceArtifact(r), "Verified direct failed."); }],
  ["valid-supporting", () => assert(createEvidenceArtifact(baseInput()).validation.valid, "Supporting failed.")],
  ["valid-contextual", () => assert(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.CONTEXTUAL) })).validation.valid, "Contextual failed.")],
  ["valid-validation", () => assert(createEvidenceArtifact(baseInput({ sourceRefs: [], recordedObservationRefs: ["observation-001"], classification: classification(EVIDENCE_ROLES.VALIDATION) })).validation.valid, "Validation failed.")],
  ["valid-conflict", () => { const r = createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.CONFLICT, { direction: EVIDENCE_DIRECTIONS.CONTRADICTORY }), conflicts: { state: EVIDENCE_CONFLICT_STATES.UNRESOLVED, conflictingEvidenceRefs: ["evidence-002"] } })); assert(r.validation.valid && isConflictingEvidenceArtifact(r), "Conflict failed."); }],
  ["valid-consensus-input", () => assert(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.CONSENSUS_INPUT) })).validation.valid, "Consensus input failed.")],
  ["valid-discovery-only", () => assert(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.DISCOVERY_ONLY) })).validation.valid, "Discovery failed.")],
  ["valid-exclusionary", () => assert(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.EXCLUSIONARY), assessment: { rationale: "The sample is explicitly excluded.", limitations: [], assumptions: [] } })).validation.valid, "Exclusionary failed.")],
  ["valid-other", () => assert(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.OTHER) })).validation.valid, "OTHER failed.")],
  ["valid-unknown-classifications-warning", () => { const r = createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.UNKNOWN, { direction: EVIDENCE_DIRECTIONS.UNKNOWN, strength: EVIDENCE_STRENGTHS.UNSPECIFIED, applicability: EVIDENCE_APPLICABILITY_STATES.UNKNOWN }), conflicts: { state: EVIDENCE_CONFLICT_STATES.UNKNOWN } })); assert(r.validation.valid && r.validation.warnings.length >= 4, "UNKNOWN warnings failed."); }],
  ["unknown-role", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification("BAD") })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown role accepted.")],
  ["unknown-direction", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.SUPPORTING, { direction: "BAD" }) })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown direction accepted.")],
  ["unknown-strength", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.SUPPORTING, { strength: "BAD" }) })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown strength accepted.")],
  ["unknown-state", () => assert(hasCode(createEvidenceArtifact(baseInput({ state: "BAD" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown state accepted.")],
  ["unknown-applicability", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.SUPPORTING, { applicability: "BAD" }) })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown applicability accepted.")],
  ["unknown-verification-state", () => assert(hasCode(createEvidenceArtifact(baseInput({ verification: { state: "BAD" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown verification accepted.")],
  ["unknown-conflict-state", () => assert(hasCode(createEvidenceArtifact(baseInput({ conflicts: { state: "BAD" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown conflict state accepted.")],
  ["unknown-basis-type", () => assert(hasCode(createEvidenceArtifact(baseInput({ basis: [{ basisType: "BAD", description: "Material" }] })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown basis type accepted.")],
  ["unknown-target-type", () => assert(hasCode(createEvidenceArtifact(baseInput({ targets: [{ targetType: "BAD", label: "External target" }] })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown target accepted.")],
  ["unknown-review-outcome", () => assert(hasCode(createEvidenceArtifact(baseInput({ review: { required: false, outcome: "BAD" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown review accepted.")],
  ["missing-evidence-id", () => assert(hasCode(createEvidenceArtifact(baseInput({ evidenceId: null })).validation, "MISSING_REQUIRED_REFERENCE"), "Missing ID accepted.")],
  ["missing-summary-and-rationale", () => assert(hasCode(createEvidenceArtifact(baseInput({ summary: null, assessment: {} })).validation, "EVIDENCE_DESCRIPTION_REQUIRED"), "Missing description accepted.")],
  ["missing-analytical-basis", () => assert(hasCode(createEvidenceArtifact(baseInput({ sourceRefs: [], recordedObservationRefs: [], analyticalObservationRefs: [], sessionRef: null, basis: [] })).validation, "EVIDENCE_BASIS_REQUIRED"), "Missing basis accepted.")],
  ["invalid-source-reference", () => assert(hasCode(createEvidenceArtifact(baseInput({ sourceRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid source accepted.")],
  ["invalid-recorded-observation-reference", () => assert(hasCode(createEvidenceArtifact(baseInput({ recordedObservationRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid observation accepted.")],
  ["invalid-analytical-observation-reference", () => assert(hasCode(createEvidenceArtifact(baseInput({ analyticalObservationRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid analysis accepted.")],
  ["invalid-related-evidence-reference", () => assert(hasCode(createEvidenceArtifact(baseInput({ relatedEvidenceRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid evidence ref accepted.")],
  ["invalid-basis-structure", () => assert(hasCode(createEvidenceArtifact(baseInput({ basis: ["source-001"] })).validation, "INVALID_NESTED_STRUCTURE"), "Invalid basis accepted.")],
  ["basis-missing-ref-description", () => assert(hasCode(createEvidenceArtifact(baseInput({ basis: [{ basisType: EVIDENCE_BASIS_TYPES.OTHER }] })).validation, "BASIS_REFERENCE_OR_DESCRIPTION_REQUIRED"), "Empty basis accepted.")],
  ["invalid-target-structure", () => assert(hasCode(createEvidenceArtifact(baseInput({ targets: ["concept-001"] })).validation, "INVALID_NESTED_STRUCTURE"), "Invalid target accepted.")],
  ["target-missing-ref-label", () => assert(hasCode(createEvidenceArtifact(baseInput({ targets: [{ targetType: EVIDENCE_TARGET_TYPES.OTHER }] })).validation, "TARGET_REFERENCE_OR_LABEL_REQUIRED"), "Empty target accepted.")],
  ["invalid-domain", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.SUPPORTING, { domains: [5] }) })).validation, "INVALID_DOMAIN"), "Invalid domain accepted.")],
  ["invalid-category", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.SUPPORTING, { categories: [null] }) })).validation, "INVALID_CATEGORY"), "Invalid category accepted.")],
  ["duplicate-scalar-references", () => { const r = createEvidenceArtifact(baseInput({ sourceRefs: ["source-001", " source-001 "] })); same(r.sourceRefs, ["source-001"], "Reference duplicates remain."); }],
  ["duplicate-vocabulary-arrays", () => { const r = createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.SUPPORTING, { domains: ["research", "research"], categories: ["documented", " documented "], tags: ["evidence", "evidence"] }), assessment: { rationale: "Rationale", limitations: ["limited", "limited"], assumptions: ["declared", " declared "] } })); assert(r.classification.domains.length === 1 && r.classification.categories.length === 1 && r.classification.tags.length === 1 && r.assessment.limitations.length === 1 && r.assessment.assumptions.length === 1, "Vocabulary duplicates remain."); }],
  ["exact-duplicate-basis", () => { const x = basis(); const r = createEvidenceArtifact(baseInput({ basis: [x, { ...x }] })); assert(r.basis.length === 1 && hasCode(r.validation, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Basis duplicates remain."); }],
  ["exact-duplicate-target", () => { const x = target(); const r = createEvidenceArtifact(baseInput({ targets: [x, { ...x }] })); assert(r.targets.length === 1 && hasCode(r.validation, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Target duplicates remain."); }],
  ["self-related-evidence", () => assert(hasCode(createEvidenceArtifact(baseInput({ relatedEvidenceRefs: ["evidence-001"] })).validation, "SELF_REFERENCE"), "Related self-reference accepted.")],
  ["self-conflicting-evidence", () => assert(hasCode(createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.UNRESOLVED, conflictingEvidenceRefs: ["evidence-001"] } })).validation, "SELF_REFERENCE"), "Conflict self-reference accepted.")],
  ["self-supersedes", () => assert(hasCode(createEvidenceArtifact(baseInput({ provenance: { supersedesEvidenceRef: "evidence-001" } })).validation, "SELF_REFERENCE"), "Self-supersession accepted.")],
  ["self-superseded-by", () => assert(hasCode(createEvidenceArtifact(baseInput({ provenance: { supersededByEvidenceRef: "evidence-001" } })).validation, "SELF_REFERENCE"), "Self replacement accepted.")],
  ["same-supersession-references", () => assert(hasCode(createEvidenceArtifact(baseInput({ provenance: { supersedesEvidenceRef: "evidence-002", supersededByEvidenceRef: "evidence-002" } })).validation, "CONFLICTING_SUPERSESSION_REFERENCES"), "Matching supersession refs accepted.")],
  ["direct-without-target-warning", () => { const r = createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.DIRECT) })); assert(r.validation.valid && hasCode(r.validation, "DIRECT_TARGET_MISSING", "warnings"), "Direct target warning failed."); }],
  ["active-discovery-warning", () => { const r = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.ACTIVE, classification: classification(EVIDENCE_ROLES.DISCOVERY_ONLY) })); assert(r.validation.valid && hasCode(r.validation, "ACTIVE_DISCOVERY_ONLY", "warnings"), "Discovery active warning failed."); }],
  ["validation-without-validation-target", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.VALIDATION) })).validation, "VALIDATION_TARGET_REQUIRED"), "Unanchored validation accepted.")],
  ["conflict-role-without-metadata", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.CONFLICT) })).validation, "CONFLICT_METADATA_REQUIRED"), "Conflict role without metadata accepted.")],
  ["exclusionary-without-explanation", () => assert(hasCode(createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.EXCLUSIONARY), assessment: {} })).validation, "EXCLUSION_EXPLANATION_REQUIRED"), "Unexplained exclusion accepted.")],
  ["not-applicable-mismatch-warning", () => { const r = createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.CONTEXTUAL, { direction: EVIDENCE_DIRECTIONS.NOT_APPLICABLE, applicability: EVIDENCE_APPLICABILITY_STATES.APPLICABLE }) })); assert(r.validation.valid && hasCode(r.validation, "NOT_APPLICABLE_CLASSIFICATION_MISMATCH", "warnings"), "Mismatch warning failed."); }],
  ["classification-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ summary: "Direct contradictory strong text." })); assert(r.classification.role === EVIDENCE_ROLES.SUPPORTING, "Role inferred."); }],
  ["direction-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ summary: "Negative text." })); assert(r.classification.direction === EVIDENCE_DIRECTIONS.POSITIVE, "Direction inferred."); }],
  ["strength-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ summary: "Very strong text." })); assert(r.classification.strength === EVIDENCE_STRENGTHS.MODERATE, "Strength inferred."); }],
  ["applicability-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ summary: "Not applicable text." })); assert(r.classification.applicability === EVIDENCE_APPLICABILITY_STATES.APPLICABLE, "Applicability inferred."); }],
  ["basis-contribution-descriptive", () => { const r = createEvidenceArtifact(baseInput({ basis: [basis()] })); assert(r.basis[0].contribution === "Provides documented support." && typeof r.basis[0].contribution === "string", "Contribution changed."); }],
  ["numeric-weight-absent", () => prohibitedBasisField("weight")],
  ["numeric-multiplier-absent", () => prohibitedBasisField("multiplier")],
  ["score-absent", () => prohibitedBasisField("score")],
  ["grade-absent", () => prohibitedBasisField("grade")],
  ["probability-absent", () => prohibitedBasisField("probability")],
  ["percentage-absent", () => prohibitedBasisField("percentage")],
  ["trait-result-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ traitResult: 88 }))).has("traitResult"), "Trait result entered output.")],
  ["component-result-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ componentResult: 88 }))).has("componentResult"), "Component result entered output.")],
  ["evaluation-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ evaluation: {} }))).has("evaluation"), "Evaluation entered output.")],
  ["projection-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ projection: "future" }))).has("projection"), "Projection entered output.")],
  ["recommendation-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ recommendation: "use" }))).has("recommendation"), "Recommendation entered output.")],
  ["ranking-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ ranking: 1 }))).has("ranking"), "Ranking entered output.")],
  ["consensus-output-absent", () => assert(!keysDeep(createEvidenceArtifact(baseInput({ consensus: {} }))).has("consensus"), "Consensus entered output.")],
  ["conflict-none-with-references", () => assert(hasCode(createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.NONE, conflictingEvidenceRefs: ["evidence-002"] } })).validation, "CONFLICT_NONE_METADATA_MISMATCH"), "NONE conflict refs accepted.")],
  ["conflict-present-without-details", () => assert(hasCode(createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.PRESENT } })).validation, "CONFLICT_DETAILS_REQUIRED"), "Empty PRESENT accepted.")],
  ["conflict-unresolved-without-details", () => assert(hasCode(createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.UNRESOLVED } })).validation, "CONFLICT_DETAILS_REQUIRED"), "Empty UNRESOLVED accepted.")],
  ["resolved-externally-without-reference", () => assert(hasCode(createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.RESOLVED_EXTERNALLY } })).validation, "EXTERNAL_RESOLUTION_REFERENCE_REQUIRED"), "Unreferenced resolution accepted.")],
  ["conflicts-remain-unresolved", () => { const r = createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.UNRESOLVED, conflictingEvidenceRefs: ["evidence-002"] } })); assert(r.validation.valid && r.conflicts.state === EVIDENCE_CONFLICT_STATES.UNRESOLVED && r.conflicts.resolutionRef === null, "Conflict resolved."); }],
  ["direction-unchanged-by-conflicts", () => { const r = createEvidenceArtifact(baseInput({ conflicts: { state: EVIDENCE_CONFLICT_STATES.UNRESOLVED, conflictingEvidenceRefs: ["evidence-002"] } })); assert(r.classification.direction === EVIDENCE_DIRECTIONS.POSITIVE, "Conflict changed direction."); }],
  ["verified-missing-verifier", () => assert(hasCode(createEvidenceArtifact(baseInput({ verification: { state: EVIDENCE_VERIFICATION_STATES.VERIFIED, verifiedAt: "2026-01-02" } })).validation, "VERIFIER_REQUIRED"), "Verifier requirement missing.")],
  ["verified-missing-date", () => assert(hasCode(createEvidenceArtifact(baseInput({ verification: { state: EVIDENCE_VERIFICATION_STATES.VERIFIED, verifiedBy: "reviewer-001" } })).validation, "VERIFICATION_DATE_REQUIRED"), "Date requirement missing.")],
  ["verified-limitations-missing", () => assert(hasCode(createEvidenceArtifact(baseInput({ verification: { state: EVIDENCE_VERIFICATION_STATES.VERIFIED_WITH_LIMITATIONS, verifiedBy: "reviewer-001", verifiedAt: "2026-01-02" } })).validation, "VERIFICATION_LIMITATIONS_REQUIRED"), "Limitations requirement missing.")],
  ["rejected-verification-valid", () => { const r = createEvidenceArtifact(baseInput({ verification: { state: EVIDENCE_VERIFICATION_STATES.REJECTED, verifiedBy: "reviewer-001", verifiedAt: "2026-01-02" } })); assert(r.validation.valid, "Rejected verification lost."); }],
  ["required-review-pending", () => assert(createEvidenceArtifact(baseInput({ review: { required: true, reviewerRefs: [], requestedChanges: [] } })).validation.valid, "Pending review invalid.")],
  ["completed-review-missing-reviewer", () => assert(hasCode(createEvidenceArtifact(baseInput({ review: { required: true, completedAt: "2026-01-02", outcome: EVIDENCE_REVIEW_OUTCOMES.ACCEPTED } })).validation, "COMPLETED_REVIEWER_REQUIRED"), "Review reviewer requirement missing.")],
  ["completed-review-no-decision", () => assert(hasCode(createEvidenceArtifact(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: EVIDENCE_REVIEW_OUTCOMES.NO_DECISION } })).validation, "COMPLETED_REVIEW_OUTCOME_REQUIRED"), "NO_DECISION accepted.")],
  ["accepted-limitations-missing-explanation", () => assert(hasCode(createEvidenceArtifact(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: EVIDENCE_REVIEW_OUTCOMES.ACCEPTED_WITH_LIMITATIONS } })).validation, "ACCEPTED_LIMITATIONS_REQUIRED"), "Unexplained limitations accepted.")],
  ["revision-missing-changes", () => assert(hasCode(createEvidenceArtifact(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: EVIDENCE_REVIEW_OUTCOMES.REVISION_REQUESTED } })).validation, "REQUESTED_CHANGES_REQUIRED"), "Revision without changes accepted.")],
  ["review-does-not-imply-verification", () => { const r = createEvidenceArtifact(baseInput({ review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: EVIDENCE_REVIEW_OUTCOMES.ACCEPTED } })); assert(r.validation.valid && r.verification.state === EVIDENCE_VERIFICATION_STATES.UNVERIFIED, "Review implied verification."); }],
  ["verification-does-not-imply-acceptance", () => { const r = createEvidenceArtifact(verifiedDirect()); assert(r.review.outcome === null && r.review.completedAt === null, "Verification implied review."); }],
  ["review-does-not-alter-content", () => { const input = baseInput({ targets: [target()], review: { required: true, reviewerRefs: ["reviewer-001"], completedAt: "2026-01-02", outcome: EVIDENCE_REVIEW_OUTCOMES.REVISION_REQUESTED, requestedChanges: ["Clarify"] } }); const r = createEvidenceArtifact(input); assert(r.summary === input.summary && r.targets.length === 1 && r.classification.role === input.classification.role && r.conflicts.state === input.conflicts.state, "Review altered evidence."); }],
  ["active-does-not-imply-verified", () => { const r = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.ACTIVE })); assert(r.verification.state === EVIDENCE_VERIFICATION_STATES.UNVERIFIED && !isVerifiedEvidenceArtifact(r), "Active implied verification."); }],
  ["unverified-active-warning", () => { const r = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.ACTIVE })); assert(r.validation.valid && hasCode(r.validation, "ACTIVE_UNVERIFIED", "warnings"), "Active warning missing."); }],
  ["restricted-explanation-warning", () => { const r = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.RESTRICTED, assessment: { rationale: "Rationale", limitations: [] }, metadata: {} })); assert(r.validation.valid && hasCode(r.validation, "RESTRICTED_EXPLANATION_MISSING", "warnings"), "Restricted warning missing."); }],
  ["superseded-missing-replacement", () => assert(hasCode(createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.SUPERSEDED })).validation, "SUPERSEDED_BY_REFERENCE_REQUIRED"), "Replacement requirement missing.")],
  ["superseded-preserved", () => { const r = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.SUPERSEDED, provenance: { supersededByEvidenceRef: "evidence-002" } })); assert(r.validation.valid && isSupersededEvidenceArtifact(r) && r.state === EVIDENCE_ARTIFACT_STATES.SUPERSEDED, "Superseded evidence lost."); }],
  ["archived-lifecycle-requirement", () => assert(hasCode(createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.ARCHIVED, provenance: {} })).validation, "ARCHIVE_DATE_REQUIRED"), "Archive requirement missing.")],
  ["state-transitions-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.DRAFT, verification: { state: EVIDENCE_VERIFICATION_STATES.VERIFIED, verifiedBy: "reviewer-001", verifiedAt: "2026-01-02" } })); assert(r.state === EVIDENCE_ARTIFACT_STATES.DRAFT, "State inferred."); }],
  ["related-artifacts-not-updated", () => { const r = createEvidenceArtifact(baseInput({ relatedEvidenceRefs: ["evidence-002"] })); assert(r.relatedEvidenceRefs.length === 1 && r.relatedEvidenceRefs[0] === "evidence-002", "Related artifact changed."); }],
  ["sources-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ sourceRefs: [], recordedObservationRefs: ["observation-001"] })); assert(r.sourceRefs.length === 0, "Source inferred."); }],
  ["observations-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ recordedObservationRefs: [] })); assert(r.recordedObservationRefs.length === 0, "Observation inferred."); }],
  ["analyses-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ analyticalObservationRefs: [] })); assert(r.analyticalObservationRefs.length === 0, "Analysis inferred."); }],
  ["targets-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ targets: [] })); assert(r.targets.length === 0, "Target inferred."); }],
  ["roles-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ classification: { direction: EVIDENCE_DIRECTIONS.POSITIVE, strength: EVIDENCE_STRENGTHS.MODERATE, applicability: EVIDENCE_APPLICABILITY_STATES.APPLICABLE } })); assert(r.classification.role === null && hasCode(r.validation, "MISSING_REQUIRED_FIELD"), "Role inferred."); }],
  ["verification-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ verification: {} })); assert(r.verification.state === null, "Verification inferred."); }],
  ["conflicts-not-inferred", () => { const r = createEvidenceArtifact(baseInput({ conflicts: {} })); assert(r.conflicts.state === null && r.conflicts.conflictingEvidenceRefs.length === 0, "Conflict inferred."); }],
  ["dates-not-invented", () => { const r = createEvidenceArtifact(baseInput({ provenance: {}, verification: { state: EVIDENCE_VERIFICATION_STATES.UNVERIFIED } })); assert(r.provenance.createdAt === null && r.verification.verifiedAt === null && r.review.completedAt === null && r.validation.checkedAt === null, "Date inferred."); }],
  ["references-never-hydrated", () => { const r = createEvidenceArtifact(baseInput({ sourceRefs: ["source-001"], basis: [basis()] })); assert(typeof r.sourceRefs[0] === "string" && typeof r.basis[0].ref === "string", "Reference hydrated."); }],
  ["multiple-targets-preserved", () => { const r = createEvidenceArtifact(baseInput({ targets: [target("concept-001"), target("domain-001", EVIDENCE_TARGET_TYPES.DOMAIN)] })); assert(r.targets.length === 2, "Targets lost."); }],
  ["conflicting-analytical-bases-coexist", () => { const r = createEvidenceArtifact(baseInput({ analyticalObservationRefs: ["analysis-001", "analysis-002"], basis: [basis("analysis-001", EVIDENCE_BASIS_TYPES.ANALYTICAL_OBSERVATION, { contribution: "Supports." }), basis("analysis-002", EVIDENCE_BASIS_TYPES.ANALYTICAL_OBSERVATION, { contribution: "Challenges." })] })); assert(r.validation.valid && r.analyticalObservationRefs.length === 2 && r.basis.length === 2, "Conflicting bases reconciled."); }],
  ["factory-input-immutability", () => { const x = verifiedDirect(); const before = JSON.stringify(x); createEvidenceArtifact(x); assert(JSON.stringify(x) === before, "Factory mutated input."); }],
  ["validator-input-immutability", () => { const x = verifiedDirect(); const before = JSON.stringify(x); validateEvidenceArtifact(x); assert(JSON.stringify(x) === before, "Validator mutated input."); }],
  ["stable-repeated-normalization", () => same(createEvidenceArtifact(verifiedDirect()), createEvidenceArtifact(verifiedDirect()), "Normalization unstable.")],
  ["type-guards", () => { const active = createEvidenceArtifact(verifiedDirect()); const conflict = createEvidenceArtifact(baseInput({ classification: classification(EVIDENCE_ROLES.CONFLICT, { direction: EVIDENCE_DIRECTIONS.CONTRADICTORY }), conflicts: { state: EVIDENCE_CONFLICT_STATES.PRESENT, description: "Declared conflict." } })); const superseded = createEvidenceArtifact(baseInput({ state: EVIDENCE_ARTIFACT_STATES.SUPERSEDED, provenance: { supersededByEvidenceRef: "evidence-002" } })); assert(isEvidenceArtifact(active) && isActiveEvidenceArtifact(active) && isVerifiedEvidenceArtifact(active) && isDirectEvidenceArtifact(active), "Primary guards failed."); assert(isConflictingEvidenceArtifact(conflict) && isSupersededEvidenceArtifact(superseded) && !isEvidenceArtifact({}), "Other guards failed."); }],
  ["unavailable-evidence-factory", () => { const r = createUnavailableEvidenceArtifact({ evidenceId: "missing-001", sessionRef: "session-001", title: "Unavailable", summary: "No artifact was available.", assessment: { rationale: "Unavailable rationale." }, reason: "Not found." }); assert(isEvidenceArtifact(r) && !r.validation.valid && r.evidenceId === "missing-001" && r.sessionRef === "session-001", "Unavailable shape failed."); assert(r.title === "Unavailable" && r.summary === "No artifact was available." && r.assessment.rationale === "Unavailable rationale." && r.metadata.notes === "Not found.", "Unavailable values lost."); assert(r.state === null && r.classification.role === null && r.verification.state === null && r.targets.length === 0 && hasCode(r.validation, "EVIDENCE_ARTIFACT_UNAVAILABLE"), "Unavailable fields invented."); }],
  ["source-exports-intact", () => assert(["createResearchSource", "validateResearchSource", "isResearchSource"].every((x) => typeof researchRepository[x] === "function"), "Source exports regressed.")],
  ["session-exports-intact", () => assert(["createResearchSession", "validateResearchSession", "isResearchSession"].every((x) => typeof researchRepository[x] === "function"), "Session exports regressed.")],
  ["recorded-exports-intact", () => assert(["createRecordedObservation", "validateRecordedObservation", "isRecordedObservation"].every((x) => typeof researchRepository[x] === "function"), "Recorded exports regressed.")],
  ["analytical-exports-intact", () => assert(["createAnalyticalObservation", "validateAnalyticalObservation", "isAnalyticalObservation"].every((x) => typeof researchRepository[x] === "function"), "Analytical exports regressed.")],
  ["evidence-export-surface", () => { const names = ["createEvidenceArtifact", "createUnavailableEvidenceArtifact", "validateEvidenceArtifact", "isEvidenceArtifact", "isActiveEvidenceArtifact", "isVerifiedEvidenceArtifact", "isDirectEvidenceArtifact", "isConflictingEvidenceArtifact", "isSupersededEvidenceArtifact"]; assert(names.every((x) => typeof researchRepository[x] === "function"), "Evidence API incomplete."); assert([EVIDENCE_ROLES, EVIDENCE_DIRECTIONS, EVIDENCE_STRENGTHS, EVIDENCE_ARTIFACT_STATES, EVIDENCE_VERIFICATION_STATES, EVIDENCE_APPLICABILITY_STATES, EVIDENCE_CONFLICT_STATES, EVIDENCE_BASIS_TYPES, EVIDENCE_TARGET_TYPES, EVIDENCE_REVIEW_OUTCOMES].every(Object.isFrozen), "Constants not frozen."); }],
  ["diagnostic-runners-excluded", () => assert(Object.keys(researchRepository).every((x) => !x.toLowerCase().includes("diagnostic")), "Diagnostic exported.")],
];

function prohibitedBasisField(field) {
  const r = createEvidenceArtifact(baseInput({ basis: [basis("source-001", EVIDENCE_BASIS_TYPES.RESEARCH_SOURCE, { [field]: 1 })] }));
  assert(!Object.hasOwn(r.basis[0], field) && hasCode(r.validation, "PROHIBITED_NUMERIC_BASIS_FIELD"), `${field} was not rejected and omitted.`);
}

export function runEvidenceArtifactContractDiagnostics({ throwOnFailure = false } = {}) {
  const cases = CASES.map(([id, execute]) => {
    try { execute(); return { id, passed: true, message: `${id} passed.`, details: null }; }
    catch (error) { return { id, passed: false, message: typeof error?.message === "string" ? error.message : `${id} failed.`, details: error?.details ?? null }; }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = { suite: SUITE, contractVersion: EVIDENCE_ARTIFACT_CONTRACT_VERSION, schemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION, total: cases.length, passed, failed, cases };
  if (throwOnFailure && failed > 0) throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  return summary;
}

export default Object.freeze({ runEvidenceArtifactContractDiagnostics });
