import {
  createPlayerAvailabilityImpactContext,
  PLAYER_ROLE_LEVELS,
  REPLACEMENT_QUALITY_LEVELS,
  TEAM_DEPENDENCY_LEVELS,
  POSITION_IMPORTANCE_LEVELS,
} from "../contracts/PlayerAvailabilityImpactContextContract.js";

export const NFL_PLAYER_IMPACT_CONTEXT_RESOLVER_VERSION =
  "FIE-NFL-PLAYER-IMPACT-CONTEXT-RESOLVER-1.0.0";

export const NFL_PLAYER_IMPACT_CONTEXT_READINESS = Object.freeze({
  READY: "READY",
  PARTIAL: "PARTIAL",
  UNAVAILABLE: "UNAVAILABLE",
});

export const NFL_POSITION_IMPORTANCE_V1 = Object.freeze({
  QB: POSITION_IMPORTANCE_LEVELS.VERY_HIGH,
  LT: POSITION_IMPORTANCE_LEVELS.HIGH,
  RT: POSITION_IMPORTANCE_LEVELS.HIGH,
  OT: POSITION_IMPORTANCE_LEVELS.HIGH,
  EDGE: POSITION_IMPORTANCE_LEVELS.HIGH,
  DE: POSITION_IMPORTANCE_LEVELS.HIGH,
  CB: POSITION_IMPORTANCE_LEVELS.HIGH,
  LCB: POSITION_IMPORTANCE_LEVELS.HIGH,
  RCB: POSITION_IMPORTANCE_LEVELS.HIGH,
  WR: POSITION_IMPORTANCE_LEVELS.HIGH,
  LWR: POSITION_IMPORTANCE_LEVELS.HIGH,
  RWR: POSITION_IMPORTANCE_LEVELS.HIGH,
  C: POSITION_IMPORTANCE_LEVELS.MODERATE,
  G: POSITION_IMPORTANCE_LEVELS.MODERATE,
  LG: POSITION_IMPORTANCE_LEVELS.MODERATE,
  RG: POSITION_IMPORTANCE_LEVELS.MODERATE,
  TE: POSITION_IMPORTANCE_LEVELS.MODERATE,
  RB: POSITION_IMPORTANCE_LEVELS.MODERATE,
  DT: POSITION_IMPORTANCE_LEVELS.MODERATE,
  NT: POSITION_IMPORTANCE_LEVELS.MODERATE,
  LB: POSITION_IMPORTANCE_LEVELS.MODERATE,
  MLB: POSITION_IMPORTANCE_LEVELS.MODERATE,
  WLB: POSITION_IMPORTANCE_LEVELS.MODERATE,
  SLB: POSITION_IMPORTANCE_LEVELS.MODERATE,
  S: POSITION_IMPORTANCE_LEVELS.MODERATE,
  SS: POSITION_IMPORTANCE_LEVELS.MODERATE,
  FS: POSITION_IMPORTANCE_LEVELS.MODERATE,
  NB: POSITION_IMPORTANCE_LEVELS.MODERATE,
  K: POSITION_IMPORTANCE_LEVELS.LOW,
  P: POSITION_IMPORTANCE_LEVELS.LOW,
  H: POSITION_IMPORTANCE_LEVELS.LOW,
  LS: POSITION_IMPORTANCE_LEVELS.LOW,
});

const upper = (value) =>
  typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;

const finiteShare = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1
    ? value
    : null;

function roleFromCanonicalAvailability(player) {
  const position = upper(
    player?.role?.depthPosition ||
    player?.player?.position
  );
  const rank = player?.role?.depthRank;
  const starter = player?.role?.starter === true;

  if (starter && position === "QB") return PLAYER_ROLE_LEVELS.PRIMARY;
  if (starter) return PLAYER_ROLE_LEVELS.STARTER;
  if (rank === 2) return PLAYER_ROLE_LEVELS.BACKUP;
  if (Number.isInteger(rank) && rank > 2) return PLAYER_ROLE_LEVELS.ROTATION;
  return PLAYER_ROLE_LEVELS.UNKNOWN;
}

function sameDepthPosition(a, b) {
  const left = upper(a?.role?.depthPosition || a?.player?.position);
  const right = upper(b?.role?.depthPosition || b?.player?.position);
  return Boolean(left && right && left === right);
}

function findReplacement(player, roster) {
  const currentRank = Number.isInteger(player?.role?.depthRank)
    ? player.role.depthRank
    : null;

  const candidates = (Array.isArray(roster) ? roster : [])
    .filter((candidate) =>
      candidate !== player &&
      sameDepthPosition(player, candidate) &&
      candidate?.canonicalAvailabilityStatus !== "OUT" &&
      candidate?.canonicalAvailabilityStatus !== "INJURED_RESERVE" &&
      candidate?.canonicalAvailabilityStatus !== "PUP" &&
      candidate?.canonicalAvailabilityStatus !== "SUSPENDED"
    )
    .sort((a, b) => {
      const ar = Number.isInteger(a?.role?.depthRank) ? a.role.depthRank : 999;
      const br = Number.isInteger(b?.role?.depthRank) ? b.role.depthRank : 999;
      return ar - br;
    });

  if (!candidates.length) return null;

  if (currentRank === null) return candidates[0];

  return (
    candidates.find((candidate) =>
      Number.isInteger(candidate?.role?.depthRank) &&
      candidate.role.depthRank > currentRank
    ) || candidates[0]
  );
}

function replacementQualityFromCaliber({
  affectedCaliber,
  replacementCaliber,
}) {
  const affected = affectedCaliber?.caliberGrade;
  const replacement = replacementCaliber?.caliberGrade;

  if (
    typeof affected !== "number" ||
    !Number.isFinite(affected) ||
    typeof replacement !== "number" ||
    !Number.isFinite(replacement)
  ) {
    return REPLACEMENT_QUALITY_LEVELS.UNKNOWN;
  }

  const gap = affected - replacement;
  if (gap <= 3) return REPLACEMENT_QUALITY_LEVELS.ELITE;
  if (gap <= 8) return REPLACEMENT_QUALITY_LEVELS.STRONG;
  if (gap <= 15) return REPLACEMENT_QUALITY_LEVELS.AVERAGE;
  if (gap <= 25) return REPLACEMENT_QUALITY_LEVELS.REPLACEMENT_LEVEL;
  return REPLACEMENT_QUALITY_LEVELS.POOR;
}

function usageShares(roleEvidence) {
  return {
    offensiveSnapShare: finiteShare(roleEvidence?.usage?.offenseSnapPct),
    defensiveSnapShare: finiteShare(roleEvidence?.usage?.defenseSnapPct),
    specialTeamsSnapShare: finiteShare(roleEvidence?.usage?.specialTeamsSnapPct),
  };
}

function missingDimensions(context, canonicalCaliber) {
  const missing = [];
  if (context.role === PLAYER_ROLE_LEVELS.UNKNOWN) missing.push("role");
  if (
    context.replacementQuality ===
    REPLACEMENT_QUALITY_LEVELS.UNKNOWN
  ) missing.push("replacementQuality");
  if (
    context.teamDependency ===
    TEAM_DEPENDENCY_LEVELS.UNKNOWN
  ) missing.push("teamDependency");
  if (
    context.positionImportance ===
    POSITION_IMPORTANCE_LEVELS.UNKNOWN
  ) missing.push("positionImportance");

  const hasUsage =
    context.offensiveSnapShare !== null ||
    context.defensiveSnapShare !== null ||
    context.specialTeamsSnapShare !== null;
  if (!hasUsage) missing.push("snapShare");

  if (
    typeof canonicalCaliber?.caliberGrade !== "number" ||
    !Number.isFinite(canonicalCaliber.caliberGrade)
  ) missing.push("canonicalCaliber");

  return missing;
}

export function resolveNFLPlayerAvailabilityImpactContext({
  canonicalAvailabilityPlayer,
  canonicalAvailabilityRoster = [],
  canonicalCaliber = null,
  replacementCaliber = null,
  roleEvidence = null,
  teamDependency = TEAM_DEPENDENCY_LEVELS.UNKNOWN,
} = {}) {
  if (!canonicalAvailabilityPlayer) {
    return {
      contract: "NFLPlayerAvailabilityImpactContextResolution",
      version: NFL_PLAYER_IMPACT_CONTEXT_RESOLVER_VERSION,
      readiness: NFL_PLAYER_IMPACT_CONTEXT_READINESS.UNAVAILABLE,
      playerId: null,
      replacement: null,
      context: null,
      missingDimensions: ["canonicalAvailabilityPlayer"],
    };
  }

  const player = canonicalAvailabilityPlayer;
  const replacement = findReplacement(
    player,
    canonicalAvailabilityRoster
  );

  const position = upper(
    player?.role?.depthPosition ||
    player?.player?.position
  );

  const role = roleFromCanonicalAvailability(player);

  const replacementQuality = replacementQualityFromCaliber({
    affectedCaliber: canonicalCaliber,
    replacementCaliber,
  });

  const shares = usageShares(roleEvidence);

  const context = createPlayerAvailabilityImpactContext({
    role,
    replacementQuality,
    teamDependency,
    positionImportance:
      NFL_POSITION_IMPORTANCE_V1[position] ||
      POSITION_IMPORTANCE_LEVELS.UNKNOWN,
    ...shares,
    depthChartPosition: position,
    replacementPlayerId:
      replacement?.player?.playerId || null,
    evidenceRefs: [
      ...(Array.isArray(player?.evidenceRefs)
        ? player.evidenceRefs
        : []),
      ...(Array.isArray(replacement?.evidenceRefs)
        ? replacement.evidenceRefs
        : []),
      ...(Array.isArray(canonicalCaliber?.evidenceRefs)
        ? canonicalCaliber.evidenceRefs
        : []),
      ...(Array.isArray(replacementCaliber?.evidenceRefs)
        ? replacementCaliber.evidenceRefs
        : []),
    ],
    provenance: {
      contributors: [
        {
          source: "CanonicalAvailabilityResolution",
          role: "ROLE_AND_REPLACEMENT_ORDER",
        },
        ...(roleEvidence
          ? [{
              source:
                roleEvidence?.provenance?.source ||
                "NFLPlayerRoleEvidence",
              role: "SNAP_USAGE",
            }]
          : []),
        ...(canonicalCaliber
          ? [{
              source:
                canonicalCaliber?.sourceEvaluation?.engine ||
                "CanonicalPlayerCaliber",
              role: "AFFECTED_PLAYER_CALIBER",
            }]
          : []),
        ...(replacementCaliber
          ? [{
              source:
                replacementCaliber?.sourceEvaluation?.engine ||
                "CanonicalPlayerCaliber",
              role: "REPLACEMENT_CALIBER",
            }]
          : []),
      ],
    },
  });

  const missing = missingDimensions(context, canonicalCaliber);

  return {
    contract: "NFLPlayerAvailabilityImpactContextResolution",
    version: NFL_PLAYER_IMPACT_CONTEXT_RESOLVER_VERSION,
    readiness:
      missing.length === 0
        ? NFL_PLAYER_IMPACT_CONTEXT_READINESS.READY
        : NFL_PLAYER_IMPACT_CONTEXT_READINESS.PARTIAL,
    playerId: player?.player?.playerId || null,
    playerName: player?.player?.playerName || null,
    canonicalAvailabilityStatus:
      player?.canonicalAvailabilityStatus || null,
    replacement: replacement
      ? {
          playerId: replacement?.player?.playerId || null,
          playerName: replacement?.player?.playerName || null,
          position:
            replacement?.role?.depthPosition ||
            replacement?.player?.position ||
            null,
          depthRank: replacement?.role?.depthRank ?? null,
          canonicalAvailabilityStatus:
            replacement?.canonicalAvailabilityStatus || null,
        }
      : null,
    context,
    missingDimensions: missing,
    safeguards: {
      snapShareInferredFromStarterStatus: false,
      teamDependencyFabricated: false,
      replacementQualityFabricatedWithoutCaliber: false,
    },
  };
}

export default {
  NFL_PLAYER_IMPACT_CONTEXT_RESOLVER_VERSION,
  NFL_PLAYER_IMPACT_CONTEXT_READINESS,
  NFL_POSITION_IMPORTANCE_V1,
  resolveNFLPlayerAvailabilityImpactContext,
};
