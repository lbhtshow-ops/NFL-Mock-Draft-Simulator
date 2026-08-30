import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import researchRepository from "../../data/researchRepository/index.js";
import { createInMemoryResearchRepositoryAdapter } from "../../data/researchRepository/diagnostics/adapters/createInMemoryResearchRepositoryAdapter.js";

import {
  createNFLPlayerAvailabilityEvidence,
} from "../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityEvidenceContract.js";

import {
  createNFLAvailabilityResearchBundle,
  createNFLAvailabilityResearchRepositoryService,
  loadNFLAvailabilityEvidenceFromResearchRepository,
} from "../../data/footballIntelligence/nfl/availability/research/index.js";

const tests = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, fn) {
  try {
    await fn();
    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
}

function sampleEvidence({
  reportStatus = "QUESTIONABLE",
  practiceStatus = "LIMITED",
  modifiedAt = "2026-09-09T12:00:00.000Z",
} = {}) {
  return createNFLPlayerAvailabilityEvidence({
    season: 2026,
    week: 1,
    gameType: "REG",
    team: "BAL",
    playerId: "00-1234567",
    playerName: "Example Quarterback",
    position: "QB",
    primaryInjury: "Knee",
    secondaryInjury: null,
    reportStatus,
    practiceStatus,
    modifiedAt,
    source: "nflverse-injury-reports",
    sourceUrl:
      "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2026.csv",
  });
}

const checkedAt = "2026-09-09T13:00:00.000Z";
const initialBundle = createNFLAvailabilityResearchBundle([sampleEvidence()], { checkedAt });

await check("reuses-approved-research-repository-contracts", async () => {
  assert(researchRepository.validateResearchSource(initialBundle.source).valid, "ResearchSource invalid.");
  assert(initialBundle.sessions.every((record) => researchRepository.validateResearchSession(record).valid), "ResearchSession invalid.");
  assert(initialBundle.observations.every((record) => researchRepository.validateRecordedObservation(record).valid), "RecordedObservation invalid.");
  assert(initialBundle.artifacts.every((record) => researchRepository.validateEvidenceArtifact(record).valid), "EvidenceArtifact invalid.");
});

await check("availability-capture-does-not-create-fid-records", async () => {
  assert(initialBundle.source.contract === "ResearchSource", "Source is not Research Repository owned.");
  assert(initialBundle.observations.every((record) => record.contract === "RecordedObservation"), "Observation is not Research Repository owned.");
  assert(initialBundle.artifacts.every((record) => record.contract === "EvidenceArtifact"), "Artifact is not Research Repository owned.");
});

await check("existing-persistence-adapter-persists-availability-bundle", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  const result = await service.persistBundle(initialBundle);
  assert(result.status === "SUCCESS", `Expected SUCCESS, got ${result.status}.`);
  assert(result.observationWrites > 0, "No recorded observations were persisted.");
  assert(result.artifactWrites === 1, "Expected one team/week evidence artifact.");
});

await check("unchanged-team-week-is-detected-without-parallel-state-table", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  const first = await service.persistBundle(initialBundle);
  const second = await service.persistBundle(initialBundle);
  assert(first.status === "SUCCESS", "First persistence failed.");
  assert(second.status === "SUCCESS", "Second persistence failed.");
  assert(second.unchangedArtifacts === 1, "Unchanged artifact was not detected.");
  assert(second.observationWrites === 0, "Unchanged observations were rewritten.");
});

await check("changed-status-preserves-prior-observation-history", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  await service.persistBundle(initialBundle);

  const changedBundle = createNFLAvailabilityResearchBundle(
    [sampleEvidence({ reportStatus: "OUT", practiceStatus: "DID_NOT_PARTICIPATE", modifiedAt: "2026-09-10T12:00:00.000Z" })],
    { checkedAt: "2026-09-10T13:00:00.000Z" }
  );
  const changed = await service.persistBundle(changedBundle);
  assert(changed.status === "SUCCESS", "Changed bundle failed.");
  assert(changed.artifactWrites === 1, "Changed artifact was not updated.");

  const current = await service.readTeamWeek({ season: 2026, week: 1, team: "BAL" });
  assert(current.status === "SUCCESS", "Current artifact could not be read.");
  assert(current.observations.some((record) => record.record.field === "report_status" && record.record.valueText === "OUT"), "Current report status not updated.");
});

await check("research-repository-projects-back-to-canonical-availability-evidence", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  await service.persistBundle(initialBundle);

  const projected = await loadNFLAvailabilityEvidenceFromResearchRepository({
    repositoryService: service,
    season: 2026,
    week: 1,
    team: "BAL",
    gameType: "REG",
    now: "2026-09-09T20:00:00.000Z",
  });

  assert(projected.status === "READY", `Expected READY, got ${projected.status}.`);
  assert(projected.records.length === 1, "Expected one projected player record.");
  assert(projected.records[0].status.report === "QUESTIONABLE", "Report status projection failed.");
  assert(projected.records[0].status.practice === "LIMITED", "Practice status projection failed.");
  assert(projected.records[0].injury.primary === "Knee", "Injury projection failed.");
});

await check("stale-research-evidence-fails-closed", async () => {
  const adapter = createInMemoryResearchRepositoryAdapter();
  const service = createNFLAvailabilityResearchRepositoryService({ adapter });
  await service.persistBundle(initialBundle);

  const projected = await loadNFLAvailabilityEvidenceFromResearchRepository({
    repositoryService: service,
    season: 2026,
    week: 1,
    team: "BAL",
    gameType: "REG",
    now: "2026-09-15T20:00:00.000Z",
  });

  assert(projected.status === "STALE", `Expected STALE, got ${projected.status}.`);
  assert(projected.records.length === 0, "Stale evidence should not reach FIE availability scoring.");
});

await check("no-parallel-sports-knowledge-migration-is-introduced", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "../../../..");
  const proposed = path.resolve(root, "supabase/migrations/20260812_sports_knowledge_nfl_availability_v1.sql");
  assert(!fs.existsSync(proposed), "Parallel Sports Knowledge Repository migration exists.");
});

await check("availability-research-layer-has-no-fid-persistence-dependency", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dir = path.resolve(here, "../../data/footballIntelligence/nfl/availability/research");
  const source = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => fs.readFileSync(path.join(dir, name), "utf8"))
    .join("\n");
  assert(!/\/fid\/|fid\/persistence|FootballIntelligenceDatabase/i.test(source), "FID persistence dependency detected.");
});

const failed = tests.filter((test) => !test.passed);

console.log(
  JSON.stringify(
    {
      suite: "NFL Availability Research Repository Integration V1 Diagnostics",
      passed: tests.length - failed.length,
      failed: failed.length,
      tests,
    },
    null,
    2
  )
);

if (failed.length) process.exitCode = 1;
