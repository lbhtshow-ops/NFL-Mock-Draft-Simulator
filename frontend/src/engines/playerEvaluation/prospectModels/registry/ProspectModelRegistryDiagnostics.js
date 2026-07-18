import registryModule, {
  PROSPECT_MODEL_POSITIONS,
  PROSPECT_POSITION_ALIASES,
  normalizeProspectPosition,
  createProspectModelRegistry,
  getProspectModel,
  hasProspectModel,
  listSupportedProspectPositions,
  evaluateProspectByPosition,
} from "./ProspectModelRegistry.js";
import {
  PROSPECT_AGGREGATION_METHODS,
  createProspectComponentResult,
  createProspectPositionModelResult,
  isProspectPositionModelResult,
  validateProspectPositionModelResult,
} from "../ProspectPositionModelContract.js";

const SUITE = "ProspectModelRegistryDiagnostics";

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

function assertCode(result, code, field = "errors") {
  assert(
    (result?.validation?.[field] ?? []).some(
      (entry) => entry.code === code
    ),
    `Expected ${field} to include ${code}.`,
    result?.validation
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

function modelResult({
  model = "DiagnosticQuarterbackModel",
  position = "QB",
  modelVersion = "MODEL-1",
  weightVersion = "WEIGHTS-1",
  playerId = "player-1",
  available = true,
  overallGrade = 80,
  components = {},
} = {}) {
  return createProspectPositionModelResult({
    model,
    playerId,
    position,
    available,
    overallGrade,
    confidence: 0.8,
    components,
    aggregation: {
      method:
        overallGrade == null
          ? PROSPECT_AGGREGATION_METHODS.NONE
          : PROSPECT_AGGREGATION_METHODS.MANUAL_GRADE,
    },
    versions: {
      model: modelVersion,
      weights: weightVersion,
    },
  });
}

function descriptor(overrides = {}) {
  return {
    position: "QB",
    modelName: "DiagnosticQuarterbackModel",
    modelVersion: "MODEL-1",
    weightVersion: "WEIGHTS-1",
    evaluate: ({ playerId }) => modelResult({ playerId }),
    ...overrides,
  };
}

function localRegistry(descriptors = [descriptor()]) {
  return createProspectModelRegistry({ descriptors });
}

function execute(registry, overrides = {}) {
  return registry.evaluateProspectByPosition({
    position: "QB",
    playerId: "player-1",
    context: { playerId: "player-1", position: "QB" },
    intelligence: {},
    ...overrides,
  });
}

const CASES = [
  {
    id: "public-export-integrity",
    message: "Registry public exports are complete.",
    run() {
      const exports = {
        PROSPECT_MODEL_POSITIONS,
        PROSPECT_POSITION_ALIASES,
        normalizeProspectPosition,
        createProspectModelRegistry,
        getProspectModel,
        hasProspectModel,
        listSupportedProspectPositions,
        evaluateProspectByPosition,
      };
      Object.entries(exports).forEach(([name, value]) => {
        assert(value != null, `${name} must exist.`);
        assert(registryModule[name] != null, `Default export must contain ${name}.`);
      });
    },
  },
  {
    id: "canonical-position-constants",
    message: "Canonical positions match the approved set.",
    run() {
      assertDeepEqual(Object.values(PROSPECT_MODEL_POSITIONS), ["QB", "RB", "WR", "TE", "OT", "IOL", "DL", "EDGE", "LB", "CB", "S", "K", "P"], "Canonical order must match.");
      assert(Object.isFrozen(PROSPECT_MODEL_POSITIONS), "Canonical constants must be frozen.");
      assertEqual(Object.keys(PROSPECT_MODEL_POSITIONS).length, 13, "Exactly 13 positions are required.");
    },
  },
  {
    id: "canonical-position-normalization",
    message: "Every canonical position normalized directly.",
    run() {
      Object.values(PROSPECT_MODEL_POSITIONS).forEach((position) => {
        const result = normalizeProspectPosition(position);
        assertEqual(result.canonicalPosition, position, `${position} must resolve.`);
        assertEqual(result.reason, "CANONICAL_POSITION", "Canonical reason must be stable.");
      });
    },
  },
  {
    id: "safe-full-name-aliases",
    message: "Representative aliases resolved for every group.",
    run() {
      const aliases = {
        QUARTERBACK: "QB",
        "RUNNING BACK": "RB",
        "WIDE RECEIVER": "WR",
        "TIGHT END": "TE",
        "OFFENSIVE TACKLE": "OT",
        GUARD: "IOL",
        "DEFENSIVE TACKLE": "DL",
        "EDGE RUSHER": "EDGE",
        LINEBACKER: "LB",
        CORNERBACK: "CB",
        "FREE SAFETY": "S",
        KICKER: "K",
        PUNTER: "P",
      };
      Object.entries(aliases).forEach(([alias, position]) => {
        const result = normalizeProspectPosition(alias);
        assertEqual(result.canonicalPosition, position, `${alias} must resolve.`);
        assertEqual(result.reason, "ALIASED_POSITION", "Alias reason must be stable.");
      });
    },
  },
  {
    id: "position-text-normalization",
    message: "Case, spacing, hyphen, and underscore normalization passed.",
    run() {
      [" quarterback ", "WIDE-RECEIVER", "interior_offensive_line", "  free   safety  "].forEach((input, index) => {
        const expected = ["QB", "WR", "IOL", "S"][index];
        assertEqual(normalizeProspectPosition(input).canonicalPosition, expected, `${input} must normalize.`);
      });
    },
  },
  {
    id: "ambiguous-defensive-end",
    message: "Defensive-end labels remained ambiguous.",
    run() {
      ["DE", "DEFENSIVE END"].forEach((position) => {
        const result = normalizeProspectPosition(position);
        assert(result.ambiguous, "Defensive end must be ambiguous.");
        assertEqual(result.canonicalPosition, null, "No model may be chosen.");
      });
    },
  },
  {
    id: "ambiguous-outside-linebacker",
    message: "Outside-linebacker labels remained ambiguous.",
    run() {
      ["OLB", "OUTSIDE LINEBACKER"].forEach((position) => {
        assertEqual(normalizeProspectPosition(position).reason, "AMBIGUOUS_POSITION", "OLB must be ambiguous.");
      });
    },
  },
  {
    id: "ambiguous-broad-positions",
    message: "Broad positions remained ambiguous.",
    run() {
      ["OL", "T", "DB", "ATH"].forEach((position) => {
        assert(normalizeProspectPosition(position).ambiguous, `${position} must be ambiguous.`);
      });
    },
  },
  {
    id: "ambiguous-hybrid-labels",
    message: "Hybrid position labels remained ambiguous.",
    run() {
      ["WR/TE", "EDGE/LB", "DL/EDGE", "QB/WR"].forEach((position) => {
        assertEqual(normalizeProspectPosition(position).reason, "AMBIGUOUS_POSITION", `${position} must be ambiguous.`);
      });
    },
  },
  {
    id: "unsupported-positions",
    message: "Fullback and long snapper remained unsupported.",
    run() {
      ["FB", "FULLBACK", "LS", "LONG SNAPPER"].forEach((position) => {
        assertEqual(normalizeProspectPosition(position).reason, "UNSUPPORTED_POSITION", `${position} must be unsupported.`);
      });
    },
  },
  {
    id: "unknown-position",
    message: "Unknown position remained unknown.",
    run() {
      const result = normalizeProspectPosition("WINGBACK");
      assertEqual(result.reason, "UNKNOWN_POSITION", "Unknown reason must be stable.");
      assertEqual(result.canonicalPosition, null, "Unknown position must not resolve.");
    },
  },
  {
    id: "invalid-position-input",
    message: "Invalid position inputs returned safe results.",
    run() {
      [null, undefined, "", "   ", [], 12, {}].forEach((position) => {
        assertEqual(normalizeProspectPosition(position).reason, "INVALID_POSITION_INPUT", "Invalid input must be rejected.");
      });
    },
  },
  {
    id: "empty-production-registry",
    message: "Production registry contains no models.",
    run() {
      Object.values(PROSPECT_MODEL_POSITIONS).forEach((position) => {
        assertEqual(getProspectModel(position), null, `${position} must be unregistered.`);
        assert(!hasProspectModel(position), `${position} must report false.`);
      });
    },
  },
  {
    id: "planned-position-listing",
    message: "Production listing contains 13 unimplemented positions.",
    run() {
      const listing = listSupportedProspectPositions();
      assertEqual(listing.length, 13, "Listing must contain 13 records.");
      assert(listing.every((entry) => !entry.implemented && entry.modelName === null), "Production entries must be unimplemented.");
    },
  },
  {
    id: "valid-isolated-registry",
    message: "Valid isolated registry passed validation.",
    run() {
      assert(localRegistry().validation.valid, "Local registry must be valid.");
    },
  },
  {
    id: "successful-canonical-lookup",
    message: "Canonical lookup returned the descriptor.",
    run() {
      const found = localRegistry().getProspectModel("QB");
      assertEqual(found.modelName, "DiagnosticQuarterbackModel", "Descriptor must be found.");
      assert(Object.isFrozen(found), "Stored descriptor must be frozen.");
    },
  },
  {
    id: "successful-alias-lookup",
    message: "Alias lookup reached the canonical descriptor.",
    run() {
      const registry = localRegistry();
      assertEqual(registry.getProspectModel("quarterback"), registry.getProspectModel("QB"), "Alias must return same descriptor.");
    },
  },
  {
    id: "supported-model-boolean-lookup",
    message: "Boolean lookup reflected registration.",
    run() {
      const registry = localRegistry();
      assert(registry.hasProspectModel("QB"), "QB must be registered locally.");
      assert(!registry.hasProspectModel("RB"), "RB must remain unregistered.");
    },
  },
  {
    id: "implemented-position-listing",
    message: "Local listing marked only QB implemented.",
    run() {
      const listing = localRegistry().listSupportedProspectPositions();
      assertEqual(listing.filter((entry) => entry.implemented).length, 1, "Only one model may be implemented.");
      assert(listing.find((entry) => entry.position === "QB").implemented, "QB must be implemented.");
      assert(!Object.prototype.hasOwnProperty.call(listing[0], "evaluate"), "Listing must omit evaluator.");
    },
  },
  {
    id: "descriptor-immutability",
    message: "Caller descriptor mutation did not alter registration.",
    run() {
      const source = descriptor();
      const registry = localRegistry([source]);
      source.modelName = "Changed";
      assertEqual(registry.getProspectModel("QB").modelName, "DiagnosticQuarterbackModel", "Stored descriptor must be copied.");
    },
  },
  {
    id: "registry-api-immutability",
    message: "Registry API exposes no mutation surface.",
    run() {
      const registry = localRegistry();
      assert(Object.isFrozen(registry), "Registry API must be frozen.");
      assert(!Object.prototype.hasOwnProperty.call(registry, "registerProspectModel"), "Registration mutation must not exist.");
    },
  },
  {
    id: "invalid-descriptor-input",
    message: "Invalid descriptor entries were rejected.",
    run() {
      [null, "descriptor", { position: "QB" }].forEach((entry) => {
        assert(!localRegistry([entry]).validation.valid, "Invalid descriptor must fail registry validation.");
      });
    },
  },
  {
    id: "invalid-descriptor-position",
    message: "Aliases and unknown descriptor positions were rejected.",
    run() {
      ["QUARTERBACK", "UNKNOWN"].forEach((position) => {
        const registry = localRegistry([descriptor({ position })]);
        assert(!registry.validation.valid, "Noncanonical descriptor position must fail.");
        assertCode({ validation: registry.validation }, "INVALID_DESCRIPTOR_POSITION");
      });
    },
  },
  {
    id: "missing-descriptor-model-name",
    message: "Missing model name was rejected.",
    run() {
      const registry = localRegistry([descriptor({ modelName: "" })]);
      assertCode({ validation: registry.validation }, "MISSING_MODEL_NAME");
    },
  },
  {
    id: "missing-descriptor-model-version",
    message: "Missing model version was rejected.",
    run() {
      const registry = localRegistry([descriptor({ modelVersion: null })]);
      assertCode({ validation: registry.validation }, "MISSING_MODEL_VERSION");
    },
  },
  {
    id: "invalid-descriptor-weight-version",
    message: "Invalid weight version was rejected.",
    run() {
      const registry = localRegistry([descriptor({ weightVersion: 2 })]);
      assertCode({ validation: registry.validation }, "INVALID_WEIGHT_VERSION");
    },
  },
  {
    id: "missing-descriptor-evaluator",
    message: "Missing evaluator was rejected.",
    run() {
      const registry = localRegistry([descriptor({ evaluate: null })]);
      assertCode({ validation: registry.validation }, "MISSING_MODEL_EVALUATOR");
    },
  },
  {
    id: "duplicate-descriptor-position",
    message: "Duplicate descriptor position was detected without replacement.",
    run() {
      const first = descriptor();
      const second = descriptor({ modelName: "Replacement" });
      const registry = localRegistry([first, second]);
      assertCode({ validation: registry.validation }, "DUPLICATE_MODEL_POSITION");
      assertEqual(registry.getProspectModel("QB").modelName, first.modelName, "First descriptor must remain stored.");
    },
  },
  {
    id: "invalid-descriptors-array",
    message: "Nonarray descriptor input was rejected.",
    run() {
      [null, "descriptors", {}].forEach((descriptors) => {
        const registry = createProspectModelRegistry({ descriptors });
        assertCode({ validation: registry.validation }, "INVALID_DESCRIPTORS_ARRAY");
      });
    },
  },
  {
    id: "invalid-registry-execution-block",
    message: "Invalid registry did not invoke an evaluator.",
    run() {
      let calls = 0;
      const registry = localRegistry([
        descriptor({ evaluate: () => { calls += 1; return modelResult(); } }),
        null,
      ]);
      const result = execute(registry);
      assertEqual(calls, 0, "Evaluator must not run.");
      assertCode(result, "INVALID_REGISTRY_CONFIGURATION");
    },
  },
  {
    id: "successful-model-execution",
    message: "Valid model execution returned its result unchanged.",
    run() {
      const expected = modelResult();
      const registry = localRegistry([descriptor({ evaluate: () => expected })]);
      assertEqual(execute(registry), expected, "Valid result reference must be returned unchanged.");
    },
  },
  {
    id: "valid-partial-model-result",
    message: "Valid partial model result was accepted.",
    run() {
      const partial = modelResult({ overallGrade: null });
      const registry = localRegistry([descriptor({ evaluate: () => partial })]);
      assertEqual(execute(registry), partial, "Partial result must be accepted.");
      assert(partial.available, "Partial result remains available.");
    },
  },
  {
    id: "missing-player-id",
    message: "Missing player ID returned unavailable output.",
    run() {
      const result = execute(localRegistry(), { playerId: null, context: null });
      assert(!result.available, "Missing ID must be unavailable.");
      assertCode(result, "MISSING_PLAYER_ID");
    },
  },
  {
    id: "player-context-id-mismatch",
    message: "Player/context ID mismatch was rejected.",
    run() {
      const result = execute(localRegistry(), { context: { playerId: "other", position: "QB" } });
      assertCode(result, "PLAYER_ID_CONTEXT_MISMATCH");
    },
  },
  {
    id: "position-context-mismatch",
    message: "Dispatch/context position mismatch was rejected.",
    run() {
      const result = execute(localRegistry(), { context: { playerId: "player-1", position: "RB" } });
      assertCode(result, "POSITION_CONTEXT_MISMATCH");
    },
  },
  {
    id: "unsupported-execution-inputs",
    message: "Invalid, unknown, ambiguous, and unsupported dispatches returned unavailable results.",
    run() {
      const cases = [[null, "INVALID_POSITION_INPUT"], ["WINGBACK", "UNKNOWN_POSITION"], ["DE", "AMBIGUOUS_POSITION"], ["LS", "UNSUPPORTED_POSITION"]];
      cases.forEach(([position, code]) => {
        const result = evaluateProspectByPosition({ position, playerId: "player-1" });
        assertCode(result, code);
        assert(!result.available, "Unsupported dispatch must be unavailable.");
      });
    },
  },
  {
    id: "model-not-registered",
    message: "Planned unregistered position returned stable failure.",
    run() {
      const result = evaluateProspectByPosition({ position: "QB", playerId: "player-1" });
      assertCode(result, "MODEL_NOT_REGISTERED");
      assertEqual(result.model, "ProspectModelRegistry", "No future model name may be fabricated.");
    },
  },
  {
    id: "evaluator-invocation-shape",
    message: "Evaluator received prepared fields without registry options.",
    run() {
      let received;
      const registry = localRegistry([descriptor({ evaluate: (input) => { received = input; return modelResult({ playerId: input.playerId }); } })]);
      const player = { name: "Player" };
      const intelligence = { production: {} };
      execute(registry, { position: "quarterback", player, intelligence, scouting: { note: true }, options: { mode: "diagnostic" }, registryOptions: { includeDiagnostics: true } });
      assertEqual(received.position, "QB", "Evaluator position must be canonical.");
      assertEqual(received.player, player, "Player must pass through.");
      assertEqual(received.intelligence, intelligence, "Intelligence must pass through.");
      assert(!Object.prototype.hasOwnProperty.call(received, "registryOptions"), "Registry options must not reach evaluator.");
    },
  },
  {
    id: "evaluator-exception",
    message: "Throwing evaluator returned nonthrowing unavailable output.",
    run() {
      const registry = localRegistry([descriptor({ evaluate: () => { throw new Error("Diagnostic failure"); } })]);
      const result = execute(registry);
      assertCode(result, "MODEL_EXECUTION_FAILED");
      assert(!result.available, "Exception output must be unavailable.");
    },
  },
  {
    id: "safe-exception-diagnostics",
    message: "Exception diagnostics preserved safe fields without stack.",
    run() {
      const registry = localRegistry([descriptor({ evaluate: () => { throw new TypeError("Safe message"); } })]);
      const result = execute(registry, { registryOptions: { includeDiagnostics: true } });
      assertDeepEqual(result.diagnostics.registry.exception, { name: "TypeError", message: "Safe message" }, "Safe exception fields must be preserved.");
      assert(!Object.prototype.hasOwnProperty.call(result.diagnostics.registry.exception, "stack"), "Stack must be omitted.");
    },
  },
  {
    id: "evaluator-null-output",
    message: "Null evaluator output was rejected.",
    run() {
      const result = execute(localRegistry([descriptor({ evaluate: () => null })]));
      assertCode(result, "INVALID_MODEL_RESULT");
    },
  },
  {
    id: "evaluator-unrelated-output",
    message: "Unrelated evaluator output was rejected.",
    run() {
      const result = execute(localRegistry([descriptor({ evaluate: () => ({ grade: 80 }) })]));
      assertCode(result, "INVALID_MODEL_RESULT");
    },
  },
  {
    id: "evaluator-invalid-contract-output",
    message: "Semantically invalid contract output was rejected.",
    run() {
      const invalid = { ...modelResult(), confidence: 2 };
      const result = execute(localRegistry([descriptor({ evaluate: () => invalid })]));
      assertCode(result, "INVALID_MODEL_RESULT");
    },
  },
  {
    id: "model-result-position-mismatch",
    message: "Returned position mismatch was rejected.",
    run() {
      const result = execute(localRegistry([descriptor({ evaluate: () => modelResult({ position: "RB" }) })]));
      assertCode(result, "MODEL_RESULT_POSITION_MISMATCH");
    },
  },
  {
    id: "model-result-name-mismatch",
    message: "Returned model name mismatch was rejected.",
    run() {
      const result = execute(localRegistry([descriptor({ evaluate: () => modelResult({ model: "OtherModel" }) })]));
      assertCode(result, "MODEL_RESULT_NAME_MISMATCH");
    },
  },
  {
    id: "model-version-mismatch",
    message: "Returned model version mismatch was rejected.",
    run() {
      const result = execute(localRegistry([descriptor({ evaluate: () => modelResult({ modelVersion: "MODEL-2" }) })]));
      assertCode(result, "MODEL_VERSION_MISMATCH");
    },
  },
  {
    id: "weight-version-mismatch",
    message: "Returned weight version mismatch was rejected.",
    run() {
      const result = execute(localRegistry([descriptor({ evaluate: () => modelResult({ weightVersion: "WEIGHTS-2" }) })]));
      assertCode(result, "WEIGHT_VERSION_MISMATCH");
    },
  },
  {
    id: "warning-only-valid-result",
    message: "Warning-only valid model result was accepted.",
    run() {
      const optionalInvalid = createProspectComponentResult({ key: "optional", score: 101, available: true });
      const warningResult = modelResult({ components: { optional: optionalInvalid } });
      assert(warningResult.validation.valid && warningResult.validation.warnings.length, "Fixture must be warning-only.");
      const registry = localRegistry([descriptor({ evaluate: () => warningResult })]);
      assertEqual(execute(registry), warningResult, "Warning-only result must pass unchanged.");
    },
  },
  {
    id: "dispatch-input-immutability",
    message: "Registry execution did not mutate dispatch inputs.",
    run() {
      const input = { position: "quarterback", playerId: " player-1 ", player: { id: "player-1" }, context: { playerId: "player-1", position: "QB" }, intelligence: { production: {} }, scouting: { notes: [] }, options: { mode: "test" }, registryOptions: { includeDiagnostics: false } };
      const before = JSON.stringify(input);
      localRegistry().evaluateProspectByPosition(input);
      assertEqual(JSON.stringify(input), before, "Dispatch input must remain unchanged.");
    },
  },
  {
    id: "deterministic-repeated-execution",
    message: "Repeated registry execution was deterministic.",
    run() {
      const registry = localRegistry();
      assertDeepEqual(execute(registry), execute(registry), "Repeated results must match.");
    },
  },
  {
    id: "no-production-mutation-leakage",
    message: "Local registries did not alter production state.",
    run() {
      localRegistry();
      assertEqual(getProspectModel("QB"), null, "Production QB must remain absent.");
      assert(!hasProspectModel("quarterback"), "Production alias lookup must remain absent.");
      assert(listSupportedProspectPositions().every((entry) => !entry.implemented), "Production listing must remain empty.");
    },
  },
  {
    id: "fallback-contract-compatibility",
    message: "Every registry fallback remained contract-compatible.",
    run() {
      const fallbacks = [
        evaluateProspectByPosition({ position: null, playerId: "player-1" }),
        evaluateProspectByPosition({ position: "QB", playerId: "player-1" }),
        execute(localRegistry(), { playerId: null, context: null }),
        execute(localRegistry([descriptor({ evaluate: () => null })])),
      ];
      fallbacks.forEach((result) => {
        assert(isProspectPositionModelResult(result), "Fallback guard must pass.");
        assert(validateProspectPositionModelResult(result).valid, "Fallback structure must validate.");
      });
    },
  },
];

export function runProspectModelRegistryDiagnostics({
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
  runProspectModelRegistryDiagnostics,
};
