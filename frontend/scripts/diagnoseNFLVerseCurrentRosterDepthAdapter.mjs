import assert from "node:assert/strict";

import {
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
  isNFLAvailabilitySignal,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";

import {
  resolveNFLMultiSignalAvailability,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLMultiSignalAvailabilityResolver.js";

import {
  adaptNFLVerseCurrentDepthChartRows,
  adaptNFLVerseCurrentRosterRows,
  NFLVERSE_CURRENT_DEPTH_CHART_PROVIDER_ID,
  NFLVERSE_CURRENT_ROSTER_PROVIDER_ID,
} from "../src/data/footballIntelligence/nfl/availability/providers/nflverse/NFLVerseCurrentRosterDepthAdapter.js";

const tests = [];

async function test(name, fn) {
  try {
    await fn();
    tests.push({ name, status: "PASS" });
  } catch (error) {
    tests.push({ name, status: "FAIL", error: error?.message || String(error) });
  }
}

const rosterRows = [{
  season: "2026",
  week: "1",
  game_type: "REG",
  team: "BAL",
  position: "QB",
  depth_chart_position: "QB",
  status: "ACT",
  status_description_abbr: "ACT",
  full_name: "QB One",
  gsis_id: "00-0030001",
  espn_id: "100001",
  last_modified_date: "2026-09-11T12:00:00Z",
}];

const depthRows = [{
  team: "BAL",
  player_name: "QB One",
  espn_id: "100001",
  gsis_id: "00-0030001",
  pos_grp: "QB",
  pos_name: "Quarterback",
  pos_abb: "QB",
  pos_slot: "QB",
  pos_rank: "1",
  dt: "2026-09-11T12:30:00Z",
}];

const rosterSignals = adaptNFLVerseCurrentRosterRows(rosterRows, {
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  sourceUrl: "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv",
});

const depthSignals = adaptNFLVerseCurrentDepthChartRows(depthRows, {
  season: 2026,
  week: 1,
  gameType: "REG",
  team: "BAL",
  sourceUrl: "https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_2026.csv",
});

await test("roster-signal-created", () => {
  assert.equal(rosterSignals.length, 1);
  assert.equal(isNFLAvailabilitySignal(rosterSignals[0]), true);
});
await test("roster-signal-class", () => {
  assert.equal(rosterSignals[0].signalClass, NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS);
});
await test("roster-authority", () => {
  assert.equal(rosterSignals[0].authority, NFL_AVAILABILITY_AUTHORITY.ROSTER);
});
await test("roster-status-preserved", () => {
  assert.equal(rosterSignals[0].availability.rosterStatus, "ACT");
});
await test("roster-canonical-gsis-identity", () => {
  assert.equal(rosterSignals[0].player.playerId, "00-0030001");
});
await test("roster-provider-identity-preserved", () => {
  assert.equal(rosterSignals[0].player.providerPlayerId, "100001");
});
await test("roster-provenance-identifies-nflverse", () => {
  assert.equal(rosterSignals[0].provenance.source, NFLVERSE_CURRENT_ROSTER_PROVIDER_ID);
  assert.equal(rosterSignals[0].metadata.provider, "nflverse");
});
await test("depth-signal-created", () => {
  assert.equal(depthSignals.length, 1);
  assert.equal(isNFLAvailabilitySignal(depthSignals[0]), true);
});
await test("depth-signal-class", () => {
  assert.equal(depthSignals[0].signalClass, NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART);
});
await test("depth-authority", () => {
  assert.equal(depthSignals[0].authority, NFL_AVAILABILITY_AUTHORITY.ROLE);
});
await test("depth-position-preserved", () => {
  assert.equal(depthSignals[0].role.depthPosition, "QB");
});
await test("depth-rank-preserved-as-number", () => {
  assert.equal(depthSignals[0].role.depthRank, 1);
});
await test("depth-rank-one-implies-starter", () => {
  assert.equal(depthSignals[0].role.starter, true);
});
await test("depth-provenance-identifies-nflverse", () => {
  assert.equal(depthSignals[0].provenance.source, NFLVERSE_CURRENT_DEPTH_CHART_PROVIDER_ID);
  assert.equal(depthSignals[0].metadata.provider, "nflverse");
});

const resolution = resolveNFLMultiSignalAvailability([
  ...rosterSignals,
  ...depthSignals,
]);

await test("resolver-accepts-nflverse-signals", () => {
  assert.equal(resolution.players.length, 1);
  assert.equal(resolution.signalCount, 2);
});
await test("roster-participates-in-availability-resolution", () => {
  assert.equal(resolution.players[0].canonicalAvailabilityStatus, "AVAILABLE");
  assert.equal(resolution.players[0].rosterStatus, "ACT");
});
await test("depth-appears-as-role-evidence", () => {
  assert.equal(resolution.players[0].role.depthPosition, "QB");
  assert.equal(resolution.players[0].role.depthRank, 1);
  assert.equal(resolution.players[0].role.starter, true);
});
await test("depth-does-not-fabricate-official-designation", () => {
  assert.equal(resolution.players[0].officialDesignation, null);
  assert.equal(resolution.players[0].officialReportAvailable, false);
  assert.equal(resolution.players[0].officialReportState, "NOT_REPORTED");
});

const passed = tests.filter((x) => x.status === "PASS").length;
const failed = tests.filter((x) => x.status === "FAIL").length;

console.log(JSON.stringify({
  suite: "NFLVerse Current Roster/Depth Canonical Signal Adapter Diagnostics",
  version: "1.0.0",
  passed,
  failed,
  tests,
}, null, 2));

if (failed) process.exitCode = 1;
