export const PLAYER_AVAILABILITY_IMPACT_CONTEXT_VERSION =
  "FIE-PLAYER-AVAILABILITY-IMPACT-CONTEXT-1.0.0";

export const PLAYER_ROLE_LEVELS = Object.freeze({
  PRIMARY: "PRIMARY",
  STARTER: "STARTER",
  KEY_ROTATION: "KEY_ROTATION",
  ROTATION: "ROTATION",
  BACKUP: "BACKUP",
  SPECIALIST: "SPECIALIST",
  UNKNOWN: "UNKNOWN",
});

export const REPLACEMENT_QUALITY_LEVELS = Object.freeze({
  ELITE: "ELITE",
  STRONG: "STRONG",
  AVERAGE: "AVERAGE",
  REPLACEMENT_LEVEL: "REPLACEMENT_LEVEL",
  POOR: "POOR",
  UNKNOWN: "UNKNOWN",
});

export const TEAM_DEPENDENCY_LEVELS = Object.freeze({
  VERY_HIGH: "VERY_HIGH",
  HIGH: "HIGH",
  MODERATE: "MODERATE",
  LOW: "LOW",
  VERY_LOW: "VERY_LOW",
  UNKNOWN: "UNKNOWN",
});

export const POSITION_IMPORTANCE_LEVELS = Object.freeze({
  VERY_HIGH: "VERY_HIGH",
  HIGH: "HIGH",
  MODERATE: "MODERATE",
  LOW: "LOW",
  UNKNOWN: "UNKNOWN",
});

const normalizeEnum = (value, values, fallback) =>
  Object.values(values).includes(value) ? value : fallback;
const normalizeShare = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Math.round(value * 10000) / 10000
    : null;
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

export function createPlayerAvailabilityImpactContext({
  role = PLAYER_ROLE_LEVELS.UNKNOWN,
  replacementQuality = REPLACEMENT_QUALITY_LEVELS.UNKNOWN,
  teamDependency = TEAM_DEPENDENCY_LEVELS.UNKNOWN,
  positionImportance = POSITION_IMPORTANCE_LEVELS.UNKNOWN,
  offensiveSnapShare = null,
  defensiveSnapShare = null,
  specialTeamsSnapShare = null,
  depthChartPosition = null,
  replacementPlayerId = null,
  evidenceRefs = [],
  provenance = {},
} = {}) {
  return {
    contract: "PlayerAvailabilityImpactContext",
    contractVersion: PLAYER_AVAILABILITY_IMPACT_CONTEXT_VERSION,
    role: normalizeEnum(role, PLAYER_ROLE_LEVELS, PLAYER_ROLE_LEVELS.UNKNOWN),
    replacementQuality: normalizeEnum(
      replacementQuality,
      REPLACEMENT_QUALITY_LEVELS,
      REPLACEMENT_QUALITY_LEVELS.UNKNOWN,
    ),
    teamDependency: normalizeEnum(
      teamDependency,
      TEAM_DEPENDENCY_LEVELS,
      TEAM_DEPENDENCY_LEVELS.UNKNOWN,
    ),
    positionImportance: normalizeEnum(
      positionImportance,
      POSITION_IMPORTANCE_LEVELS,
      POSITION_IMPORTANCE_LEVELS.UNKNOWN,
    ),
    offensiveSnapShare: normalizeShare(offensiveSnapShare),
    defensiveSnapShare: normalizeShare(defensiveSnapShare),
    specialTeamsSnapShare: normalizeShare(specialTeamsSnapShare),
    depthChartPosition:
      typeof depthChartPosition === "string" && depthChartPosition.trim()
        ? depthChartPosition.trim()
        : null,
    replacementPlayerId:
      typeof replacementPlayerId === "string" && replacementPlayerId.trim()
        ? replacementPlayerId.trim()
        : null,
    evidenceRefs: normalizeArray(evidenceRefs),
    provenance: {
      contributors: normalizeArray(provenance?.contributors),
    },
  };
}
