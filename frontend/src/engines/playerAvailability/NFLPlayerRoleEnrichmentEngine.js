export const NFL_PLAYER_ROLE_ENRICHMENT_VERSION =
  "NFL-PLAYER-ROLE-ENRICHMENT-V1.0.0";

function finite(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeId(value) {
  return value == null
    ? null
    : String(value).trim();
}

function position(player) {
  return String(
    player?.identity?.position ||
      player?.position ||
      ""
  ).toUpperCase();
}

function rosterValue(player) {
  const value =
    player?.evaluation?.rosterValue ??
    player?.rosterValue ??
    null;

  return finite(value)
    ? clamp(value, 0, 100)
    : null;
}

function matchRoleEvidence(
  player,
  roleEvidence
) {
  const playerId =
    normalizeId(
      player?.playerId ||
      player?.identity?.playerId
    );

  if (playerId) {
    const byId = roleEvidence.find(
      (record) =>
        normalizeId(
          record?.player?.playerId
        ) === playerId
    );

    if (byId) return byId;
  }

  const name = String(
    player?.identity?.playerName ||
      player?.playerName ||
      ""
  ).toLowerCase();

  if (!name) return null;

  return (
    roleEvidence.find(
      (record) =>
        String(
          record?.player?.playerName || ""
        ).toLowerCase() === name
    ) || null
  );
}

function usageForPosition(
  playerPosition,
  role
) {
  if (!role) return null;

  if (
    ["QB","RB","WR","TE","OT","T","G","C"].includes(
      playerPosition
    )
  ) {
    return role?.usage?.offenseSnapPct ?? null;
  }

  if (
    ["EDGE","DE","DT","NT","LB","CB","S"].includes(
      playerPosition
    )
  ) {
    return role?.usage?.defenseSnapPct ?? null;
  }

  return (
    role?.usage?.offenseSnapPct ??
    role?.usage?.defenseSnapPct ??
    role?.usage?.specialTeamsSnapPct ??
    null
  );
}

function inferredRole({
  player,
  evidence,
}) {
  const depthRank =
    evidence?.depthChart?.rank ?? null;

  const snapPct =
    usageForPosition(
      position(player),
      evidence
    );

  if (depthRank === 1) {
    return {
      role: position(player) === "QB"
        ? "QB1"
        : "STARTER",
      source: "DEPTH_CHART",
      confidence: 0.95,
    };
  }

  if (depthRank === 2) {
    return {
      role: "BACKUP",
      source: "DEPTH_CHART",
      confidence: 0.90,
    };
  }

  if (finite(snapPct) && snapPct >= 0.70) {
    return {
      role: position(player) === "QB"
        ? "QB1"
        : "STARTER",
      source: "SNAP_USAGE",
      confidence: 0.85,
    };
  }

  if (finite(snapPct) && snapPct >= 0.35) {
    return {
      role: "ROTATION",
      source: "SNAP_USAGE",
      confidence: 0.80,
    };
  }

  if (finite(snapPct) && snapPct > 0) {
    return {
      role: "DEPTH",
      source: "SNAP_USAGE",
      confidence: 0.75,
    };
  }

  return {
    role: "UNKNOWN",
    source: "UNRESOLVED",
    confidence: 0.25,
  };
}

export function enrichNFLRosterWithRoleEvidence({
  roster = [],
  roleEvidence = [],
} = {}) {
  return (Array.isArray(roster) ? roster : [])
    .map((player) => {
      const evidence =
        matchRoleEvidence(
          player,
          roleEvidence
        );

      const inferred =
        inferredRole({
          player,
          evidence,
        });

      const depthRank =
        evidence?.depthChart?.rank ?? null;

      const snapPct =
        usageForPosition(
          position(player),
          evidence
        );

      const originalStarter =
        player?.roster?.starter ??
        player?.starter ??
        null;

      const originalRank =
        player?.roster?.depthChartRank ??
        player?.depthChartRank ??
        null;

      return {
        ...player,

        roster: {
          ...(player?.roster || {}),

          starter:
            originalStarter !== null
              ? originalStarter
              : inferred.role === "QB1" ||
                inferred.role === "STARTER",

          depthChartRank:
            originalRank !== null
              ? originalRank
              : depthRank,

          rosterRole:
            player?.roster?.rosterRole ||
            player?.rosterRole ||
            inferred.role,

          roleEvidence: {
            version:
              NFL_PLAYER_ROLE_ENRICHMENT_VERSION,
            role: inferred.role,
            source: inferred.source,
            confidence: inferred.confidence,
            depthRank,
            snapPct,
            raw: evidence,
          },
        },

        evaluation: {
          ...(player?.evaluation || {}),
          rosterValue: rosterValue(player),
        },
      };
    });
}

export default {
  NFL_PLAYER_ROLE_ENRICHMENT_VERSION,
  enrichNFLRosterWithRoleEvidence,
};
