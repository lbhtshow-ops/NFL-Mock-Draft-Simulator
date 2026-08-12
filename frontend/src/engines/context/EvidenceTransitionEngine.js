// src/engines/context/EvidenceTransitionEngine.js

import {
  CAREER_STAGES,
  SAMPLE_STRENGTHS,
  resolvePlayerContext,
} from "./PlayerContextResolver.js";

export const PROSPECT_EVIDENCE_ROLES = {
  PRIMARY: "PRIMARY",
  STRONG_PRIOR: "STRONG_PRIOR",
  SUPPORTING_PRIOR: "SUPPORTING_PRIOR",
  HISTORICAL_CONTEXT: "HISTORICAL_CONTEXT",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  UNKNOWN: "UNKNOWN",
};

export const TRANSITION_STAGES = {
  COLLEGE_PRIMARY: "COLLEGE_PRIMARY",
  PRE_NFL: "PRE_NFL",
  EARLY_TRANSITION: "EARLY_TRANSITION",
  DEVELOPING_PRO: "DEVELOPING_PRO",
  NFL_PRIMARY: "NFL_PRIMARY",
  ESTABLISHED_PRO: "ESTABLISHED_PRO",
  HISTORICAL_ONLY: "HISTORICAL_ONLY",
  UNKNOWN: "UNKNOWN",
};

function clampWeight(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function getNFLGamesPlayed(player = {}, evidence = {}) {
  return normalizeNumber(
    evidence?.nflGamesPlayed ??
      evidence?.gamesPlayed ??
      player?.nflGamesPlayed ??
      player?.gamesPlayed ??
      player?.performanceProfile?.gamesTracked ??
      player?.usageProfile?.gamesTracked ??
      null
  );
}

function getNFLSnaps(player = {}, evidence = {}) {
  return normalizeNumber(
    evidence?.nflSnaps ??
      evidence?.totalSnaps ??
      player?.nflSnaps ??
      player?.totalSnaps ??
      player?.usageProfile?.totalSnaps ??
      null
  );
}

function getNFLStarts(player = {}, evidence = {}) {
  return normalizeNumber(
    evidence?.nflStarts ??
      evidence?.starts ??
      player?.nflStarts ??
      player?.starts ??
      null
  );
}

function getNFLSeasonsWithEvidence(
  player = {},
  evidence = {},
  context = {}
) {
  const explicitSeasons =
    evidence?.nflSeasonsWithEvidence ??
    evidence?.seasonsWithEvidence ??
    player?.nflSeasonsWithEvidence ??
    null;

  const normalizedExplicitSeasons =
    normalizeNumber(explicitSeasons);

  if (normalizedExplicitSeasons !== null) {
    return normalizedExplicitSeasons;
  }

  const seasonsPlayed = context?.experience?.seasonsPlayed;

  if (Array.isArray(seasonsPlayed)) {
    return seasonsPlayed.length;
  }

  return 0;
}

function getBaseTransitionForCareerStage(careerStage) {
  switch (careerStage) {
    case CAREER_STAGES.COLLEGE_DEVELOPMENTAL:
    case CAREER_STAGES.COLLEGE_STARTER:
    case CAREER_STAGES.DRAFT_PROSPECT:
      return {
        transitionStage: TRANSITION_STAGES.COLLEGE_PRIMARY,
        prospectEvidenceRole:
          PROSPECT_EVIDENCE_ROLES.PRIMARY,
        prospectWeight: 1,
        nflWeight: 0,
      };

    case CAREER_STAGES.ROOKIE:
      return {
        transitionStage: TRANSITION_STAGES.EARLY_TRANSITION,
        prospectEvidenceRole:
          PROSPECT_EVIDENCE_ROLES.STRONG_PRIOR,
        prospectWeight: 0.75,
        nflWeight: 0.25,
      };

    case CAREER_STAGES.YOUNG_NFL_PLAYER:
      return {
        transitionStage: TRANSITION_STAGES.DEVELOPING_PRO,
        prospectEvidenceRole:
          PROSPECT_EVIDENCE_ROLES.SUPPORTING_PRIOR,
        prospectWeight: 0.35,
        nflWeight: 0.65,
      };

    case CAREER_STAGES.NFL_VETERAN:
      return {
        transitionStage: TRANSITION_STAGES.ESTABLISHED_PRO,
        prospectEvidenceRole:
          PROSPECT_EVIDENCE_ROLES.HISTORICAL_CONTEXT,
        prospectWeight: 0.1,
        nflWeight: 0.9,
      };

    case CAREER_STAGES.LATE_CAREER_NFL_PLAYER:
    case CAREER_STAGES.FREE_AGENT:
    case CAREER_STAGES.RETIRED:
      return {
        transitionStage: TRANSITION_STAGES.HISTORICAL_ONLY,
        prospectEvidenceRole:
          PROSPECT_EVIDENCE_ROLES.HISTORICAL_CONTEXT,
        prospectWeight: 0,
        nflWeight: 1,
      };

    default:
      return {
        transitionStage: TRANSITION_STAGES.UNKNOWN,
        prospectEvidenceRole:
          PROSPECT_EVIDENCE_ROLES.UNKNOWN,
        prospectWeight: 0,
        nflWeight: 0,
      };
  }
}

function getProfessionalEvidenceAdjustment({
  gamesPlayed,
  snaps,
  starts,
  seasonsWithEvidence,
  sampleStrength,
}) {
  let evidenceAdjustment = 0;

  if (seasonsWithEvidence >= 3) {
    evidenceAdjustment += 0.3;
  } else if (seasonsWithEvidence >= 2) {
    evidenceAdjustment += 0.2;
  } else if (seasonsWithEvidence >= 1) {
    evidenceAdjustment += 0.1;
  }

  if (gamesPlayed >= 40) {
    evidenceAdjustment += 0.25;
  } else if (gamesPlayed >= 24) {
    evidenceAdjustment += 0.18;
  } else if (gamesPlayed >= 12) {
    evidenceAdjustment += 0.1;
  } else if (gamesPlayed >= 4) {
    evidenceAdjustment += 0.04;
  }

  if (starts >= 32) {
    evidenceAdjustment += 0.2;
  } else if (starts >= 16) {
    evidenceAdjustment += 0.14;
  } else if (starts >= 6) {
    evidenceAdjustment += 0.07;
  }

  if (snaps >= 2000) {
    evidenceAdjustment += 0.2;
  } else if (snaps >= 1000) {
    evidenceAdjustment += 0.14;
  } else if (snaps >= 400) {
    evidenceAdjustment += 0.07;
  } else if (snaps >= 100) {
    evidenceAdjustment += 0.03;
  }

  if (sampleStrength === SAMPLE_STRENGTHS.VERY_STRONG) {
    evidenceAdjustment += 0.1;
  } else if (sampleStrength === SAMPLE_STRENGTHS.STRONG) {
    evidenceAdjustment += 0.06;
  } else if (sampleStrength === SAMPLE_STRENGTHS.MODERATE) {
    evidenceAdjustment += 0.03;
  }

  return Math.min(0.75, evidenceAdjustment);
}

function resolveTransitionStage({
  careerStage,
  nflWeight,
  gamesPlayed,
  seasonsWithEvidence,
}) {
  if (
    careerStage === CAREER_STAGES.COLLEGE_DEVELOPMENTAL ||
    careerStage === CAREER_STAGES.COLLEGE_STARTER ||
    careerStage === CAREER_STAGES.DRAFT_PROSPECT
  ) {
    return TRANSITION_STAGES.COLLEGE_PRIMARY;
  }

  if (careerStage === CAREER_STAGES.ROOKIE) {
    if (gamesPlayed === 0 && seasonsWithEvidence === 0) {
      return TRANSITION_STAGES.PRE_NFL;
    }

    return TRANSITION_STAGES.EARLY_TRANSITION;
  }

  if (nflWeight >= 0.9) {
    return TRANSITION_STAGES.ESTABLISHED_PRO;
  }

  if (nflWeight >= 0.65) {
    return TRANSITION_STAGES.NFL_PRIMARY;
  }

  if (nflWeight > 0) {
    return TRANSITION_STAGES.DEVELOPING_PRO;
  }

  return TRANSITION_STAGES.UNKNOWN;
}

function resolveProspectEvidenceRole(prospectWeight) {
  if (prospectWeight >= 0.8) {
    return PROSPECT_EVIDENCE_ROLES.PRIMARY;
  }

  if (prospectWeight >= 0.5) {
    return PROSPECT_EVIDENCE_ROLES.STRONG_PRIOR;
  }

  if (prospectWeight > 0.1) {
    return PROSPECT_EVIDENCE_ROLES.SUPPORTING_PRIOR;
  }

  if (prospectWeight > 0) {
    return PROSPECT_EVIDENCE_ROLES.HISTORICAL_CONTEXT;
  }

  return PROSPECT_EVIDENCE_ROLES.NOT_APPLICABLE;
}

function buildExplanation({
  careerStage,
  prospectWeight,
  nflWeight,
  gamesPlayed,
  starts,
  snaps,
  seasonsWithEvidence,
}) {
  const contextualFactors = [];
  const transitionFactors = [];

  contextualFactors.push(`Career stage: ${careerStage}.`);

  if (seasonsWithEvidence > 0) {
    transitionFactors.push(
      `${seasonsWithEvidence} NFL season(s) contain usable evidence.`
    );
  }

  if (gamesPlayed > 0) {
    transitionFactors.push(
      `${gamesPlayed} NFL game(s) are included in the evidence sample.`
    );
  }

  if (starts > 0) {
    transitionFactors.push(
      `${starts} NFL start(s) are included in the evidence sample.`
    );
  }

  if (snaps > 0) {
    transitionFactors.push(
      `${snaps} NFL snap(s) are included in the evidence sample.`
    );
  }

  if (prospectWeight >= nflWeight) {
    contextualFactors.push(
      "Prospect evidence remains the primary or equal evaluation foundation."
    );
  } else if (prospectWeight > 0) {
    contextualFactors.push(
      "NFL evidence is primary, while prospect evidence remains supporting context."
    );
  } else {
    contextualFactors.push(
      "NFL evidence is sufficient for prospect evidence to remain historical only."
    );
  }

  return {
    summary:
      `Prospect evidence weight is ${Math.round(
        prospectWeight * 100
      )}% and NFL evidence weight is ${Math.round(
        nflWeight * 100
      )}%.`,

    contextualFactors,
    transitionFactors,
  };
}

export function resolveEvidenceTransition(
  player = {},
  evidence = {}
) {
  const context =
    evidence?.playerContext ||
    player?.playerContext ||
    resolvePlayerContext(player);

  const careerStage =
    context?.careerStage || CAREER_STAGES.UNKNOWN;

  const gamesPlayed =
    getNFLGamesPlayed(player, evidence) ?? 0;

  const snaps = getNFLSnaps(player, evidence) ?? 0;

  const starts = getNFLStarts(player, evidence) ?? 0;

  const seasonsWithEvidence =
    getNFLSeasonsWithEvidence(
      player,
      evidence,
      context
    ) ?? 0;

  const baseTransition =
    getBaseTransitionForCareerStage(careerStage);

  const professionalEvidenceAdjustment =
    getProfessionalEvidenceAdjustment({
      gamesPlayed,
      snaps,
      starts,
      seasonsWithEvidence,
      sampleStrength: context?.sampleStrength,
    });

  let prospectWeight =
    baseTransition.prospectWeight;

  let nflWeight = baseTransition.nflWeight;

  const isProfessionalStage = [
    CAREER_STAGES.ROOKIE,
    CAREER_STAGES.YOUNG_NFL_PLAYER,
    CAREER_STAGES.NFL_VETERAN,
    CAREER_STAGES.LATE_CAREER_NFL_PLAYER,
    CAREER_STAGES.FREE_AGENT,
    CAREER_STAGES.RETIRED,
  ].includes(careerStage);

  if (isProfessionalStage) {
    nflWeight = clampWeight(
      nflWeight + professionalEvidenceAdjustment
    );

    prospectWeight = clampWeight(1 - nflWeight);
  }

  const transitionStage = resolveTransitionStage({
    careerStage,
    nflWeight,
    gamesPlayed,
    seasonsWithEvidence,
  });

  const prospectEvidenceRole =
    resolveProspectEvidenceRole(prospectWeight);

  const explanation = buildExplanation({
    careerStage,
    prospectWeight,
    nflWeight,
    gamesPlayed,
    starts,
    snaps,
    seasonsWithEvidence,
  });

  return {
    available: Boolean(context?.available),

    playerId: context?.playerId || null,
    careerStage,
    competitionLevel:
      context?.competition?.level || null,

    transitionStage,
    prospectEvidenceRole,

    weights: {
      prospect: prospectWeight,
      nfl: nflWeight,
    },

    professionalEvidence: {
      gamesPlayed,
      starts,
      snaps,
      seasonsWithEvidence,
      sampleStrength:
        context?.sampleStrength || null,
      evidenceAdjustment:
        professionalEvidenceAdjustment,
    },

    explanation,

    versions: {
      framework: "1.0.0",
      engine: "1.0.0",
    },
  };
}

export function blendProspectAndNFLScores({
  prospectScore = null,
  nflScore = null,
  transition = null,
} = {}) {
  const prospectAvailable =
    typeof prospectScore === "number" &&
    Number.isFinite(prospectScore);

  const nflAvailable =
    typeof nflScore === "number" &&
    Number.isFinite(nflScore);

  if (!prospectAvailable && !nflAvailable) {
    return {
      available: false,
      score: null,
      reason: "NO_EVIDENCE_AVAILABLE",
    };
  }

  if (prospectAvailable && !nflAvailable) {
    return {
      available: true,
      score: Math.round(prospectScore),
      reason: "PROSPECT_EVIDENCE_ONLY",
    };
  }

  if (!prospectAvailable && nflAvailable) {
    return {
      available: true,
      score: Math.round(nflScore),
      reason: "NFL_EVIDENCE_ONLY",
    };
  }

  const prospectWeight =
    transition?.weights?.prospect ?? 0.5;

  const nflWeight =
    transition?.weights?.nfl ?? 0.5;

  const totalWeight = prospectWeight + nflWeight;

  if (totalWeight <= 0) {
    return {
      available: false,
      score: null,
      reason: "INVALID_TRANSITION_WEIGHTS",
    };
  }

  const score =
    prospectScore * (prospectWeight / totalWeight) +
    nflScore * (nflWeight / totalWeight);

  return {
    available: true,
    score: Math.round(score),
    reason: "BLENDED_PROSPECT_AND_NFL_EVIDENCE",
    weights: {
      prospect: prospectWeight / totalWeight,
      nfl: nflWeight / totalWeight,
    },
  };
}

export default {
  resolveEvidenceTransition,
  blendProspectAndNFLScores,
  PROSPECT_EVIDENCE_ROLES,
  TRANSITION_STAGES,
};
