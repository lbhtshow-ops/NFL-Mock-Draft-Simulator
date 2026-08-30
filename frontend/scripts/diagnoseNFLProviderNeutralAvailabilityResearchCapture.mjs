import assert from "node:assert/strict";

import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";

import {
  NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID,
  createNFLProviderNeutralAvailabilityResearchBundle,
  createNFLProviderNeutralAvailabilityResearchSource,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLProviderNeutralAvailabilityResearchCapture.js";

const tests = [];

function test(name, fn) {
  try {
    fn();
    tests.push({ name, status: "PASS" });
  } catch (error) {
    tests.push({ name, status: "FAIL", error: error?.message || String(error) });
  }
}

const common = {
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  playerId: "00-0030001",
  playerName: "Player One",
  position: "QB",
  observedAt: "2026-08-29T20:00:00Z",
};

const roster = createNFLAvailabilitySignal({
  ...common,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS,
  authority: NFL_AVAILABILITY_AUTHORITY.ROSTER,
  source: "nflverse-current-rosters",
  sourceUrl: "https://github.com/nflverse/nflverse-data/",
  rosterStatus: "ACT",
});

const depth = createNFLAvailabilitySignal({
  ...common,
  signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART,
  authority: NFL_AVAILABILITY_AUTHORITY.ROLE,
  source: "nflverse-current-depth-charts",
  sourceUrl: "https://github.com/nflverse/nflverse-data/",
  depthPosition: "QB",
  depthRank: 1,
});

const checkedAt = "2026-08-29T20:01:00Z";
const source = createNFLProviderNeutralAvailabilityResearchSource({ checkedAt });
const bundle = createNFLProviderNeutralAvailabilityResearchBundle(
  [roster, depth],
  { checkedAt }
);

test("provider-neutral-source-id", () => {
  assert.equal(
    source.sourceId,
    "research-source:lbht-nfl-availability-multisignal"
  );
});

test("source-contract-valid", () => {
  assert.equal(source.validation?.valid, true);
});

test("source-does-not-identify-sportradar", () => {
  assert.equal(JSON.stringify(source).toLowerCase().includes("sportradar"), false);
});

test("source-independence-group-multi-source", () => {
  assert.equal(source.independenceGroup, "MULTI_SOURCE");
});

test("provider-auth-not-required-by-capture-boundary", () => {
  assert.equal(source.access?.requiresAuthentication, false);
});

test("bundle-preserves-two-signals", () => {
  assert.equal(bundle.summary.signalCount, 2);
  assert.equal(bundle.observations.length, 2);
});

test("provider-neutral-observations-are-contract-valid", () => {
  assert.equal(
    bundle.observations.every((observation) => observation.validation?.valid === true),
    true
  );
});

test("provider-neutral-observation-canonical-temporal-semantics", () => {
  for (const observation of bundle.observations) {
    assert.equal(observation.temporal?.type, "INSTANT");
    assert.equal(observation.temporal?.precision, "EXACT");
    assert.equal(observation.temporal?.timezone, "UTC");
    assert.equal(typeof observation.temporal?.occurredAt, "string");
  }
});

test("provider-neutral-observation-canonical-spatial-semantics", () => {
  assert.equal(
    bundle.observations.every(
      (observation) => observation.spatial?.type === "NOT_APPLICABLE"
    ),
    true
  );
});

test("provider-neutral-observation-canonical-status-record-field", () => {
  assert.equal(
    bundle.observations.every(
      (observation) => observation.record?.field === "availability_signal"
    ),
    true
  );
});

test("provider-neutral-observation-canonical-verification-semantics", () => {
  for (const observation of bundle.observations) {
    assert.equal(observation.verification?.state, "VERIFIED_WITH_LIMITATIONS");
    assert.equal(
      observation.verification?.method,
      "AUTOMATED_PROVIDER_NORMALIZATION"
    );
    assert.equal(
      observation.verification?.verifiedBy,
      "lbht-automated-source-normalization"
    );
  }
});

test("provider-neutral-observation-effective-at-follows-occurred-at", () => {
  for (const observation of bundle.observations) {
    assert.equal(
      observation.record?.effectiveAt,
      observation.temporal?.occurredAt
    );
  }
});

test("provider-neutral-source-refs-remain-canonical", () => {
  assert.equal(
    bundle.observations.every(
      (observation) =>
        Array.isArray(observation.sourceRefs) &&
        observation.sourceRefs.length === 1 &&
        observation.sourceRefs[0] ===
          "research-source:lbht-nfl-availability-multisignal"
    ),
    true
  );
});

test("bundle-preserves-distinct-signal-classes", () => {
  assert.deepEqual(bundle.summary.signalClasses, [
    "DEPTH_CHART",
    "ROSTER_STATUS",
  ]);
});

test("bundle-preserves-external-provider-provenance", () => {
  const snapshots = bundle.observations.map((observation) =>
    JSON.parse(observation.record.valueText)
  );
  assert.equal(
    snapshots.some(
      (snapshot) => snapshot.provenance?.source === "nflverse-current-rosters"
    ),
    true
  );
  assert.equal(
    snapshots.some(
      (snapshot) =>
        snapshot.provenance?.source === "nflverse-current-depth-charts"
    ),
    true
  );
});

test("artifact-provider-provenance-tags-preserved", () => {
  const tags = bundle.artifacts[0].classification?.tags || [];
  assert.equal(
    tags.includes("provider:nflverse-current-depth-charts"),
    true
  );
  assert.equal(
    tags.includes("provider:nflverse-current-rosters"),
    true
  );
});

test("artifact-does-not-claim-medical-evidence", () => {
  assert.equal(
    bundle.artifacts[0].assessment.limitations.includes(
      "Roster and depth evidence do not constitute medical evidence."
    ),
    true
  );
});

test("bundle-does-not-identify-sportradar", () => {
  assert.equal(JSON.stringify(bundle).toLowerCase().includes("sportradar"), false);
});

test("same-content-remains-idempotent-across-acquisition-time", () => {
  const laterRoster = {
    ...roster,
    timing: {
      ...roster.timing,
      observedAt: "2026-08-29T21:00:00Z",
    },
  };
  const first = createNFLProviderNeutralAvailabilityResearchBundle([roster], {
    checkedAt,
  });
  const second = createNFLProviderNeutralAvailabilityResearchBundle(
    [laterRoster],
    { checkedAt: "2026-08-29T21:01:00Z" }
  );
  assert.equal(
    first.observations[0].observationId,
    second.observations[0].observationId
  );
});

test("content-change-creates-new-observation", () => {
  const changed = {
    ...roster,
    availability: {
      ...roster.availability,
      rosterStatus: "IR",
    },
  };
  const first = createNFLProviderNeutralAvailabilityResearchBundle([roster], {
    checkedAt,
  });
  const second = createNFLProviderNeutralAvailabilityResearchBundle([changed], {
    checkedAt,
  });
  assert.notEqual(
    first.observations[0].observationId,
    second.observations[0].observationId
  );
});

test("no-provider-reasoning-field-added", () => {
  assert.equal(
    "providerSpecificReasoning" in bundle.artifacts[0],
    false
  );
});

test("canonical-evidence-id-remains-provider-neutral", () => {
  assert.equal(
    bundle.artifacts[0].evidenceId,
    "evidence:nfl-multisignal-availability:2026:reg:1:bal"
  );
});

const passed = tests.filter((item) => item.status === "PASS").length;
const failed = tests.filter((item) => item.status === "FAIL").length;

console.log(
  JSON.stringify(
    {
      suite: "NFL Provider-Neutral Availability Research Capture Diagnostics",
      version: "1.1.0",
      passed,
      failed,
      sourceId: NFL_PROVIDER_NEUTRAL_AVAILABILITY_SOURCE_ID,
      tests,
    },
    null,
    2
  )
);

if (failed) process.exitCode = 1;
