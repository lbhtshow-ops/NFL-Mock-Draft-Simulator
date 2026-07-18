import researchRepository, {
  RESEARCH_ROLES,
  RESEARCH_SOURCE_ACCESS_TYPES,
  RESEARCH_SOURCE_CLASSES,
  RESEARCH_SOURCE_CONTRACT_VERSION,
  RESEARCH_SOURCE_SCHEMA_VERSION,
  RESEARCH_SOURCE_STATUSES,
  RESEARCH_VERIFICATION_REQUIREMENTS,
  createResearchSource,
  createUnavailableResearchSource,
  isApprovedResearchSource,
  isResearchSource,
  validateResearchSource,
} from "../index.js";

const SUITE = "ResearchSourceContractDiagnostics";

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function same(actual, expected, message) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    message,
    { actual, expected }
  );
}

function hasCode(validation, code, field = "errors") {
  return (validation?.[field] || []).some(
    (entry) => entry.code === code
  );
}

function approvedInput(overrides = {}) {
  return {
    sourceId: "source-001",
    name: "Independent Methods Archive",
    sourceClass: RESEARCH_SOURCE_CLASSES.ACADEMIC_RESEARCH,
    status: RESEARCH_SOURCE_STATUSES.APPROVED,
    description: "A documented research source.",
    domains: ["measurement", "methodology"],
    permittedRoles: [
      RESEARCH_ROLES.DIRECT_EVIDENCE,
      RESEARCH_ROLES.VALIDATION_EVIDENCE,
    ],
    prohibitedRoles: [RESEARCH_ROLES.DISCOVERY_ONLY],
    independenceGroup: "independent-archive",
    methodology: {
      available: true,
      publicDescription: "Published methods are available.",
      methodologyRef: "methods-001",
      notes: null,
    },
    access: {
      type: RESEARCH_SOURCE_ACCESS_TYPES.PUBLIC,
      location: "https://example.invalid/source",
      requiresAuthentication: false,
      notes: null,
    },
    authorityByDomain: {
      measurement: "Declared primary source",
      methodology: null,
    },
    usageRestrictions: {
      rawContentStorageAllowed: false,
      quotationAllowed: true,
      derivedFactsAllowed: true,
      redistributionAllowed: false,
      attributionRequired: true,
      licenseRef: "license-001",
      notes: null,
    },
    conflicts: {
      disclosed: true,
      subjects: [],
      organizations: [],
      notes: "No material conflicts declared.",
    },
    verificationRequirements: [
      RESEARCH_VERIFICATION_REQUIREMENTS.HUMAN_REVIEW,
    ],
    provenance: {
      createdBy: "research-admin",
      createdAt: "2026-07-14",
      updatedBy: null,
      updatedAt: null,
    },
    review: {
      lastReviewedAt: "2026-07-14",
      nextReviewAt: null,
      reviewedBy: "research-reviewer",
      notes: null,
    },
    metadata: {
      tags: ["methods", "independent"],
      notes: null,
    },
    ...overrides,
  };
}

const CASES = [
  ["fully-valid-approved-source", () => {
    const result = createResearchSource(approvedInput());
    assert(result.validation.valid && isApprovedResearchSource(result), "Approved source did not validate.");
    assert(result.validation.checkedAt === null, "Validation date was invented.");
  }],
  ["valid-incomplete-candidate-source", () => {
    const result = createResearchSource({
      sourceId: "candidate-001",
      name: "Candidate Source",
      sourceClass: RESEARCH_SOURCE_CLASSES.REPORTER,
      status: RESEARCH_SOURCE_STATUSES.CANDIDATE,
      access: { type: RESEARCH_SOURCE_ACCESS_TYPES.UNKNOWN },
    });
    assert(result.validation.valid, "Honest incomplete candidate must remain valid.");
    assert(result.review.lastReviewedAt === null && Object.keys(result.authorityByDomain).length === 0, "Candidate unknowns were not preserved.");
  }],
  ["unknown-source-class", () => {
    const result = createResearchSource(approvedInput({ sourceClass: "UNKNOWN_CLASS" }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown source class was accepted.");
  }],
  ["unknown-status", () => {
    const result = createResearchSource(approvedInput({ status: "UNKNOWN_STATUS" }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown status was accepted.");
  }],
  ["unknown-access-type", () => {
    const result = createResearchSource(approvedInput({ access: { type: "OPEN" } }));
    assert(hasCode(result.validation, "UNRECOGNIZED_ENUM_VALUE"), "Unknown access type was accepted.");
  }],
  ["invalid-role", () => {
    const result = createResearchSource(approvedInput({ permittedRoles: ["PRIMARY"] }));
    assert(hasCode(result.validation, "INVALID_RESEARCH_ROLE"), "Invalid role was accepted.");
  }],
  ["conflicting-permitted-prohibited-role", () => {
    const role = RESEARCH_ROLES.DIRECT_EVIDENCE;
    const result = createResearchSource(approvedInput({ permittedRoles: [role], prohibitedRoles: [role] }));
    assert(hasCode(result.validation, "CONFLICTING_RESEARCH_ROLE"), "Conflicting role was accepted.");
  }],
  ["duplicate-normalized-roles", () => {
    const role = RESEARCH_ROLES.DIRECT_EVIDENCE;
    const result = createResearchSource(approvedInput({ permittedRoles: [role, role] }));
    same(result.permittedRoles, [role], "Duplicate roles were not normalized.");
    assert(hasCode(result.validation, "DUPLICATE_NORMALIZED_VALUE", "warnings"), "Duplicate role warning is missing.");
  }],
  ["missing-approved-required-fields", () => {
    const result = createResearchSource({ status: RESEARCH_SOURCE_STATUSES.APPROVED, access: {} });
    assert(!result.validation.valid, "Incomplete approved source was accepted.");
    assert(hasCode(result.validation, "APPROVED_SOURCE_REQUIRES_PERMITTED_ROLE") && hasCode(result.validation, "APPROVED_SOURCE_REQUIRES_VERIFICATION"), "Approved-source requirements were not enforced.");
  }],
  ["invalid-authority-by-domain-shape", () => {
    const result = createResearchSource(approvedInput({ authorityByDomain: [] }));
    assert(hasCode(result.validation, "INVALID_AUTHORITY_BY_DOMAIN"), "Invalid authority shape was accepted.");
  }],
  ["numeric-authority-rating-rejected", () => {
    const result = createResearchSource(approvedInput({ authorityByDomain: { measurement: 95 } }));
    assert(hasCode(result.validation, "INVALID_AUTHORITY_DECLARATION"), "Numeric authority rating was accepted.");
  }],
  ["invalid-usage-restriction-booleans", () => {
    const result = createResearchSource(approvedInput({ usageRestrictions: { quotationAllowed: "yes" } }));
    assert(hasCode(result.validation, "INVALID_BOOLEAN"), "Invalid usage boolean was accepted.");
  }],
  ["invalid-conflict-structure", () => {
    const result = createResearchSource(approvedInput({ conflicts: [] }));
    assert(hasCode(result.validation, "INVALID_NESTED_STRUCTURE"), "Invalid conflicts were accepted.");
  }],
  ["invalid-verification-requirement", () => {
    const result = createResearchSource(approvedInput({ verificationRequirements: ["TRUSTED"] }));
    assert(hasCode(result.validation, "INVALID_VERIFICATION_REQUIREMENT"), "Invalid verification requirement was accepted.");
  }],
  ["invalid-provenance-structure", () => {
    const result = createResearchSource(approvedInput({ provenance: "unknown" }));
    assert(hasCode(result.validation, "INVALID_NESTED_STRUCTURE"), "Invalid provenance was accepted.");
  }],
  ["invalid-review-structure", () => {
    const result = createResearchSource(approvedInput({ review: [] }));
    assert(hasCode(result.validation, "INVALID_NESTED_STRUCTURE"), "Invalid review was accepted.");
  }],
  ["factory-input-immutability", () => {
    const input = approvedInput();
    const before = JSON.stringify(input);
    createResearchSource(input);
    assert(JSON.stringify(input) === before, "Factory mutated input.");
  }],
  ["validator-input-immutability", () => {
    const input = approvedInput();
    const before = JSON.stringify(input);
    validateResearchSource(input);
    assert(JSON.stringify(input) === before, "Validator mutated input.");
  }],
  ["stable-repeated-normalization", () => {
    same(createResearchSource(approvedInput()), createResearchSource(approvedInput()), "Repeated normalization is unstable.");
  }],
  ["type-guards", () => {
    const approved = createResearchSource(approvedInput());
    const candidate = createResearchSource(approvedInput({ status: RESEARCH_SOURCE_STATUSES.CANDIDATE }));
    assert(isResearchSource(approved) && isApprovedResearchSource(approved), "Approved guards failed.");
    assert(isResearchSource(candidate) && !isApprovedResearchSource(candidate) && !isResearchSource({}), "Type guards failed.");
  }],
  ["unavailable-source-factory", () => {
    const result = createUnavailableResearchSource({ sourceId: "missing-001" });
    assert(isResearchSource(result) && !result.validation.valid, "Unavailable result shape is invalid.");
    assert(hasCode(result.validation, "RESEARCH_SOURCE_UNAVAILABLE"), "Unavailable error is missing.");
  }],
  ["explicit-null-preservation", () => {
    const result = createResearchSource(approvedInput({ description: null, independenceGroup: null, authorityByDomain: { measurement: null } }));
    assert(result.description === null && result.independenceGroup === null && result.authorityByDomain.measurement === null, "Explicit null values were not preserved.");
  }],
  ["export-surface", () => {
    const names = ["createResearchSource", "createUnavailableResearchSource", "validateResearchSource", "isResearchSource", "isApprovedResearchSource"];
    assert(names.every((name) => typeof researchRepository[name] === "function"), "Default API is incomplete.");
    assert(Object.isFrozen(RESEARCH_SOURCE_CLASSES) && Object.isFrozen(RESEARCH_SOURCE_STATUSES) && Object.isFrozen(RESEARCH_SOURCE_ACCESS_TYPES) && Object.isFrozen(RESEARCH_ROLES) && Object.isFrozen(RESEARCH_VERIFICATION_REQUIREMENTS), "Constants are not frozen.");
  }],
];

export function runResearchSourceContractDiagnostics({
  throwOnFailure = false,
} = {}) {
  const cases = CASES.map(([id, execute]) => {
    try {
      execute();
      return {
        id,
        passed: true,
        message: `${id} passed.`,
        details: null,
      };
    } catch (error) {
      return {
        id,
        passed: false,
        message:
          typeof error?.message === "string"
            ? error.message
            : `${id} failed.`,
        details: error?.details ?? null,
      };
    }
  });
  const passed = cases.filter((entry) => entry.passed).length;
  const failed = cases.length - passed;
  const summary = {
    suite: SUITE,
    contractVersion: RESEARCH_SOURCE_CONTRACT_VERSION,
    schemaVersion: RESEARCH_SOURCE_SCHEMA_VERSION,
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

export default Object.freeze({
  runResearchSourceContractDiagnostics,
});
