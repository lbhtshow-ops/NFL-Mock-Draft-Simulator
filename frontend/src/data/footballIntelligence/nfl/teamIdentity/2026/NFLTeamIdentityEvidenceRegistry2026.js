import {
  NFL_TEAM_IDENTITY_2026_BASELINE_VERSION,
  nflTeamIdentity2026Baseline,
} from "../NFLTeamIdentity2026Baseline.js";
import {
  NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_VERSION,
  nflTeamIdentityPrimarySourceEnrichment2026Wave1,
} from "./NFLTeamIdentityPrimarySourceEnrichment2026Wave1.js";
import {
  NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_VERSION,
  nflTeamIdentityPrimarySourceEnrichment2026Wave2,
} from "./NFLTeamIdentityPrimarySourceEnrichment2026Wave2.js";
import {
  NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_VERSION,
  nflTeamIdentityPrimarySourceEnrichment2026Wave3,
} from "./NFLTeamIdentityPrimarySourceEnrichment2026Wave3.js";
import {
  NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_VERSION,
  nflTeamIdentityPrimarySourceEnrichment2026Wave4,
} from "./NFLTeamIdentityPrimarySourceEnrichment2026Wave4.js";
import {
  NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_VERSION,
  nflTeamIdentityPrimarySourceEnrichment2026Wave5,
} from "./NFLTeamIdentityPrimarySourceEnrichment2026Wave5.js";

export const NFL_TEAM_IDENTITY_EVIDENCE_REGISTRY_2026_VERSION =
  "FIE-NFL-TEAM-IDENTITY-EVIDENCE-REGISTRY-2026-1.0.0";

const WAVE_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "WAVE1", version: NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE1_VERSION, records: nflTeamIdentityPrimarySourceEnrichment2026Wave1 }),
  Object.freeze({ id: "WAVE2", version: NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE2_VERSION, records: nflTeamIdentityPrimarySourceEnrichment2026Wave2 }),
  Object.freeze({ id: "WAVE3", version: NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE3_VERSION, records: nflTeamIdentityPrimarySourceEnrichment2026Wave3 }),
  Object.freeze({ id: "WAVE4", version: NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE4_VERSION, records: nflTeamIdentityPrimarySourceEnrichment2026Wave4 }),
  Object.freeze({ id: "WAVE5", version: NFL_TEAM_IDENTITY_PRIMARY_SOURCE_ENRICHMENT_2026_WAVE5_VERSION, records: nflTeamIdentityPrimarySourceEnrichment2026Wave5 }),
]);

const normalizeTeam = (team) =>
  typeof team === "string" && team.trim() ? team.trim().toUpperCase() : null;

const ENRICHMENT_BY_TEAM = new Map();
for (const wave of WAVE_DEFINITIONS) {
  for (const [teamKey, record] of Object.entries(wave.records || {})) {
    const team = normalizeTeam(record?.team || teamKey);
    if (!team) continue;
    if (!ENRICHMENT_BY_TEAM.has(team)) {
      ENRICHMENT_BY_TEAM.set(team, {
        waveIds: new Set(),
        waveVersions: new Set(),
        observations: [],
      });
    }
    const entry = ENRICHMENT_BY_TEAM.get(team);
    entry.waveIds.add(wave.id);
    entry.waveVersions.add(wave.version);
    entry.observations.push(...(record?.observations || []));
  }
}

function recordForTeam(team, { asOf = null } = {}) {
  const key = normalizeTeam(team);
  const baseline = key ? nflTeamIdentity2026Baseline[key] || null : null;
  if (!baseline) return null;

  const enrichment = ENRICHMENT_BY_TEAM.get(key) || {
    waveIds: new Set(),
    waveVersions: new Set(),
    observations: [],
  };

  return Object.freeze({
    registryVersion: NFL_TEAM_IDENTITY_EVIDENCE_REGISTRY_2026_VERSION,
    team: key,
    season: 2026,
    asOf: asOf || baseline.asOf || null,
    observations: Object.freeze([
      ...(baseline.observations || []),
      ...enrichment.observations,
    ]),
    resolutionObservations: Object.freeze([
      ...(baseline.observations || []).filter((baselineObservation) =>
        !enrichment.observations.some(
          (enrichmentObservation) => enrichmentObservation?.subject === baselineObservation?.subject
        )
      ),
      ...enrichment.observations,
    ]),
    layers: Object.freeze({
      baselineVersion: NFL_TEAM_IDENTITY_2026_BASELINE_VERSION,
      enrichmentWaveIds: Object.freeze([...enrichment.waveIds]),
      enrichmentWaveVersions: Object.freeze([...enrichment.waveVersions]),
      resolutionPolicy: "PRIMARY_ENRICHMENT_SUBJECT_OVERRIDES_BASELINE",
    }),
  });
}

export function getNFLTeamIdentityEvidenceInput2026(team, options = {}) {
  return recordForTeam(team, options);
}

export function listNFLTeamIdentityEvidenceInputs2026(options = {}) {
  return Object.freeze(
    Object.keys(nflTeamIdentity2026Baseline)
      .sort()
      .map((team) => recordForTeam(team, options))
      .filter(Boolean)
  );
}

export function getNFLTeamIdentityEvidenceRegistry2026Coverage() {
  const records = listNFLTeamIdentityEvidenceInputs2026();
  return Object.freeze({
    registryVersion: NFL_TEAM_IDENTITY_EVIDENCE_REGISTRY_2026_VERSION,
    season: 2026,
    teamCount: records.length,
    enrichedTeamCount: records.filter((record) => record.layers.enrichmentWaveIds.length > 0).length,
    baselineVersion: NFL_TEAM_IDENTITY_2026_BASELINE_VERSION,
    waveCount: WAVE_DEFINITIONS.length,
    waveIds: Object.freeze(WAVE_DEFINITIONS.map((wave) => wave.id)),
    waveVersions: Object.freeze(WAVE_DEFINITIONS.map((wave) => wave.version)),
  });
}

export default {
  NFL_TEAM_IDENTITY_EVIDENCE_REGISTRY_2026_VERSION,
  getNFLTeamIdentityEvidenceInput2026,
  listNFLTeamIdentityEvidenceInputs2026,
  getNFLTeamIdentityEvidenceRegistry2026Coverage,
};
