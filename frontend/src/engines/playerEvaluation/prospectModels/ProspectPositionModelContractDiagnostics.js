import prospectPositionModelContract, {
  PROSPECT_POSITION_MODEL_CONTRACT_VERSION,
  PROSPECT_AGGREGATION_METHODS,
  PROSPECT_CONTRIBUTOR_ROLES,
  createProspectComponentResult,
  createProspectPositionModelResult,
  createUnavailableProspectPositionModelResult,
  validateProspectComponentResult,
  validateProspectAggregation,
  validateProspectPositionModelResult,
  isProspectComponentResult,
  isProspectPositionModelResult,
} from "./ProspectPositionModelContract.js";
import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../../contracts/IntelligenceResultContract.js";

const SUITE = "ProspectPositionModelContractDiagnostics";
const APPROVED_VERSION =
  "PROSPECT-POSITION-MODEL-CONTRACT-1.0.0";

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function assertEqual(actual, expected, message) {
  assert(
    Object.is(actual, expected),
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

function entriesWithCode(validation, code, field = "errors") {
  return (validation?.[field] ?? []).filter(
    (entry) => entry.code === code
  );
}

function assertIncludesCode(
  validation,
  code,
  field = "errors"
) {
  assert(
    entriesWithCode(validation, code, field).length > 0,
    `Expected ${field} to include ${code}.`,
    validation
  );
}

function assertNoDuplicateValidationEntries(validation) {
  ["errors", "warnings"].forEach((field) => {
    const entries = validation?.[field] ?? [];
    const keys = entries.map(
      (entry) =>
        `${entry.code}\u0000${entry.path}\u0000${entry.message}`
    );
    assertEqual(
      new Set(keys).size,
      keys.length,
      `Validation ${field} must not contain duplicates.`
    );
  });
}

function createContributor(overrides = {}) {
  return {
    contributorId: "production",
    domain: "PRODUCTION",
    role: PROSPECT_CONTRIBUTOR_ROLES.DIRECT,
    available: true,
    dataState: DATA_STATES.AVAILABLE,
    confidence: 0.9,
    evidenceLevel: EVIDENCE_LEVELS.VERY_STRONG,
    versions: {
      framework: "FRAMEWORK-1",
      model: "PRODUCTION-1",
      data: "2026",
    },
    evidenceRefs: ["production.score"],
    contributedToScore: true,
    contributedToOverallGrade: true,
    componentKeys: ["accuracy"],
    exclusionReason: null,
    notes: ["Verified contributor."],
    ...overrides,
  };
}

function createValidComponent(key = "accuracy", overrides = {}) {
  return createProspectComponentResult({
    key,
    score: 85,
    confidence: 0.8,
    available: true,
    provenance: { contributors: [] },
    ...overrides,
  });
}

function createInvalidComponent(key, overrides = {}) {
  return createProspectComponentResult({
    key,
    score: 101,
    confidence: 0.8,
    available: true,
    provenance: { contributors: [] },
    ...overrides,
  });
}

function createModel(overrides = {}) {
  return createProspectPositionModelResult({
    model: "DiagnosticProspectModel",
    playerId: "diagnostic-player",
    position: "QB",
    available: true,
    overallGrade: 85,
    confidence: 0.8,
    components: {
      accuracy: createValidComponent(),
    },
    aggregation: {
      method: PROSPECT_AGGREGATION_METHODS.MANUAL_GRADE,
    },
    versions: {
      model: "DIAGNOSTIC-MODEL-1",
    },
    ...overrides,
  });
}

function promotedEntries(result, key, field = "errors") {
  return (result.validation?.[field] ?? []).filter(
    (entry) =>
      entry.code === "GRADE_OUT_OF_RANGE" &&
      entry.path.startsWith(`components.${key}`)
  );
}

function runDiagnosticCase(id, message, diagnostic) {
  try {
    diagnostic();
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

const DIAGNOSTIC_CASES = [
  {
    id: "contract-constants",
    message: "Contract constants match the approved values.",
    run() {
      assertEqual(
        PROSPECT_POSITION_MODEL_CONTRACT_VERSION,
        APPROVED_VERSION,
        "Contract version must match the approved version."
      );
      assertDeepEqual(
        Object.values(PROSPECT_AGGREGATION_METHODS),
        ["NONE", "WEIGHTED_COMPONENTS", "MANUAL_GRADE"],
        "Aggregation methods must match the approved set."
      );
      assertDeepEqual(
        Object.values(PROSPECT_CONTRIBUTOR_ROLES),
        ["DIRECT", "SUPPORTING", "CONTEXT_ONLY", "EXCLUDED"],
        "Contributor roles must match the approved set."
      );
    },
  },
  {
    id: "complete-valid-component",
    message: "Complete valid component passed.",
    run() {
      const component = createValidComponent("accuracy", {
        required: true,
        weight: 0.5,
        provenance: { contributors: [createContributor()] },
        evidence: [{ path: "accuracy.charting" }],
        notes: ["Stable accuracy evidence."],
        missingEvidence: [],
      });
      assert(isProspectComponentResult(component), "Component guard must pass.");
      assert(validateProspectComponentResult(component).valid, "Standalone validation must pass.");
      assert(component.validation.valid, "Factory validation must pass.");
      assertEqual(component.contract, "ProspectComponentResult", "Component identifier must be stable.");
      assertEqual(component.score, 85, "Score must be preserved.");
      assertEqual(component.confidence, 0.8, "Confidence must be preserved.");
      assertEqual(component.evidenceLevel, EVIDENCE_LEVELS.STRONG, "Evidence level must be derived.");
    },
  },
  {
    id: "zero-component-score",
    message: "Zero component score remained valid.",
    run() {
      const component = createValidComponent("accuracy", { score: 0 });
      assertEqual(component.score, 0, "Zero must be preserved.");
      assert(component.available, "Zero must not make the component unavailable.");
      assert(component.validation.valid, "Zero score must validate.");
    },
  },
  {
    id: "fractional-grade-rounding",
    message: "Fractional grades were rounded.",
    run() {
      const component = createValidComponent("accuracy", { score: 84.6 });
      const model = createModel({ overallGrade: 87.4 });
      assertEqual(component.score, 85, "Component grade must round with Math.round semantics.");
      assertEqual(model.overallGrade, 87, "Model grade must round with Math.round semantics.");
    },
  },
  {
    id: "invalid-component-scores",
    message: "Invalid component scores normalized safely.",
    run() {
      [101, -1, Number.NaN, Number.POSITIVE_INFINITY, "85"].forEach((score) => {
        const component = createValidComponent("accuracy", { score });
        assertEqual(component.score, null, "Invalid score must become null.");
        assert(!component.validation.valid, "Invalid score must be recorded.");
        assert(
          component.validation.errors.some((entry) =>
            ["GRADE_OUT_OF_RANGE", "INVALID_GRADE"].includes(entry.code)
          ),
          "Invalid score must include a grade validation code."
        );
      });
    },
  },
  {
    id: "confidence-normalization",
    message: "Confidence normalization and evidence thresholds passed.",
    run() {
      const thresholds = [
        [0, EVIDENCE_LEVELS.NONE],
        [0.25, EVIDENCE_LEVELS.LIMITED],
        [0.5, EVIDENCE_LEVELS.MODERATE],
        [0.75, EVIDENCE_LEVELS.STRONG],
        [0.9, EVIDENCE_LEVELS.VERY_STRONG],
      ];
      thresholds.forEach(([confidence, level]) => {
        const component = createValidComponent("accuracy", { confidence });
        assertEqual(component.confidence, confidence, "Valid confidence must be preserved.");
        assertEqual(component.evidenceLevel, level, "Evidence level threshold must match.");
      });
      const below = createValidComponent("accuracy", { confidence: -0.2 });
      const above = createValidComponent("accuracy", { confidence: 1.2 });
      const string = createValidComponent("accuracy", { confidence: "0.8" });
      assertEqual(below.confidence, 0, "Low confidence must clamp to zero.");
      assertEqual(below.evidenceLevel, EVIDENCE_LEVELS.NONE, "Clamped confidence must drive evidence level.");
      assert(!below.validation.valid, "Low confidence must be recorded.");
      assertEqual(above.confidence, 1, "High confidence must clamp to one.");
      assertEqual(above.evidenceLevel, EVIDENCE_LEVELS.VERY_STRONG, "Clamped high confidence must derive evidence.");
      assert(!above.validation.valid, "High confidence must be recorded.");
      assertEqual(string.confidence, 0, "String confidence must normalize to zero.");
      assert(!string.validation.valid, "String confidence must be invalid.");
    },
  },
  {
    id: "missing-evidence-normalization",
    message: "Missing evidence normalized and deduplicated.",
    run() {
      const component = createValidComponent("accuracy", {
        missingEvidence: ["athletics.speed", "", "  ", 12, "production.sample", "athletics.speed"],
      });
      assertDeepEqual(
        component.missingEvidence,
        ["athletics.speed", "production.sample"],
        "Missing evidence must preserve first-valid order."
      );
      assertIncludesCode(component.validation, "DUPLICATE_STRING_ENTRY", "warnings");
    },
  },
  {
    id: "structured-provenance",
    message: "Structured provenance was preserved without inference.",
    run() {
      const direct = createContributor();
      const excluded = createContributor({
        contributorId: "scheme-fit",
        domain: "SCHEME_FIT",
        role: PROSPECT_CONTRIBUTOR_ROLES.EXCLUDED,
        contributedToScore: false,
        contributedToOverallGrade: false,
        exclusionReason: "NOT_APPLICABLE",
      });
      const component = createValidComponent("accuracy", {
        provenance: { contributors: [direct, excluded] },
      });
      const [normalizedDirect, normalizedExcluded] = component.provenance.contributors;
      assertEqual(normalizedDirect.versions.framework, "FRAMEWORK-1", "Framework version must be preserved.");
      assertDeepEqual(normalizedDirect.evidenceRefs, ["production.score"], "Evidence references must be preserved.");
      assertEqual(normalizedExcluded.role, PROSPECT_CONTRIBUTOR_ROLES.EXCLUDED, "Excluded role must be preserved.");
      assertEqual(normalizedExcluded.exclusionReason, "NOT_APPLICABLE", "Exclusion reason must be preserved.");
      assert(!normalizedExcluded.contributedToScore, "Contribution flag must not be inferred.");
      assert(!normalizedExcluded.contributedToOverallGrade, "Overall contribution flag must not be inferred.");
    },
  },
  {
    id: "complete-valid-model-result",
    message: "Complete weighted model result passed.",
    run() {
      const accuracy = createValidComponent("accuracy", { weight: 0.6 });
      const processing = createValidComponent("processing", { score: 82, weight: 0.4 });
      const model = createModel({
        components: { accuracy, processing },
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
          includedComponents: ["accuracy", "processing"],
          requestedWeights: { accuracy: 0.6, processing: 0.4 },
          appliedWeights: { accuracy: 0.6, processing: 0.4 },
          requestedWeightTotal: 1,
          appliedWeightTotal: 1,
          normalizationApplied: false,
        },
        conclusions: { archetype: "Diagnostic archetype", developmentPriorities: ["Processing"] },
        explanation: { strengths: ["Accuracy"], concerns: [], contextualFactors: ["Sample context"] },
        provenance: { contributors: [createContributor()] },
        versions: { model: "MODEL-1", weights: "WEIGHTS-1", data: "DATA-1" },
      });
      assert(isProspectPositionModelResult(model), "Model guard must pass.");
      assert(validateProspectPositionModelResult(model).valid, "Full validation must pass.");
      assert(validateProspectAggregation(model.aggregation, model.components).valid, "Aggregation must validate.");
      assert(model.validation.valid, "Factory validation must pass.");
      assertEqual(model.versions.contract, APPROVED_VERSION, "Contract version must be present.");
      assertEqual(model.versions.model, "MODEL-1", "Model version must be preserved.");
      assertEqual(model.versions.weights, "WEIGHTS-1", "Weight version must be preserved.");
    },
  },
  {
    id: "partial-available-result",
    message: "Available partial result preserved a null grade.",
    run() {
      const model = createModel({
        overallGrade: null,
        dataState: DATA_STATES.INSUFFICIENT_SAMPLE,
      });
      assert(model.available, "Partial result may remain available.");
      assertEqual(model.overallGrade, null, "No grade may be invented.");
      assert(model.validation.valid, "Null grade alone must not invalidate the result.");
    },
  },
  {
    id: "unavailable-result",
    message: "Unavailable factory returned the approved shape.",
    run() {
      const result = createUnavailableProspectPositionModelResult({
        model: "DiagnosticProspectModel",
        playerId: "diagnostic-player",
        position: "QB",
        missingEvidence: ["production.sample", "production.sample", "athletics.testing"],
        modelVersion: "MODEL-1",
      });
      assert(!result.available, "Unavailable result must be unavailable.");
      assertEqual(result.overallGrade, null, "Unavailable grade must be null.");
      assertEqual(result.confidence, 0, "Unavailable confidence must be zero.");
      assertEqual(result.evidenceLevel, EVIDENCE_LEVELS.NONE, "Unavailable evidence level must be NONE.");
      assertEqual(result.aggregation.method, PROSPECT_AGGREGATION_METHODS.NONE, "Unavailable aggregation must be NONE.");
      assertDeepEqual(result.components, {}, "Unavailable components must be empty.");
      assertDeepEqual(result.missingEvidence, ["production.sample", "athletics.testing"], "Missing evidence must normalize.");
      assert(isProspectPositionModelResult(result), "Unavailable guard must pass.");
      assert(result.validation.valid, "Valid unavailable metadata must pass.");
    },
  },
  {
    id: "unsupported-position-result",
    message: "Unsupported-position metadata remained explicit.",
    run() {
      const diagnostics = { reason: "UNSUPPORTED_POSITION" };
      const result = createUnavailableProspectPositionModelResult({
        model: "UnsupportedProspectModel",
        playerId: "diagnostic-player",
        position: "LS",
        dataState: DATA_STATES.NOT_APPLICABLE,
        missingEvidence: ["positionModel"],
        validationWarnings: [{ code: "UNSUPPORTED_POSITION", path: "position", message: "No model is registered." }],
        diagnostics,
      });
      assertEqual(result.dataState, DATA_STATES.NOT_APPLICABLE, "Explicit state must be preserved.");
      assertEqual(result.overallGrade, null, "No unsupported grade may be invented.");
      assertEqual(result.diagnostics, diagnostics, "Diagnostics object must be preserved.");
      assertIncludesCode(result.validation, "UNSUPPORTED_POSITION", "warnings");
      assert(result.validation.valid, "Warning-only unsupported result must remain structurally valid.");
    },
  },
  {
    id: "unavailable-numeric-grade",
    message: "Unavailable numeric grade was rejected.",
    run() {
      const result = createModel({ available: false, dataState: DATA_STATES.UNAVAILABLE, overallGrade: 80 });
      assert(!result.validation.valid, "Unavailable numeric grade must fail.");
      assertIncludesCode(result.validation, "UNAVAILABLE_RESULT_HAS_GRADE");
      const unavailable = createUnavailableProspectPositionModelResult();
      assertEqual(unavailable.overallGrade, null, "Unavailable factory must still force null.");
    },
  },
  {
    id: "required-invalid-component-promotion",
    message: "Required component error was promoted once.",
    run() {
      const component = createInvalidComponent("accuracy", { required: true });
      const result = createModel({ components: { accuracy: component } });
      assertEqual(result.components.accuracy.score, null, "Invalid score must remain null.");
      assertIncludesCode(result.components.accuracy.validation, "GRADE_OUT_OF_RANGE");
      assert(!result.validation.valid, "Required component error must invalidate the model.");
      assertEqual(promotedEntries(result, "accuracy").length, 1, "Required error must be promoted exactly once.");
      assertNoDuplicateValidationEntries(result.validation);
    },
  },
  {
    id: "critical-invalid-component-promotion",
    message: "Critical component error was promoted.",
    run() {
      const component = createInvalidComponent("accuracy", { critical: true });
      const result = createModel({ components: { accuracy: component } });
      assertEqual(promotedEntries(result, "accuracy").length, 1, "Critical error must be promoted.");
      assert(!result.validation.valid, "Critical error must invalidate the model.");
    },
  },
  {
    id: "included-invalid-component-promotion",
    message: "Included component error was promoted.",
    run() {
      const component = createInvalidComponent("accuracy");
      const result = createModel({
        components: { accuracy: component },
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.MANUAL_GRADE,
          includedComponents: ["accuracy"],
        },
      });
      assertEqual(promotedEntries(result, "accuracy").length, 1, "Included error must be promoted.");
      assert(!result.validation.valid, "Included error must invalidate the model.");
    },
  },
  {
    id: "positive-weight-invalid-component-promotion",
    message: "Positive-weight component error was promoted.",
    run() {
      const component = createInvalidComponent("accuracy");
      const result = createModel({
        components: { accuracy: component },
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.MANUAL_GRADE,
          appliedWeights: { accuracy: 0.5 },
          appliedWeightTotal: 0.5,
        },
      });
      assertEqual(promotedEntries(result, "accuracy").length, 1, "Positive-weight error must be promoted.");
      assert(!result.validation.valid, "Positive-weight error must invalidate the model.");
    },
  },
  {
    id: "contributor-invalid-component-promotion",
    message: "Contributor flags independently promoted component errors.",
    run() {
      ["contributedToScore", "contributedToOverallGrade"].forEach((flag) => {
        const component = createInvalidComponent("accuracy", {
          provenance: {
            contributors: [createContributor({
              contributedToScore: false,
              contributedToOverallGrade: false,
              [flag]: true,
            })],
          },
        });
        const result = createModel({ components: { accuracy: component } });
        assertEqual(promotedEntries(result, "accuracy").length, 1, `${flag} must promote the error.`);
        assert(!result.validation.valid, `${flag} must invalidate the model.`);
      });
    },
  },
  {
    id: "optional-component-warning-severity",
    message: "Optional noncontributing component error became a model warning.",
    run() {
      const component = createInvalidComponent("pressureResponse");
      const result = createModel({ components: { pressureResponse: component } });
      assert(!result.components.pressureResponse.validation.valid, "Component must remain locally invalid.");
      assertEqual(promotedEntries(result, "pressureResponse", "errors").length, 0, "Optional error must not become a model error.");
      assertEqual(promotedEntries(result, "pressureResponse", "warnings").length, 1, "Optional error must become one warning.");
      assert(result.validation.valid, "Warning-only model may remain valid.");
    },
  },
  {
    id: "component-warning-promotion",
    message: "Component warning remained a model warning.",
    run() {
      const component = createValidComponent("accuracy", {
        missingEvidence: ["athletics.testing", "athletics.testing"],
      });
      const result = createModel({ components: { accuracy: component } });
      assertIncludesCode(component.validation, "DUPLICATE_STRING_ENTRY", "warnings");
      assertIncludesCode(result.validation, "DUPLICATE_STRING_ENTRY", "warnings");
      assert(!entriesWithCode(result.validation, "DUPLICATE_STRING_ENTRY", "errors").length, "Warning must not become an error.");
    },
  },
  {
    id: "embedded-validation-preservation",
    message: "Embedded component validation survived normalization.",
    run() {
      const component = createInvalidComponent("accuracy", { required: true });
      const originalError = component.validation.errors[0];
      const result = createModel({ components: { accuracy: component } });
      const normalized = result.components.accuracy;
      assertEqual(normalized.score, null, "Invalid raw score must not return.");
      assert(
        normalized.validation.errors.some((entry) =>
          entry.code === originalError.code &&
          entry.path === originalError.path &&
          entry.message === originalError.message
        ),
        "Original validation entry must survive."
      );
      assertNoDuplicateValidationEntries(normalized.validation);
      assertEqual(promotedEntries(result, "accuracy").length, 1, "Preserved error must be promoted once.");
    },
  },
  {
    id: "aggregation-total-validation",
    message: "Aggregation totals and structural failures were validated.",
    run() {
      const components = { accuracy: createValidComponent() };
      const validAggregation = createModel({
        components,
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
          includedComponents: ["accuracy"],
          requestedWeights: { accuracy: 1 },
          appliedWeights: { accuracy: 1 },
          requestedWeightTotal: 1,
          appliedWeightTotal: 1,
        },
        versions: { model: "MODEL-1", weights: "WEIGHTS-1" },
      });
      assert(validAggregation.validation.valid, "Valid totals must pass.");
      const baseAggregation = validAggregation.aggregation;
      const invalidInputs = [
        { ...baseAggregation, requestedWeights: { accuracy: -1 }, requestedWeightTotal: -1 },
        { ...baseAggregation, appliedWeights: { accuracy: Number.POSITIVE_INFINITY }, appliedWeightTotal: Number.POSITIVE_INFINITY },
        { ...baseAggregation, includedComponents: ["unknown"] },
        { ...baseAggregation, includedComponents: ["accuracy", "accuracy"] },
        { ...baseAggregation, excludedComponents: [{ key: "accuracy", reason: "" }] },
      ];
      invalidInputs.forEach((aggregation) => {
        assert(!validateProspectAggregation(aggregation, components).valid, "Invalid aggregation must fail.");
      });
      const invalidTotal = createModel({
        components,
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
          includedComponents: ["accuracy"],
          requestedWeights: { accuracy: 0.5 },
          appliedWeights: { accuracy: 0.5 },
          requestedWeightTotal: 0.5,
          appliedWeightTotal: 0.5,
        },
        versions: { model: "MODEL-1", weights: "WEIGHTS-1" },
      });
      assert(!invalidTotal.validation.valid, "Numeric weighted grade requires applied total 1.");
      assertIncludesCode(invalidTotal.validation, "IMPOSSIBLE_AGGREGATION");
    },
  },
  {
    id: "requested-applied-weight-metadata",
    message: "Requested/applied weight metadata was validated without mutation.",
    run() {
      const components = {
        accuracy: createValidComponent(),
        processing: createValidComponent("processing"),
      };
      const aggregation = {
        method: PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
        includedComponents: ["accuracy", "processing"],
        requestedWeights: { accuracy: 0.6, processing: 0.4 },
        appliedWeights: { accuracy: 0.7, processing: 0.3 },
        requestedWeightTotal: 1,
        appliedWeightTotal: 1,
        normalizationApplied: true,
      };
      const valid = createModel({ components, aggregation, versions: { model: "MODEL-1", weights: "WEIGHTS-1" } });
      assert(valid.validation.valid, "Explicit normalization metadata must pass.");
      const inconsistent = createModel({
        components,
        aggregation: { ...aggregation, normalizationApplied: false },
        versions: { model: "MODEL-1", weights: "WEIGHTS-1" },
      });
      assertIncludesCode(inconsistent.validation, "NORMALIZATION_FLAG_INCONSISTENT", "warnings");
      assertEqual(inconsistent.aggregation.normalizationApplied, false, "Flag must not be changed.");
      assertDeepEqual(inconsistent.aggregation.appliedWeights, aggregation.appliedWeights, "Weights must not be recalculated.");
    },
  },
  {
    id: "weighted-null-grade-result",
    message: "Weighted null-grade result preserved incomplete totals.",
    run() {
      const result = createModel({
        overallGrade: null,
        components: { accuracy: createValidComponent() },
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
          includedComponents: ["accuracy"],
          requestedWeights: { accuracy: 0.5 },
          appliedWeights: { accuracy: 0.5 },
          requestedWeightTotal: 0.5,
          appliedWeightTotal: 0.5,
          normalizationApplied: false,
        },
        versions: { model: "MODEL-1", weights: "WEIGHTS-1" },
      });
      assertEqual(result.overallGrade, null, "No grade may be calculated.");
      assert(result.validation.valid, "Incomplete totals alone must not reject a null-grade result.");
      const structuralError = validateProspectAggregation(
        { ...result.aggregation, appliedWeights: { accuracy: -0.5 }, appliedWeightTotal: -0.5 },
        result.components
      );
      assert(!structuralError.valid, "Structural weight errors must still fail.");
    },
  },
  {
    id: "version-requirements",
    message: "Model and weight version requirements were enforced.",
    run() {
      const missingModel = createModel({ versions: {} });
      assertIncludesCode(missingModel.validation, "MISSING_MODEL_VERSION");
      assertEqual(missingModel.versions.model, null, "Model version must not be invented.");
      const weighted = createModel({
        aggregation: {
          method: PROSPECT_AGGREGATION_METHODS.WEIGHTED_COMPONENTS,
          includedComponents: ["accuracy"],
          requestedWeights: { accuracy: 1 },
          appliedWeights: { accuracy: 1 },
          requestedWeightTotal: 1,
          appliedWeightTotal: 1,
        },
        versions: { model: "MODEL-1" },
      });
      assertIncludesCode(weighted.validation, "MISSING_WEIGHT_VERSION");
      assertEqual(weighted.versions.weights, null, "Weight version must not be invented.");
      const dataOptional = createModel({ versions: { model: "MODEL-1" } });
      assert(dataOptional.validation.valid, "Data version must remain optional.");
      assertEqual(dataOptional.versions.data, null, "Data version may remain null.");
      assertEqual(dataOptional.versions.contract, APPROVED_VERSION, "Factory must supply contract version.");
    },
  },
  {
    id: "identity-requirements",
    message: "Available identity requirements and unavailable flexibility passed.",
    run() {
      assertIncludesCode(createModel({ playerId: null }).validation, "MISSING_PLAYER_ID");
      assertIncludesCode(createModel({ position: null }).validation, "MISSING_POSITION");
      assertIncludesCode(createModel({ model: "" }).validation, "INVALID_MODEL_IDENTITY");
      const unavailable = createUnavailableProspectPositionModelResult();
      assert(unavailable.validation.valid, "Unavailable result may omit player and position identities.");
    },
  },
  {
    id: "invalid-explicit-evidence-level",
    message: "Invalid evidence level normalized safely.",
    run() {
      const component = createValidComponent("accuracy", { confidence: 0.8, evidenceLevel: "ELITE" });
      assertEqual(component.evidenceLevel, EVIDENCE_LEVELS.STRONG, "Safe derived level must replace invalid value.");
      assertIncludesCode(component.validation, "INVALID_EVIDENCE_LEVEL");
      assert(component.evidenceLevel !== "ELITE", "Unsupported level must not remain.");
    },
  },
  {
    id: "invalid-explicit-data-state",
    message: "Invalid data state normalized safely.",
    run() {
      const invalid = createValidComponent("accuracy", { dataState: "READY" });
      const valid = createValidComponent("accuracy", { dataState: DATA_STATES.INSUFFICIENT_SAMPLE });
      assertEqual(invalid.dataState, DATA_STATES.AVAILABLE, "Invalid state must use derived default.");
      assertIncludesCode(invalid.validation, "INVALID_DATA_STATE");
      assertEqual(valid.dataState, DATA_STATES.INSUFFICIENT_SAMPLE, "Valid explicit state must be preserved.");
    },
  },
  {
    id: "guard-behavior",
    message: "Guards remained shallow structural checks.",
    run() {
      const component = createValidComponent();
      const model = createModel();
      [null, [], {}, { contract: "Wrong" }].forEach((value) => {
        assert(!isProspectComponentResult(value), "Invalid component shape must fail guard.");
        assert(!isProspectPositionModelResult(value), "Invalid model shape must fail guard.");
      });
      assert(isProspectComponentResult(component), "Valid component shape must pass.");
      assert(isProspectPositionModelResult(model), "Valid model shape must pass.");
      const semanticInvalid = { ...component, score: 101 };
      assert(isProspectComponentResult(semanticInvalid), "Shape-valid semantic error must pass guard.");
      assert(!validateProspectComponentResult(semanticInvalid).valid, "Validator must reject semantic error.");
    },
  },
  {
    id: "diagnostics-preservation",
    message: "Diagnostics were preserved only when supplied.",
    run() {
      const componentDiagnostics = { rawScore: 101 };
      const modelDiagnostics = { benchmark: "diagnostic" };
      const component = createValidComponent("accuracy", { diagnostics: componentDiagnostics });
      const model = createModel({ diagnostics: modelDiagnostics });
      assertEqual(component.diagnostics, componentDiagnostics, "Component diagnostics must be preserved.");
      assertEqual(model.diagnostics, modelDiagnostics, "Model diagnostics must be preserved.");
      assertEqual(createValidComponent().diagnostics, null, "Default component diagnostics must be null.");
      assertEqual(createModel().diagnostics, null, "Default model diagnostics must be null.");
    },
  },
  {
    id: "conclusions-normalization",
    message: "Conclusions returned the stable shape without invention.",
    run() {
      const empty = createModel({ conclusions: {} }).conclusions;
      assertDeepEqual(empty, {
        archetype: null,
        readiness: null,
        ceiling: null,
        floor: null,
        riskProfile: null,
        translationRisk: null,
        roleProjection: null,
        developmentPriorities: [],
      }, "Empty conclusions must use stable defaults.");
      const archetype = { name: "Structured archetype" };
      const supplied = createModel({ conclusions: { archetype, readiness: "DEVELOPING", developmentPriorities: ["Footwork"] } }).conclusions;
      assertEqual(supplied.archetype, archetype, "Structured conclusion must be preserved.");
      assertEqual(supplied.readiness, "DEVELOPING", "Scalar conclusion must be preserved.");
      assertDeepEqual(supplied.developmentPriorities, ["Footwork"], "Priorities must remain an array.");
    },
  },
  {
    id: "explanation-normalization",
    message: "Explanation returned the stable structured shape.",
    run() {
      const explanation = createModel({
        explanation: {
          strengths: ["Accuracy"],
          concerns: ["Pressure"],
          contextualFactors: ["Limited sample"],
          componentExplanations: {
            accuracy: {
              scoreRationale: ["Charted accuracy"],
              supportingEvidence: ["production.accuracy"],
              conflictingEvidence: [],
              missingEvidence: ["pressure splits"],
              confidenceRationale: ["Stable sample"],
              developmentImplications: ["Continue footwork work"],
            },
          },
        },
      }).explanation;
      assertDeepEqual(explanation.strengths, ["Accuracy"], "Strengths must be preserved.");
      assertDeepEqual(explanation.concerns, ["Pressure"], "Concerns must be preserved.");
      assertDeepEqual(explanation.contextualFactors, ["Limited sample"], "Context must be preserved.");
      assertDeepEqual(explanation.componentExplanations.accuracy.scoreRationale, ["Charted accuracy"], "Component explanation arrays must be preserved.");
      const empty = createModel({ explanation: {} }).explanation;
      assertDeepEqual(empty, { strengths: [], concerns: [], contextualFactors: [], componentExplanations: {} }, "No prose may be invented.");
    },
  },
  {
    id: "public-export-integrity",
    message: "All approved public exports are present.",
    run() {
      const exports = {
        PROSPECT_POSITION_MODEL_CONTRACT_VERSION,
        PROSPECT_AGGREGATION_METHODS,
        PROSPECT_CONTRIBUTOR_ROLES,
        createProspectComponentResult,
        createProspectPositionModelResult,
        createUnavailableProspectPositionModelResult,
        validateProspectComponentResult,
        validateProspectAggregation,
        validateProspectPositionModelResult,
        isProspectComponentResult,
        isProspectPositionModelResult,
      };
      Object.entries(exports).forEach(([name, value]) => {
        assert(value != null, `Named export ${name} must exist.`);
        assert(prospectPositionModelContract[name] != null, `Default export must include ${name}.`);
      });
    },
  },
];

export function runProspectPositionModelContractDiagnostics({
  throwOnFailure = false,
} = {}) {
  const tests = DIAGNOSTIC_CASES.map(({ id, message, run }) =>
    runDiagnosticCase(id, message, run)
  );
  const passedCount = tests.filter((test) => test.passed).length;
  const failedCount = tests.length - passedCount;
  const report = {
    suite: SUITE,
    contractVersion: PROSPECT_POSITION_MODEL_CONTRACT_VERSION,
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
  runProspectPositionModelContractDiagnostics,
};
