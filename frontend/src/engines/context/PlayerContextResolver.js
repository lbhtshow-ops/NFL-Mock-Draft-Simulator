// src/engines/context/PlayerContextResolver.js

const NFL_LEVELS = new Set(["NFL", "PRO", "PROFESSIONAL"]);

const COLLEGE_LEVELS = new Set([
  "COLLEGE",
  "NCAA",
  "FBS",
  "FCS",
  "DII",
  "DIII",
  "NAIA",
  "JUCO",
]);

const CAREER_STAGES = {
  COLLEGE_DEVELOPMENTAL: "COLLEGE_DEVELOPMENTAL",
  COLLEGE_STARTER: "COLLEGE_STARTER",
  DRAFT_PROSPECT: "DRAFT_PROSPECT",
  ROOKIE: "ROOKIE",
  YOUNG_NFL_PLAYER: "YOUNG_NFL_PLAYER",
  NFL_VETERAN: "NFL_VETERAN",
  LATE_CAREER_NFL_PLAYER: "LATE_CAREER_NFL_PLAYER",
  FREE_AGENT: "FREE_AGENT",
  RETIRED: "RETIRED",
  UNKNOWN: "UNKNOWN",
};

const EVIDENCE_PROFILES = {
  COLLEGE_DEVELOPMENT: "COLLEGE_DEVELOPMENT",
  COLLEGE_STARTER: "COLLEGE_STARTER",
  COLLEGE_PROJECTION: "COLLEGE_PROJECTION",
  ROOKIE_TRANSITION: "ROOKIE_TRANSITION",
  EARLY_CAREER_PRO: "EARLY_CAREER_PRO",
  ESTABLISHED_PRO: "ESTABLISHED_PRO",
  LATE_CAREER_PRO: "LATE_CAREER_PRO",
  FREE_AGENT: "FREE_AGENT",
  HISTORICAL: "HISTORICAL",
  UNKNOWN: "UNKNOWN",
};

const SAMPLE_STRENGTHS = {
  NONE: "NONE",
  LIMITED: "LIMITED",
  MODERATE: "MODERATE",
  STRONG: "STRONG",
  VERY_STRONG: "VERY_STRONG",
  UNKNOWN: "UNKNOWN",
};

function normalizeText(value) {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();

  return normalized || null;
}

function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getPlayerId(player = {}) {
  return (
    player?.canonicalId ||
    player?.playerId ||
    player?.prospectId ||
    player?.id ||
    player?.record?.playerId ||
    null
  );
}

function getCareerContext(player = {}) {
  return (
    player?.careerContext ||
    player?.profile?.careerContext ||
    player?.record?.careerContext ||
    {}
  );
}

function getIdentity(player = {}) {
  return (
    player?.identity ||
    player?.profile?.bio ||
    player?.record?.identity ||
    {}
  );
}

function getPosition(player = {}) {
  const identity = getIdentity(player);

  return normalizeText(
    identity?.position ||
      player?.position ||
      player?.roster?.position ||
      null
  );
}

function getCompetitionLevel(player = {}, careerContext = {}) {
  const explicitLevel = normalizeText(
    careerContext?.competition?.level ||
      careerContext?.competitionLevel ||
      player?.competitionLevel ||
      player?.level ||
      null
  );

  if (explicitLevel) {
    return explicitLevel;
  }

  const league = normalizeText(
    careerContext?.competition?.league ||
      careerContext?.league ||
      player?.league ||
      null
  );

  if (league === "NFL") {
    return "NFL";
  }

  if (league === "NCAA") {
    return "COLLEGE";
  }

  const identity = getIdentity(player);

  const hasSchool = Boolean(
    identity?.school ||
      player?.school ||
      player?.college ||
      player?.collegeName
  );

  const hasNFLTeam = Boolean(
    careerContext?.currentTeam?.abbreviation ||
      player?.teamAbbr ||
      player?.team ||
      player?.roster?.team
  );

  if (hasNFLTeam) {
    return "NFL";
  }

  if (hasSchool) {
    return "COLLEGE";
  }

  return "UNKNOWN";
}

function getYearsExperience(player = {}, careerContext = {}) {
  return normalizeNumber(
    careerContext?.experience?.yearsExperience ??
      player?.yearsExperience ??
      player?.years_exp ??
      player?.yearsExp ??
      player?.experience ??
      player?.identity?.experience ??
      player?.roster?.experience ??
      null
  );
}

function getSeasonsPlayed(player = {}, careerContext = {}) {
  const explicitSeasons =
    careerContext?.experience?.seasonsPlayed ||
    player?.seasonProfiles ||
    player?.seasonsPlayed ||
    [];

  if (Array.isArray(explicitSeasons)) {
    return explicitSeasons.filter(Boolean);
  }

  if (
    explicitSeasons &&
    typeof explicitSeasons === "object"
  ) {
    return Object.keys(explicitSeasons);
  }

  return [];
}

function getCareerStage({
  player,
  careerContext,
  competitionLevel,
  yearsExperience,
}) {
  const explicitStage = normalizeText(
    careerContext?.careerStage ||
      player?.careerStage ||
      null
  );

  if (
    explicitStage &&
    Object.values(CAREER_STAGES).includes(explicitStage)
  ) {
    return explicitStage;
  }

  const rosterStatus = normalizeText(
    careerContext?.roster?.status ||
      player?.roster?.status ||
      player?.status ||
      null
  );

  if (rosterStatus === "RETIRED") {
    return CAREER_STAGES.RETIRED;
  }

  if (
    rosterStatus === "FREE_AGENT" ||
    rosterStatus === "FA"
  ) {
    return CAREER_STAGES.FREE_AGENT;
  }

  const rookieFlag =
    careerContext?.roster?.rookie ??
    player?.isRookie ??
    player?.rookie ??
    null;

  if (
    rookieFlag === true ||
    (competitionLevel === "NFL" && yearsExperience === 0)
  ) {
    return CAREER_STAGES.ROOKIE;
  }

  if (NFL_LEVELS.has(competitionLevel)) {
    if (yearsExperience === null) {
      return CAREER_STAGES.UNKNOWN;
    }

    if (yearsExperience <= 3) {
      return CAREER_STAGES.YOUNG_NFL_PLAYER;
    }

    if (yearsExperience <= 10) {
      return CAREER_STAGES.NFL_VETERAN;
    }

    return CAREER_STAGES.LATE_CAREER_NFL_PLAYER;
  }

  if (COLLEGE_LEVELS.has(competitionLevel)) {
    const draftStatus = normalizeText(
      careerContext?.draft?.status ||
        player?.draftStatus ||
        null
    );

    const draftClass =
      careerContext?.draft?.draftClass ??
      player?.draftClass ??
      null;

    if (
      draftStatus === "DECLARED" ||
      draftStatus === "ELIGIBLE" ||
      draftStatus === "PROSPECT" ||
      draftClass
    ) {
      return CAREER_STAGES.DRAFT_PROSPECT;
    }

    const starterFlag =
      careerContext?.roster?.starter ??
      player?.starter ??
      null;

    if (starterFlag === true) {
      return CAREER_STAGES.COLLEGE_STARTER;
    }

    return CAREER_STAGES.COLLEGE_DEVELOPMENTAL;
  }

  return CAREER_STAGES.UNKNOWN;
}

function getEvidenceProfile(careerStage) {
  switch (careerStage) {
    case CAREER_STAGES.COLLEGE_DEVELOPMENTAL:
      return EVIDENCE_PROFILES.COLLEGE_DEVELOPMENT;

    case CAREER_STAGES.COLLEGE_STARTER:
      return EVIDENCE_PROFILES.COLLEGE_STARTER;

    case CAREER_STAGES.DRAFT_PROSPECT:
      return EVIDENCE_PROFILES.COLLEGE_PROJECTION;

    case CAREER_STAGES.ROOKIE:
      return EVIDENCE_PROFILES.ROOKIE_TRANSITION;

    case CAREER_STAGES.YOUNG_NFL_PLAYER:
      return EVIDENCE_PROFILES.EARLY_CAREER_PRO;

    case CAREER_STAGES.NFL_VETERAN:
      return EVIDENCE_PROFILES.ESTABLISHED_PRO;

    case CAREER_STAGES.LATE_CAREER_NFL_PLAYER:
      return EVIDENCE_PROFILES.LATE_CAREER_PRO;

    case CAREER_STAGES.FREE_AGENT:
      return EVIDENCE_PROFILES.FREE_AGENT;

    case CAREER_STAGES.RETIRED:
      return EVIDENCE_PROFILES.HISTORICAL;

    default:
      return EVIDENCE_PROFILES.UNKNOWN;
  }
}

function getSampleStrength({
  seasonsPlayed,
  yearsExperience,
  careerStage,
}) {
  const seasonCount = seasonsPlayed.length;

  if (seasonCount >= 5) {
    return SAMPLE_STRENGTHS.VERY_STRONG;
  }

  if (seasonCount >= 3) {
    return SAMPLE_STRENGTHS.STRONG;
  }

  if (seasonCount >= 1) {
    return SAMPLE_STRENGTHS.MODERATE;
  }

  if (
    careerStage === CAREER_STAGES.ROOKIE ||
    careerStage === CAREER_STAGES.DRAFT_PROSPECT ||
    careerStage === CAREER_STAGES.COLLEGE_DEVELOPMENTAL
  ) {
    return SAMPLE_STRENGTHS.LIMITED;
  }

  if (typeof yearsExperience === "number") {
    if (yearsExperience >= 5) {
      return SAMPLE_STRENGTHS.VERY_STRONG;
    }

    if (yearsExperience >= 3) {
      return SAMPLE_STRENGTHS.STRONG;
    }

    if (yearsExperience >= 1) {
      return SAMPLE_STRENGTHS.MODERATE;
    }

    return SAMPLE_STRENGTHS.LIMITED;
  }

  return SAMPLE_STRENGTHS.UNKNOWN;
}

function getEvaluationPath({
  competitionLevel,
  careerStage,
}) {
  if (
    careerStage === CAREER_STAGES.ROOKIE ||
    careerStage === CAREER_STAGES.YOUNG_NFL_PLAYER
  ) {
    return "TRANSITION";
  }

  if (NFL_LEVELS.has(competitionLevel)) {
    return "NFL";
  }

  if (COLLEGE_LEVELS.has(competitionLevel)) {
    return "COLLEGE";
  }

  if (careerStage === CAREER_STAGES.RETIRED) {
    return "HISTORICAL";
  }

  return "UNKNOWN";
}

function getProspectEvidenceRole(careerStage) {
  switch (careerStage) {
    case CAREER_STAGES.DRAFT_PROSPECT:
    case CAREER_STAGES.COLLEGE_STARTER:
    case CAREER_STAGES.COLLEGE_DEVELOPMENTAL:
      return "PRIMARY";

    case CAREER_STAGES.ROOKIE:
      return "STRONG_PRIOR";

    case CAREER_STAGES.YOUNG_NFL_PLAYER:
      return "SUPPORTING_PRIOR";

    case CAREER_STAGES.NFL_VETERAN:
    case CAREER_STAGES.LATE_CAREER_NFL_PLAYER:
    case CAREER_STAGES.FREE_AGENT:
    case CAREER_STAGES.RETIRED:
      return "HISTORICAL_CONTEXT";

    default:
      return "UNKNOWN";
  }
}

function getMissingContext({
  competitionLevel,
  careerStage,
  position,
  yearsExperience,
}) {
  const missing = [];

  if (!position) {
    missing.push("position");
  }

  if (
    !competitionLevel ||
    competitionLevel === "UNKNOWN"
  ) {
    missing.push("competitionLevel");
  }

  if (
    !careerStage ||
    careerStage === CAREER_STAGES.UNKNOWN
  ) {
    missing.push("careerStage");
  }

  if (
    NFL_LEVELS.has(competitionLevel) &&
    yearsExperience === null
  ) {
    missing.push("yearsExperience");
  }

  return missing;
}

export function resolvePlayerContext(player = {}) {
  const careerContext = getCareerContext(player);
  const playerId = getPlayerId(player);
  const position = getPosition(player);

  const competitionLevel = getCompetitionLevel(
    player,
    careerContext
  );

  const yearsExperience = getYearsExperience(
    player,
    careerContext
  );

  const seasonsPlayed = getSeasonsPlayed(
    player,
    careerContext
  );

  const careerStage = getCareerStage({
    player,
    careerContext,
    competitionLevel,
    yearsExperience,
  });

  const evidenceProfile = getEvidenceProfile(careerStage);

  const sampleStrength = getSampleStrength({
    seasonsPlayed,
    yearsExperience,
    careerStage,
  });

  const evaluationPath = getEvaluationPath({
    competitionLevel,
    careerStage,
  });

  const prospectEvidenceRole =
    getProspectEvidenceRole(careerStage);

  const missingContext = getMissingContext({
    competitionLevel,
    careerStage,
    position,
    yearsExperience,
  });

  return {
    available: Boolean(playerId),

    playerId,
    position,

    competition: {
      level: competitionLevel,
      league:
        normalizeText(
          careerContext?.competition?.league ||
            player?.league ||
            null
        ) || null,

      division:
        normalizeText(
          careerContext?.competition?.division ||
            player?.division ||
            null
        ) || null,

      conference:
        normalizeText(
          careerContext?.competition?.conference ||
            player?.conference ||
            null
        ) || null,
    },

    careerStage,
    evidenceProfile,
    sampleStrength,
    evaluationPath,
    prospectEvidenceRole,

    experience: {
      yearsExperience,
      seasonsPlayed,
      seasonCount: seasonsPlayed.length,
    },

    currentTeam:
      careerContext?.currentTeam || null,

    draft:
      careerContext?.draft || null,

    roster:
      careerContext?.roster || null,

    activeSeason:
      careerContext?.activeSeason ?? null,

    previousLevels:
      Array.isArray(careerContext?.previousLevels)
        ? careerContext.previousLevels
        : [],

    missingContext,

    contextConfidence:
      missingContext.length === 0
        ? 1
        : Math.max(0.25, 1 - missingContext.length * 0.2),

    frameworkVersion: "1.0.0",
    resolverVersion: "1.0.0",
  };
}

export {
  CAREER_STAGES,
  EVIDENCE_PROFILES,
  SAMPLE_STRENGTHS,
};

export default {
  resolvePlayerContext,
  CAREER_STAGES,
  EVIDENCE_PROFILES,
  SAMPLE_STRENGTHS,
};