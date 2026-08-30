import {
  createNFLGameDecisionRefreshRequirement,
} from "../gameDecisionSupport/refresh/NFLGameDecisionRefreshRequirementContract.js";

import {
  NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS,
  executeNFLGameDecisionRefresh,
} from "../gameDecisionSupport/refresh/NFLGameDecisionRefreshExecutor.js";

const tests = [];
const check = (name, fn) => {
  try {
    const passed = fn();
    tests.push({ name, passed: passed === true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
};

const game = {
  gameId: 2026091301,
  season: 2026,
  week: 1,
  awayTeam: "BAL",
  homeTeam: "BUF",
  kickoff: "2026-09-13T20:20:00Z",
};

const trigger = {
  domain: "PLAYER_AVAILABILITY",
  team: "BAL",
  playerId: "player-qb-1",
  changeType: "CHANGED",
  changedFields: ["status"],
  evidenceEffectiveAt: "2026-09-13T16:00:00Z",
};

const materiality = {
  level: "CRITICAL",
  rationale: "Starting QB availability changed.",
  position: "QB",
  starter: true,
  previousStatus: "QUESTIONABLE",
  currentStatus: "OUT",
};

function requirement(required = true) {
  return createNFLGameDecisionRefreshRequirement({
    game: required ? game : {},
    trigger,
    materiality,
    refreshRequired: required,
    reasonCode: required
      ? "STARTING_QB_AVAILABILITY_CHANGE"
      : "UNCHANGED_EVIDENCE",
    detectedAt: "2026-09-13T16:01:00Z",
  });
}

function dependencies({ availabilityStatus = "READY", failDecision = false } = {}) {
  const calls = [];
  const runtime = {
    invalidateTeamAvailability(args) {
      calls.push({ type: "invalidate", args });
      return { status: "INVALIDATED", invalidated: true, key: `${args.season}:${args.week}:${args.gameType}:${args.team}` };
    },
    async loadForMatchup(args) {
      calls.push({ type: "load", args });
      return { status: availabilityStatus, teams: args.teams.map(team => ({ team, status: availabilityStatus })) };
    },
  };
  const buildMatchup = async args => {
    calls.push({ type: "build", args });
    return { matchupEdge: 8, evidenceQuality: 0.7 };
  };
  const getDecision = async args => {
    calls.push({ type: "decision", args });
    if (failDecision) throw new Error("simulated decision failure");
    return {
      game: args.game,
      favorite: "BUF",
      homeWinProbability: 0.6,
      awayWinProbability: 0.4,
      generatedAt: args.generatedAt,
      model: { version: "NFL-GAME-DECISION-MODEL-V1.0.0" },
    };
  };
  return { calls, runtime, buildMatchup, getDecision };
}

const results = [];

{
  const dep = dependencies();
  results.push(await executeNFLGameDecisionRefresh({
    requirement: null,
    availabilityRuntime: dep.runtime,
    buildMatchup: dep.buildMatchup,
    getDecision: dep.getDecision,
  }));
}

{
  const dep = dependencies();
  results.push(await executeNFLGameDecisionRefresh({
    requirement: requirement(false),
    availabilityRuntime: dep.runtime,
    buildMatchup: dep.buildMatchup,
    getDecision: dep.getDecision,
  }));
}

const successDep = dependencies();
const success = await executeNFLGameDecisionRefresh({
  requirement: requirement(true),
  availabilityRuntime: successDep.runtime,
  buildMatchup: successDep.buildMatchup,
  getDecision: successDep.getDecision,
  now: () => "2026-09-13T16:02:00Z",
});

const staleDep = dependencies({ availabilityStatus: "STALE" });
const stale = await executeNFLGameDecisionRefresh({
  requirement: requirement(true),
  availabilityRuntime: staleDep.runtime,
  buildMatchup: staleDep.buildMatchup,
  getDecision: staleDep.getDecision,
});

const failDep = dependencies({ failDecision: true });
const failedDecision = await executeNFLGameDecisionRefresh({
  requirement: requirement(true),
  availabilityRuntime: failDep.runtime,
  buildMatchup: failDep.buildMatchup,
  getDecision: failDep.getDecision,
});

check("invalid-requirement-is-blocked", () =>
  results[0].status === NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.INVALID_REQUIREMENT
);

check("refresh-not-required-does-not-execute", () =>
  results[1].status === NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.NOT_REQUIRED
);

check("valid-requirement-executes", () =>
  success.status === NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.EXECUTED
);

check("affected-team-cache-is-invalidated-first", () =>
  successDep.calls[0]?.type === "invalidate" &&
  successDep.calls[0]?.args?.team === "BAL"
);

check("matchup-load-covers-both-teams", () =>
  successDep.calls[1]?.type === "load" &&
  successDep.calls[1]?.args?.teams?.join(",") === "BAL,BUF"
);

check("canonical-matchup-is-rebuilt-before-decision", () =>
  successDep.calls[2]?.type === "build" && successDep.calls[3]?.type === "decision"
);

check("canonical-decision-output-is-retained", () =>
  success.decision?.model?.version === "NFL-GAME-DECISION-MODEL-V1.0.0" &&
  success.decision?.homeWinProbability === 0.6
);

check("refresh-provenance-is-retained", () =>
  success.provenance?.reasonCode === "STARTING_QB_AVAILABILITY_CHANGE" &&
  success.provenance?.triggerTeam === "BAL"
);

check("stale-availability-fails-closed-before-model", () =>
  stale.status === NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.AVAILABILITY_REFRESH_FAILED &&
  staleDep.calls.every(call => call.type !== "build" && call.type !== "decision")
);

check("canonical-recompute-failure-is-not-silent", () =>
  failedDecision.status === NFL_GAME_DECISION_REFRESH_EXECUTION_STATUS.CANONICAL_RECOMPUTE_FAILED &&
  failedDecision.error?.message === "simulated decision failure"
);

check("executor-cannot-author-model-or-probability-mutation", () =>
  success.governance?.modelMutationAuthorized === false &&
  success.governance?.probabilityMutationAuthorized === false &&
  success.governance?.pickemReasoningAuthorized === false
);

check("le2-requirement-remains-orchestration-only", () =>
  success.requirement?.governance?.orchestrationOnly === true &&
  success.requirement?.governance?.recomputeAuthorized === false &&
  success.requirement?.governance?.cacheMutationAuthorized === false
);

const passed = tests.filter(test => test.passed).length;
const failed = tests.length - passed;

console.log(JSON.stringify({
  suite: "NFL Game Decision Refresh Executor Diagnostics",
  passed,
  failed,
  tests,
}, null, 2));

if (failed > 0) process.exitCode = 1;
