import fs from "node:fs";

import {
  createInMemoryResearchRepositoryAdapter,
} from "../src/data/researchRepository/diagnostics/adapters/createInMemoryResearchRepositoryAdapter.js";

import researchRepository from "../src/data/researchRepository/index.js";

import {
  createNFLAvailabilityAcquisitionPlan,
  createNFLAvailabilityResearchBundle,
  createNFLAvailabilityResearchRepositoryService,
  summarizeNFLAvailabilityAcquisitionResult,
} from "../src/data/footballIntelligence/nfl/availability/research/index.js";

const tests = [];
async function check(name, fn) {
  try { await fn(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
}
function assert(condition, message) { if (!condition) throw new Error(message); }

function record({ team, playerId, report = "Questionable", practice = "Limited", injury = "Knee" } = {}) {
  return {
    season: 2025, week: 1, gameType: "REG", team,
    player: { playerId, playerName: `${team} ${playerId}`, position: "WR" },
    injury: { primary: injury, secondary: null },
    status: { report, practice },
    provenance: {
      source: "nflverse-injury-reports",
      sourceUrl: "https://example.invalid/injuries_2025.csv",
      modifiedAt: "2025-09-01T12:00:00.000Z",
    },
  };
}

const fixture = [
  record({ team: "BAL", playerId: "BAL-1" }),
  record({ team: "BAL", playerId: "BAL-2" }),
  record({ team: "CAR", playerId: "CAR-1" }),
  record({ team: "PIT", playerId: "PIT-1" }),
];

await check("explicit-team-plan-is-deterministic", () => {
  const plan = createNFLAvailabilityAcquisitionPlan(fixture, {
    season: 2025, week: 1, teams: ["CAR", "BAL"],
  });
  assert(JSON.stringify(plan.selectedTeams) === JSON.stringify(["BAL", "CAR"]), "Explicit teams were not normalized/sorted.");
  assert(plan.recordCount === 3, "Explicit team record count incorrect.");
});

await check("all-team-plan-is-supported", () => {
  const plan = createNFLAvailabilityAcquisitionPlan(fixture, { season: 2025, week: 1, allTeams: true });
  assert(plan.teamCount === 3, "All-team plan did not select all teams.");
});

await check("max-teams-bounds-scheduled-scope", () => {
  const plan = createNFLAvailabilityAcquisitionPlan(fixture, { season: 2025, week: 1, allTeams: true, maxTeams: 2 });
  assert(plan.teamCount === 2, "maxTeams was not enforced.");
});

await check("missing-team-is-explicit", () => {
  const plan = createNFLAvailabilityAcquisitionPlan(fixture, { season: 2025, week: 1, teams: ["BAL", "ZZZ"] });
  assert(plan.missingTeams.includes("ZZZ"), "Missing requested team was not reported.");
});

await check("selection-required", () => {
  let threw = false;
  try { createNFLAvailabilityAcquisitionPlan(fixture, { season: 2025, week: 1 }); }
  catch { threw = true; }
  assert(threw, "Plan allowed implicit all-team selection.");
});

await check("multi-team-bundle-uses-one-session", () => {
  const plan = createNFLAvailabilityAcquisitionPlan(fixture, { season: 2025, week: 1, teams: ["BAL", "CAR"] });
  const bundle = createNFLAvailabilityResearchBundle(plan.selectedRecords, { checkedAt: "2026-08-13T12:00:00.000Z" });
  assert(bundle.summary.artifactCount === 2, "Expected one artifact per team.");
  assert(bundle.summary.sessionCount === 1, "Expected one session per season/week.");
});

await check("unchanged-team-week-is-idempotent", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  const bundle = createNFLAvailabilityResearchBundle(fixture.filter((item) => item.team === "BAL"), {
    checkedAt: "2026-08-13T12:00:00.000Z",
  });
  const first = await service.persistBundle(bundle);
  const second = await service.persistBundle(bundle);
  assert(first.artifactWrites === 1, "Initial artifact was not written.");
  assert(second.artifactWrites === 0 && second.unchangedArtifacts === 1, "Repeated identical team/week was not idempotent.");
});

await check("session-checkpoint-merges-team-artifacts", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  const bal = createNFLAvailabilityResearchBundle(fixture.filter((item) => item.team === "BAL"), {
    checkedAt: "2026-08-13T12:00:00.000Z",
  });
  const car = createNFLAvailabilityResearchBundle(fixture.filter((item) => item.team === "CAR"), {
    checkedAt: "2026-08-13T12:05:00.000Z",
  });
  await service.persistBundle(bal);
  await service.persistBundle(car);

  const sessionResult = await adapter.read({
    requestId: "diagnostic-read-session",
    operation: researchRepository.PERSISTENCE_OPERATION_TYPES.READ,
    recordType: researchRepository.PERSISTENCE_RECORD_TYPES.RESEARCH_SESSION,
    recordId: "research-session:nfl-availability:2025:1",
    query: { includeArchived: false, includeDeleted: false },
    consistency: researchRepository.PERSISTENCE_CONSISTENCY_MODES.STANDARD,
    context: { source: "DIAGNOSTIC" },
  });
  const refs = sessionResult.record?.artifactRefs?.evidenceArtifactRefs || [];
  assert(
    refs.includes("evidence:nfl-availability:2025:1:bal") &&
    refs.includes("evidence:nfl-availability:2025:1:car"),
    "Session checkpoint lost a previously persisted team artifact."
  );
});

await check("report-contract-captures-operational-counts", () => {
  const plan = createNFLAvailabilityAcquisitionPlan(fixture, { season: 2025, week: 1, teams: ["BAL"] });
  const bundle = createNFLAvailabilityResearchBundle(plan.selectedRecords, { checkedAt: "2026-08-13T12:00:00.000Z" });
  const report = summarizeNFLAvailabilityAcquisitionResult({ plan, bundle, mode: "DRY_RUN" });
  assert(report.contract === "NFLAvailabilityAcquisitionRunReport" && report.counts.artifacts === 1 && report.persistenceStatus === "NOT_EXECUTED", "Run report did not preserve operational state.");
});

const writer = fs.readFileSync(new URL("./runGovernedNFLAvailabilityAcquisition.mjs", import.meta.url), "utf8");

await check("writer-uses-postgres-not-data-api", () => {
  assert(writer.includes('import pg from "pg"') && !writer.includes("@supabase/supabase-js") && !writer.includes("/rest/v1"), "Writer does not preserve the PostgreSQL-only boundary.");
});
await check("writer-has-no-generic-database-fallback", () => {
  assert(writer.includes("RESEARCH_REPOSITORY_DATABASE_URL") && !/process\.env\.DATABASE_URL/.test(writer), "Writer accepts a generic DATABASE_URL fallback.");
});
await check("writer-does-not-auto-retry", () => {
  assert(!writer.includes("setTimeout(") && !writer.includes("retry(") && !writer.includes("maxRetries"), "Writer contains automatic retry behavior.");
});
await check("writer-requires-explicit-mode", () => {
  assert(writer.includes("Choose exactly one mode: --dry-run or --execute-write."), "Writer does not require an explicit execution mode.");
});
await check("writer-requires-week-and-team-selection", () => {
  assert(writer.includes("A positive --week is required for governed acquisition.") && writer.includes("Select --all-teams or at least one --team/--teams value."), "Writer can run with an unbounded acquisition scope.");
});
await check("source-unavailable-fails-closed", () => {
  assert(writer.includes('persistenceStatus: "SOURCE_UNAVAILABLE"') && writer.includes("Research Repository was not mutated."), "Missing provider source is not explicit/fail-closed.");
});

const failed = tests.filter((test) => !test.passed);
console.log(JSON.stringify({
  suite: "Governed NFL Availability Acquisition Runtime V1 Diagnostics",
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
}, null, 2));
if (failed.length) process.exitCode = 1;
