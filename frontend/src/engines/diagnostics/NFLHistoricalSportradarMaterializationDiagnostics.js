import assert from "node:assert/strict";
import {
  buildNFLHistoricalSportradarUrls,
  NFL_HISTORICAL_SPORTRADAR_ACQUISITION_DEFAULTS,
} from "../teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarAcquisition.js";
import {
  buildNFLHistoricalSportradarKickoffMap,
  classifyNFLHistoricalSportradarTemporalEvidence,
} from "../teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarTemporalQualification.js";
import {
  getNFLHistoricalSportradarMaterializationGovernance,
  materializeNFLHistoricalSportradarWeek,
  NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS,
  qualifyNFLHistoricalSportradarMaterialization,
} from "../teamIntelligence/strength/calibration/acquisition/NFLHistoricalSportradarAvailabilityMaterializer.js";
import {
  buildNFLHistoricalSportradarGsisCrosswalk,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLHistoricalSportradarIdentityCrosswalk.js";

const tests = [];
function test(name, fn) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
}

const crosswalk = buildNFLHistoricalSportradarGsisCrosswalk([
  { sportradar_id: "sr-player-1", gsis_id: "00-0000001" },
  { sportradar_id: "sr-player-2", gsis_id: "00-0000002" },
]);
const injuryPayload = {
  teams: [{
    id: "team-jax",
    alias: "JAC",
    players: [
      { id: "sr-player-1", name: "Safe Player", position: "QB", injuries: [{ primary: "Hamstring", status: "Questionable", status_date: "2025-09-04T00:00:00Z", practice: { status: "Limited" } }] },
      { id: "sr-player-2", name: "Same Day Player", position: "WR", injuries: [{ primary: "Ankle", status: "Out", status_date: "2025-09-07T00:00:00Z", practice: { status: "DNP" } }] },
      { id: "sr-missing", name: "Unknown Player", position: "T", injuries: [{ primary: "Knee", status: "Out", status_date: "2025-09-04T00:00:00Z", practice: { status: "DNP" } }] },
      { id: "sr-player-2", name: "No Date Player", position: "WR", injuries: [{ primary: "Foot", status: "Questionable", practice: { status: "Limited" } }] },
    ],
  }],
};
const schedulePayload = {
  games: [{ home: { alias: "JAX" }, away: { alias: "CAR" }, scheduled: "2025-09-07T17:00:00Z" }],
};
const materialized = materializeNFLHistoricalSportradarWeek({
  season: 2025,
  week: 1,
  injuryPayload,
  schedulePayload,
  injuryUrl: "https://example.test/injuries.json",
  crosswalk,
});

const urls = buildNFLHistoricalSportradarUrls({ season: 2025, week: 3, gameType: "REG", accessLevel: "trial" });
test("historical-injury-url", () => assert.match(urls.injuryUrl, /seasons\/2025\/REG\/3\/injuries\.json$/));
test("historical-schedule-url", () => assert.match(urls.scheduleUrl, /games\/2025\/REG\/3\/schedule\.json$/));
test("rate-limit-spacing-preserved", () => assert.equal(NFL_HISTORICAL_SPORTRADAR_ACQUISITION_DEFAULTS.minRequestIntervalMs, 1300));
test("bounded-429-retries-preserved", () => assert.equal(NFL_HISTORICAL_SPORTRADAR_ACQUISITION_DEFAULTS.max429Retries, 2));
test("request-timeout-preserved", () => assert.equal(NFL_HISTORICAL_SPORTRADAR_ACQUISITION_DEFAULTS.requestTimeoutMs, 15000));

test("prior-calendar-date-safe", () => assert.equal(classifyNFLHistoricalSportradarTemporalEvidence("2025-09-04", "2025-09-07T17:00:00Z"), "SAFE_PRIOR_CALENDAR_DATE"));
test("same-day-remains-ambiguous", () => assert.equal(classifyNFLHistoricalSportradarTemporalEvidence("2025-09-07", "2025-09-07T17:00:00Z"), "SAME_DAY_AMBIGUOUS"));
test("after-date-rejected", () => assert.equal(classifyNFLHistoricalSportradarTemporalEvidence("2025-09-08", "2025-09-07T17:00:00Z"), "AFTER_KICKOFF_DATE"));
test("missing-date-rejected", () => assert.equal(classifyNFLHistoricalSportradarTemporalEvidence(null, "2025-09-07T17:00:00Z"), "MISSING_STATUS_DATE"));

const kickoff = buildNFLHistoricalSportradarKickoffMap(schedulePayload);
test("jax-canonical-kickoff-map", () => assert.equal(kickoff.map.get("JAX"), "2025-09-07T17:00:00Z"));
test("jac-provider-normalizes-to-jax", () => assert.equal(materialized.rows[0].team, "JAX"));
test("exact-gsis-materialized", () => assert.equal(materialized.rows[0].gsis_id, "00-0000001"));
test("only-safe-exact-row-materialized", () => assert.equal(materialized.rows.length, 1));
test("unsafe-and-unresolved-quarantined", () => assert.equal(materialized.quarantined.length, 3));
test("same-day-quarantined", () => assert(materialized.quarantined.some((x) => x.reason === "SAME_DAY_AMBIGUOUS")));
test("unresolved-identity-quarantined", () => assert(materialized.quarantined.some((x) => x.reason === "IDENTITY_UNRESOLVED")));
test("missing-source-date-quarantined", () => assert(materialized.quarantined.some((x) => x.reason === "SOURCE_INJURY_STATUS_DATE_REQUIRED")));
test("canonical-columns-match-existing-contract", () => assert.deepEqual(NFL_HISTORICAL_SPORTRADAR_CANONICAL_COLUMNS, ["season","team","week","gsis_id","position","full_name","report_primary_injury","report_status","practice_primary_injury","practice_status","date_modified"]));

const passingQualification = qualifyNFLHistoricalSportradarMaterialization({
  season: 2025,
  sourceRecordCount: 100,
  canonicalRows: Array.from({ length: 96 }, () => materialized.rows[0]),
  sourceRecordsWithInjuryStatusDate: 100,
  kickoffResolvedRecords: 100,
  safePriorCalendarDateRecords: 96,
});
test("95-percent-contract-can-qualify", () => assert.equal(passingQualification.qualifiedForJoin, true));
test("calibration-remains-blocked", () => assert.equal(passingQualification.calibrationAuthorized, false));
test("learned-weights-remain-blocked", () => assert.equal(passingQualification.learnedWeightsAuthorized, false));

const governance = getNFLHistoricalSportradarMaterializationGovernance();
test("explicit-write-required", () => assert.equal(governance.historicalArtifactWriteRequiresExplicitFlag, true));
test("treatment-rebuild-blocked", () => assert.equal(governance.treatmentControlRebuildAuthorized, false));
test("matching-blocked", () => assert.equal(governance.matchingAuthorized, false));
test("att-blocked", () => assert.equal(governance.attRecomputationAuthorized, false));
test("team-strength-blocked", () => assert.equal(governance.teamStrengthMutationAuthorized, false));
test("pickem-blocked", () => assert.equal(governance.pickemMutationAuthorized, false));
test("database-blocked", () => assert.equal(governance.databaseMutationAuthorized, false));

const failures = tests.filter((t) => !t.passed);
console.log(JSON.stringify({
  suite: "NFL Historical Sportradar 2025 Materialization",
  contractVersion: "FIE-NFL-HISTORICAL-SPORTRADAR-MATERIALIZATION-DIAGNOSTICS-2C3-1.0.0",
  status: failures.length ? "FAIL" : "PASS",
  passed: tests.length - failures.length,
  failed: failures.length,
  tests,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
