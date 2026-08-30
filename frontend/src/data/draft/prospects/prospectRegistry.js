import prospects from "../prospects.js";

function getCanonicalProspectId(prospect) {
  return (
    prospect.canonicalId ||
    prospect.playerId ||
    prospect.prospectId ||
    prospect.id ||
    `rank-${prospect.rank}`
  );
}

function normalizeProspect(prospect) {
  const canonicalId = getCanonicalProspectId(prospect);

  return {
    id: canonicalId,
    canonicalId,
    playerId: canonicalId,
    prospectId: canonicalId,
    rank: prospect.rank,

    bio: {
      name: prospect.name || prospect.player || "Unknown Prospect",
      position: prospect.position || "",
      school: prospect.school || prospect.college || "",
      age: prospect.age || null,
      height: prospect.height || "",
      weight: prospect.weight || null,
      classYear: prospect.classYear || "",
    },

    rankings: {
      overall: prospect.rank || null,
      position: prospect.positionRank || null,
      consensus: prospect.consensusRank || prospect.rank || null,
    },

    evaluation: {
      grade: prospect.grade || null,
      tier: prospect.tier || "",
      projection: prospect.projection || "",
      archetype: prospect.archetype || "",
      comparison: prospect.comparison || "",
      floor: prospect.floor || "",
      ceiling: prospect.ceiling || "",
      readiness: prospect.readiness || "",
      development: prospect.development || "",
      risk: prospect.risk || "",
      strengths: prospect.strengths || [],
      weaknesses: prospect.weaknesses || [],
      scoutingNotes: prospect.scoutingNotes || "",
    },

    traits: prospect.traits || {},
    athletics: prospect.athletics || {},
    intelligence: prospect.intelligence || {},
    schemeFit: prospect.schemeFit || {},

    display: {
      logo: prospect.logo || "",
    },

    metadata: {
      sources: prospect.sources || [],
      confidence: prospect.confidence || null,
      lastUpdated: prospect.lastUpdated || "",
      status: prospect.status || "legacy_normalized",
    },
  };
}

export const prospectRegistry = prospects.map(normalizeProspect);

export function getAllProspects() {
  return prospectRegistry;
}

export function getProspectById(id) {
  return prospectRegistry.find((prospect) => prospect.id === id) || null;
}

export function getProspectByRank(rank) {
  return (
    prospectRegistry.find(
      (prospect) => Number(prospect.rank) === Number(rank)
    ) || null
  );
}
