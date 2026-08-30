import { createNFLAvailabilitySignal, NFL_AVAILABILITY_AUTHORITY, NFL_AVAILABILITY_SIGNAL_CLASSES } from "../src/data/footballIntelligence/nfl/availability/signals/NFLAvailabilitySignalContract.js";
import { resolveNFLMultiSignalAvailability } from "../src/data/footballIntelligence/nfl/availability/signals/NFLMultiSignalAvailabilityResolver.js";
import { adaptSportradarDailyTransactionsPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLTransactionAdapter.js";
import { adaptSportradarTeamRosterPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLRosterStatusAdapter.js";
import { adaptSportradarWeeklyDepthChartsPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLDepthChartAdapter.js";

const tests = [];
const test = (name, fn) => { try { const value = fn(); tests.push({ name, passed: Boolean(value) }); } catch (e) { tests.push({ name, passed: false, error: e?.message }); } };
const base = { season: 2026, week: 1, gameType: "REG", now: "2026-09-01T12:00:00Z" };
const tx = adaptSportradarDailyTransactionsPayload({ transactions: [{ type: "Placed on Injured Reserve", status_before: "ACT", status_after: "IR", created_at: base.now, player: { id: "p1", name: "QB One", position: "QB" }, team: { id: "t1", alias: "BAL" } }] }, base);
const roster = adaptSportradarTeamRosterPayload({ id: "t1", alias: "BAL", generated_at: base.now, players: [{ id: "p1", name: "QB One", position: "QB", status: "IR" }] }, base);
const depth = adaptSportradarWeeklyDepthChartsPayload({ generated_at: base.now, teams: [{ id: "t1", alias: "BAL", offense: [{ position: "QB", players: [{ id: "p1", name: "QB One", position: "QB", depth: 1 }] }] }] }, base);
const official = createNFLAvailabilitySignal({ signalClass: NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT, authority: NFL_AVAILABILITY_AUTHORITY.OFFICIAL, season: 2026, week: 1, team: "BAL", playerId: "p1", playerName: "QB One", position: "QB", observedAt: "2026-09-02T12:00:00Z", source: "sportradar-nfl-v7", status: "QUESTIONABLE", practiceStatus: "LIMITED", injury: "Hamstring" });

test("transaction-normalizes-status-transition", () => tx.length === 1 && tx[0].transaction.statusAfter === "IR");
test("transaction-preserves-provider-ids", () => tx[0].player.providerPlayerId === "p1" && tx[0].player.providerTeamId === "t1");
test("roster-status-normalizes", () => roster.length === 1 && roster[0].availability.rosterStatus === "IR");
test("depth-chart-identifies-starter", () => depth.length === 1 && depth[0].role.depthRank === 1 && depth[0].role.starter === true);
test("depth-chart-preserves-position", () => depth[0].role.depthPosition === "QB");
test("resolver-keeps-official-designation-distinct", () => resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth, official]).players[0].officialDesignation === "QUESTIONABLE");
test("resolver-keeps-roster-status-distinct", () => resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth, official]).players[0].rosterStatus === "IR");
test("resolver-keeps-role-context", () => resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth, official]).players[0].role.starter === true);
test("official-report-not-inferred-from-roster", () => resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth]).players[0].officialDesignation === null);
test("inferred-availability-is-explicit", () => resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth]).players[0].inferredAvailabilityOnly === true);
test("official-signal-has-highest-authority", () => resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth, official]).players[0].evidence.selected.signalClass === NFL_AVAILABILITY_SIGNAL_CLASSES.OFFICIAL_INJURY_REPORT);
test("weaker-role-evidence-cannot-overwrite-official", () => resolveNFLMultiSignalAvailability([...depth, official]).players[0].officialDesignation === "QUESTIONABLE");
test("signal-contract-preserves-provenance", () => tx[0].provenance.source === "sportradar-nfl-v7-transactions");
test("no-persistence-authority-in-signal-contract", () => !("persistenceAuthorized" in tx[0]));
test("multi-signal-resolution-does-not-score-impact", () => !("impactScore" in resolveNFLMultiSignalAvailability([...tx, ...roster, ...depth, official]).players[0]));

const passed = tests.filter((x) => x.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({ suite: "NFL Multi-Signal Availability Intelligence V1 Diagnostics", passed, failed, tests }, null, 2));
if (failed) process.exitCode = 1;
