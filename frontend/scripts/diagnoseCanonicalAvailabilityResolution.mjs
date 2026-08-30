import {
  createNFLAvailabilitySignal,
  NFL_AVAILABILITY_AUTHORITY,
  NFL_AVAILABILITY_SIGNAL_CLASSES,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";
import {
  resolveNFLMultiSignalAvailability,
} from "../src/data/footballIntelligence/nfl/availability/signals/NFLMultiSignalAvailabilityResolver.js";
import {
  projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLCanonicalAvailabilityResearchProjection.js";
import {
  createNFLMultiSignalAvailabilityResearchBundle,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLMultiSignalAvailabilityResearchCapture.js";

const tests = [];
const test = (name, fn) => { try { tests.push({ name, passed: Boolean(fn()) }); } catch (e) { tests.push({ name, passed: false, error: e?.message }); } };
const base = { season: 2026, week: 1, gameType: "PRE", team: "BAL", observedAt: "2026-08-15T00:00:00Z", source: "fixture" };
const sig = (x) => createNFLAvailabilitySignal({ ...base, playerId: "p1", playerName: "QB One", position: "QB", ...x });

const depth = sig({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.DEPTH_CHART, authority: NFL_AVAILABILITY_AUTHORITY.ROLE, depthPosition: "QB", depthRank: 1, starter: true });
const roster = sig({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS, authority: NFL_AVAILABILITY_AUTHORITY.ROSTER, rosterStatus: "ACT" });
const tx = sig({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.TRANSACTION, authority: NFL_AVAILABILITY_AUTHORITY.TRANSACTION, transactionType: "ACTIVATED", statusBefore: "PUP", statusAfter: "ACT" });
const official = sig({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT, authority: NFL_AVAILABILITY_AUTHORITY.OFFICIAL, status: "QUESTIONABLE", practiceStatus: "LIMITED", injury: "Hamstring" });

const noOfficial = resolveNFLMultiSignalAvailability([depth, roster, tx]).players[0];
const withOfficial = resolveNFLMultiSignalAvailability([depth, roster, tx, official]).players[0];

test("active-roster-resolves-available", () => noOfficial.canonicalAvailabilityStatus === "AVAILABLE");
test("starter-role-preserved", () => noOfficial.role?.starter === true && noOfficial.role?.depthRank === 1);
test("transaction-state-preserved", () => noOfficial.latestTransaction?.statusAfter === "ACT");
test("absence-of-official-report-is-not-reported", () => noOfficial.officialReportState === "NOT_REPORTED");
test("absence-of-official-report-does-not-invent-designation", () => noOfficial.officialDesignation === null);
test("official-questionable-controls-canonical-status", () => withOfficial.canonicalAvailabilityStatus === "QUESTIONABLE");
test("official-practice-status-preserved", () => withOfficial.practiceStatus === "LIMITED");
test("official-injury-preserved", () => withOfficial.injury === "Hamstring");
test("official-evidence-has-higher-confidence", () => withOfficial.availabilityConfidence > noOfficial.availabilityConfidence);
test("resolution-does-not-score-player-impact", () => !("impactScore" in withOfficial));
test("resolution-does-not-own-prediction", () => !("winProbability" in withOfficial));

const bundle = createNFLMultiSignalAvailabilityResearchBundle([depth, roster, tx], { checkedAt: base.observedAt });
const projected = projectNFLCanonicalAvailabilityFromMultiSignalResearchSnapshot({
  artifact: bundle.artifacts[0],
  observations: bundle.observations,
  season: 2026, week: 1, gameType: "PRE", team: "BAL",
});
const projectedPlayer = projected.resolution?.players?.[0];

test("research-snapshot-projects-three-signals", () => projected.signalCount === 3);
test("research-projection-preserves-pre-identity", () => projected.gameType === "PRE");
test("research-projection-resolves-player", () => projectedPlayer?.playerKey === "p1");
test("research-projection-preserves-evidence-refs", () => projectedPlayer?.evidenceRefs?.length === 3);
test("research-projection-resolves-active-player", () => projectedPlayer?.canonicalAvailabilityStatus === "AVAILABLE");
test("research-projection-does-not-infer-official-report", () => projectedPlayer?.officialReportState === "NOT_REPORTED");

const ir = resolveNFLMultiSignalAvailability([
  sig({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS, authority: NFL_AVAILABILITY_AUTHORITY.ROSTER, rosterStatus: "IR" })
]).players[0];
test("ir-roster-resolves-injured-reserve", () => ir.canonicalAvailabilityStatus === "INJURED_RESERVE");

const pup = resolveNFLMultiSignalAvailability([
  sig({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.ROSTER_STATUS, authority: NFL_AVAILABILITY_AUTHORITY.ROSTER, rosterStatus: "PUP" })
]).players[0];
test("pup-roster-resolves-pup", () => pup.canonicalAvailabilityStatus === "PUP");

const passed = tests.filter((x) => x.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({ suite: "Canonical Availability Resolution V1 Diagnostics", passed, failed, tests }, null, 2));
if (failed) process.exitCode = 1;
