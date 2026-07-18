import sourceAdapter, {
  PROSPECT_SOURCE_USABILITY_REASONS,
  readProspectIntelligenceSource,
  createProspectContributor,
} from "./ProspectModelSourceAdapter.js";
import {
  DATA_STATES,
  EVIDENCE_LEVELS,
  createIntelligenceResult,
  createUnavailableIntelligenceResult,
} from "../../../contracts/IntelligenceResultContract.js";
import {
  PROSPECT_CONTRIBUTOR_ROLES,
  createProspectComponentResult,
} from "../ProspectPositionModelContract.js";

const SUITE = "ProspectModelSourceAdapterDiagnostics";

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function assertEqual(actual, expected, message) {
  assert(Object.is(actual, expected), message, {
    expected,
    actual,
  });
}

function assertDeepEqual(actual, expected, message) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    message,
    { expected, actual }
  );
}

function assertCode(validation, code, field = "errors") {
  assert(
    (validation?.[field] ?? []).some(
      (entry) => entry.code === code
    ),
    `Expected ${field} to contain ${code}.`,
    validation
  );
}

function runCase(id, message, run) {
  try {
    run();
    return { id, passed: true, message, details: null };
  } catch (error) {
    return {
      id,
      passed: false,
      message: error?.message || `${id} failed.`,
      details: error?.details ?? null,
    };
  }
}

function scalarResult(overrides = {}) {
  return createIntelligenceResult({
    domain: "production",
    available: true,
    dataState: DATA_STATES.AVAILABLE,
    score: 84.5,
    confidence: 0.8,
    evidenceLevel: EVIDENCE_LEVELS.STRONG,
    evidence: [{ type: "PRODUCTION" }],
    missingEvidence: [],
    sources: ["profile"],
    frameworkVersion: "1.0.0",
    modelVersion: "PRODUCTION-1",
    dataVersion: "2026",
    ...overrides,
  });
}

function adaptRaw(overrides = {}, options = {}) {
  return readProspectIntelligenceSource(
    { ...scalarResult(), ...overrides },
    options
  );
}

function directContributor(source, overrides = {}) {
  return createProspectContributor({
    contributorId: "production",
    domain: "production",
    role: PROSPECT_CONTRIBUTOR_ROLES.DIRECT,
    source,
    evidenceRefs: ["production.score"],
    contributedToScore: true,
    contributedToOverallGrade: true,
    componentKeys: ["exampleComponent"],
    notes: ["Explicit contributor."],
    ...overrides,
  });
}

const CASES = [
  {
    id: "public-export-integrity",
    message: "Public source-adapter exports are complete.",
    run() {
      const named = {
        PROSPECT_SOURCE_USABILITY_REASONS,
        readProspectIntelligenceSource,
        createProspectContributor,
      };
      Object.entries(named).forEach(([name, value]) => {
        assert(value != null, `Named export ${name} must exist.`);
        assert(sourceAdapter[name] != null, `Default export must contain ${name}.`);
      });
      assertDeepEqual(
        Object.values(PROSPECT_SOURCE_USABILITY_REASONS),
        [
          "USABLE_SCORE",
          "USEFUL_CONTEXT_ONLY",
          "UNAVAILABLE_SOURCE",
          "NULL_SCORE",
          "INVALID_SOURCE_RESULT",
          "SOURCE_VALIDATION_ERROR",
          "NONSCORING_DATA_STATE",
          "DOMAIN_MISMATCH",
        ],
        "Usability reasons must match the approved set."
      );
    },
  },
  {
    id: "valid-scalar-source",
    message: "Valid scalar source projected correctly.",
    run() {
      const adapted = readProspectIntelligenceSource(
        scalarResult(),
        { expectedDomain: "production" }
      );
      assert(adapted.validShape, "Scalar shape must be valid.");
      assertEqual(adapted.domain, "production", "Domain must be preserved.");
      assert(adapted.available, "Availability must be preserved.");
      assertEqual(adapted.dataState, DATA_STATES.AVAILABLE, "Data state must be preserved.");
      assertEqual(adapted.score, 85, "Factory-normalized score must be preserved.");
      assertEqual(adapted.confidence, 0.8, "Confidence must be preserved.");
      assertEqual(adapted.evidenceLevel, EVIDENCE_LEVELS.STRONG, "Evidence level must be preserved.");
      assertDeepEqual(adapted.versions, { framework: "1.0.0", model: "PRODUCTION-1", data: "2026" }, "Versions must project.");
      assert(adapted.usability.usableForScore, "Scalar score must be usable.");
      assert(adapted.usability.usableForContext, "Scalar context must be usable.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.USABLE_SCORE, "Reason must be USABLE_SCORE.");
    },
  },
  {
    id: "valid-zero-score",
    message: "Zero remained a usable score.",
    run() {
      const adapted = readProspectIntelligenceSource(scalarResult({ score: 0 }));
      assertEqual(adapted.score, 0, "Zero must be preserved.");
      assert(adapted.usability.usableForScore, "Zero must be score-usable.");
    },
  },
  {
    id: "structured-vector-null-score",
    message: "Vector value remained useful context without a scalar score.",
    run() {
      const value = { type: "VECTOR", data: { exampleTrait: 82 } };
      const adapted = readProspectIntelligenceSource(
        scalarResult({ domain: "playerTraits", score: null, value })
      );
      assertEqual(adapted.score, null, "Vector score must remain null.");
      assertEqual(adapted.value, value, "Structured value reference must be preserved.");
      assert(!adapted.usability.usableForScore, "Vector must not become scalar-usable.");
      assert(adapted.usability.usableForContext, "Vector must be context-usable.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.USEFUL_CONTEXT_ONLY, "Vector reason must be context-only.");
    },
  },
  {
    id: "insufficient-sample-source",
    message: "Insufficient-sample source remained contextual.",
    run() {
      const adapted = readProspectIntelligenceSource(
        scalarResult({ dataState: DATA_STATES.INSUFFICIENT_SAMPLE })
      );
      assertEqual(adapted.dataState, DATA_STATES.INSUFFICIENT_SAMPLE, "State must not be rewritten.");
      assert(!adapted.usability.usableForScore, "Partial source must not automatically score.");
      assert(adapted.usability.usableForContext, "Partial source must remain contextual.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.NONSCORING_DATA_STATE, "Reason must reflect data state.");
    },
  },
  {
    id: "unavailable-source",
    message: "Unavailable source remained non-scoring context.",
    run() {
      const adapted = readProspectIntelligenceSource(
        createUnavailableIntelligenceResult({
          domain: "production",
          missingEvidence: ["productionProfile"],
        })
      );
      assert(!adapted.usability.usableForScore, "Unavailable source cannot score.");
      assert(adapted.usability.usableForContext, "Unavailable explanation may remain context.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.UNAVAILABLE_SOURCE, "Reason must be unavailable.");
      assertDeepEqual(adapted.missingEvidence, ["productionProfile"], "Missing evidence must remain.");
      assertEqual(adapted.score, null, "No score may be invented.");
    },
  },
  {
    id: "not-applicable-source",
    message: "Not-applicable source preserved exclusion context.",
    run() {
      const adapted = readProspectIntelligenceSource(
        createUnavailableIntelligenceResult({ domain: "schemeFit", dataState: DATA_STATES.NOT_APPLICABLE })
      );
      assertEqual(adapted.dataState, DATA_STATES.NOT_APPLICABLE, "NOT_APPLICABLE must be preserved.");
      assert(!adapted.usability.usableForScore, "Not-applicable source cannot score.");
      assert(adapted.usability.usableForContext, "Not-applicable state supplies exclusion context.");
    },
  },
  {
    id: "unknown-source",
    message: "Unknown source produced deterministic non-scoring usability.",
    run() {
      const adapted = readProspectIntelligenceSource(
        createUnavailableIntelligenceResult({ domain: "production", dataState: DATA_STATES.UNKNOWN })
      );
      assertEqual(adapted.dataState, DATA_STATES.UNKNOWN, "UNKNOWN must be preserved.");
      assert(!adapted.usability.usableForScore, "Unknown source cannot score.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.UNAVAILABLE_SOURCE, "Availability precedence must be deterministic.");
    },
  },
  {
    id: "malformed-inputs",
    message: "Malformed inputs returned safe defaults.",
    run() {
      [null, [], "source", 42, { unrelated: true }].forEach((input) => {
        const adapted = readProspectIntelligenceSource(input);
        assert(!adapted.validShape, "Malformed shape must fail.");
        assert(!adapted.usability.usableForScore, "Malformed input cannot score.");
        assert(!adapted.usability.usableForContext, "Malformed input cannot provide context.");
        assertEqual(adapted.score, null, "Malformed score must be null.");
        assertCode(adapted.validation, "INVALID_SOURCE_RESULT");
      });
    },
  },
  {
    id: "expected-domain-match",
    message: "Matching expected domain passed.",
    run() {
      const adapted = readProspectIntelligenceSource(scalarResult(), { expectedDomain: "production" });
      assert(adapted.validation.valid, "Matching domain must not add an error.");
      assert(adapted.usability.usableForScore, "Matching source remains usable.");
    },
  },
  {
    id: "expected-domain-mismatch",
    message: "Domain mismatch blocked scoring without rewriting context.",
    run() {
      const adapted = readProspectIntelligenceSource(scalarResult(), { expectedDomain: "athleticism" });
      assertEqual(adapted.domain, "production", "Real domain must remain.");
      assertCode(adapted.validation, "DOMAIN_MISMATCH");
      assert(!adapted.usability.usableForScore, "Mismatch must block score use.");
      assert(adapted.usability.usableForContext, "Mismatch may preserve context.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.DOMAIN_MISMATCH, "Mismatch reason must be stable.");
    },
  },
  {
    id: "invalid-expected-domain-option",
    message: "Invalid expected-domain option was reported safely.",
    run() {
      const adapted = readProspectIntelligenceSource(scalarResult(), { expectedDomain: 12 });
      assertCode(adapted.validation, "INVALID_EXPECTED_DOMAIN");
      assert(!adapted.usability.usableForScore, "Invalid option must block unsafe scoring.");
    },
  },
  {
    id: "invalid-source-scores",
    message: "Invalid source scores became null without clamping.",
    run() {
      [-1, 101, Number.NaN, Number.POSITIVE_INFINITY, "84"].forEach((score) => {
        const adapted = adaptRaw({ score });
        assertEqual(adapted.score, null, "Invalid score must become null.");
        assertCode(adapted.validation, "INVALID_SOURCE_SCORE");
        assert(!adapted.usability.usableForScore, "Invalid score cannot be used.");
      });
    },
  },
  {
    id: "confidence-handling",
    message: "Confidence values projected safely.",
    run() {
      assertEqual(adaptRaw({ confidence: 0 }).confidence, 0, "Zero confidence must remain.");
      assertEqual(adaptRaw({ confidence: 0.42 }).confidence, 0.42, "Fractional confidence must remain.");
      [-0.1, 1.1, "0.8"].forEach((confidence) => {
        const adapted = adaptRaw({ confidence });
        assertEqual(adapted.confidence, 0, "Invalid confidence must become zero.");
        assertCode(adapted.validation, "INVALID_SOURCE_CONFIDENCE");
      });
    },
  },
  {
    id: "evidence-level-handling",
    message: "Evidence levels projected safely.",
    run() {
      assertEqual(adaptRaw({ evidenceLevel: EVIDENCE_LEVELS.MODERATE }).evidenceLevel, EVIDENCE_LEVELS.MODERATE, "Valid level must remain.");
      const invalid = adaptRaw({ evidenceLevel: "ELITE" });
      assertEqual(invalid.evidenceLevel, EVIDENCE_LEVELS.NONE, "Invalid level must use NONE.");
      assertCode(invalid.validation, "INVALID_SOURCE_EVIDENCE_LEVEL");
      assertEqual(adaptRaw({ evidenceLevel: undefined }).evidenceLevel, EVIDENCE_LEVELS.NONE, "Missing level must safely use NONE.");
    },
  },
  {
    id: "data-state-handling",
    message: "Data states projected and derived safely.",
    run() {
      assertEqual(adaptRaw({ dataState: DATA_STATES.AVAILABLE }).dataState, DATA_STATES.AVAILABLE, "Valid available state must remain.");
      assertEqual(adaptRaw({ available: false, dataState: DATA_STATES.UNAVAILABLE }).dataState, DATA_STATES.UNAVAILABLE, "Valid unavailable state must remain.");
      const invalid = adaptRaw({ dataState: "READY" });
      assertEqual(invalid.dataState, DATA_STATES.AVAILABLE, "Invalid state must derive safely.");
      assertCode(invalid.validation, "INVALID_SOURCE_DATA_STATE");
      assertEqual(adaptRaw({ dataState: undefined }).dataState, DATA_STATES.AVAILABLE, "Missing state must derive from availability.");
    },
  },
  {
    id: "source-validation-errors",
    message: "Source-declared errors blocked scoring but preserved context.",
    run() {
      const source = { ...scalarResult(), validation: { valid: false, errors: [{ code: "BAD", message: "Bad source." }], warnings: [] } };
      const before = JSON.stringify(source.validation);
      const adapted = readProspectIntelligenceSource(source);
      assertCode(adapted.validation, "SOURCE_VALIDATION_ERROR");
      assert(!adapted.usability.usableForScore, "Source errors must block scoring.");
      assert(adapted.usability.usableForContext, "Source errors may preserve context.");
      assertEqual(adapted.usability.reason, PROSPECT_SOURCE_USABILITY_REASONS.SOURCE_VALIDATION_ERROR, "Reason must identify source validation.");
      assertEqual(JSON.stringify(source.validation), before, "Source validation must not mutate.");
    },
  },
  {
    id: "source-validation-warnings",
    message: "Source warnings remained nonblocking.",
    run() {
      const adapted = readProspectIntelligenceSource({
        ...scalarResult(),
        validation: { valid: true, errors: [], warnings: [{ code: "LIMITED", message: "Limited sample." }] },
      });
      assertCode(adapted.validation, "SOURCE_VALIDATION_WARNING", "warnings");
      assert(adapted.usability.usableForScore, "Warnings alone must not block score use.");
    },
  },
  {
    id: "array-projection",
    message: "Source arrays copied and missing evidence deduplicated.",
    run() {
      const evidence = [{ id: 1 }, null];
      const missingEvidence = ["a", "", 2, "b", "a"];
      const sources = ["profile", "", null];
      const source = { ...scalarResult(), evidence, missingEvidence, sources };
      const adapted = readProspectIntelligenceSource(source);
      assertDeepEqual(adapted.evidence, [{ id: 1 }], "Valid evidence must remain and invalid entries must be removed.");
      assertDeepEqual(adapted.missingEvidence, ["a", "b"], "Missing paths must normalize in first order.");
      assertDeepEqual(adapted.sources, ["profile"], "Valid sources must remain and invalid entries must be removed.");
      assert(adapted.evidence !== evidence, "Evidence array must be copied.");
      assertDeepEqual(source.missingEvidence, missingEvidence, "Source missing evidence must not mutate.");
      assertCode(adapted.validation, "DUPLICATE_SOURCE_ARRAY_ENTRY", "warnings");
      assertCode(adapted.validation, "INVALID_SOURCE_ARRAY_ENTRY", "warnings");
    },
  },
  {
    id: "version-projection",
    message: "Versions projected without invention.",
    run() {
      const projected = adaptRaw({ versions: { framework: "F1", model: "M1", data: 2026 } });
      assertDeepEqual(projected.versions, { framework: "F1", model: "M1", data: 2026 }, "Approved versions must project.");
      assertDeepEqual(adaptRaw({ versions: undefined }).versions, { framework: null, model: null, data: null }, "Missing versions must become null.");
      const invalid = adaptRaw({ versions: "v1" });
      assertDeepEqual(invalid.versions, { framework: null, model: null, data: null }, "Invalid versions must normalize safely.");
      assertCode(invalid.validation, "INVALID_SOURCE_VERSIONS");
    },
  },
  {
    id: "original-source-reference",
    message: "Original source reference was preserved without mutation.",
    run() {
      const source = scalarResult();
      const before = JSON.stringify(source);
      const adapted = readProspectIntelligenceSource(source);
      const contributor = directContributor(adapted);
      assertEqual(adapted.sourceResult, source, "Adapter must preserve object identity.");
      assert(!Object.prototype.hasOwnProperty.call(contributor, "sourceResult"), "Contributor must not copy sourceResult.");
      assertEqual(JSON.stringify(source), before, "Adapter must not mutate source.");
    },
  },
  {
    id: "direct-contributor",
    message: "Direct contributor preserved explicit caller decisions.",
    run() {
      const contributor = directContributor(readProspectIntelligenceSource(scalarResult()));
      assertEqual(contributor.role, PROSPECT_CONTRIBUTOR_ROLES.DIRECT, "Direct role must remain.");
      assert(contributor.contributedToScore, "Score flag must remain true.");
      assert(contributor.contributedToOverallGrade, "Overall flag must remain true.");
      assertDeepEqual(contributor.componentKeys, ["exampleComponent"], "Component keys must remain.");
      assertDeepEqual(contributor.evidenceRefs, ["production.score"], "Evidence references must remain.");
      assertDeepEqual(contributor.notes, ["Explicit contributor."], "Notes must remain.");
    },
  },
  {
    id: "context-only-contributor",
    message: "Context-only contributor remained noncontributing.",
    run() {
      const contributor = createProspectContributor({
        role: PROSPECT_CONTRIBUTOR_ROLES.CONTEXT_ONLY,
        source: readProspectIntelligenceSource(scalarResult()),
      });
      assertEqual(contributor.role, PROSPECT_CONTRIBUTOR_ROLES.CONTEXT_ONLY, "Role must remain contextual.");
      assert(!contributor.contributedToScore, "Availability must not infer score contribution.");
      assert(!contributor.contributedToOverallGrade, "Availability must not infer overall contribution.");
    },
  },
  {
    id: "excluded-contributor",
    message: "Excluded contributor preserved explicit exclusion metadata.",
    run() {
      const source = readProspectIntelligenceSource(createUnavailableIntelligenceResult({ domain: "production" }));
      const contributor = createProspectContributor({
        role: PROSPECT_CONTRIBUTOR_ROLES.EXCLUDED,
        source,
        exclusionReason: "UNAVAILABLE_SOURCE",
        contributedToScore: false,
        contributedToOverallGrade: false,
      });
      assertEqual(contributor.role, PROSPECT_CONTRIBUTOR_ROLES.EXCLUDED, "Excluded role must remain.");
      assertEqual(contributor.exclusionReason, "UNAVAILABLE_SOURCE", "Reason must remain.");
      assert(!contributor.contributedToScore, "No score contribution may be inferred.");
    },
  },
  {
    id: "excluded-contributor-without-reason",
    message: "Excluded contributor did not invent a reason.",
    run() {
      const contributor = createProspectContributor({
        role: PROSPECT_CONTRIBUTOR_ROLES.EXCLUDED,
        source: readProspectIntelligenceSource(scalarResult()),
      });
      assertEqual(contributor.exclusionReason, null, "Exclusion reason must remain null.");
    },
  },
  {
    id: "invalid-contributor-role",
    message: "Invalid contributor role fell back to context-only.",
    run() {
      const contributor = createProspectContributor({
        role: "PRIMARY",
        source: readProspectIntelligenceSource(scalarResult()),
        contributedToScore: "true",
      });
      assertEqual(contributor.role, PROSPECT_CONTRIBUTOR_ROLES.CONTEXT_ONLY, "Invalid role must become context-only.");
      assert(!contributor.contributedToScore, "Non-Boolean true must not infer contribution.");
    },
  },
  {
    id: "contributor-domain-fallback",
    message: "Contributor domain precedence remained explicit.",
    run() {
      const source = readProspectIntelligenceSource(scalarResult());
      assertEqual(createProspectContributor({ domain: "explicit", source }).domain, "explicit", "Explicit domain must win.");
      assertEqual(createProspectContributor({ domain: null, source }).domain, "production", "Null domain may use source domain.");
      assertEqual(createProspectContributor({ domain: null, source: {} }).domain, null, "Missing domains must remain null.");
    },
  },
  {
    id: "contributor-source-projection",
    message: "Contributor copied only approved source metadata.",
    run() {
      const source = readProspectIntelligenceSource(scalarResult());
      const contributor = directContributor(source);
      assertEqual(contributor.available, source.available, "Availability must copy.");
      assertEqual(contributor.dataState, source.dataState, "Data state must copy.");
      assertEqual(contributor.confidence, source.confidence, "Confidence must copy.");
      assertEqual(contributor.evidenceLevel, source.evidenceLevel, "Evidence level must copy.");
      assertDeepEqual(contributor.versions, source.versions, "Versions must copy.");
      ["sourceResult", "usability", "validation", "value", "score", "evidence"].forEach((field) => {
        assert(!Object.prototype.hasOwnProperty.call(contributor, field), `Contributor must omit ${field}.`);
      });
    },
  },
  {
    id: "contributor-contract-compatibility",
    message: "Contributor was accepted by the approved component contract.",
    run() {
      const contributor = directContributor(readProspectIntelligenceSource(scalarResult()));
      const component = createProspectComponentResult({
        key: "exampleComponent",
        score: 80,
        confidence: 0.8,
        available: true,
        provenance: { contributors: [contributor] },
      });
      assert(component.validation.valid, "Component contract must accept contributor.");
      assertDeepEqual(component.provenance.contributors[0], contributor, "Contributor structure must be preserved.");
    },
  },
  {
    id: "deterministic-repeated-execution",
    message: "Repeated adapter and contributor execution was deterministic.",
    run() {
      const source = scalarResult();
      const first = readProspectIntelligenceSource(source);
      const second = readProspectIntelligenceSource(source);
      assertDeepEqual(first, second, "Adapter projections must be deterministic.");
      assertDeepEqual(directContributor(first), directContributor(second), "Contributor projections must be deterministic.");
    },
  },
];

export function runProspectModelSourceAdapterDiagnostics({
  throwOnFailure = false,
} = {}) {
  const tests = CASES.map(({ id, message, run }) =>
    runCase(id, message, run)
  );
  const passedCount = tests.filter((test) => test.passed).length;
  const failedCount = tests.length - passedCount;
  const report = {
    suite: SUITE,
    passed: failedCount === 0,
    total: tests.length,
    passedCount,
    failedCount,
    tests,
  };

  if (throwOnFailure && failedCount > 0) {
    throw new Error(
      `${SUITE} failed ${failedCount} of ${tests.length} diagnostics.`
    );
  }

  return report;
}

export default {
  runProspectModelSourceAdapterDiagnostics,
};
