import assert from "node:assert/strict";

import {
  normalizeNFLCanonicalScheduleGame,
  validateNFLCanonicalSchedule,
} from "../gameDecisionSupport/schedule/NFLCanonicalScheduleContract.js";
import {
  createNFLCanonicalScheduleRepositoryService,
} from "../gameDecisionSupport/schedule/NFLCanonicalScheduleRepositoryService.js";

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

const rows = [
  {
    game_id: 1001,
    season: 2026,
    week: 1,
    game_type: "REG",
    away_team: "BAL",
    home_team: "BUF",
    kickoff: "2026-09-13T17:00:00.000Z",
    status: "SCHEDULED",
  },
  {
    game_id: 1002,
    season: 2026,
    week: 1,
    game_type: "REG",
    away_team: "CIN",
    home_team: "CLE",
    kickoff: "2026-09-13T17:00:00.000Z",
    status: "SCHEDULED",
  },
];

const calls = [];
const pool = {
  async query(sql, params) {
    calls.push({ sql, params });
    return { rows };
  },
};

const service = createNFLCanonicalScheduleRepositoryService({ pool });
const result = await service.readWeek({ season: 2026, week: 1 });

await check("repository reads the shared canonical schedule table", async () => {
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /public\.nfl_canonical_games/);
});

await check("repository scope is season week and game type", async () => {
  assert.deepEqual(calls[0].params, [2026, 1, "REG"]);
});

await check("numeric canonical game identity is preserved", async () => {
  assert.deepEqual(result.records.map(game => game.gameId), [1001, 1002]);
});

await check("canonical football identity is preserved", async () => {
  assert.equal(result.records[0].awayTeam, "BAL");
  assert.equal(result.records[0].homeTeam, "BUF");
});

await check("kickoff is normalized for LE-3 resolution", async () => {
  assert.equal(result.records[0].kickoff, "2026-09-13T17:00:00.000Z");
});

await check("repository service is provider neutral", async () => {
  assert.equal(result.governance.providerSpecificDependencyAuthorized, false);
});

await check("repository service does not depend on Pick'em at runtime", async () => {
  assert.equal(result.governance.pickemRuntimeDependencyAuthorized, false);
});

await check("repository service is read only for FIE execution", async () => {
  assert.equal(result.governance.readOnly, true);
  assert.equal(result.governance.modelCalculationAuthorized, false);
  assert.equal(result.governance.probabilityCalculationAuthorized, false);
});

await check("invalid canonical game ids fail validation", async () => {
  const normalized = normalizeNFLCanonicalScheduleGame({
    ...rows[0],
    game_id: "provider-guid",
  });
  assert.equal(normalized.valid, false);
  assert(normalized.errors.includes("NUMERIC_GAME_ID_REQUIRED"));
});

await check("duplicate football identity fails closed", async () => {
  const validation = validateNFLCanonicalSchedule([
    rows[0],
    { ...rows[0], game_id: 9999 },
  ]);
  assert.equal(validation.valid, false);
  assert.equal(validation.duplicateFootballIdentities.length, 1);
});

await check("empty week is a valid empty repository response", async () => {
  const emptyService = createNFLCanonicalScheduleRepositoryService({
    pool: { async query() { return { rows: [] }; } },
  });
  const empty = await emptyService.readWeek({ season: 2026, week: 2 });
  assert.equal(empty.status, "SUCCESS");
  assert.equal(empty.records.length, 0);
});

await check("repository never authors model or probability logic", async () => {
  assert.equal("probability" in result, false);
  assert.equal("model" in result, false);
});

console.log(
  `NFLCanonicalScheduleRepositoryDiagnostics: ${passed}/${passed} passed`
);
