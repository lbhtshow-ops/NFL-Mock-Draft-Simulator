import {
  buildNFLRosterIntelligence,
} from "../NFLRosterIntelligenceEngine.js";

import {
  getNFLTeamAvailabilityEvidence,
} from "../../data/footballIntelligence/nfl/availability/NFLPlayerAvailabilityRegistry.js";

import {
  buildNFLTeamAvailabilityImpactFromInputs,
} from "./NFLTeamAvailabilityImpactEngine.js";

import {
  getNFLTeamPlayerRoleEvidence,
} from "../../data/footballIntelligence/nfl/roles/NFLPlayerRoleRegistry.js";

import {
  enrichNFLRosterWithRoleEvidence,
} from "./NFLPlayerRoleEnrichmentEngine.js";

function latestModifiedAt(evidence = []) {
  return evidence
    .map((record) => record?.provenance?.modifiedAt || null)
    .filter(Boolean)
    .sort()
    .at(-1) || null;
}

function sourceRefs(evidence = []) {
  const refs = [];

  for (const record of evidence) {
    refs.push({
      playerId: record?.player?.playerId || null,
      playerName: record?.player?.playerName || null,
      position: record?.player?.position || null,
      reportStatus: record?.status?.report || null,
      practiceStatus: record?.status?.practice || null,
      source: record?.provenance?.source || null,
      sourceUrl: record?.provenance?.sourceUrl || null,
      modifiedAt: record?.provenance?.modifiedAt || null,
    });
  }

  return refs;
}

export function resolveNFLTeamAvailabilityImpact(
  team,
  {
    season = new Date().getFullYear(),
    week = null,
    gameType = "REG",
  } = {}
) {
  const rosterIntelligence =
    buildNFLRosterIntelligence(team);

  const evidence =
    getNFLTeamAvailabilityEvidence(
      team,
      {
        season,
        week,
        gameType,
      }
    );

  const roleEvidence =
    getNFLTeamPlayerRoleEvidence(
      team,
      {
        season,
        week,
      }
    );

  const enrichedRoster =
    enrichNFLRosterWithRoleEvidence({
      roster:
        rosterIntelligence?.roster || [],
      roleEvidence,
    });

  const impact =
    buildNFLTeamAvailabilityImpactFromInputs({
      team,
      roster: enrichedRoster,
      evidence,
    });

  return {
    ...impact,

    report: {
      available:
        Array.isArray(evidence) &&
        evidence.length > 0,
      season:
        evidence?.[0]?.season ??
        Number(season) ??
        null,
      week:
        evidence?.[0]?.week ??
        (
          week === null
            ? null
            : Number(week)
        ),
      gameType:
        evidence?.[0]?.gameType ||
        String(gameType || "REG").toUpperCase(),
      latestModifiedAt:
        latestModifiedAt(evidence),
      sourceRefs:
        sourceRefs(evidence),
    },

    roleEvidenceCount:
      Array.isArray(roleEvidence)
        ? roleEvidence.length
        : 0,
  };
}

export default {
  resolveNFLTeamAvailabilityImpact,
};
