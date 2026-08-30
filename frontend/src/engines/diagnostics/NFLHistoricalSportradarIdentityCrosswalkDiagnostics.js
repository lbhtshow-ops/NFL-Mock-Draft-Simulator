import assert from "node:assert/strict";
import {
  buildNFLHistoricalSportradarGsisCrosswalk,
  getNFLHistoricalSportradarIdentityGovernance,
  normalizeNFLHistoricalProviderTeamCode,
  resolveNFLHistoricalSportradarPlayerIdentity,
} from "../teamIntelligence/strength/calibration/index.js";

const tests = [];
const test = (name, fn) => {
  try {
    fn();
    tests.push([name, true]);
  } catch (error) {
    tests.push([name, false, error.message]);
  }
};

const fixture = [
  { gsis_id: "00-0000001", sportradar_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
  { gsis_id: "00-0000001", sportradar_id: "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA" },
  { gsis_id: "00-0000002", sportradar_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
];

const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk(fixture);
const governance = getNFLHistoricalSportradarIdentityGovernance();

test("crosswalk-contract", () =>
  assert.equal(
    crosswalk.contractVersion,
    "FIE-NFL-HISTORICAL-SPORTRADAR-GSIS-CROSSWALK-1.0.0"
  )
);
test("deduplicates-case-insensitive-provider-id", () =>
  assert.equal(crosswalk.resolvedCount, 2)
);
test("no-conflict-for-identical-exact-mapping", () =>
  assert.equal(crosswalk.conflictCount, 0)
);
test("exact-resolution", () =>
  assert.deepEqual(
    resolveNFLHistoricalSportradarPlayerIdentity(
      "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
      crosswalk
    ).canonicalPlayerId,
    "00-0000001"
  )
);
test("missing-remains-unresolved", () =>
  assert.equal(
    resolveNFLHistoricalSportradarPlayerIdentity(
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
      crosswalk
    ).status,
    "UNRESOLVED"
  )
);
test("conflict-remains-unresolved", () => {
  const conflicted = buildNFLHistoricalSportradarGsisCrosswalk([
    { gsis_id: "00-0000001", sportradar_id: "dddddddd-dddd-dddd-dddd-dddddddddddd" },
    { gsis_id: "00-0000002", sportradar_id: "dddddddd-dddd-dddd-dddd-dddddddddddd" },
  ]);
  assert.equal(
    resolveNFLHistoricalSportradarPlayerIdentity(
      "dddddddd-dddd-dddd-dddd-dddddddddddd",
      conflicted
    ).status,
    "CONFLICT"
  );
});
test("jax-alias-normalization", () =>
  assert.equal(normalizeNFLHistoricalProviderTeamCode("JAC"), "JAX")
);
test("canonical-jax-preserved", () =>
  assert.equal(normalizeNFLHistoricalProviderTeamCode("JAX"), "JAX")
);
test("no-name-fallback", () => assert.equal(governance.nameFallbackAllowed, false));
test("exact-id-required", () => assert.equal(governance.exactIdMappingRequired, true));
test("normalization-not-authorized", () =>
  assert.equal(governance.historicalNormalizationAuthorized, false)
);
test("calibration-blocked", () => assert.equal(governance.calibrationAuthorized, false));
test("team-strength-blocked", () =>
  assert.equal(governance.teamStrengthMutationAuthorized, false)
);

const failed = tests.filter((entry) => !entry[1]);
console.log(
  JSON.stringify(
    {
      suite: "NFL Historical Sportradar Identity Crosswalk",
      contractVersion: "FIE-NFL-HISTORICAL-SPORTRADAR-IDENTITY-2C2-1.0.0",
      status: failed.length ? "FAIL" : "PASS",
      passed: tests.length - failed.length,
      failed: failed.length,
      checks: Object.fromEntries(tests.map((entry) => [entry[0], entry[1]])),
      failures: failed.map((entry) => `${entry[0]}: ${entry[2]}`),
    },
    null,
    2
  )
);
if (failed.length) process.exitCode = 1;
