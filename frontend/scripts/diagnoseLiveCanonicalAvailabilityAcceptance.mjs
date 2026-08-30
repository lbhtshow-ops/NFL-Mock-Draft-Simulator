import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const target = path.join(
  root,
  "scripts",
  "runLiveCanonicalAvailabilityAcceptance.mjs"
);

const text = fs.readFileSync(target, "utf8");
const tests = [];

const test = (name, fn) => {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error?.message || String(error),
    });
  }
};

test("requires-research-repository-database-url", () =>
  assert.match(text, /RESEARCH_REPOSITORY_DATABASE_URL/)
);

test("uses-canonical-postgres-research-adapter", () =>
  assert.match(text, /createPostgresResearchRepositoryAdapter/)
);

test("adapter-capabilities-disable-mutation", () => {
  assert.match(text, /allowSoftDelete:\s*false/);
  assert.match(text, /allowArchive:\s*false/);
  assert.match(text, /allowHardDelete:\s*false/);
});

test("uses-read-operation-only", () =>
  assert.match(text, /PERSISTENCE_OPERATION_TYPES\.READ/)
);

test("does-not-call-upsert", () =>
  assert.ok(!/adapter\.upsert\s*\(/.test(text))
);

test("does-not-call-create", () =>
  assert.ok(!/adapter\.create\s*\(/.test(text))
);

test("does-not-call-update", () =>
  assert.ok(!/adapter\.update\s*\(/.test(text))
);

test("does-not-call-delete", () =>
  assert.ok(!/adapter\.delete\s*\(/.test(text))
);

test("does-not-call-archive", () =>
  assert.ok(!/adapter\.archive\s*\(/.test(text))
);

test("uses-game-type-aware-evidence-id", () =>
  assert.match(text, /getNFLMultiSignalAvailabilityEvidenceId\(season,\s*gameType,\s*week,\s*team\)/)
);

test("uses-canonical-research-projection", () =>
  assert.match(text, /projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot/)
);

test("reads-artifact-observation-refs", () =>
  assert.match(text, /recordedObservationRefs/)
);

test("fails-on-missing-observation-refs", () =>
  assert.match(text, /missingObservationRefCount/)
);

test("reports-signal-class-counts", () =>
  assert.match(text, /classCounts/)
);

test("reports-resolved-player-count", () =>
  assert.match(text, /resolvedPlayerCount/)
);

test("reports-canonical-status-counts", () =>
  assert.match(text, /canonicalCounts/)
);

test("reports-starter-state", () =>
  assert.match(text, /starterCount/)
);

test("reports-lamar-jackson", () =>
  assert.match(text, /lamar jackson/i)
);

test("reports-official-report-separately", () => {
  assert.match(text, /officialReportState/);
  assert.match(text, /officialDesignation/);
});

test("does-not-score-player-impact", () =>
  assert.ok(!/overallImpact|impactScore|scorePlayerImpact/.test(text))
);

test("does-not-score-predictions", () =>
  assert.ok(!/winProbability|predictGame|decisionModel/.test(text))
);

test("explicitly-reports-read-only-mode", () =>
  assert.match(text, /mode:\s*"READ_ONLY"/)
);

const passed = tests.filter((item) => item.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "Live Canonical Availability Acceptance V1 Diagnostics",
  passed,
  failed,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
