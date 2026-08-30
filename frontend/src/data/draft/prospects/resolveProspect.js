import {
  getProspectById,
  getProspectByRank,
} from "./prospectRegistry.js";

export function resolveProspect(identifier) {
  if (!identifier) {
    return null;
  }

  if (typeof identifier === "object") {
    return normalizeResolvedProspect(identifier);
  }

  if (typeof identifier === "number") {
    return normalizeResolvedProspect(getProspectByRank(identifier));
  }

  return normalizeResolvedProspect(getProspectById(identifier));
}

export function normalizeResolvedProspect(prospect) {
  if (!prospect) {
    return null;
  }

  const displayName =
    prospect.bio?.name ||
    prospect.name ||
    prospect.player ||
    "Unknown Prospect";

  const displayPosition =
    prospect.bio?.position ||
    prospect.position ||
    "--";

  const displaySchool =
    prospect.bio?.school ||
    prospect.school ||
    prospect.college ||
    "Unknown School";

  const displayLogo =
    prospect.display?.logo ||
    prospect.logo ||
    "";

  const displayGrade =
    prospect.evaluation?.grade ||
    prospect.grade ||
    "--";

  const displayTier =
    prospect.evaluation?.tier ||
    prospect.tier ||
    "--";

  const displayProjection =
    prospect.evaluation?.projection ||
    prospect.projection ||
    "--";

  return {
    ...prospect,

    id: prospect.id || `rank-${prospect.rank}`,
playerId:
  prospect.playerId ||
  prospect.prospectId ||
  prospect.canonicalId ||
  prospect.id ||
  `rank-${prospect.rank}`,
prospectId:
  prospect.prospectId ||
  prospect.playerId ||
  prospect.canonicalId ||
  prospect.id ||
  `rank-${prospect.rank}`,
canonicalId:
  prospect.canonicalId ||
  prospect.playerId ||
  prospect.prospectId ||
  prospect.id ||
  `rank-${prospect.rank}`,
rank: prospect.rank,

    // Engine compatibility
    name: displayName,
    player: displayName,
    position: displayPosition,
    school: displaySchool,
    college: displaySchool,
    logo: displayLogo,
    grade: displayGrade,
    tier: displayTier,
    projection: displayProjection,

    // UI display helpers
    displayName,
    displayPosition,
    displaySchool,
    displayLogo,
    displayGrade,
    displayTier,
    displayProjection,
  };
}
