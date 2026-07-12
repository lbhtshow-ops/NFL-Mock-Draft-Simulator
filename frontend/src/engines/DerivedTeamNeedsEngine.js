import { buildNFLRosterIntelligence } from "./NFLRosterIntelligenceEngine";

function calculatePositionNeed(positionGroup) {
  if (
    !positionGroup ||
    positionGroup.playerCount === 0 ||
    positionGroup.hasEvaluationData === false
  ) {
    return null;
  }

  const specialistPositions = ["K", "P", "LS"];

  if (specialistPositions.includes(positionGroup.position)) {
    return null;
  }

  const {
    playerCount = 0,
    starterCount = 0,
    hasStarterData = false,
    averageRosterValue = null,
    topRosterValue = null,
    depthScore = null,
  } = positionGroup;

  if (playerCount === 0) {
    return null;
  }

  let needScore = 5;

  if (hasStarterData === true && starterCount === 0) {
    needScore += 2;
  }

  if (typeof averageRosterValue === "number") {
    if (averageRosterValue < 60) {
      needScore += 2;
    } else if (averageRosterValue < 70) {
      needScore += 1;
    }
  }

  if (typeof topRosterValue === "number") {
    if (topRosterValue < 70) {
      needScore += 1;
    }

    if (topRosterValue >= 90) {
      needScore -= 2;
    } else if (topRosterValue >= 84) {
      needScore -= 1;
    }
  }

  if (typeof depthScore === "number") {
    if (depthScore < 60) {
      needScore += 1;
    } else if (depthScore >= 80) {
      needScore -= 1;
    }
  }

  return Math.max(1, Math.min(10, needScore));
}

export function buildDerivedTeamNeeds(teamAbbreviation) {
  const rosterIntelligence = buildNFLRosterIntelligence(teamAbbreviation);
  const positionGroups = rosterIntelligence?.positionGroups || {};
  
  const coverage =
    rosterIntelligence?.coverage || {
      hasRosterData: false,
      coveredPositions: [],
      coveragePercent: 0,
    };

  if (!coverage.hasRosterData) {
    return {
      team: teamAbbreviation,
      available: false,
      needs: {},
      coverage,
      metadata: {
        source: "LBHT Derived Team Needs Engine",
        rosterPlayerCount: 0,
        notes: "No roster data available. Static team needs fallback required.",
      },
    };
  }

  const coveredPositions = new Set(coverage.coveredPositions || []);

  const needs = Object.entries(positionGroups).reduce(
    (results, [position, positionGroup]) => {
      if (!coveredPositions.has(position)) {
        return results;
      }

      const needScore = calculatePositionNeed(positionGroup);

      if (typeof needScore !== "number") {
        return results;
      }

      return {
        ...results,
        [position]: needScore,
      };
    },
    {}
  );

  return {
    team: teamAbbreviation,
    available: Object.keys(needs).length > 0,
    needs,
    coverage,
    metadata: {
      source: "LBHT Derived Team Needs Engine",
      rosterPlayerCount: rosterIntelligence?.metadata?.playerCount || 0,
      notes:
        Object.keys(needs).length === 0
          ? "Roster data is available but position groups are ungraded. Static team needs fallback required."
          : coverage.coveragePercent < 100
          ? "Partial roster coverage. Ungraded or uncovered positions require static team needs fallback."
          : "Full roster coverage available.",
    },
  };
}

export function getDerivedPositionNeed(position, teamAbbreviation) {
  const derivedNeeds = buildDerivedTeamNeeds(teamAbbreviation);

  if (!derivedNeeds?.available) {
    return null;
  }

  const positionNeed = derivedNeeds?.needs?.[position];

  return typeof positionNeed === "number" ? positionNeed : null;
}

export default {
  buildDerivedTeamNeeds,
  getDerivedPositionNeed,
};