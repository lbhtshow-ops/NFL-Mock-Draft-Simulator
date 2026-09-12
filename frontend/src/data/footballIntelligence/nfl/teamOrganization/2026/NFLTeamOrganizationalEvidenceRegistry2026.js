import {
  NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026,
  NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026_VERSION,
} from "./NFLTeamOrganizationalCoreSnapshot2026.js";
import {
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1,
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_VERSION,
} from "./NFLTeamOrganizationalPrimarySourceEnrichment2026Wave1.js";
import {
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2,
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_VERSION,
} from "./NFLTeamOrganizationalPrimarySourceEnrichment2026Wave2.js";
import {
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3,
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_VERSION,
} from "./NFLTeamOrganizationalPrimarySourceEnrichment2026Wave3.js";
import {
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4,
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_VERSION,
} from "./NFLTeamOrganizationalPrimarySourceEnrichment2026Wave4.js";
import {
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5,
  NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_VERSION,
} from "./NFLTeamOrganizationalPrimarySourceEnrichment2026Wave5.js";

export const NFL_TEAM_ORGANIZATIONAL_EVIDENCE_REGISTRY_2026_VERSION =
  "FIE-NFL-TEAM-ORGANIZATIONAL-EVIDENCE-REGISTRY-2026-1.0.0";

const WAVE_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "WAVE1",
    version: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_VERSION,
    observations: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1,
  }),
  Object.freeze({
    id: "WAVE2",
    version: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_VERSION,
    observations: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2,
  }),
  Object.freeze({
    id: "WAVE3",
    version: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_VERSION,
    observations: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3,
  }),
  Object.freeze({
    id: "WAVE4",
    version: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_VERSION,
    observations: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4,
  }),
  Object.freeze({
    id: "WAVE5",
    version: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_VERSION,
    observations: NFL_TEAM_ORGANIZATIONAL_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5,
  }),
]);

const normalizeTeam = (team) =>
  typeof team === "string" && team.trim() ? team.trim().toUpperCase() : null;

const ENRICHMENT_BY_TEAM = new Map();
for (const wave of WAVE_DEFINITIONS) {
  for (const observation of wave.observations) {
    const team = normalizeTeam(observation?.team);
    if (!team) continue;
    if (!ENRICHMENT_BY_TEAM.has(team)) {
      ENRICHMENT_BY_TEAM.set(team, { waveIds: new Set(), waveVersions: new Set(), observations: [] });
    }
    const entry = ENRICHMENT_BY_TEAM.get(team);
    entry.waveIds.add(wave.id);
    entry.waveVersions.add(wave.version);
    entry.observations.push(observation);
  }
}

function recordForTeam(team, { asOf = null } = {}) {
  const key = normalizeTeam(team);
  const core = key ? NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026[key] || null : null;
  if (!core) return null;

  const enrichment = ENRICHMENT_BY_TEAM.get(key) || {
    waveIds: new Set(),
    waveVersions: new Set(),
    observations: [],
  };

  return Object.freeze({
    registryVersion: NFL_TEAM_ORGANIZATIONAL_EVIDENCE_REGISTRY_2026_VERSION,
    team: key,
    teamName: core.teamName || null,
    season: 2026,
    asOf: asOf || core.asOf || null,
    observations: Object.freeze([
      ...(core.observations || []),
      ...enrichment.observations,
    ]),
    layers: Object.freeze({
      coreSnapshotVersion: NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026_VERSION,
      enrichmentWaveIds: Object.freeze([...enrichment.waveIds]),
      enrichmentWaveVersions: Object.freeze([...enrichment.waveVersions]),
    }),
  });
}

export function getNFLTeamOrganizationalEvidenceInput2026(team, options = {}) {
  return recordForTeam(team, options);
}

export function listNFLTeamOrganizationalEvidenceInputs2026(options = {}) {
  return Object.freeze(
    Object.keys(NFL_TEAM_ORGANIZATIONAL_CORE_SNAPSHOT_2026)
      .sort()
      .map((team) => recordForTeam(team, options))
      .filter(Boolean)
  );
}

export function getNFLTeamOrganizationalEvidenceRegistry2026Coverage() {
  const records = listNFLTeamOrganizationalEvidenceInputs2026();
  return Object.freeze({
    registryVersion: NFL_TEAM_ORGANIZATIONAL_EVIDENCE_REGISTRY_2026_VERSION,
    season: 2026,
    teamCount: records.length,
    enrichedTeamCount: records.filter((record) => record.layers.enrichmentWaveIds.length > 0).length,
    waveCount: WAVE_DEFINITIONS.length,
    waveIds: Object.freeze(WAVE_DEFINITIONS.map((wave) => wave.id)),
  });
}

export default {
  NFL_TEAM_ORGANIZATIONAL_EVIDENCE_REGISTRY_2026_VERSION,
  getNFLTeamOrganizationalEvidenceInput2026,
  listNFLTeamOrganizationalEvidenceInputs2026,
  getNFLTeamOrganizationalEvidenceRegistry2026Coverage,
};
