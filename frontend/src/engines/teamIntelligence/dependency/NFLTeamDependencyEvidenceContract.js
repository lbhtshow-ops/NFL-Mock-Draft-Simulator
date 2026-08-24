export const NFL_TEAM_DEPENDENCY_EVIDENCE_CONTRACT =
  "NFLTeamDependencyEvidence";
export const NFL_TEAM_DEPENDENCY_EVIDENCE_VERSION =
  "FIE-NFL-TEAM-DEPENDENCY-EVIDENCE-1.2.0";

export const NFL_TEAM_DEPENDENCY_STATES = Object.freeze({
  VERY_HIGH: "VERY_HIGH",
  HIGH: "HIGH",
  MODERATE: "MODERATE",
  LOW: "LOW",
  VERY_LOW: "VERY_LOW",
  UNKNOWN: "UNKNOWN",
});

export const NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES = Object.freeze({
  PROVISIONAL: "PROVISIONAL",
  APPROVED: "APPROVED",
  UNAVAILABLE: "UNAVAILABLE",
});

const allowed = new Set(Object.values(NFL_TEAM_DEPENDENCY_STATES));
const clamp01 = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : null;

export function createNFLTeamDependencyEvidence({
  season = null,
  week = null,
  team = null,
  playerId = null,
  playerName = null,
  dependency = NFL_TEAM_DEPENDENCY_STATES.UNKNOWN,
  dependencyIndex = null,
  confidence = 0,
  source = null,
  evidenceRefs = [],
  observedAt = null,
  methodology = null,
  components = null,
  sample = null,
  evidenceState = null,
  calibrationReadiness = null,
} = {}) {
  const normalized = allowed.has(dependency)
    ? dependency
    : NFL_TEAM_DEPENDENCY_STATES.UNKNOWN;

  return {
    contract: NFL_TEAM_DEPENDENCY_EVIDENCE_CONTRACT,
    version: NFL_TEAM_DEPENDENCY_EVIDENCE_VERSION,
    season: Number.isInteger(Number(season)) ? Number(season) : null,
    week: Number.isInteger(Number(week)) ? Number(week) : null,
    team:
      typeof team === "string" && team.trim()
        ? team.trim().toUpperCase()
        : null,
    player: {
      playerId: playerId || null,
      playerName: playerName || null,
    },
    dependency: normalized,
    dependencyIndex:
      typeof dependencyIndex === "number" &&
      Number.isFinite(dependencyIndex)
        ? Math.round(Math.max(0, Math.min(100, dependencyIndex)) * 100) / 100
        : null,
    confidence: clamp01(confidence) ?? 0,
    observedAt: observedAt || null,
    components:
      components && typeof components === "object"
        ? { ...components }
        : null,
    sample:
      sample && typeof sample === "object"
        ? { ...sample }
        : null,
    evidenceState:
      evidenceState && typeof evidenceState === "object"
        ? { ...evidenceState }
        : null,
    calibrationReadiness:
      calibrationReadiness && typeof calibrationReadiness === "object"
        ? { ...calibrationReadiness }
        : null,
    provenance: {
      source: source || null,
      evidenceRefs:
        Array.isArray(evidenceRefs) ? [...evidenceRefs] : [],
      methodology: methodology || null,
    },
  };
}

export function createUnknownNFLTeamDependencyEvidence(input = {}) {
  return createNFLTeamDependencyEvidence({
    ...input,
    dependency: NFL_TEAM_DEPENDENCY_STATES.UNKNOWN,
    dependencyIndex: null,
    confidence: 0,
    source:
      input?.source ||
      "UNRESOLVED_TEAM_DEPENDENCY",
    methodology:
      input?.methodology || {
        state: NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES.UNAVAILABLE,
      },
  });
}

export default {
  NFL_TEAM_DEPENDENCY_EVIDENCE_CONTRACT,
  NFL_TEAM_DEPENDENCY_EVIDENCE_VERSION,
  NFL_TEAM_DEPENDENCY_STATES,
  NFL_TEAM_DEPENDENCY_METHODOLOGY_STATES,
  createNFLTeamDependencyEvidence,
  createUnknownNFLTeamDependencyEvidence,
};
