import { adaptSportradarDailyTransactionsPayload } from "../src/data/footballIntelligence/nfl/availability/providers/sportradar/SportradarNFLTransactionAdapter.js";

const tests = [];
const test = (name, fn) => {
  try {
    tests.push({ name, passed: Boolean(fn()) });
  } catch (error) {
    tests.push({ name, passed: false, error: error?.message || String(error) });
  }
};

const base = {
  season: 2026,
  week: 1,
  gameType: "REG",
  now: "2026-08-13T22:30:00-04:00",
  sourceUrl: "https://api.sportradar.com/nfl/official/trial/v7/en/league/2026/08/13/transactions.json",
};

const liveShapePayload = {
  league: { id: "league-1", name: "NFL", alias: "NFL" },
  start_time: "2026-08-13T04:00:00Z",
  end_time: "2026-08-14T03:59:59Z",
  players: [
    {
      id: "e70723a0-250e-11f0-aaf3-252b830cb685",
      name: "Tyron Herring",
      first_name: "Tyron",
      last_name: "Herring",
      position: "SAF",
      sr_id: "sr:player:123",
      transactions: [
        {
          id: "tx-1",
          desc: "Placed on reserve list",
          effective_date: "2026-08-13",
          last_modified: "2026-08-13T18:10:00Z",
          transaction_type: "Reserve",
          transaction_code: "RES",
          transaction_year: 2026,
          status_before: "ACT",
          status_after: "IR",
          from_team: {
            id: "team-1",
            name: "Baltimore Ravens",
            market: "Baltimore",
            alias: "BAL",
            sr_id: "sr:competitor:4413",
          },
        },
      ],
    },
  ],
};

const liveSignals = adaptSportradarDailyTransactionsPayload(liveShapePayload, base);

const legacyShapePayload = {
  transactions: [
    {
      type: "Placed on Injured Reserve",
      status_before: "ACT",
      status_after: "IR",
      created_at: base.now,
      player: { id: "p1", name: "QB One", position: "QB" },
      team: { id: "t1", alias: "BAL" },
    },
  ],
};

const legacySignals = adaptSportradarDailyTransactionsPayload(legacyShapePayload, base);

test("live-player-nested-transactions-normalize", () => liveSignals.length === 1);
test("live-player-identity-preserved", () => liveSignals[0]?.player?.playerId === "e70723a0-250e-11f0-aaf3-252b830cb685");
test("live-player-name-preserved", () => liveSignals[0]?.player?.playerName === "Tyron Herring");
test("live-player-position-preserved", () => liveSignals[0]?.player?.position === "SAF");
test("live-from-team-resolves-team", () => liveSignals[0]?.team === "BAL");
test("live-provider-team-id-preserved", () => liveSignals[0]?.player?.providerTeamId === "team-1");
test("live-status-transition-preserved", () => liveSignals[0]?.transaction?.statusBefore === "ACT" && liveSignals[0]?.transaction?.statusAfter === "IR");
test("live-roster-status-projects-status-after", () => liveSignals[0]?.availability?.rosterStatus === "IR");
test("live-effective-date-preserved", () => liveSignals[0]?.timing?.effectiveAt === "2026-08-13");
test("live-last-modified-used-as-observed-at", () => liveSignals[0]?.timing?.observedAt === "2026-08-13T18:10:00Z");
test("live-transaction-code-preserved", () => liveSignals[0]?.metadata?.transactionCode === "RES");
test("live-transaction-id-preserved", () => liveSignals[0]?.metadata?.providerTransactionId === "tx-1");
test("live-league-window-preserved", () => liveSignals[0]?.metadata?.leagueWindowStart === "2026-08-13T04:00:00Z" && liveSignals[0]?.metadata?.leagueWindowEnd === "2026-08-14T03:59:59Z");
test("legacy-top-level-transactions-remain-supported", () => legacySignals.length === 1 && legacySignals[0]?.team === "BAL");
test("no-persistence-authority-added", () => !("persistenceAuthorized" in liveSignals[0]));

const passed = tests.filter((x) => x.passed).length;
const failed = tests.length - passed;
console.log(JSON.stringify({ suite: "Sportradar Daily Transactions Live Payload Correction Diagnostics", passed, failed, tests }, null, 2));
if (failed) process.exitCode = 1;
