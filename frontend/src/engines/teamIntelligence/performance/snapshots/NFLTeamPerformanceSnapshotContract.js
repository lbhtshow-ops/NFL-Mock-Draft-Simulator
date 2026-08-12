import { createNFLTeamPerformanceEvidence } from "../NFLTeamPerformanceEvidenceContract.js";

export const NFL_TEAM_PERFORMANCE_SNAPSHOT_CONTRACT = "NFLTeamPerformanceSnapshot";
export const NFL_TEAM_PERFORMANCE_SNAPSHOT_VERSION = "NFL-TEAM-PERFORMANCE-SNAPSHOT-1.0.0";

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function iso(value) {
  const normalized = text(value);
  if (!normalized) return null;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function createNFLTeamPerformanceSnapshot(input = {}) {
  const evidence = input.evidence ? createNFLTeamPerformanceEvidence(input.evidence) : null;
  const teamAbbreviation = text(input.teamAbbreviation)?.toUpperCase() || evidence?.teamAbbreviation || null;
  const season = Number.isInteger(input.season) ? input.season : evidence?.season ?? null;
  const throughWeek = Number.isInteger(input.throughWeek) ? input.throughWeek : evidence?.throughWeek ?? null;
  const provider = text(input.provider) || evidence?.provenance?.provider || null;
  const dataset = text(input.dataset) || evidence?.provenance?.dataset || null;
  const methodologyVersion = text(input.methodologyVersion) || evidence?.provenance?.methodology || null;

  const errors = [];
  if (!teamAbbreviation) errors.push("TEAM_REQUIRED");
  if (!Number.isInteger(season)) errors.push("SEASON_REQUIRED");
  if (!Number.isInteger(throughWeek) || throughWeek < 0) errors.push("THROUGH_WEEK_REQUIRED");
  if (!provider) errors.push("PROVIDER_REQUIRED");
  if (!dataset) errors.push("DATASET_REQUIRED");
  if (!methodologyVersion) errors.push("METHODOLOGY_VERSION_REQUIRED");
  if (!evidence?.validation?.valid) errors.push("VALID_EVIDENCE_REQUIRED");

  return Object.freeze({
    contract: NFL_TEAM_PERFORMANCE_SNAPSHOT_CONTRACT,
    version: NFL_TEAM_PERFORMANCE_SNAPSHOT_VERSION,
    teamAbbreviation,
    season,
    throughWeek,
    provider,
    dataset,
    methodologyVersion,
    generatedAt: iso(input.generatedAt),
    retrievedAt: iso(input.retrievedAt) || evidence?.freshness?.retrievedAt || null,
    providerUpdatedAt: iso(input.providerUpdatedAt),
    sourceUrl: text(input.sourceUrl),
    datasetVersion: text(input.datasetVersion) || evidence?.provenance?.datasetVersion || null,
    cache: Object.freeze({
      status: text(input.cache?.status) || "MISS",
      key: text(input.cache?.key),
      storedAt: iso(input.cache?.storedAt),
      expiresAt: iso(input.cache?.expiresAt),
      ageMs: Number.isFinite(input.cache?.ageMs) && input.cache.ageMs >= 0 ? input.cache.ageMs : null,
      stale: input.cache?.stale === true,
    }),
    evidence,
    validation: Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) }),
  });
}

export function buildNFLTeamPerformanceSnapshotKey({
  team,
  season,
  throughWeek,
  provider,
  dataset,
  methodologyVersion,
} = {}) {
  const code = text(team)?.toUpperCase();
  if (!code || !Number.isInteger(season) || !Number.isInteger(throughWeek)) return null;
  if (!text(provider) || !text(dataset) || !text(methodologyVersion)) return null;
  return [provider, dataset, methodologyVersion, season, throughWeek, code]
    .map((value) => String(value).trim().toUpperCase())
    .join("::");
}

export default {
  NFL_TEAM_PERFORMANCE_SNAPSHOT_CONTRACT,
  NFL_TEAM_PERFORMANCE_SNAPSHOT_VERSION,
  createNFLTeamPerformanceSnapshot,
  buildNFLTeamPerformanceSnapshotKey,
};
