export const NFL_PLAYER_AVAILABILITY_IMPACT_VERSION =
  "NFL-PLAYER-AVAILABILITY-IMPACT-V1.0.0";

export const NFL_PLAYER_AVAILABILITY_IMPACT_POLICY =
  Object.freeze({
    maxTeamStrengthImpactByPosition: {
      QB: 18,
      OT: 7,
      T: 7,
      EDGE: 7,
      DE: 6,
      CB: 6.5,
      WR: 6,
      C: 5,
      G: 5,
      TE: 5,
      RB: 4.5,
      DT: 5,
      NT: 4.5,
      LB: 5,
      S: 5,
      K: 2.5,
      P: 2,
      LS: 1,
      DEFAULT: 4,
    },

    statusMultiplier: {
      OUT: 1,
      INJURED_RESERVE: 1,
      PUP: 1,
      DOUBTFUL: 0.75,
      DID_NOT_PARTICIPATE: 0.55,
      QUESTIONABLE: 0.35,
      LIMITED: 0.15,
      FULL: 0,
      ACTIVE: 0,
      UNKNOWN: 0,
    },

    roleMultiplier: {
      QB1: 1,
      STARTER: 1,
      DEPTH_1: 1,
      ROTATION: 0.5,
      BACKUP: 0.35,
      DEPTH: 0.25,
      UNKNOWN: 0.6,
    },

    teamAdjustmentFloor: -24,
  });

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function playerPosition(player, evidence) {
  return String(
    player?.identity?.position ||
      player?.position ||
      evidence?.player?.position ||
      "DEFAULT"
  ).toUpperCase();
}

function playerValue(player) {
  const value =
    player?.evaluation?.rosterValue ??
    player?.rosterValue ??
    null;

  return finite(value)
    ? clamp(value, 0, 100)
    : null;
}

function depthRank(player) {
  const value =
    player?.roster?.depthChartRank ??
    player?.depthChartRank ??
    null;

  const number = Number(value);
  return Number.isInteger(number)
    ? number
    : null;
}

function starterKnown(player) {
  const value =
    player?.roster?.starter ??
    player?.starter;

  return typeof value === "boolean";
}

function isStarter(player) {
  return (
    player?.roster?.starter === true ||
    player?.starter === true
  );
}

function role(player, position) {
  const enrichedRole =
    player?.roster?.roleEvidence?.role;

  if (
    typeof enrichedRole === "string" &&
    enrichedRole &&
    enrichedRole !== "UNKNOWN"
  ) {
    return enrichedRole;
  }

  if (
    position === "QB" &&
    (
      isStarter(player) ||
      depthRank(player) === 1
    )
  ) {
    return "QB1";
  }

  if (isStarter(player)) {
    return "STARTER";
  }

  if (depthRank(player) === 1) {
    return "DEPTH_1";
  }

  const rosterRole = String(
    player?.roster?.rosterRole ||
      player?.rosterRole ||
      ""
  ).toUpperCase();

  if (rosterRole.includes("ROTAT")) {
    return "ROTATION";
  }

  if (
    depthRank(player) === 2 ||
    rosterRole.includes("BACKUP")
  ) {
    return "BACKUP";
  }

  if (
    depthRank(player) !== null &&
    depthRank(player) > 2
  ) {
    return "DEPTH";
  }

  return "UNKNOWN";
}

function evidenceStatus(evidence) {
  const report =
    evidence?.status?.report || "UNKNOWN";
  const practice =
    evidence?.status?.practice || "UNKNOWN";

  const priority = [
    "OUT",
    "INJURED_RESERVE",
    "PUP",
    "DOUBTFUL",
    "DID_NOT_PARTICIPATE",
    "QUESTIONABLE",
    "LIMITED",
    "FULL",
    "ACTIVE",
    "UNKNOWN",
  ];

  for (const status of priority) {
    if (
      report === status ||
      practice === status
    ) {
      return status;
    }
  }

  return "UNKNOWN";
}

function replacementValue(replacementPlayer) {
  return playerValue(replacementPlayer);
}

function valueGapFactor(
  affectedValue,
  replacement
) {
  if (
    finite(affectedValue) &&
    finite(replacement)
  ) {
    const gap = clamp(
      (affectedValue - replacement) / 100,
      0,
      1
    );

    return {
      factor: 0.35 + gap * 0.65,
      known: true,
      gap,
    };
  }

  if (finite(affectedValue)) {
    return {
      factor: 0.75,
      known: false,
      gap: null,
    };
  }

  return {
    factor: 0.6,
    known: false,
    gap: null,
  };
}

function confidence({
  player,
  evidence,
  replacementKnown,
}) {
  let score = 0.35;

  if (evidence?.player?.playerId) {
    score += 0.20;
  }

  if (starterKnown(player) || depthRank(player) !== null) {
    score += 0.20;
  }

  if (finite(playerValue(player))) {
    score += 0.15;
  }

  if (replacementKnown) {
    score += 0.10;
  }

  return clamp(score, 0, 0.95);
}

export function evaluateNFLPlayerAvailabilityImpact({
  player = {},
  evidence,
  replacementPlayer = null,
} = {}) {
  if (!evidence) {
    return {
      state: "UNKNOWN",
      adjustment: null,
      confidence: null,
    };
  }

  const position =
    playerPosition(player, evidence);
  const status =
    evidenceStatus(evidence);
  const roleClass =
    role(player, position);

  const maxImpact =
    NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
      .maxTeamStrengthImpactByPosition[
        position
      ] ??
    NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
      .maxTeamStrengthImpactByPosition
      .DEFAULT;

  const statusMultiplier =
    NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
      .statusMultiplier[status] ?? 0;

  const roleMultiplier =
    NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
      .roleMultiplier[roleClass] ??
    NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
      .roleMultiplier.UNKNOWN;

  const affectedValue =
    playerValue(player);
  const replacement =
    replacementValue(replacementPlayer);

  const gap =
    valueGapFactor(
      affectedValue,
      replacement
    );

  const magnitude =
    maxImpact *
    statusMultiplier *
    roleMultiplier *
    gap.factor;

  const adjustment =
    magnitude > 0
      ? -Number(magnitude.toFixed(3))
      : 0;

  return {
    contract: "NFLPlayerAvailabilityImpact",
    version:
      NFL_PLAYER_AVAILABILITY_IMPACT_VERSION,

    state: "AVAILABLE",

    player: {
      playerId:
        player?.playerId ||
        evidence?.player?.playerId ||
        null,
      playerName:
        player?.identity?.playerName ||
        player?.playerName ||
        evidence?.player?.playerName ||
        null,
      position,
      role: roleClass,
      rosterValue: affectedValue,
    },

    availability: {
      status,
      primaryInjury:
        evidence?.injury?.primary || null,
      secondaryInjury:
        evidence?.injury?.secondary || null,
    },

    replacement: replacementPlayer
      ? {
          playerId:
            replacementPlayer?.playerId || null,
          playerName:
            replacementPlayer?.identity
              ?.playerName ||
            replacementPlayer?.playerName ||
            null,
          rosterValue: replacement,
        }
      : null,

    adjustment,

    confidence: confidence({
      player,
      evidence,
      replacementKnown: gap.known,
    }),

    derivation: {
      maxPositionImpact: maxImpact,
      statusMultiplier,
      roleMultiplier,
      valueGapFactor: gap.factor,
      valueGapKnown: gap.known,
      valueGap: gap.gap,
    },
  };
}

export default {
  NFL_PLAYER_AVAILABILITY_IMPACT_VERSION,
  NFL_PLAYER_AVAILABILITY_IMPACT_POLICY,
  evaluateNFLPlayerAvailabilityImpact,
};
