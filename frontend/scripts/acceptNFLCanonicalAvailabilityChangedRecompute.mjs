import assert from "node:assert/strict";
import pg from "pg";

import {
  createNFLCanonicalScheduleRepositoryService,
} from "../src/engines/gameDecisionSupport/schedule/NFLCanonicalScheduleRepositoryService.js";

import {
  persistNFLAvailabilityBundleWithLiveRefresh,
} from "../src/engines/gameDecisionSupport/refresh/NFLLiveAvailabilityPersistenceRefreshBinding.js";

import {
  buildNFLMatchupIntelligenceProfile,
} from "../src/data/footballIntelligence/services/NFLMatchupIntelligenceService.js";

import {
  getNFLGameDecision,
} from "../src/engines/gameDecisionSupport/canonical/NFLGameDecisionService.js";

const { Pool } = pg;

const args = process.argv.slice(2);
const value = flag => {
  const index = args.lastIndexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const season = Number(value("--season") || 2026);
const week = Number(value("--week") || 1);
const gameType = String(value("--game-type") || "REG").trim().toUpperCase();
const team = String(value("--team") || "BAL").trim().toUpperCase();

if (!Number.isInteger(season)) throw new Error("Valid --season is required.");
if (!Number.isInteger(week) || week < 1) throw new Error("Valid --week is required.");
if (!team || !/^[A-Z]{2,3}$/.test(team)) throw new Error("Valid --team is required.");

const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL;
if (!databaseUrl) throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required.");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 2,
  application_name: "lbht-fie-le3-f4-changed-acceptance",
});

try {
  const scheduleService = createNFLCanonicalScheduleRepositoryService({ pool });
  const schedule = await scheduleService.readWeek({ season, week, gameType });

  assert.equal(schedule.status, "SUCCESS");
  assert(schedule.records.length > 0, "Canonical schedule records are required.");

  const matchingGames = schedule.records.filter(
    game => game.awayTeam === team || game.homeTeam === team
  );
  assert.equal(
    matchingGames.length,
    1,
    `Exactly one canonical ${team} game is required for the selected week.`
  );

  const game = matchingGames[0];
  const asOf = new Date(Date.parse(game.kickoff) - 24 * 60 * 60 * 1000).toISOString();

  const previousPlayers = [
    {
      playerId: `acceptance:${team}:qb1`,
      playerName: "F4 Acceptance Quarterback",
      position: "QB",
      starter: true,
      depthRank: 1,
      availabilityStatus: "AVAILABLE",
      rosterStatus: "ACTIVE",
      snapshotId: "f4-before",
      effectiveAt: asOf,
    },
  ];

  const currentPlayers = [
    {
      ...previousPlayers[0],
      availabilityStatus: "OUT",
      reportStatus: "OUT",
      snapshotId: "f4-after",
    },
  ];

  let projectionReads = 0;
  const loadProjection = async () => {
    projectionReads += 1;
    return {
      status: "READY",
      resolution: {
        players: projectionReads === 1 ? previousPlayers : currentPlayers,
      },
    };
  };

  let persistenceCalls = 0;
  const repositoryService = {
    async persistBundle() {
      persistenceCalls += 1;
      return {
        status: "SUCCESS",
        observationWrites: 1,
        artifactWrites: 1,
        sessionWrites: 1,
        unchangedArtifacts: 0,
        unchangedSessions: 0,
        failures: [],
        teamResults: [{ team, status: "SUCCESS" }],
      };
    },
  };

  const runtimeCalls = [];
  const availabilityRuntime = {
    configured: true,
    invalidateTeamAvailability(input) {
      runtimeCalls.push({ type: "invalidate", input });
      return {
        status: "INVALIDATED",
        invalidated: true,
        key: `${input.season}:${input.week}:${input.gameType}:${input.team}`,
      };
    },
    async loadForMatchup(input) {
      runtimeCalls.push({ type: "load", input });
      return {
        status: "READY",
        teams: input.teams.map(code => ({
          team: code,
          status: "READY",
          freshness: "FRESH",
          recordCount: code === team ? currentPlayers.length : 0,
        })),
      };
    },
  };

  let matchupCalls = 0;
  let decisionCalls = 0;

  const buildMatchup = async input => {
    matchupCalls += 1;
    return buildNFLMatchupIntelligenceProfile(input);
  };

  const getDecision = async input => {
    decisionCalls += 1;
    return getNFLGameDecision(input);
  };

  const result = await persistNFLAvailabilityBundleWithLiveRefresh({
    repositoryService,
    bundle: { acceptance: "LE-3I-F4" },
    season,
    week,
    gameType,
    teams: [team],
    scheduleRecords: schedule.records,
    asOf,
    provenance: {
      acceptanceGate: "LE-3I-F4",
      source: "CONTROLLED_IN_MEMORY_CHANGED_EVIDENCE",
      providerSpecificDependencyAuthorized: false,
    },
    availabilityRuntime,
    buildMatchup,
    getDecision,
    loadProjection,
    now: () => asOf,
  });

  const teamResult = result.teamResults[0];
  const refresh = teamResult?.refresh;
  const executed = refresh?.results?.find(entry => entry.execution?.status === "EXECUTED");
  const execution = executed?.execution ?? null;

  assert.equal(persistenceCalls, 1);
  assert.equal(projectionReads, 2);
  assert.equal(teamResult.status, "REFRESH_PROCESSED");
  assert.equal(result.summary.refreshProcessed, 1);
  assert.equal(result.summary.refreshExecutions, 1);
  assert.equal(result.summary.refreshFailed, 0);

  assert.equal(refresh.status, "COMPLETE");
  assert.equal(refresh.summary.changes, 1);
  assert.equal(refresh.summary.refreshRequirements, 1);
  assert.equal(refresh.summary.executed, 1);

  assert(executed, "One canonical refresh execution must complete.");
  assert.equal(
    executed.orchestration.materiality.level,
    "CRITICAL"
  );
  assert.equal(
    executed.orchestration.materiality.reasonCode,
    "STARTING_QB_AVAILABILITY_CHANGE"
  );

  assert.equal(runtimeCalls[0]?.type, "invalidate");
  assert.equal(runtimeCalls[0]?.input.team, team);
  assert.equal(runtimeCalls[1]?.type, "load");
  assert.deepEqual(
    runtimeCalls[1]?.input.teams,
    [game.awayTeam, game.homeTeam]
  );

  assert.equal(matchupCalls, 1);
  assert.equal(decisionCalls, 1);
  assert.equal(execution.status, "EXECUTED");
  assert.equal(execution.requirement.game.gameId, game.gameId);
  assert.equal(execution.requirement.trigger.team, team);

  assert(execution.matchup, "Canonical matchup result must be retained.");
  assert(execution.decision, "Canonical decision result must be retained.");
  assert.equal(
    execution.decision.contract,
    "NFLGameDecisionOutput"
  );
  assert.equal(
    execution.governance.modelMutationAuthorized,
    false
  );
  assert.equal(
    execution.governance.probabilityMutationAuthorized,
    false
  );

  console.log(JSON.stringify({
    gate: "LE-3I-F4",
    status: "PASS",
    scope: {
      season,
      week,
      gameType,
      team,
      gameId: game.gameId,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      kickoff: game.kickoff,
    },
    change: {
      playerId: previousPlayers[0].playerId,
      position: "QB",
      starter: true,
      previousStatus: "AVAILABLE",
      currentStatus: "OUT",
      materiality: executed.orchestration.materiality.level,
      reasonCode: executed.orchestration.materiality.reasonCode,
    },
    persistenceBoundary: {
      simulated: true,
      destructiveWritePerformed: false,
      persistenceCalls,
      projectionReads,
      persistenceStatus: result.persistence.status,
      teamPersistenceStatus: result.persistence.teamResults[0]?.status ?? null,
    },
    refresh: {
      processed: result.summary.refreshProcessed,
      executions: result.summary.refreshExecutions,
      failures: result.summary.refreshFailed,
      runtimeOrder: runtimeCalls.map(entry => entry.type),
      matchupCalls,
      decisionCalls,
      executionStatus: execution.status,
    },
    canonicalDecision: {
      contract: execution.decision.contract,
      favorite: execution.decision.favorite ?? null,
      homeWinProbability: execution.decision.homeWinProbability ?? null,
      awayWinProbability: execution.decision.awayWinProbability ?? null,
      expectedPointMargin: execution.decision.expectedPointMargin ?? null,
    },
    governance: {
      providerSpecificDependencyAuthorized: false,
      externalProviderRequestPerformed: false,
      productionEvidenceMutationPerformed: false,
      canonicalScheduleReadOnly: true,
      canonicalMatchupBuilderUsed: true,
      canonicalDecisionServiceUsed: true,
    },
  }, null, 2));
} finally {
  await pool.end();
}
