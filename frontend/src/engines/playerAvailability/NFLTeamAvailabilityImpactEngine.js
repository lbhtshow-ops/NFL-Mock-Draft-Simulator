import {
  evaluateNFLPlayerAvailabilityImpact,
  NFL_PLAYER_AVAILABILITY_IMPACT_POLICY,
} from "./NFLPlayerAvailabilityImpactEngine.js";

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

function value(player) {
  const candidate =
    player?.evaluation?.rosterValue ??
    player?.rosterValue ??
    null;

  return typeof candidate === "number" &&
    Number.isFinite(candidate)
      ? candidate
      : null;
}

function depthRank(player) {
  const candidate =
    player?.roster?.depthChartRank ??
    player?.depthChartRank ??
    null;

  const number = Number(candidate);

  return Number.isInteger(number)
    ? number
    : null;
}

function starter(player) {
  return (
    player?.roster?.starter === true ||
    player?.starter === true
  );
}

function findPlayer(roster, evidence) {
  const evidenceId =
    normalizeId(evidence?.player?.playerId);

  if (evidenceId) {
    const byId = roster.find(
      (player) =>
        normalizeId(player?.playerId) ===
          evidenceId ||
        normalizeId(
          player?.identity?.playerId
        ) === evidenceId
    );

    if (byId) return byId;
  }

  const name = String(
    evidence?.player?.playerName || ""
  ).toLowerCase();

  const evidencePosition = String(
    evidence?.player?.position || ""
  ).toUpperCase();

  if (!name) return null;

  return (
    roster.find((player) => {
      const candidate = String(
        player?.identity?.playerName ||
          player?.playerName ||
          ""
      ).toLowerCase();

      return (
        candidate === name &&
        (
          !evidencePosition ||
          position(player) ===
            evidencePosition
        )
      );
    }) || null
  );
}

function findReplacement(roster, affected) {
  if (!affected) return null;

  const samePosition = roster
    .filter(
      (player) =>
        player !== affected &&
        position(player) ===
          position(affected)
    )
    .sort((a, b) => {
      const aRank = depthRank(a);
      const bRank = depthRank(b);

      if (
        aRank !== null &&
        bRank !== null &&
        aRank !== bRank
      ) {
        return aRank - bRank;
      }

      if (
        starter(a) !== starter(b)
      ) {
        return starter(a) ? 1 : -1;
      }

      return (
        (value(b) ?? -1) -
        (value(a) ?? -1)
      );
    });

  return samePosition[0] || null;
}

function quarterbackState(
  roster,
  impacts
) {
  const qbs = roster.filter(
    (player) =>
      position(player) === "QB"
  );

  const qb1 =
    qbs.find(starter) ||
    qbs.find(
      (player) =>
        depthRank(player) === 1
    ) ||
    null;

  if (!qb1) {
    return {
      state: "UNKNOWN",
      qb1: null,
      impact: null,
    };
  }

  const qbImpact =
    impacts.find(
      (impact) =>
        impact?.player?.playerId &&
        normalizeId(impact.player.playerId) ===
          normalizeId(qb1.playerId)
    ) ||
    impacts.find(
      (impact) =>
        impact?.player?.playerName ===
          (
            qb1?.identity?.playerName ||
            qb1?.playerName
          )
    ) ||
    null;

  return {
    state: qbImpact
      ? (
          qbImpact.adjustment < 0
            ? "IMPACTED"
            : "AVAILABLE"
        )
      : "AVAILABLE",

    qb1: {
      playerId: qb1.playerId || null,
      playerName:
        qb1?.identity?.playerName ||
        qb1?.playerName ||
        null,
      rosterValue: value(qb1),
    },

    impact: qbImpact,
  };
}

export function buildNFLTeamAvailabilityImpactFromInputs({
  team,
  roster = [],
  evidence = [],
} = {}) {
  const normalizedTeam =
    typeof team === "string"
      ? team.trim().toUpperCase()
      : null;

  if (!normalizedTeam) {
    return {
      state: "UNAVAILABLE",
      team: null,
      adjustment: null,
      impacts: [],
      quarterbackState: {
        state: "UNKNOWN",
        qb1: null,
        impact: null,
      },
    };
  }

  if (!Array.isArray(evidence) || !evidence.length) {
    return {
      contract: "NFLTeamAvailabilityImpact",
      version: "NFL-TEAM-AVAILABILITY-IMPACT-V1.0.0",
      state: "NO_REPORT",
      team: normalizedTeam,
      adjustment: 0,
      confidence: null,
      impacts: [],
      quarterbackState:
        quarterbackState(roster, []),
      evidenceCount: 0,
    };
  }

  const impacts = evidence
    .map((availabilityEvidence) => {
      const affected =
        findPlayer(
          roster,
          availabilityEvidence
        );

      const replacement =
        findReplacement(
          roster,
          affected
        );

      return evaluateNFLPlayerAvailabilityImpact({
        player: affected || {},
        evidence: availabilityEvidence,
        replacementPlayer: replacement,
      });
    })
    .filter(
      (impact) =>
        impact &&
        impact.state === "AVAILABLE"
    );

  const rawAdjustment =
    impacts.reduce(
      (sum, impact) =>
        sum +
        (
          typeof impact.adjustment === "number"
            ? impact.adjustment
            : 0
        ),
      0
    );

  const adjustment =
    Math.max(
      NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
        .teamAdjustmentFloor,
      rawAdjustment
    );

  const knownConfidence =
    impacts
      .map(
        (impact) =>
          impact.confidence
      )
      .filter(
        (score) =>
          typeof score === "number" &&
          Number.isFinite(score)
      );

  const confidence =
    knownConfidence.length
      ? knownConfidence.reduce(
          (sum, score) =>
            sum + score,
          0
        ) / knownConfidence.length
      : null;

  return {
    contract: "NFLTeamAvailabilityImpact",
    version: "NFL-TEAM-AVAILABILITY-IMPACT-V1.0.0",

    state: impacts.length
      ? "AVAILABLE"
      : "PARTIAL",

    team: normalizedTeam,
    adjustment:
      Number(adjustment.toFixed(3)),
    uncappedAdjustment:
      Number(rawAdjustment.toFixed(3)),
    confidence,

    impacts: impacts
      .sort(
        (a, b) =>
          a.adjustment - b.adjustment
      ),

    quarterbackState:
      quarterbackState(
        roster,
        impacts
      ),

    evidenceCount:
      evidence.length,
    resolvedPlayerCount:
      impacts.filter(
        (impact) =>
          impact?.player?.playerName
      ).length,

    methodology: {
      unit:
        "NFL Team Strength index points",
      teamFloor:
        NFL_PLAYER_AVAILABILITY_IMPACT_POLICY
          .teamAdjustmentFloor,
      calibratedWinProbability: false,
    },
  };
}

export default {
  buildNFLTeamAvailabilityImpactFromInputs,
};
