import { createNFLTeamOrganizationalEvidence } from "./NFLTeamOrganizationalEvidenceContract.js";
import { synthesizeNFLTeamOrganizationalIntelligence } from "./NFLTeamOrganizationalIntelligence.js";
import {
  NFL_TEAM_ORGANIZATIONAL_EVIDENCE_REGISTRY_2026_VERSION,
  getNFLTeamOrganizationalEvidenceInput2026,
} from "../../../../data/footballIntelligence/nfl/teamOrganization/2026/NFLTeamOrganizationalEvidenceRegistry2026.js";

export const NFL_TEAM_ORGANIZATIONAL_KNOWLEDGE_RESOLVER_VERSION =
  "FIE-NFL-TEAM-ORGANIZATIONAL-KNOWLEDGE-RESOLVER-1.0.0";

const normalizeTeam = (team) =>
  typeof team === "string" && team.trim() ? team.trim().toUpperCase() : null;

export function evaluateNFLTeamOrganizationalKnowledge(input = {}) {
  const evidence = createNFLTeamOrganizationalEvidence(input);
  const organization = synthesizeNFLTeamOrganizationalIntelligence(evidence);

  return Object.freeze({
    contextVersion: "FIE-NFL-TEAM-ORGANIZATIONAL-KNOWLEDGE-1.0.0",
    team: evidence.team,
    season: evidence.season,
    asOf: evidence.asOf,
    organization,
    provenance: evidence.provenance,
    freshness: evidence.freshness,
    evidenceStatus: evidence.status,
  });
}

export function resolveNFLTeamOrganizationalKnowledge(input = {}) {
  const normalizedInput =
    typeof input === "string"
      ? { team: input, season: 2026 }
      : input && typeof input === "object"
        ? input
        : {};

  const team = normalizeTeam(normalizedInput.team);
  const season = Number.isInteger(normalizedInput.season) ? normalizedInput.season : null;
  const asOf =
    typeof normalizedInput.asOf === "string" && normalizedInput.asOf.trim()
      ? normalizedInput.asOf.trim()
      : null;

  const registryInput =
    team && season === 2026
      ? getNFLTeamOrganizationalEvidenceInput2026(team, { asOf })
      : null;

  const result = evaluateNFLTeamOrganizationalKnowledge(
    registryInput || { team, season, asOf, observations: [] }
  );

  return Object.freeze({
    ...result,
    resolver: Object.freeze({
      resolverVersion: NFL_TEAM_ORGANIZATIONAL_KNOWLEDGE_RESOLVER_VERSION,
      registryVersion:
        registryInput?.registryVersion ||
        (season === 2026 ? NFL_TEAM_ORGANIZATIONAL_EVIDENCE_REGISTRY_2026_VERSION : null),
      resolved: Boolean(registryInput),
      sourceLayers: registryInput?.layers || null,
      observationCount: registryInput?.observations?.length || 0,
    }),
  });
}

export default {
  evaluateNFLTeamOrganizationalKnowledge,
  resolveNFLTeamOrganizationalKnowledge,
};
