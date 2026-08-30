export const NFL_TEAM_DEPENDENCY_EVIDENCE_CONTRACT = "NFLTeamDependencyEvidence";
export const NFL_TEAM_DEPENDENCY_EVIDENCE_VERSION = "FIE-NFL-TEAM-DEPENDENCY-EVIDENCE-1.0.0";

export const NFL_TEAM_DEPENDENCY_STATES = Object.freeze({
  VERY_HIGH: "VERY_HIGH",
  HIGH: "HIGH",
  MODERATE: "MODERATE",
  LOW: "LOW",
  VERY_LOW: "VERY_LOW",
  UNKNOWN: "UNKNOWN",
});

const allowed = new Set(Object.values(NFL_TEAM_DEPENDENCY_STATES));

export function createNFLTeamDependencyEvidence({
  season = null,
  week = null,
  team = null,
  playerId = null,
  playerName = null,
  dependency = NFL_TEAM_DEPENDENCY_STATES.UNKNOWN,
  confidence = 0,
  source = null,
  evidenceRefs = [],
  observedAt = null,
  methodology = null,
} = {}) {
  const normalized = allowed.has(dependency)
    ? dependency
    : NFL_TEAM_DEPENDENCY_STATES.UNKNOWN;
  return {
    contract: NFL_TEAM_DEPENDENCY_EVIDENCE_CONTRACT,
    version: NFL_TEAM_DEPENDENCY_EVIDENCE_VERSION,
    season: Number.isInteger(Number(season)) ? Number(season) : null,
    week: Number.isInteger(Number(week)) ? Number(week) : null,
    team: typeof team === "string" && team.trim() ? team.trim().toUpperCase() : null,
    player: {
      playerId: playerId || null,
      playerName: playerName || null,
    },
    dependency: normalized,
    confidence:
      typeof confidence === "number" && Number.isFinite(confidence)
        ? Math.max(0, Math.min(1, confidence))
        : 0,
    observedAt: observedAt || null,
    provenance: {
      source: source || null,
      evidenceRefs: Array.isArray(evidenceRefs) ? [...evidenceRefs] : [],
      methodology: methodology || null,
    },
  };
}

export function createUnknownNFLTeamDependencyEvidence(input = {}) {
  return createNFLTeamDependencyEvidence({
    ...input,
    dependency: NFL_TEAM_DEPENDENCY_STATES.UNKNOWN,
    confidence: 0,
    source: input?.source || "UNRESOLVED_TEAM_DEPENDENCY",
  });
}

export default {
  NFL_TEAM_DEPENDENCY_EVIDENCE_CONTRACT,
  NFL_TEAM_DEPENDENCY_EVIDENCE_VERSION,
  NFL_TEAM_DEPENDENCY_STATES,
  createNFLTeamDependencyEvidence,
  createUnknownNFLTeamDependencyEvidence,
};
