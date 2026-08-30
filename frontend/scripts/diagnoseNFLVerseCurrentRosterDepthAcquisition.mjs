import assert from "node:assert/strict";

import {
  acquireNFLVerseCurrentDepthSignals,
  acquireNFLVerseCurrentRosterSignals,
  parseNFLVerseCsv,
  selectLatestNFLVerseDepthSnapshot,
} from "../src/data/footballIntelligence/nfl/availability/providers/nflverse/NFLVerseCurrentAvailabilityAcquisition.js";

import {
  createNFLProviderNeutralAvailabilityResearchBundle,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLProviderNeutralAvailabilityResearchCapture.js";

const rosterCsv = `season,team,position,depth_chart_position,status,full_name,gsis_id,espn_id,week,game_type,status_description_abbr
2026,BAL,QB,QB,ACT,QB One,00-0030001,100001,1,REG,A01
2026,BAL,WR,WR,E14,WR Two,00-0030002,100002,1,REG,E14
2026,IND,QB,QB,ACT,QB Other,00-0030003,100003,1,REG,A01`;

const depthCsv = `dt,team,player_name,espn_id,gsis_id,pos_grp_id,pos_grp,pos_id,pos_name,pos_abb,pos_slot,pos_rank
2026-08-28T12:00:00Z,BAL,QB One,100001,00-0030001,1,Offense,1,Quarterback,QB,1,1
2026-08-29T12:00:00Z,BAL,QB One,100001,00-0030001,1,Offense,1,Quarterback,QB,1,1
2026-08-29T12:00:00Z,BAL,WR Two,100002,00-0030002,1,Offense,2,Wide Receiver,WR,1,2
2026-08-29T12:00:00Z,IND,QB Other,100003,00-0030003,1,Offense,1,Quarterback,QB,1,1`;

function mockFetchByUrl(map, resolvedUrls = {}) {
  return async (url) => {
    if (!(url in map)) return { ok: false, status: 404, url, text: async () => "" };
    return {
      ok: true,
      status: 200,
      url: resolvedUrls[url] || url,
      text: async () => map[url],
    };
  };
}

const tests = [];
async function test(name, fn) {
  try {
    await fn();
    tests.push({ name, status: "PASS" });
  } catch (error) {
    tests.push({ name, status: "FAIL", error: error.message });
  }
}

await test("csv-parser-preserves-rows", () => {
  assert.equal(parseNFLVerseCsv(rosterCsv).length, 3);
});

await test("latest-depth-snapshot-selected", () => {
  const result = selectLatestNFLVerseDepthSnapshot(parseNFLVerseCsv(depthCsv), { team: "BAL" });
  assert.equal(result.snapshotCount, 2);
  assert.equal(result.latestTimestamp, "2026-08-29T12:00:00Z");
  assert.equal(result.rows.length, 2);
});

const rosterUrl = "https://test.local/roster.csv";
const depthUrl = "https://test.local/depth.csv";
const fetchImpl = mockFetchByUrl({
  [rosterUrl]: rosterCsv,
  [depthUrl]: depthCsv,
});

const roster = await acquireNFLVerseCurrentRosterSignals({
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  observedAt: "2026-08-29T13:00:00Z",
  rosterUrl,
  fetchImpl,
});

const depth = await acquireNFLVerseCurrentDepthSignals({
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  depthUrl,
  fetchImpl,
});

await test("roster-scope-filters-team", () => assert.equal(roster.rowCount, 2));
await test("roster-signals-created", () => assert.equal(roster.signalCount, 2));
await test("roster-status-prefers-semantic-status", () => {
  assert.equal(roster.signals[0].availability.rosterStatus, "ACT");
});
await test("provider-status-description-remains-metadata", () => {
  assert.equal(roster.signals[0].metadata.providerStatusDescriptionAbbr, "A01");
});
await test("opaque-status-is-preserved-not-invented", () => {
  assert.equal(roster.signals[1].availability.rosterStatus, "E14");
});
await test("depth-selects-latest-team-snapshot", () => {
  assert.equal(depth.snapshotCount, 2);
  assert.equal(depth.latestTimestamp, "2026-08-29T12:00:00Z");
  assert.equal(depth.rowCount, 2);
});
await test("depth-signals-created", () => assert.equal(depth.signalCount, 2));
await test("depth-rank-one-starter-inference-remains-canonical", () => {
  assert.equal(depth.signals[0].role.depthRank, 1);
  assert.equal(depth.signals[0].role.starter, true);
});
await test("depth-role-does-not-create-official-status", () => {
  assert.equal(depth.signals[0].availability.status, null);
  assert.equal(depth.signals[0].availability.practiceStatus, null);
  assert.equal(depth.signals[0].availability.injury, null);
});
await test("acquisition-is-persistence-neutral", () => {
  assert.equal("persist" in roster, false);
  assert.equal("persist" in depth, false);
});

await test("redirect-target-does-not-replace-canonical-source-url", async () => {
  const redirectedFetch = mockFetchByUrl(
    { [rosterUrl]: rosterCsv },
    { [rosterUrl]: "https://objects.example.test/temporary/signed-roster.csv?token=one" }
  );
  const redirected = await acquireNFLVerseCurrentRosterSignals({
    season: 2026,
    week: 1,
    gameType: "REG",
    team: "BAL",
    observedAt: "2026-08-29T13:00:00Z",
    rosterUrl,
    fetchImpl: redirectedFetch,
  });
  assert.equal(redirected.sourceUrl, rosterUrl);
  assert.equal(
    redirected.transportUrl,
    "https://objects.example.test/temporary/signed-roster.csv?token=one"
  );
  assert.equal(redirected.signals[0].provenance.sourceUrl, rosterUrl);
});

await test("different-redirect-targets-preserve-same-signal-provenance", async () => {
  const firstFetch = mockFetchByUrl(
    { [rosterUrl]: rosterCsv },
    { [rosterUrl]: "https://objects.example.test/temporary/signed-roster.csv?token=one" }
  );
  const secondFetch = mockFetchByUrl(
    { [rosterUrl]: rosterCsv },
    { [rosterUrl]: "https://objects.example.test/temporary/signed-roster.csv?token=two" }
  );
  const first = await acquireNFLVerseCurrentRosterSignals({
    season: 2026,
    week: 1,
    gameType: "REG",
    team: "BAL",
    observedAt: "2026-08-29T13:00:00Z",
    rosterUrl,
    fetchImpl: firstFetch,
  });
  const second = await acquireNFLVerseCurrentRosterSignals({
    season: 2026,
    week: 1,
    gameType: "REG",
    team: "BAL",
    observedAt: "2026-08-29T14:00:00Z",
    rosterUrl,
    fetchImpl: secondFetch,
  });
  assert.equal(first.signals[0].provenance.sourceUrl, rosterUrl);
  assert.equal(second.signals[0].provenance.sourceUrl, rosterUrl);
});

await test("different-redirect-targets-preserve-observation-identity", async () => {
  const firstFetch = mockFetchByUrl(
    { [rosterUrl]: rosterCsv },
    { [rosterUrl]: "https://objects.example.test/temporary/signed-roster.csv?token=one" }
  );
  const secondFetch = mockFetchByUrl(
    { [rosterUrl]: rosterCsv },
    { [rosterUrl]: "https://objects.example.test/temporary/signed-roster.csv?token=two" }
  );
  const first = await acquireNFLVerseCurrentRosterSignals({
    season: 2026, week: 1, gameType: "REG", team: "BAL",
    observedAt: "2026-08-29T13:00:00Z", rosterUrl, fetchImpl: firstFetch,
  });
  const second = await acquireNFLVerseCurrentRosterSignals({
    season: 2026, week: 1, gameType: "REG", team: "BAL",
    observedAt: "2026-08-29T14:00:00Z", rosterUrl, fetchImpl: secondFetch,
  });
  const firstBundle = createNFLProviderNeutralAvailabilityResearchBundle(first.signals, {
    checkedAt: "2026-08-29T13:01:00Z",
  });
  const secondBundle = createNFLProviderNeutralAvailabilityResearchBundle(second.signals, {
    checkedAt: "2026-08-29T14:01:00Z",
  });
  assert.deepEqual(
    firstBundle.observations.map((item) => item.observationId).sort(),
    secondBundle.observations.map((item) => item.observationId).sort()
  );
});

const passed = tests.filter((x) => x.status === "PASS").length;
const failed = tests.filter((x) => x.status === "FAIL").length;

console.log(JSON.stringify({
  suite: "NFLVerse Current Roster/Depth Acquisition Diagnostics",
  version: "1.0.0",
  passed,
  failed,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
