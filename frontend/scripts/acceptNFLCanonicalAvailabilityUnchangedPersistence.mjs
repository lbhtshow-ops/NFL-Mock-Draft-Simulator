import assert from "node:assert/strict";
import pg from "pg";

import {
  createPostgresResearchRepositoryAdapter,
} from "../src/data/researchRepository/persistence/postgres/createPostgresResearchRepositoryAdapter.js";

import {
  createNFLAvailabilityResearchRepositoryService,
} from "../src/data/footballIntelligence/nfl/availability/research/NFLAvailabilityResearchRepositoryService.js";

import {
  persistNFLAvailabilityBundleWithLiveRefresh,
} from "../src/engines/gameDecisionSupport/refresh/NFLLiveAvailabilityPersistenceRefreshBinding.js";

const { Pool } = pg;
const args = process.argv.slice(2);
const value = flag => {
  const index = args.lastIndexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const season = Number(value("--season"));
const week = Number(value("--week"));
const gameType = String(value("--game-type") || "REG").trim().toUpperCase();
const team = String(value("--team") || "").trim().toUpperCase();

if (!Number.isInteger(season)) throw new Error("Valid --season is required.");
if (!Number.isInteger(week) || week < 1) throw new Error("Valid --week is required.");
if (!team) throw new Error("Valid --team is required.");

const databaseUrl = process.env.RESEARCH_REPOSITORY_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("RESEARCH_REPOSITORY_DATABASE_URL is required.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 2,
  application_name: "lbht-fie-le3-f3-unchanged-acceptance",
});

try {
  const adapter = createPostgresResearchRepositoryAdapter({
    pool,
    options: {
      allowSoftDelete: true,
      allowArchive: true,
      allowHardDelete: false,
    },
  });
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });

  const snapshot = await service.readTeamWeek({
    season,
    week,
    gameType,
    team,
  });

  if (snapshot.status !== "SUCCESS") {
    throw new Error(
      `F3_ACCEPTANCE_SNAPSHOT_UNAVAILABLE:${snapshot.status}:${season}:${gameType}:${week}:${team}`
    );
  }
  if (!snapshot.source || !snapshot.artifact || !snapshot.session) {
    throw new Error(
      `F3_ACCEPTANCE_INCOMPLETE_SNAPSHOT:source=${Boolean(snapshot.source)}:artifact=${Boolean(snapshot.artifact)}:session=${Boolean(snapshot.session)}`
    );
  }

  const bundle = {
    source: snapshot.source,
    observations: snapshot.observations,
    artifacts: [snapshot.artifact],
    sessions: [snapshot.session],
    summary: {
      replay: true,
      teamWeekCount: 1,
      observationCount: snapshot.observations.length,
      artifactCount: 1,
      sessionCount: 1,
    },
  };

  let coordinatorCalls = 0;
  const result = await persistNFLAvailabilityBundleWithLiveRefresh({
    repositoryService: service,
    bundle,
    season,
    week,
    gameType,
    teams: [team],
    scheduleRecords: [],
    asOf: new Date().toISOString(),
    provenance: {
      acceptanceGate: "LE-3I-F3",
      source: "CANONICAL_REPOSITORY_REPLAY",
      providerSpecificDependencyAuthorized: false,
    },
    coordinateRefresh: async () => {
      coordinatorCalls += 1;
      throw new Error("UNCHANGED_EVIDENCE_MUST_NOT_REACH_REFRESH_COORDINATOR");
    },
  });

  assert.equal(result.persistence.status, "SUCCESS");
  assert.equal(result.persistence.observationWrites, 0);
  assert.equal(result.persistence.artifactWrites, 0);
  assert.equal(result.persistence.sessionWrites, 0);
  assert.equal(result.persistence.unchangedArtifacts, 1);
  assert.equal(result.teamResults[0]?.status, "UNCHANGED");
  assert.equal(result.teamResults[0]?.persistenceStatus, "UNCHANGED");
  assert.equal(result.summary.unchanged, 1);
  assert.equal(result.summary.refreshProcessed, 0);
  assert.equal(result.summary.refreshExecutions, 0);
  assert.equal(result.summary.refreshFailed, 0);
  assert.equal(coordinatorCalls, 0);

  console.log(JSON.stringify({
    gate: "LE-3I-F3",
    status: "PASS",
    scope: { season, week, gameType, team },
    repositoryIdentityMode: snapshot.identityMode,
    evidenceId: snapshot.evidenceId,
    snapshot: {
      observations: snapshot.observations.length,
      sessionId: snapshot.session.sessionId,
    },
    persistence: {
      status: result.persistence.status,
      observationWrites: result.persistence.observationWrites,
      artifactWrites: result.persistence.artifactWrites,
      sessionWrites: result.persistence.sessionWrites,
      unchangedArtifacts: result.persistence.unchangedArtifacts,
      unchangedSessions: result.persistence.unchangedSessions,
      teamStatus: result.persistence.teamResults[0]?.status ?? null,
    },
    refresh: {
      coordinatorCalls,
      unchanged: result.summary.unchanged,
      processed: result.summary.refreshProcessed,
      executions: result.summary.refreshExecutions,
      failures: result.summary.refreshFailed,
    },
    governance: {
      providerSpecificDependencyAuthorized: false,
      externalProviderRequestPerformed: false,
    },
  }, null, 2));
} finally {
  await pool.end();
}
