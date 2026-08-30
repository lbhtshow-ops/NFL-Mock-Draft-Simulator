import assert from "node:assert/strict";

import {
  NFL_CANONICAL_GAME_IDENTITY_STATUS,
  resolveNFLCanonicalGameIdentity,
} from "../gameDecisionSupport/identity/NFLCanonicalGameIdentityResolver.js";

let passes = 0;
async function check(name, fn) {
  await fn();
  passes += 1;
  console.log(`PASS ${passes}: ${name}`);
}

const providerGame = {
  provider: "TEMP_PROVIDER",
  providerGameId: "provider-guid-abc",
  season: 2026,
  week: 1,
  awayTeam: "BAL",
  homeTeam: "BUF",
  kickoff: "2026-09-13T17:00:00.000Z",
};

const canonicalSchedule = [
  {
    gameId: 6201,
    season: 2026,
    week: 1,
    awayTeam: "BAL",
    homeTeam: "BUF",
    kickoff: "2026-09-13T17:00:00.000Z",
  },
];

const resolved = resolveNFLCanonicalGameIdentity({
  providerGame,
  canonicalScheduleRecords: canonicalSchedule,
});

await check("football identity resolves one canonical numeric game id", async () => {
  assert.equal(resolved.status, NFL_CANONICAL_GAME_IDENTITY_STATUS.RESOLVED);
  assert.equal(resolved.canonicalGame.gameId, 6201);
});

await check("provider identity is retained only as provenance", async () => {
  assert.equal(resolved.providerIdentity.provider, "TEMP_PROVIDER");
  assert.equal(resolved.providerIdentity.providerGameId, "provider-guid-abc");
  assert.notEqual(
    String(resolved.canonicalGame.gameId),
    resolved.providerIdentity.providerGameId
  );
});

await check("resolver does not synthesize canonical ids from provider ids", async () => {
  assert.equal(resolved.governance.canonicalGameIdSynthesisAuthorized, false);
  assert.equal(resolved.governance.providerSpecificIdentityAuthorized, false);
});

await check("kickoff corroborates a matching football identity", async () => {
  assert.equal(resolved.kickoffCorroborated, true);
});

await check("small kickoff representation drift is tolerated", async () => {
  const result = resolveNFLCanonicalGameIdentity({
    providerGame: {
      ...providerGame,
      kickoff: "2026-09-13T17:10:00.000Z",
    },
    canonicalScheduleRecords: canonicalSchedule,
  });
  assert.equal(result.status, NFL_CANONICAL_GAME_IDENTITY_STATUS.RESOLVED);
  assert.equal(result.kickoffCorroborated, true);
});

await check("material kickoff disagreement fails closed", async () => {
  const result = resolveNFLCanonicalGameIdentity({
    providerGame: {
      ...providerGame,
      kickoff: "2026-09-13T18:00:00.000Z",
    },
    canonicalScheduleRecords: canonicalSchedule,
  });
  assert.equal(result.status, NFL_CANONICAL_GAME_IDENTITY_STATUS.UNRESOLVED);
  assert.equal(result.reason, "KICKOFF_CORROBORATION_FAILED");
  assert.equal(result.canonicalGame, null);
});

await check("missing football identity fails closed", async () => {
  const result = resolveNFLCanonicalGameIdentity({
    providerGame: { ...providerGame, homeTeam: "CAR" },
    canonicalScheduleRecords: canonicalSchedule,
  });
  assert.equal(result.status, NFL_CANONICAL_GAME_IDENTITY_STATUS.UNRESOLVED);
  assert.equal(result.reason, "CANONICAL_FOOTBALL_IDENTITY_NOT_FOUND");
});

await check("multiple canonical matches fail closed as ambiguous", async () => {
  const result = resolveNFLCanonicalGameIdentity({
    providerGame,
    canonicalScheduleRecords: [
      canonicalSchedule[0],
      { ...canonicalSchedule[0], gameId: 6202 },
    ],
  });
  assert.equal(result.status, NFL_CANONICAL_GAME_IDENTITY_STATUS.AMBIGUOUS);
  assert.equal(result.canonicalGame, null);
  assert.equal(result.candidateCount, 2);
});

await check("canonical schedule absence fails closed", async () => {
  const result = resolveNFLCanonicalGameIdentity({
    providerGame,
    canonicalScheduleRecords: [],
  });
  assert.equal(
    result.status,
    NFL_CANONICAL_GAME_IDENTITY_STATUS.CANONICAL_SCHEDULE_UNAVAILABLE
  );
});

await check("provider-neutral contract requires provenance plus football identity", async () => {
  const result = resolveNFLCanonicalGameIdentity({
    providerGame: {
      season: 2026,
      week: 1,
      awayTeam: "BAL",
      homeTeam: "BUF",
    },
    canonicalScheduleRecords: canonicalSchedule,
  });
  assert.equal(
    result.status,
    NFL_CANONICAL_GAME_IDENTITY_STATUS.INVALID_PROVIDER_GAME
  );
  assert.equal(result.governance.modelCalculationAuthorized, false);
  assert.equal(result.governance.probabilityCalculationAuthorized, false);
});

console.log(
  `NFLCanonicalGameIdentityResolverDiagnostics: ${passes}/${passes} passed`
);
