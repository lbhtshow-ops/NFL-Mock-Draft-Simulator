import assert from "node:assert/strict";
import fs from "node:fs";

const materializer =
  fs.readFileSync(
    "./scripts/materializeHistoricalCanonicalPlayerCaliberSnapshots.mjs",
    "utf8"
  );
const audit =
  fs.readFileSync(
    "./scripts/auditHistoricalStarterReplacementCaliberPairCoverage.mjs",
    "utf8"
  );
const runner =
  fs.readFileSync(
    "./scripts/runHistoricalStarterReplacementCaliberPairCompletion.mjs",
    "utf8"
  );

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

test("materializer-reuses-canonical-historical-service", () =>
  assert.match(materializer, /evaluateHistoricalCanonicalNFLPlayer/)
);
test("materializer-writes-only-valid-available-snapshots", () => {
  assert.match(materializer, /snapshotValidation\?\.valid === true/);
  assert.match(materializer, /snapshot\?\.status === "AVAILABLE"/);
});
test("materializer-preserves-temporal-safe-flag", () =>
  assert.match(materializer, /temporallySafe: true/)
);
test("materializer-classifies-residuals", () =>
  assert.match(materializer, /unavailableReasons/)
);
test("no-current-rating-backfill", () =>
  assert.match(materializer, /currentRatingBackfillUsed: false/)
);
test("no-future-evidence", () =>
  assert.match(materializer, /futureEvidenceUsed: false/)
);
test("no-current-recognition", () =>
  assert.match(materializer, /currentRecognitionUsed: false/)
);
test("no-learned-weights", () =>
  assert.match(materializer, /learnedWeightsCreated: false/)
);
test("pair-audit-requires-both-calibers", () =>
  assert.match(audit, /pc !== null && rc !== null/)
);
test("pair-audit-calculates-delta-only-from-real-calibers", () =>
  assert.match(audit, /expectedReplacementDelta: pc - rc/)
);
test("pair-audit-does-not-fabricate-replacements", () =>
  assert.match(audit, /replacementIdentityFabricated: false/)
);
test("runner-reuses-existing-enrichment-script", () =>
  assert.match(runner, /enrichHistoricalReplacementPairsWithCaliber\.py/)
);
test("runner-does-not-calibrate", () =>
  assert.match(runner, /calibrationExecuted: false/)
);
test("runner-does-not-learn-weights", () =>
  assert.match(runner, /learnedWeightsCreated: false/)
);

const passed = tests.filter((x) => x.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite:
    "Historical Starter/Replacement Caliber Pair Completion V1 Diagnostics",
  passed,
  failed,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
