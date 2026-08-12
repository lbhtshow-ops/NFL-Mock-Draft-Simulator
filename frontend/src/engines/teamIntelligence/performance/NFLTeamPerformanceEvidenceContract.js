import { assessConfidence } from "../../shared/confidenceUtils.js";

export const NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_NAME =
  "NFLTeamPerformanceEvidence";
export const NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_VERSION =
  "NFL-TEAM-PERFORMANCE-EVIDENCE-1.0.0";
export const NFL_TEAM_PERFORMANCE_EVIDENCE_SCHEMA_VERSION =
  "NFL-TEAM-PERFORMANCE-EVIDENCE-SCHEMA-1.0.0";

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function boundedNumber(value, min, max) {
  const normalized = finiteNumber(value);
  return normalized !== null && normalized >= min && normalized <= max
    ? normalized
    : null;
}

function uniqueTextArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(text).filter(Boolean))];
}

function normalizeMetricGroup(value = {}, { defense = false } = {}) {
  const source = isObject(value) ? value : {};
  return {
    epaPerPlay: finiteNumber(source.epaPerPlay),
    successRate: boundedNumber(source.successRate, 0, 1),
    pointsPerDrive: finiteNumber(source.pointsPerDrive),
    explosivePlayRate: boundedNumber(source.explosivePlayRate, 0, 1),
    turnoverRate: boundedNumber(source.turnoverRate, 0, 1),
    perspective: defense ? "DEFENSE_ALLOWED" : "OFFENSE_PRODUCED",
  };
}

function normalizeRecentForm(value = {}) {
  const source = isObject(value) ? value : {};
  const windowGames = Number.isInteger(source.windowGames) && source.windowGames > 0
    ? source.windowGames
    : null;

  return {
    windowGames,
    epaPerPlay: finiteNumber(source.epaPerPlay),
    successRate: boundedNumber(source.successRate, 0, 1),
    pointsPerDrive: finiteNumber(source.pointsPerDrive),
    decayModel: text(source.decayModel),
  };
}

function normalizeProvenance(value = {}) {
  const source = isObject(value) ? value : {};
  return {
    provider: text(source.provider),
    dataset: text(source.dataset),
    datasetVersion: text(source.datasetVersion),
    methodology: text(source.methodology),
    sourceRefs: uniqueTextArray(source.sourceRefs),
    evidenceArtifactRefs: uniqueTextArray(source.evidenceArtifactRefs),
    researchSourceRefs: uniqueTextArray(source.researchSourceRefs),
  };
}

function metricCount(record) {
  return [
    record.offense?.epaPerPlay,
    record.offense?.successRate,
    record.offense?.pointsPerDrive,
    record.defense?.epaPerPlay,
    record.defense?.successRate,
    record.defense?.pointsPerDrive,
    record.specialTeams?.epaPerPlay,
    record.strengthOfSchedule,
    record.opponentAdjustedRating,
    record.recentForm?.epaPerPlay,
    record.recentForm?.successRate,
    record.recentForm?.pointsPerDrive,
  ].filter((value) => typeof value === "number" && Number.isFinite(value)).length;
}

export function createNFLTeamPerformanceEvidence(input = {}) {
  const source = isObject(input) ? input : {};
  const confidenceAssessment = assessConfidence(source.confidence);

  const result = {
    contract: NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_NAME,
    contractVersion: NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_VERSION,
    schemaVersion: NFL_TEAM_PERFORMANCE_EVIDENCE_SCHEMA_VERSION,

    teamAbbreviation: text(source.teamAbbreviation)?.toUpperCase() || null,
    season: Number.isInteger(source.season) ? source.season : null,
    throughWeek:
      Number.isInteger(source.throughWeek) && source.throughWeek >= 0
        ? source.throughWeek
        : null,

    sample: {
      games:
        Number.isInteger(source.sample?.games) && source.sample.games >= 0
          ? source.sample.games
          : null,
      offensivePlays:
        Number.isInteger(source.sample?.offensivePlays) && source.sample.offensivePlays >= 0
          ? source.sample.offensivePlays
          : null,
      defensivePlays:
        Number.isInteger(source.sample?.defensivePlays) && source.sample.defensivePlays >= 0
          ? source.sample.defensivePlays
          : null,
      drives:
        Number.isInteger(source.sample?.drives) && source.sample.drives >= 0
          ? source.sample.drives
          : null,
    },

    offense: normalizeMetricGroup(source.offense),
    defense: normalizeMetricGroup(source.defense, { defense: true }),
    specialTeams: {
      epaPerPlay: finiteNumber(source.specialTeams?.epaPerPlay),
    },

    strengthOfSchedule: finiteNumber(source.strengthOfSchedule),
    opponentAdjustedRating: finiteNumber(source.opponentAdjustedRating),
    recentForm: normalizeRecentForm(source.recentForm),

    confidence: confidenceAssessment.confidence,
    confidenceKnown: confidenceAssessment.known,
    evidenceLevel: confidenceAssessment.evidenceLevel,

    freshness: {
      observedThrough: text(source.freshness?.observedThrough),
      retrievedAt: text(source.freshness?.retrievedAt),
      generatedAt: text(source.freshness?.generatedAt),
    },

    provenance: normalizeProvenance(source.provenance),
  };

  const errors = [];
  const warnings = [];

  if (!result.teamAbbreviation) {
    errors.push({ code: "TEAM_REQUIRED", path: "teamAbbreviation" });
  }

  if (!result.season) {
    errors.push({ code: "SEASON_REQUIRED", path: "season" });
  }

  if (!confidenceAssessment.valid) {
    errors.push({ code: "INVALID_CONFIDENCE", path: "confidence" });
  }

  if (metricCount(result) > 0 && !result.provenance.provider) {
    errors.push({
      code: "PERFORMANCE_PROVIDER_REQUIRED",
      path: "provenance.provider",
    });
  }

  if (metricCount(result) > 0 && result.provenance.sourceRefs.length === 0) {
    warnings.push({
      code: "PERFORMANCE_SOURCE_REFS_MISSING",
      path: "provenance.sourceRefs",
    });
  }

  result.metricCount = metricCount(result);
  result.available = result.metricCount > 0;
  result.validation = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  return result;
}

export function isNFLTeamPerformanceEvidence(value) {
  const normalized = createNFLTeamPerformanceEvidence(value);
  return Boolean(
    normalized.validation.valid &&
      normalized.contract === NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_NAME
  );
}

export default {
  NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_NAME,
  NFL_TEAM_PERFORMANCE_EVIDENCE_CONTRACT_VERSION,
  NFL_TEAM_PERFORMANCE_EVIDENCE_SCHEMA_VERSION,
  createNFLTeamPerformanceEvidence,
  isNFLTeamPerformanceEvidence,
};
