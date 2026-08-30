import {
  createFieResearchRepositoryAvailabilityRuntime,
} from "../../../services/fieDecisionApi/researchRepositoryAvailability.mjs";

const runtime = createFieResearchRepositoryAvailabilityRuntime({
  supabase: null,
});

const tests = [
  {
    name: "runtime-exposes-targeted-invalidation-boundary",
    passed: typeof runtime.invalidateTeamAvailability === "function",
  },
  {
    name: "unconfigured-invalidation-fails-closed",
    passed: runtime.invalidateTeamAvailability({
      season: 2026,
      week: 1,
      gameType: "REG",
      team: "BAL",
    })?.invalidated === false,
  },
  {
    name: "runtime-still-exposes-matchup-loader",
    passed: typeof runtime.loadForMatchup === "function",
  },
];

const passed = tests.filter(test => test.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "FIE Availability Runtime Targeted Invalidation Diagnostics",
  passed,
  failed,
  tests,
}, null, 2));

if (failed > 0) process.exitCode = 1;
