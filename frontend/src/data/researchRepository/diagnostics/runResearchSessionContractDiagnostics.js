import researchRepository, {
  RESEARCH_SESSION_CONTRACT_VERSION,
  RESEARCH_SESSION_REVIEW_TYPES,
  RESEARCH_SESSION_SCHEMA_VERSION,
  RESEARCH_SESSION_SCOPE_STATES,
  RESEARCH_SESSION_STATUSES,
  RESEARCH_SESSION_SUBJECT_TYPES,
  RESEARCH_SESSION_TYPES,
  RESEARCH_SESSION_VERIFICATION_STATES,
  RESEARCH_SOURCE_CLASSES,
  createResearchSession,
  createUnavailableResearchSession,
  isCompletedResearchSession,
  isResearchSession,
  isVerifiedResearchSession,
  validateResearchSession,
} from "../index.js";

const SUITE = "ResearchSessionContractDiagnostics";

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

function completedInput(overrides = {}) {
  return {
    sessionId: "session-001",
    title: "Bounded comparative review",
    description: "A documented research session.",
    sessionType: RESEARCH_SESSION_TYPES.COMPARATIVE_REVIEW,
    status: RESEARCH_SESSION_STATUSES.COMPLETED,
    subjects: [{
      subjectRef: "subject-001",
      subjectType: RESEARCH_SESSION_SUBJECT_TYPES.CONCEPT,
      label: "Primary subject",
      notes: null,
    }],
    scope: {
      state: RESEARCH_SESSION_SCOPE_STATES.DEFINED,
      objectives: ["Review declared evidence"],
      inclusionCriteria: ["Documented material"],
      exclusionCriteria: [],
      dateRange: { start: "2025-01-01", end: "2025-12-31" },
      sourceClasses: [RESEARCH_SOURCE_CLASSES.ACADEMIC_RESEARCH],
      domains: ["methodology"],
      limitations: [],
      notes: null,
    },
    researchers: [{
      researcherRef: "researcher-001",
      role: "lead",
      startedAt: "2026-01-01",
      endedAt: "2026-01-03",
      notes: null,
    }],
    sourceRefs: ["source-001"],
    researchPlan: {
      methodology: "Comparative review",
      plannedSourceRefs: ["source-001"],
      plannedActivities: ["Review source"],
      samplingStrategy: null,
      verificationPlan: "Independent review",
      notes: null,
    },
    execution: {
      startedAt: "2026-01-01",
      completedAt: "2026-01-03",
      activitiesCompleted: ["Review source"],
      deviations: [],
      notes: null,
    },
    artifactRefs: {
      recordedObservationRefs: ["observation-001"],
      analyticalObservationRefs: [],
      evidenceArtifactRefs: ["evidence-001"],
      otherArtifactRefs: [],
    },
    verification: {
      state: RESEARCH_SESSION_VERIFICATION_STATES.VERIFIED,
      verifiedBy: "reviewer-001",
      verifiedAt: "2026-01-04",
      limitations: [],
      notes: null,
    },
    review: {
      required: true,
      reviewTypes: [RESEARCH_SESSION_REVIEW_TYPES.INDEPENDENT_REVIEW],
      reviewerRefs: ["reviewer-001"],
      completedAt: "2026-01-04",
      outcome: "Accepted",
      notes: null,
    },
    provenance: {
      createdBy: "researcher-001",
      createdAt: "2025-12-30",
      updatedBy: "reviewer-001",
      updatedAt: "2026-01-04",
    },
    metadata: { tags: ["comparison"], externalRefs: [], notes: null },
    ...overrides,
  };
}

function plannedInput(overrides = {}) {
  return {
    sessionId: "session-planned",
    title: "Planned source review",
    sessionType: RESEARCH_SESSION_TYPES.SOURCE_REVIEW,
    status: RESEARCH_SESSION_STATUSES.PLANNED,
    scope: { state: RESEARCH_SESSION_SCOPE_STATES.PARTIAL },
    verification: { state: RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED },
    review: { required: false, reviewTypes: [] },
    ...overrides,
  };
}

const CASES = [
  ["fully-valid-completed-verified-session", () => {
    const result = createResearchSession(completedInput());
    assert(result.validation.valid && isCompletedResearchSession(result) && isVerifiedResearchSession(result), "Completed verified session failed.");
  }],
  ["valid-minimal-planned-session", () => {
    const result = createResearchSession(plannedInput());
    assert(result.validation.valid && result.execution.startedAt === null, "Minimal planned session failed.");
  }],
  ["valid-in-progress-session", () => {
    const result = createResearchSession(plannedInput({
      status: RESEARCH_SESSION_STATUSES.IN_PROGRESS,
      researchers: [{ researcherRef: "researcher-001" }],
      execution: { startedAt: "2026-02-01" },
    }));
    assert(result.validation.valid, "Valid in-progress session failed.");
  }],
  ["valid-paused-session", () => {
    const result = createResearchSession(plannedInput({
      status: RESEARCH_SESSION_STATUSES.PAUSED,
      researchers: [{ researcherRef: "researcher-001" }],
      execution: { startedAt: "2026-02-01" },
    }));
    assert(result.validation.valid, "Valid paused session failed.");
  }],
  ["valid-cancelled-session", () => {
    const result = createResearchSession(plannedInput({
      status: RESEARCH_SESSION_STATUSES.CANCELLED,
      execution: { notes: "Scope withdrawn." },
    }));
    assert(result.validation.valid, "Valid cancelled session failed.");
  }],
  ["valid-archived-session", () => {
    const result = createResearchSession(plannedInput({
      status: RESEARCH_SESSION_STATUSES.ARCHIVED,
      provenance: { updatedAt: "2026-02-01" },
    }));
    assert(result.validation.valid, "Valid archived session failed.");
  }],
  ["unknown-session-type", () => {
    assert(hasCode(createResearchSession(plannedInput({ sessionType: "UNKNOWN" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown session type was accepted.");
  }],
  ["unknown-status", () => {
    assert(hasCode(createResearchSession(plannedInput({ status: "UNKNOWN" })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown status was accepted.");
  }],
  ["unknown-subject-type", () => {
    const result = createResearchSession(plannedInput({ subjects: [{ subjectRef: "subject-001", subjectType: "UNKNOWN_KIND" }] }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown subject type was accepted.");
  }],
  ["unknown-scope-state", () => {
    assert(hasCode(createResearchSession(plannedInput({ scope: { state: "UNKNOWN" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown scope state was accepted.");
  }],
  ["unknown-verification-state", () => {
    assert(hasCode(createResearchSession(plannedInput({ verification: { state: "UNKNOWN" } })).validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown verification state was accepted.");
  }],
  ["unknown-review-type", () => {
    const result = createResearchSession(plannedInput({ review: { required: true, reviewTypes: ["UNKNOWN"] } }));
    assert(hasCode(result.validation, "INVALID_REVIEW_TYPE"), "Unknown review type was accepted.");
  }],
  ["none-combined-with-review-type", () => {
    const result = createResearchSession(plannedInput({ review: { required: false, reviewTypes: [RESEARCH_SESSION_REVIEW_TYPES.NONE, RESEARCH_SESSION_REVIEW_TYPES.PEER_REVIEW] } }));
    assert(hasCode(result.validation, "CONFLICTING_REVIEW_TYPES"), "Conflicting NONE review was accepted.");
  }],
  ["required-review-missing-valid-type", () => {
    const result = createResearchSession(plannedInput({ review: { required: true, reviewTypes: [RESEARCH_SESSION_REVIEW_TYPES.NONE] } }));
    assert(hasCode(result.validation, "REQUIRED_REVIEW_TYPE_MISSING"), "Required review without a valid type was accepted.");
  }],
  ["invalid-subject-structure", () => {
    assert(hasCode(createResearchSession(plannedInput({ subjects: ["subject-001"] })).validation, "INVALID_NESTED_STRUCTURE"), "Invalid subject was accepted.");
  }],
  ["invalid-researcher-structure", () => {
    assert(hasCode(createResearchSession(plannedInput({ researchers: ["researcher-001"] })).validation, "INVALID_NESTED_STRUCTURE"), "Invalid researcher was accepted.");
  }],
  ["invalid-source-reference", () => {
    assert(hasCode(createResearchSession(plannedInput({ sourceRefs: [""] })).validation, "INVALID_REFERENCE"), "Invalid source reference was accepted.");
  }],
  ["invalid-artifact-reference", () => {
    const result = createResearchSession(plannedInput({ artifactRefs: { evidenceArtifactRefs: [null] } }));
    assert(hasCode(result.validation, "INVALID_REFERENCE"), "Invalid artifact reference was accepted.");
  }],
  ["duplicate-normalized-reference-arrays", () => {
    const result = createResearchSession(plannedInput({ sourceRefs: ["source-001", " source-001 "] }));
    same(result.sourceRefs, ["source-001"], "Duplicate references were not normalized.");
    assert(hasCode(result.validation, "DUPLICATE_NORMALIZED_VALUE", "warnings"), "Duplicate reference warning missing.");
  }],
  ["duplicate-normalized-vocabulary-arrays", () => {
    const result = createResearchSession(plannedInput({ scope: {
      state: RESEARCH_SESSION_SCOPE_STATES.DEFINED,
      sourceClasses: [RESEARCH_SOURCE_CLASSES.OFFICIAL, RESEARCH_SOURCE_CLASSES.OFFICIAL],
      domains: ["analysis", " analysis "],
    }, metadata: { tags: ["review", "review"] }, review: {
      required: false,
      reviewTypes: [RESEARCH_SESSION_REVIEW_TYPES.NONE, RESEARCH_SESSION_REVIEW_TYPES.NONE],
    } }));
    assert(result.scope.sourceClasses.length === 1 && result.scope.domains.length === 1 && result.metadata.tags.length === 1 && result.review.reviewTypes.length === 1, "Vocabulary duplicates remain.");
  }],
  ["exact-duplicate-structured-records", () => {
    const subject = { subjectRef: "subject-001", subjectType: RESEARCH_SESSION_SUBJECT_TYPES.CONCEPT };
    const researcher = { researcherRef: "researcher-001", role: "lead" };
    const result = createResearchSession(plannedInput({ subjects: [subject, { ...subject }], researchers: [researcher, { ...researcher }] }));
    assert(result.subjects.length === 1 && result.researchers.length === 1, "Exact structured duplicates remain.");
    assert(hasCode(result.validation, "DUPLICATE_NORMALIZED_OBJECT", "warnings"), "Structured duplicate warning missing.");
  }],
  ["completed-missing-started-at", () => {
    const result = createResearchSession(completedInput({ execution: { completedAt: "2026-01-03" } }));
    assert(hasCode(result.validation, "LIFECYCLE_STARTED_AT_REQUIRED"), "Missing startedAt was accepted.");
  }],
  ["completed-missing-completed-at", () => {
    const result = createResearchSession(completedInput({ execution: { startedAt: "2026-01-01" } }));
    assert(hasCode(result.validation, "COMPLETED_AT_REQUIRED"), "Missing completedAt was accepted.");
  }],
  ["completed-missing-researcher", () => {
    assert(hasCode(createResearchSession(completedInput({ researchers: [] })).validation, "LIFECYCLE_RESEARCHER_REQUIRED"), "Missing researcher was accepted.");
  }],
  ["completed-missing-subject", () => {
    assert(hasCode(createResearchSession(completedInput({ subjects: [] })).validation, "COMPLETED_SUBJECT_REQUIRED"), "Missing subject was accepted.");
  }],
  ["completed-missing-source", () => {
    assert(hasCode(createResearchSession(completedInput({ sourceRefs: [] })).validation, "COMPLETED_SOURCE_REQUIRED"), "Missing source was accepted.");
  }],
  ["completed-without-artifacts-warning", () => {
    const result = createResearchSession(completedInput({ artifactRefs: {} }));
    assert(result.validation.valid && hasCode(result.validation, "COMPLETED_WITHOUT_ARTIFACTS", "warnings"), "No-artifact warning behavior failed.");
  }],
  ["in-progress-missing-started-at", () => {
    const result = createResearchSession(plannedInput({ status: RESEARCH_SESSION_STATUSES.IN_PROGRESS, researchers: [{ researcherRef: "researcher-001" }] }));
    assert(hasCode(result.validation, "LIFECYCLE_STARTED_AT_REQUIRED"), "In-progress startedAt was not enforced.");
  }],
  ["in-progress-missing-researcher", () => {
    const result = createResearchSession(plannedInput({ status: RESEARCH_SESSION_STATUSES.IN_PROGRESS, execution: { startedAt: "2026-01-01" } }));
    assert(hasCode(result.validation, "LIFECYCLE_RESEARCHER_REQUIRED"), "In-progress researcher was not enforced.");
  }],
  ["paused-missing-lifecycle-requirements", () => {
    const result = createResearchSession(plannedInput({ status: RESEARCH_SESSION_STATUSES.PAUSED }));
    assert(hasCode(result.validation, "LIFECYCLE_STARTED_AT_REQUIRED") && hasCode(result.validation, "LIFECYCLE_RESEARCHER_REQUIRED"), "Paused requirements were not enforced.");
  }],
  ["invalid-scope-date-order", () => {
    const result = createResearchSession(plannedInput({ scope: { state: RESEARCH_SESSION_SCOPE_STATES.DEFINED, dateRange: { start: "2026-02-02", end: "2026-01-01" } } }));
    assert(hasCode(result.validation, "INVALID_DATE_ORDER"), "Scope date order was accepted.");
  }],
  ["invalid-execution-date-order", () => {
    const result = createResearchSession(plannedInput({ execution: { startedAt: "2026-02-02", completedAt: "2026-01-01" } }));
    assert(hasCode(result.validation, "INVALID_DATE_ORDER"), "Execution date order was accepted.");
  }],
  ["invalid-researcher-date-order", () => {
    const result = createResearchSession(plannedInput({ researchers: [{ researcherRef: "researcher-001", startedAt: "2026-02-02", endedAt: "2026-01-01" }] }));
    assert(hasCode(result.validation, "INVALID_DATE_ORDER"), "Researcher date order was accepted.");
  }],
  ["review-completed-without-reviewers-warning", () => {
    const result = createResearchSession(plannedInput({ review: { required: false, reviewTypes: [RESEARCH_SESSION_REVIEW_TYPES.SELF_REVIEW], completedAt: "2026-01-01" } }));
    assert(result.validation.valid && hasCode(result.validation, "REVIEW_COMPLETED_WITHOUT_REVIEWER", "warnings"), "Review warning behavior failed.");
  }],
  ["review-does-not-imply-verification", () => {
    const result = createResearchSession(plannedInput({ review: {
      required: true,
      reviewTypes: [RESEARCH_SESSION_REVIEW_TYPES.PEER_REVIEW],
      reviewerRefs: ["reviewer-001"],
      completedAt: "2026-01-01",
      outcome: "Accepted",
    } }));
    assert(result.verification.state === RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED && !isVerifiedResearchSession(result), "Review inferred verification.");
  }],
  ["completed-does-not-imply-verification", () => {
    const result = createResearchSession(completedInput({ verification: { state: RESEARCH_SESSION_VERIFICATION_STATES.NOT_STARTED } }));
    assert(result.validation.valid && isCompletedResearchSession(result) && !isVerifiedResearchSession(result), "Completion inferred verification.");
  }],
  ["timestamps-are-not-invented", () => {
    const result = createResearchSession(plannedInput());
    assert(result.execution.startedAt === null && result.provenance.createdAt === null && result.validation.checkedAt === null, "A timestamp was invented.");
  }],
  ["sources-not-inferred-from-plan", () => {
    const result = createResearchSession(plannedInput({ researchPlan: { plannedSourceRefs: ["source-planned"] } }));
    assert(result.sourceRefs.length === 0 && result.researchPlan.plannedSourceRefs[0] === "source-planned", "Planned source was promoted.");
  }],
  ["artifact-references-not-inferred", () => {
    const result = createResearchSession(plannedInput({ sourceRefs: ["source-001"] }));
    assert(Object.values(result.artifactRefs).every((refs) => refs.length === 0), "Artifact references were invented.");
  }],
  ["factory-input-immutability", () => {
    const input = completedInput();
    const before = JSON.stringify(input);
    createResearchSession(input);
    assert(JSON.stringify(input) === before, "Factory mutated input.");
  }],
  ["validator-input-immutability", () => {
    const input = completedInput();
    const before = JSON.stringify(input);
    validateResearchSession(input);
    assert(JSON.stringify(input) === before, "Validator mutated input.");
  }],
  ["stable-repeated-normalization", () => {
    same(createResearchSession(completedInput()), createResearchSession(completedInput()), "Repeated normalization is unstable.");
  }],
  ["type-guards", () => {
    const completed = createResearchSession(completedInput());
    const planned = createResearchSession(plannedInput());
    assert(isResearchSession(completed) && isCompletedResearchSession(completed) && isVerifiedResearchSession(completed), "Completed guards failed.");
    assert(isResearchSession(planned) && !isCompletedResearchSession(planned) && !isVerifiedResearchSession(planned) && !isResearchSession({}), "General guards failed.");
  }],
  ["unavailable-session-factory", () => {
    const result = createUnavailableResearchSession({ sessionId: "missing-001", title: "Unavailable session", reason: "Record not found." });
    assert(isResearchSession(result) && !result.validation.valid, "Unavailable shape failed.");
    assert(result.sessionId === "missing-001" && result.title === "Unavailable session" && result.metadata.notes === "Record not found.", "Unavailable supplied values were not preserved.");
    assert(result.status === null && hasCode(result.validation, "RESEARCH_SESSION_UNAVAILABLE"), "Unavailable lifecycle or validation is incorrect.");
  }],
  ["research-source-exports-remain-intact", () => {
    const names = ["createResearchSource", "createUnavailableResearchSource", "validateResearchSource", "isResearchSource", "isApprovedResearchSource"];
    assert(names.every((name) => typeof researchRepository[name] === "function") && Object.isFrozen(researchRepository.RESEARCH_SOURCE_CLASSES), "Research Source API regressed.");
  }],
  ["research-session-export-surface", () => {
    const names = ["createResearchSession", "createUnavailableResearchSession", "validateResearchSession", "isResearchSession", "isCompletedResearchSession", "isVerifiedResearchSession"];
    assert(names.every((name) => typeof researchRepository[name] === "function"), "Research Session API is incomplete.");
    assert(Object.isFrozen(RESEARCH_SESSION_STATUSES) && Object.isFrozen(RESEARCH_SESSION_TYPES) && Object.isFrozen(RESEARCH_SESSION_VERIFICATION_STATES) && Object.isFrozen(RESEARCH_SESSION_REVIEW_TYPES) && Object.isFrozen(RESEARCH_SESSION_SUBJECT_TYPES) && Object.isFrozen(RESEARCH_SESSION_SCOPE_STATES), "Session constants are not frozen.");
  }],
  ["diagnostic-runners-excluded-from-production-index", () => {
    const keys = Object.keys(researchRepository);
    assert(!keys.includes("runResearchSourceContractDiagnostics") && !keys.includes("runResearchSessionContractDiagnostics"), "A diagnostic runner entered production exports.");
  }],
];

export function runResearchSessionContractDiagnostics({ throwOnFailure = false } = {}) {
  const cases = CASES.map(([id, execute]) => {
    try {
      execute();
      return { id, passed: true, message: `${id} passed.`, details: null };
    } catch (error) {
      return {
        id,
        passed: false,
        message: typeof error?.message === "string" ? error.message : `${id} failed.`,
        details: error?.details ?? null,
      };
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: RESEARCH_SESSION_CONTRACT_VERSION,
    schemaVersion: RESEARCH_SESSION_SCHEMA_VERSION,
    total: cases.length,
    passed,
    failed,
    cases,
  };
  if (throwOnFailure && failed > 0) {
    throw new Error(`${SUITE} failed ${failed} of ${cases.length} cases.`);
  }
  return summary;
}

export default Object.freeze({ runResearchSessionContractDiagnostics });
