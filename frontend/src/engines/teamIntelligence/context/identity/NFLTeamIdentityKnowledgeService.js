import { createNFLTeamIdentityEvidence } from "./NFLTeamIdentityEvidenceContract.js";
import { synthesizeNFLTeamIdentityIntelligence } from "./NFLTeamIdentityIntelligence.js";

export function evaluateNFLTeamIdentityKnowledge(input = {}) {
  const evidence = createNFLTeamIdentityEvidence(input);
  const identity = synthesizeNFLTeamIdentityIntelligence(evidence);

  return Object.freeze({
    contextVersion: "FIE-NFL-TEAM-IDENTITY-KNOWLEDGE-1.0.0",
    team: evidence.team,
    season: evidence.season,
    asOf: evidence.asOf,
    identity,
    provenance: evidence.provenance,
    freshness: evidence.freshness,
    evidenceStatus: evidence.status,
  });
}

export default { evaluateNFLTeamIdentityKnowledge };
