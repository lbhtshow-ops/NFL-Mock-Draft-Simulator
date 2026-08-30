#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  createFieResearchRepositoryAvailabilityRuntime,
} from "../services/fieDecisionApi/researchRepositoryAvailability.mjs";

const tests = [];
async function test(name, fn) {
  try {
    await fn();
    tests.push({ name, status: "PASS" });
  } catch (error) {
    tests.push({
      name,
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await test("not-configured-runtime-exposes-invalidation", () => {
  const previousUrl = process.env.RESEARCH_REPOSITORY_SUPABASE_URL;
  const previousKey = process.env.RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.RESEARCH_REPOSITORY_SUPABASE_URL;
  delete process.env.RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const runtime = createFieResearchRepositoryAvailabilityRuntime();
    assert.equal(typeof runtime.invalidateTeamAvailability, "function");
    const result = runtime.invalidateTeamAvailability({
      season: 2026, week: 1, gameType: "REG", team: "BAL",
    });
    assert.equal(result.status, "NOT_CONFIGURED");
    assert.equal(result.invalidated, false);
    assert.equal(result.key, "2026:1:REG:BAL");
  } finally {
    if (previousUrl !== undefined) process.env.RESEARCH_REPOSITORY_SUPABASE_URL = previousUrl;
    if (previousKey !== undefined) process.env.RESEARCH_REPOSITORY_SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousSupabaseUrl !== undefined) process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousSupabaseKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = previousSupabaseKey;
  }
});

await test("configured-injected-runtime-exposes-invalidation", async () => {
  const repositoryService = {
    async readTeamWeek() {
      return { status: "NOT_FOUND", records: [] };
    },
  };
  const runtime = createFieResearchRepositoryAvailabilityRuntime({
    repositoryService,
    now: () => "2026-08-30T03:50:00.000Z",
  });
  assert.equal(runtime.configured, true);
  assert.equal(typeof runtime.invalidateTeamAvailability, "function");
  const first = runtime.invalidateTeamAvailability({
    season: 2026, week: 1, gameType: "REG", team: "BAL",
  });
  assert.equal(first.status, "NOT_CACHED");
  assert.equal(first.invalidated, false);
});

await test("invalidation-key-is-deterministic", () => {
  const repositoryService = {
    async readTeamWeek() {
      return { status: "NOT_FOUND", records: [] };
    },
  };
  const runtime = createFieResearchRepositoryAvailabilityRuntime({ repositoryService });
  const a = runtime.invalidateTeamAvailability({
    season: 2026, week: 1, gameType: "REG", team: "SF",
  });
  const b = runtime.invalidateTeamAvailability({
    season: 2026, week: 1, gameType: "REG", team: "SF",
  });
  assert.equal(a.key, "2026:1:REG:SF");
  assert.equal(b.key, a.key);
});

const passed = tests.filter((t) => t.status === "PASS").length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "FIE Forced Refresh Availability Runtime Parity Diagnostics",
  sprint: "6C",
  version: "1.0.0",
  passed,
  failed,
  tests,
  safeguards: {
    modelMutationAuthorized: false,
    probabilityMutationAuthorized: false,
    databaseMutationAuthorized: false,
    pickemMutationAuthorized: false,
    sportradarRequired: false,
  },
}, null, 2));

if (failed) process.exitCode = 1;
