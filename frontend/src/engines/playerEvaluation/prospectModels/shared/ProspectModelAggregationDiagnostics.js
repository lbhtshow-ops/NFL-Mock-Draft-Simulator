import aggregationModule, {
  PROSPECT_MISSING_COMPONENT_STRATEGIES,
  aggregateProspectComponents,
} from "./ProspectModelAggregation.js";
import {
  PROSPECT_AGGREGATION_METHODS,
  createProspectComponentResult,
  createProspectPositionModelResult,
  createUnavailableProspectPositionModelResult,
  isProspectPositionModelResult,
  validateProspectPositionModelResult,
} from "../ProspectPositionModelContract.js";

const SUITE = "ProspectModelAggregationDiagnostics";

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

function assertClose(actual, expected, message) {
  assert(
    typeof actual === "number" &&
      Math.abs(actual - expected) <= 1e-9,
    message,
    { expected, actual }
  );
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

function component(key, score, overrides = {}) {
  return createProspectComponentResult({
    key,
    score,
    confidence: 0.8,
    available: true,
    ...overrides,
  });
}

function threeComponents() {
  return {
    accuracy: component("accuracy", 90),
    processing: component("processing", 80),
    mobility: component("mobility", 70),
  };
}

function completeInput(overrides = {}) {
  return {
    components: threeComponents(),
    weights: {
      accuracy: 0.5,
      processing: 0.3,
      mobility: 0.2,
    },
    ...overrides,
  };
}

const RENORMALIZE =
  PROSPECT_MISSING_COMPONENT_STRATEGIES
    .EXCLUDE_AND_RENORMALIZE;

const CASES = [
  {
    id: "public-export-integrity",
    message: "Aggregation exports are complete.",
    run() {
      assert(PROSPECT_MISSING_COMPONENT_STRATEGIES, "Strategy export must exist.");
      assert(aggregateProspectComponents, "Aggregator export must exist.");
      assert(aggregationModule.PROSPECT_MISSING_COMPONENT_STRATEGIES, "Default export must contain strategies.");
      assert(aggregationModule.aggregateProspectComponents, "Default export must contain aggregator.");
      assertDeepEqual(Object.values(PROSPECT_MISSING_COMPONENT_STRATEGIES), ["BLOCK_GRADE", "EXCLUDE_AND_RENORMALIZE"], "Strategies must match v1.");
    },
  },
  {
    id: "complete-valid-weighted-aggregation",
    message: "Complete weighted aggregation produced the expected grade.",
    run() {
      const result = aggregateProspectComponents(completeInput());
      assert(result.available, "Grade must be available.");
      assertClose(result.overallGrade, 83, "Weighted grade must equal 83.");
      assertDeepEqual(result.aggregation.requestedWeights, completeInput().weights, "Requested weights must remain.");
      assertDeepEqual(result.aggregation.appliedWeights, completeInput().weights, "Applied weights must match.");
      assertClose(result.aggregation.requestedWeightTotal, 1, "Requested total must be one.");
      assertClose(result.aggregation.appliedWeightTotal, 1, "Applied total must be one.");
      assert(!result.aggregation.normalizationApplied, "Normalization must be false.");
      assertDeepEqual(result.aggregation.includedComponents, ["accuracy", "processing", "mobility"], "Included order must follow weights.");
      assert(result.validation.valid, "Valid aggregation must pass.");
    },
  },
  {
    id: "zero-component-score",
    message: "A score of zero remained included.",
    run() {
      const result = aggregateProspectComponents({
        components: { zero: component("zero", 0), other: component("other", 100) },
        weights: { zero: 0.5, other: 0.5 },
      });
      assert(result.available, "Zero score must not block grade.");
      assertDeepEqual(result.aggregation.includedComponents, ["zero", "other"], "Zero score must be included.");
      assertClose(result.overallGrade, 50, "Zero must contribute numerically.");
      assertDeepEqual(result.missingEvidence, [], "Zero must not be missing.");
    },
  },
  {
    id: "fractional-precision",
    message: "Fractional grade precision was preserved.",
    run() {
      const input = {
        components: {
          a: { ...component("a", 81), score: 81.25 },
          b: { ...component("b", 73), score: 72.75 },
        },
        weights: { a: 0.65, b: 0.35 },
      };
      const expected = 81.25 * 0.65 + 72.75 * 0.35;
      const first = aggregateProspectComponents(input);
      const second = aggregateProspectComponents(input);
      assertEqual(first.rawOverallGrade, expected, "Raw grade must preserve JS precision.");
      assertEqual(first.overallGrade, expected, "Overall grade must not round.");
      assertDeepEqual(first, second, "Repeated precision must be stable.");
    },
  },
  {
    id: "weight-insertion-order",
    message: "Aggregation order followed the weight map.",
    run() {
      const components = threeComponents();
      const result = aggregateProspectComponents({
        components,
        weights: { mobility: 0.2, accuracy: 0.5, processing: 0.3 },
      });
      assertDeepEqual(result.aggregation.includedComponents, ["mobility", "accuracy", "processing"], "Weight order must control inclusion.");
    },
  },
  {
    id: "block-grade-missing-optional",
    message: "BLOCK_GRADE rejected a missing optional component.",
    run() {
      const result = aggregateProspectComponents({
        components: { accuracy: component("accuracy", 90) },
        weights: { accuracy: 0.6, pressure: 0.4 },
      });
      assert(!result.available, "Missing optional component must block.");
      assertEqual(result.overallGrade, null, "Partial grade must not be calculated.");
      assertDeepEqual(result.missingEvidence, ["components.pressure"], "Missing path must be recorded.");
      assertDeepEqual(result.aggregation.excludedComponents, [{ key: "pressure", reason: "MISSING_COMPONENT" }], "Exclusion must be recorded.");
      assertDeepEqual(result.aggregation.appliedWeights, {}, "No completed applied weights may remain.");
      assert(!result.aggregation.normalizationApplied, "No normalization may occur.");
    },
  },
  {
    id: "renormalize-missing-optional",
    message: "Optional missing component was explicitly renormalized.",
    run() {
      const weights = { accuracy: 0.6, pressure: 0.4 };
      const result = aggregateProspectComponents({
        components: { accuracy: component("accuracy", 90) },
        weights,
        missingComponentStrategy: RENORMALIZE,
      });
      assert(result.available, "Remaining component must produce grade.");
      assertClose(result.overallGrade, 90, "Renormalized grade must use remaining evidence.");
      assertClose(result.aggregation.appliedWeightTotal, 1, "Applied total must be one.");
      assertDeepEqual(result.aggregation.requestedWeights, weights, "Requested weights must remain unchanged.");
      assert(result.aggregation.normalizationApplied, "Normalization must be recorded.");
      assertCode(result.validation, "OPTIONAL_COMPONENT_EXCLUDED", "warnings");
      assertCode(result.validation, "WEIGHTS_RENORMALIZED", "warnings");
    },
  },
  {
    id: "missing-required-list-component",
    message: "Explicit missing required component blocked the grade.",
    run() {
      const result = aggregateProspectComponents({
        components: { accuracy: component("accuracy", 90) },
        weights: { accuracy: 0.6, processing: 0.4 },
        requiredComponents: ["processing"],
      });
      assert(!result.available, "Missing required component must block.");
      assertCode(result.validation, "MISSING_REQUIRED_COMPONENT");
    },
  },
  {
    id: "required-component-flag",
    message: "Component required flag blocked unusable evidence.",
    run() {
      const required = component("processing", null, { required: true });
      const result = aggregateProspectComponents({
        components: { processing: required },
        weights: { processing: 1 },
        missingComponentStrategy: RENORMALIZE,
      });
      assert(!result.available, "Required flag must block.");
      assertCode(result.validation, "MISSING_REQUIRED_COMPONENT");
    },
  },
  {
    id: "missing-critical-list-component",
    message: "Explicit missing critical component was recorded.",
    run() {
      const result = aggregateProspectComponents({
        components: {},
        weights: { processing: 1 },
        criticalComponents: ["processing"],
      });
      assert(!result.available, "Missing critical component must block.");
      assertCode(result.validation, "MISSING_CRITICAL_COMPONENT");
      assertDeepEqual(result.aggregation.criticalMissingComponents, ["processing"], "Critical key must be recorded.");
    },
  },
  {
    id: "critical-component-flag",
    message: "Component critical flag blocked unusable evidence.",
    run() {
      const critical = component("processing", null, { critical: true });
      const result = aggregateProspectComponents({ components: { processing: critical }, weights: { processing: 1 } });
      assert(!result.available, "Critical flag must block.");
      assertCode(result.validation, "MISSING_CRITICAL_COMPONENT");
      assertDeepEqual(result.aggregation.criticalMissingComponents, ["processing"], "Flagged key must be recorded.");
    },
  },
  {
    id: "material-component-renormalization-block",
    message: "Renormalization did not bypass material evidence.",
    run() {
      [
        { requiredComponents: ["missing"] },
        { criticalComponents: ["missing"] },
      ].forEach((declaration) => {
        const result = aggregateProspectComponents({
          components: { usable: component("usable", 80) },
          weights: { usable: 0.5, missing: 0.5 },
          missingComponentStrategy: RENORMALIZE,
          ...declaration,
        });
        assert(!result.available, "Material component must block renormalization.");
      });
    },
  },
  {
    id: "null-component-score",
    message: "Null component score followed the selected strategy.",
    run() {
      const nullScore = component("missing", null);
      const blocked = aggregateProspectComponents({ components: { missing: nullScore }, weights: { missing: 1 } });
      assert(!blocked.available, "Null score must block default strategy.");
      assertDeepEqual(blocked.aggregation.excludedComponents, [{ key: "missing", reason: "NULL_COMPONENT_SCORE" }], "Null reason must be stable.");
    },
  },
  {
    id: "unavailable-component",
    message: "Unavailable component could not contribute.",
    run() {
      const unavailable = component("missing", 80, { available: false });
      const result = aggregateProspectComponents({ components: { missing: unavailable }, weights: { missing: 1 } });
      assert(!result.available, "Unavailable component must not contribute.");
      assertDeepEqual(result.aggregation.excludedComponents, [{ key: "missing", reason: "UNAVAILABLE_COMPONENT" }], "Unavailable reason must be stable.");
    },
  },
  {
    id: "locally-invalid-component",
    message: "Local component validation errors blocked contribution.",
    run() {
      const invalid = component("invalid", 101);
      const result = aggregateProspectComponents({ components: { invalid }, weights: { invalid: 1 } });
      assert(!result.available, "Locally invalid component must not contribute.");
      assertDeepEqual(result.aggregation.excludedComponents, [{ key: "invalid", reason: "INVALID_COMPONENT" }], "Invalid reason must be stable.");
    },
  },
  {
    id: "malformed-component-object",
    message: "Malformed component returned safe validation.",
    run() {
      const result = aggregateProspectComponents({ components: { malformed: { score: 80 } }, weights: { malformed: 1 } });
      assert(!result.available, "Malformed component cannot contribute.");
      assertDeepEqual(result.aggregation.excludedComponents, [{ key: "malformed", reason: "INVALID_COMPONENT" }], "Malformed component must be identified.");
    },
  },
  {
    id: "missing-configured-component",
    message: "Missing configured component was excluded deterministically.",
    run() {
      const result = aggregateProspectComponents({ components: {}, weights: { missing: 1 } });
      assert(!result.available, "Missing component cannot produce grade.");
      assertDeepEqual(result.aggregation.excludedComponents, [{ key: "missing", reason: "MISSING_COMPONENT" }], "Missing reason must be stable.");
      assertCode(result.validation, "MISSING_CONFIGURED_COMPONENT");
    },
  },
  {
    id: "optional-component-without-weight",
    message: "Unweighted optional component was ignored.",
    run() {
      const result = aggregateProspectComponents({
        components: { weighted: component("weighted", 80), ignored: component("ignored", 20) },
        weights: { weighted: 1 },
      });
      assert(result.available, "Optional unweighted component must not block.");
      assertDeepEqual(result.aggregation.includedComponents, ["weighted"], "Only weighted component may be included.");
    },
  },
  {
    id: "required-component-without-weight",
    message: "Required unweighted component was rejected.",
    run() {
      const result = aggregateProspectComponents({
        components: { weighted: component("weighted", 80), required: component("required", 90) },
        weights: { weighted: 1 },
        requiredComponents: ["required"],
      });
      assert(!result.available, "Required unweighted component must block.");
      assertCode(result.validation, "REQUIRED_COMPONENT_WITHOUT_WEIGHT");
    },
  },
  {
    id: "critical-component-without-weight",
    message: "Critical unweighted component was rejected.",
    run() {
      const result = aggregateProspectComponents({
        components: { weighted: component("weighted", 80), critical: component("critical", 90) },
        weights: { weighted: 1 },
        criticalComponents: ["critical"],
      });
      assert(!result.available, "Critical unweighted component must block.");
      assertCode(result.validation, "CRITICAL_COMPONENT_WITHOUT_WEIGHT");
      assertDeepEqual(result.aggregation.criticalMissingComponents, ["critical"], "Critical key must be recorded.");
    },
  },
  {
    id: "zero-requested-weight",
    message: "Zero requested weight was ignored without becoming missing.",
    run() {
      const result = aggregateProspectComponents({
        components: { weighted: component("weighted", 80), zero: component("zero", null) },
        weights: { weighted: 1, zero: 0 },
      });
      assert(result.available, "Zero-weight component must not block.");
      assertClose(result.overallGrade, 80, "Zero weight must not alter grade.");
      assertDeepEqual(result.missingEvidence, [], "Optional zero weight must not be missing evidence.");
      assertCode(result.validation, "ZERO_REQUESTED_WEIGHT", "warnings");
    },
  },
  {
    id: "negative-weight",
    message: "Negative weight was rejected.",
    run() {
      const result = aggregateProspectComponents({ components: { a: component("a", 80) }, weights: { a: -1 } });
      assert(!result.available, "Negative weight cannot grade.");
      assertCode(result.validation, "INVALID_REQUESTED_WEIGHT");
      assertDeepEqual(result.aggregation.requestedWeights, {}, "Invalid weight must not be coerced.");
    },
  },
  {
    id: "nonfinite-weight",
    message: "Nonfinite weights were rejected.",
    run() {
      [Number.NaN, Number.POSITIVE_INFINITY].forEach((weight) => {
        const result = aggregateProspectComponents({ components: { a: component("a", 80) }, weights: { a: weight } });
        assert(!result.available, "Nonfinite weight cannot grade.");
        assertCode(result.validation, "INVALID_REQUESTED_WEIGHT");
      });
    },
  },
  {
    id: "numeric-string-weight",
    message: "Numeric-string weight was not coerced.",
    run() {
      const result = aggregateProspectComponents({ components: { a: component("a", 80) }, weights: { a: "1" } });
      assert(!result.available, "String weight cannot grade.");
      assertCode(result.validation, "INVALID_REQUESTED_WEIGHT");
      assertDeepEqual(result.aggregation.requestedWeights, {}, "String weight must be omitted.");
    },
  },
  {
    id: "complete-weights-below-one",
    message: "Complete weights below one were rejected.",
    run() {
      const result = aggregateProspectComponents({ components: { a: component("a", 80), b: component("b", 90) }, weights: { a: 0.4, b: 0.4 } });
      assert(!result.available, "Incomplete total cannot grade.");
      assertCode(result.validation, "REQUESTED_WEIGHT_TOTAL_INVALID");
      assert(!result.aggregation.normalizationApplied, "Misconfiguration must not normalize.");
    },
  },
  {
    id: "complete-weights-above-one",
    message: "Complete weights above one were rejected.",
    run() {
      const result = aggregateProspectComponents({ components: { a: component("a", 80), b: component("b", 90) }, weights: { a: 0.7, b: 0.7 } });
      assert(!result.available, "Excess total cannot grade.");
      assertCode(result.validation, "REQUESTED_WEIGHT_TOTAL_INVALID");
    },
  },
  {
    id: "weight-total-tolerance",
    message: "Floating-point total within tolerance passed.",
    run() {
      const result = aggregateProspectComponents({
        components: { a: component("a", 80), b: component("b", 90), c: component("c", 70) },
        weights: { a: 0.1, b: 0.2, c: 0.7 },
      });
      assert(result.available, "Floating total must pass tolerance.");
    },
  },
  {
    id: "no-positive-weights",
    message: "No positive weights produced structured failure.",
    run() {
      const result = aggregateProspectComponents({ components: { a: component("a", 80) }, weights: { a: 0 } });
      assert(!result.available, "No positive weights cannot grade.");
      assertCode(result.validation, "NO_POSITIVE_REQUESTED_WEIGHTS");
    },
  },
  {
    id: "all-optional-components-excluded",
    message: "All optional exclusions avoided division by zero.",
    run() {
      const result = aggregateProspectComponents({ components: {}, weights: { a: 0.5, b: 0.5 }, missingComponentStrategy: RENORMALIZE });
      assert(!result.available, "No remaining component cannot grade.");
      assertEqual(result.overallGrade, null, "No fallback grade may be invented.");
      assertCode(result.validation, "NO_USABLE_COMPONENTS");
      assertEqual(result.diagnostics.usableWeightTotal, 0, "Usable total must be zero.");
    },
  },
  {
    id: "invalid-strategy",
    message: "Invalid strategy returned structured validation.",
    run() {
      const result = aggregateProspectComponents({ ...completeInput(), missingComponentStrategy: "IGNORE" });
      assert(!result.available, "Invalid strategy cannot grade.");
      assertCode(result.validation, "INVALID_MISSING_COMPONENT_STRATEGY");
    },
  },
  {
    id: "invalid-components-map",
    message: "Invalid component maps returned safe results.",
    run() {
      [null, [], "components"].forEach((components) => {
        const result = aggregateProspectComponents({ components, weights: { a: 1 } });
        assert(!result.available, "Invalid components map cannot grade.");
        assertCode(result.validation, "INVALID_COMPONENTS_MAP");
      });
    },
  },
  {
    id: "invalid-weights-map",
    message: "Invalid weight maps returned safe results.",
    run() {
      [null, [], "weights"].forEach((weights) => {
        const result = aggregateProspectComponents({ components: {}, weights });
        assert(!result.available, "Invalid weights map cannot grade.");
        assertCode(result.validation, "INVALID_WEIGHTS_MAP");
      });
    },
  },
  {
    id: "required-list-normalization",
    message: "Required declarations normalized deterministically.",
    run() {
      const result = aggregateProspectComponents({
        components: { required: component("required", null) },
        weights: { required: 1 },
        requiredComponents: ["required", "", 4, "required"],
      });
      assertCode(result.validation, "INVALID_COMPONENT_DECLARATION", "warnings");
      assertCode(result.validation, "DUPLICATE_COMPONENT_DECLARATION", "warnings");
      assertEqual(result.validation.errors.filter((entry) => entry.code === "MISSING_REQUIRED_COMPONENT").length, 1, "Required error must not duplicate.");
    },
  },
  {
    id: "critical-list-normalization",
    message: "Critical declarations normalized deterministically.",
    run() {
      const result = aggregateProspectComponents({
        components: {},
        weights: { critical: 1 },
        criticalComponents: ["critical", " ", null, "critical"],
      });
      assertCode(result.validation, "INVALID_COMPONENT_DECLARATION", "warnings");
      assertCode(result.validation, "DUPLICATE_COMPONENT_DECLARATION", "warnings");
      assertDeepEqual(result.aggregation.criticalMissingComponents, ["critical"], "Critical missing key must deduplicate.");
    },
  },
  {
    id: "missing-evidence-ordering",
    message: "Missing evidence followed weight order.",
    run() {
      const result = aggregateProspectComponents({ components: {}, weights: { second: 0.3, first: 0.7 } });
      assertDeepEqual(result.missingEvidence, ["components.second", "components.first"], "Missing paths must follow weights.");
    },
  },
  {
    id: "excluded-record-ordering",
    message: "Excluded records followed weight order.",
    run() {
      const result = aggregateProspectComponents({
        components: { unavailable: component("unavailable", 80, { available: false }), nullScore: component("nullScore", null) },
        weights: { nullScore: 0.3, missing: 0.2, unavailable: 0.5 },
      });
      assertDeepEqual(result.aggregation.excludedComponents.map(({ key }) => key), ["nullScore", "missing", "unavailable"], "Exclusions must follow weights.");
    },
  },
  {
    id: "input-immutability",
    message: "Aggregation did not mutate its inputs.",
    run() {
      const components = threeComponents();
      const weights = { accuracy: 0.5, processing: 0.3, mobility: 0.2 };
      const requiredComponents = ["accuracy"];
      const criticalComponents = ["processing"];
      const before = JSON.stringify({ components, weights, requiredComponents, criticalComponents });
      aggregateProspectComponents({ components, weights, requiredComponents, criticalComponents });
      assertEqual(JSON.stringify({ components, weights, requiredComponents, criticalComponents }), before, "Inputs must remain unchanged.");
    },
  },
  {
    id: "deterministic-repeated-execution",
    message: "Repeated aggregation was structurally identical.",
    run() {
      const input = completeInput();
      assertDeepEqual(aggregateProspectComponents(input), aggregateProspectComponents(input), "Repeated output must match.");
    },
  },
  {
    id: "contract-aggregation-compatibility",
    message: "Successful metadata passed the approved model contract.",
    run() {
      const components = threeComponents();
      const calculation = aggregateProspectComponents({ components, weights: completeInput().weights });
      const model = createProspectPositionModelResult({
        model: "DiagnosticProspectModel",
        playerId: "diagnostic-player",
        position: "QB",
        available: true,
        overallGrade: calculation.overallGrade,
        confidence: 0.8,
        components,
        aggregation: calculation.aggregation,
        versions: { model: "MODEL-1", weights: "WEIGHTS-1" },
      });
      assert(model.validation.valid, "Contract must accept aggregation metadata.");
      assert(validateProspectPositionModelResult(model).valid, "Standalone contract validation must pass.");
    },
  },
  {
    id: "contract-unavailable-compatibility",
    message: "Failed calculation errors passed through unavailable contract output.",
    run() {
      const calculation = aggregateProspectComponents({ components: {}, weights: { missing: 1 } });
      const model = createUnavailableProspectPositionModelResult({
        model: "DiagnosticProspectModel",
        playerId: "diagnostic-player",
        position: "QB",
        missingEvidence: calculation.missingEvidence,
        validationErrors: calculation.validation.errors,
        validationWarnings: calculation.validation.warnings,
        modelVersion: "MODEL-1",
        diagnostics: calculation.diagnostics,
      });
      assert(isProspectPositionModelResult(model), "Unavailable output must retain contract shape.");
      assert(validateProspectPositionModelResult(model).valid, "Unavailable structure must validate independently.");
      assert(!model.validation.valid, "Calculation errors must remain attached.");
    },
  },
];

export function runProspectModelAggregationDiagnostics({
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
  runProspectModelAggregationDiagnostics,
};
