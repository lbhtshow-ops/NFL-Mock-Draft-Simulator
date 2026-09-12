import { createNFLTeamIdentityEvidence } from "./NFLTeamIdentityEvidenceContract.js";
import { synthesizeNFLTeamIdentityIntelligence } from "./NFLTeamIdentityIntelligence.js";
import { evaluateNFLTeamIdentityKnowledge } from "./NFLTeamIdentityKnowledgeService.js";
import {
  NFL_TEAM_IDENTITY_EVIDENCE_REGISTRY_2026_VERSION,
  getNFLTeamIdentityEvidenceInput2026,
} from "../../../../data/footballIntelligence/nfl/teamIdentity/2026/NFLTeamIdentityEvidenceRegistry2026.js";

export const NFL_TEAM_IDENTITY_KNOWLEDGE_RESOLVER_2026_VERSION =
  "FIE-NFL-TEAM-IDENTITY-KNOWLEDGE-RESOLVER-2026-1.0.0";

const normalizeTeam = (team) =>
  typeof team === "string" && team.trim() ? team.trim().toUpperCase() : null;

function evaluateRegistryInput(registryInput) {
  const fullEvidence = createNFLTeamIdentityEvidence(registryInput);
  const resolutionEvidence = createNFLTeamIdentityEvidence({
    ...registryInput,
    observations: registryInput.resolutionObservations || registryInput.observations || [],
  });
  const resolvedIdentity = synthesizeNFLTeamIdentityIntelligence(resolutionEvidence);
  const identity = Object.freeze({
    ...resolvedIdentity,
    observations: fullEvidence.observations,
  });

  return Object.freeze({
    contextVersion: "FIE-NFL-TEAM-IDENTITY-KNOWLEDGE-1.0.0",
    team: fullEvidence.team,
    season: fullEvidence.season,
    asOf: fullEvidence.asOf,
    identity,
    provenance: fullEvidence.provenance,
    freshness: fullEvidence.freshness,
    evidenceStatus: fullEvidence.status,
  });
}

export function resolveNFLTeamIdentityKnowledge2026(input = {}) {
  const normalizedInput =
    typeof input === "string"
      ? { team: input, season: 2026 }
      : input && typeof input === "object"
        ? input
        : {};

  const team = normalizeTeam(normalizedInput.team);
  const season = Number.isInteger(normalizedInput.season) ? normalizedInput.season : 2026;
  const asOf =
    typeof normalizedInput.asOf === "string" && normalizedInput.asOf.trim()
      ? normalizedInput.asOf.trim()
      : null;

  const registryInput =
    team && season === 2026
      ? getNFLTeamIdentityEvidenceInput2026(team, { asOf })
      : null;

  const result = registryInput
    ? evaluateRegistryInput(registryInput)
    : evaluateNFLTeamIdentityKnowledge({ team, season, asOf, observations: [] });

  return Object.freeze({
    ...result,
    resolver: Object.freeze({
      resolverVersion: NFL_TEAM_IDENTITY_KNOWLEDGE_RESOLVER_2026_VERSION,
      registryVersion:
        registryInput?.registryVersion ||
        (season === 2026 ? NFL_TEAM_IDENTITY_EVIDENCE_REGISTRY_2026_VERSION : null),
      resolved: Boolean(registryInput),
      sourceLayers: registryInput?.layers || null,
      observationCount: registryInput?.observations?.length || 0,
      resolutionObservationCount: registryInput?.resolutionObservations?.length || 0,
    }),
  });
}

export default {
  NFL_TEAM_IDENTITY_KNOWLEDGE_RESOLVER_2026_VERSION,
  resolveNFLTeamIdentityKnowledge2026,
};
