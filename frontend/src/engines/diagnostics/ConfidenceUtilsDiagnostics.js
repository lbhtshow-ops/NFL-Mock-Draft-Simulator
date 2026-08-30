import {
  DATA_STATES,
  EVIDENCE_LEVELS,
} from "../contracts/IntelligenceResultContract.js";
import {
  assessConfidence,
  getEvidenceLevelForConfidence,
  normalizeConfidence,
} from "../shared/confidenceUtils.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function equal(actual, expected, message) {
  assert(Object.is(actual, expected), `${message} Expected ${String(expected)}, received ${String(actual)}.`);
}

const cases = [];

function diagnostic(id, run) {
  cases.push({ id, run });
}

[
  ["zero", 0, 0],
  ["one", 1, 1],
  ["middle", 0.42, 0.42],
  ["negative-clamp", -0.1, 0],
  ["positive-clamp", 1.1, 1],
].forEach(([id, input, expected]) => {
  diagnostic(`normalize-${id}`, () => equal(normalizeConfidence(input), expected, "Confidence normalization changed."));
});

[
  ["numeric-string", "0.8"],
  ["null", null],
  ["undefined", undefined],
  ["nan", Number.NaN],
  ["positive-infinity", Number.POSITIVE_INFINITY],
  ["negative-infinity", Number.NEGATIVE_INFINITY],
  ["object", { confidence: 0.8 }],
  ["array", [0.8]],
].forEach(([id, input]) => {
  diagnostic(`normalize-${id}`, () => equal(normalizeConfidence(input), null, "Unsupported confidence must remain unknown."));
});

diagnostic("normalization-does-not-mutate", () => {
  const input = Object.freeze({ confidence: 0.8 });
  normalizeConfidence(input);
  equal(input.confidence, 0.8, "Input was mutated.");
});

diagnostic("normalization-deterministic", () => {
  equal(normalizeConfidence(0.625), normalizeConfidence(0.625), "Normalization is not deterministic.");
});

const thresholdCases = [
  [0, EVIDENCE_LEVELS.NONE],
  [0.000001, EVIDENCE_LEVELS.LIMITED],
  [0.499999, EVIDENCE_LEVELS.LIMITED],
  [0.5, EVIDENCE_LEVELS.MODERATE],
  [0.500001, EVIDENCE_LEVELS.MODERATE],
  [0.749999, EVIDENCE_LEVELS.MODERATE],
  [0.75, EVIDENCE_LEVELS.STRONG],
  [0.750001, EVIDENCE_LEVELS.STRONG],
  [0.899999, EVIDENCE_LEVELS.STRONG],
  [0.9, EVIDENCE_LEVELS.VERY_STRONG],
  [0.900001, EVIDENCE_LEVELS.VERY_STRONG],
  [1, EVIDENCE_LEVELS.VERY_STRONG],
];

thresholdCases.forEach(([input, expected], index) => {
  diagnostic(`evidence-threshold-${index + 1}`, () => equal(getEvidenceLevelForConfidence(input), expected, "Evidence threshold changed."));
});

[
  ["unknown-null", null],
  ["unknown-undefined", undefined],
  ["invalid-string", "0.8"],
  ["invalid-low", -0.1],
  ["invalid-high", 1.1],
].forEach(([id, input]) => {
  diagnostic(`evidence-${id}`, () => equal(getEvidenceLevelForConfidence(input), null, "Unsupported mapping fabricated an evidence level."));
});

diagnostic("unknown-distinct-from-zero", () => {
  const unknown = assessConfidence(null);
  const zero = assessConfidence(0);
  assert(!unknown.known && unknown.confidence === null && unknown.evidenceLevel === null, "Unknown confidence was fabricated.");
  assert(zero.known && zero.confidence === 0 && zero.evidenceLevel === EVIDENCE_LEVELS.NONE, "Known zero was not preserved.");
  equal(unknown.dataState, DATA_STATES.UNKNOWN, "Unknown data state changed.");
  equal(zero.dataState, DATA_STATES.AVAILABLE, "Known zero data state changed.");
});

diagnostic("invalid-distinct-from-unknown", () => {
  const invalid = assessConfidence("0.8");
  assert(!invalid.known && !invalid.valid && invalid.errors.length === 1, "Invalid confidence was not reported.");
  equal(invalid.dataState, DATA_STATES.UNAVAILABLE, "Invalid confidence state changed.");
});

diagnostic("positive-confidence-known", () => {
  const result = assessConfidence(0.8);
  assert(result.known && result.valid, "Positive confidence was not known and valid.");
  equal(result.evidenceLevel, EVIDENCE_LEVELS.STRONG, "Positive evidence level changed.");
});

diagnostic("assessment-clamps-finite-input", () => {
  const result = assessConfidence(2);
  equal(result.confidence, 1, "Assessment did not clamp confidence.");
  equal(result.evidenceLevel, EVIDENCE_LEVELS.VERY_STRONG, "Clamped evidence level changed.");
});

diagnostic("canonical-evidence-levels-only", () => {
  thresholdCases.forEach(([input]) => {
    assert(Object.values(EVIDENCE_LEVELS).includes(getEvidenceLevelForConfidence(input)), "A noncanonical evidence level was returned.");
  });
});

diagnostic("mapping-deterministic", () => {
  equal(getEvidenceLevelForConfidence(0.8), getEvidenceLevelForConfidence(0.8), "Evidence mapping is not deterministic.");
});

diagnostic("assessment-side-effect-free", () => {
  const before = JSON.stringify({ confidence: 0.8 });
  const input = { confidence: 0.8 };
  assessConfidence(input);
  equal(JSON.stringify(input), before, "Assessment mutated its input.");
});

export function runConfidenceUtilsDiagnostics() {
  const results = cases.map(({ id, run }) => {
    try {
      run();
      return { id, passed: true, error: null };
    } catch (error) {
      return { id, passed: false, error: error.message };
    }
  });
  const passed = results.filter((result) => result.passed).length;

  return {
    suite: "ConfidenceUtilsDiagnostics",
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
    externalEffects: {
      fid: false,
      fiis: false,
      research: false,
      decisionEngine: false,
      application: false,
      simulator: false,
      ui: false,
      persistence: false,
      registry: false,
      network: false,
      runtime: false,
    },
  };
}

export default {
  runConfidenceUtilsDiagnostics,
};
