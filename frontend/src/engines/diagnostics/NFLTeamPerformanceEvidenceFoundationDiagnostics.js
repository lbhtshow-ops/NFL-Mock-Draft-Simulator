import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createNFLTeamPerformanceEvidence,
  createNFLTeamPerformanceEvidenceProvider,
} from "../teamIntelligence/performance/index.js";

const performanceFixture = {
  teamAbbreviation: "BAL",
  season: 2026,
  throughWeek: 4,
  sample: {
    games: 4,
    offensivePlays: 248,
    defensivePlays: 241,
    drives: 46,
  },
  offense: {
    epaPerPlay: 0.14,
    successRate: 0.49,
    pointsPerDrive: 2.51,
    explosivePlayRate: 0.13,
    turnoverRate: 0.08,
  },
  defense: {
    epaPerPlay: -0.06,
    successRate: 0.41,
    pointsPerDrive: 1.82,
    explosivePlayRate: 0.09,
    turnoverRate: 0.11,
  },
  specialTeams: { epaPerPlay: 0.01 },
  strengthOfSchedule: 0.18,
  opponentAdjustedRating: 0.11,
  recentForm: {
    windowGames: 3,
    epaPerPlay: 0.09,
    successRate: 0.47,
    pointsPerDrive: 2.28,
    decayModel: "EXPONENTIAL_RECENCY_V1_DECLARATION",
  },
  confidence: 0.82,
  freshness: {
    observedThrough: "2026-W04",
    retrievedAt: "2026-10-01T12:00:00Z",
    generatedAt: "2026-10-01T12:05:00Z",
  },
  provenance: {
    provider: "DIAGNOSTIC_FIXTURE_ONLY",
    dataset: "NFL_TEAM_PERFORMANCE_FIXTURE",
    datasetVersion: "1.0.0",
    methodology: "CONTRACT_VALIDATION_FIXTURE_NOT_PRODUCTION_EVIDENCE",
    sourceRefs: ["fixture://nfl-team-performance/BAL/2026/W04"],
  },
};

const normalized = createNFLTeamPerformanceEvidence(performanceFixture);
const provider = createNFLTeamPerformanceEvidenceProvider([performanceFixture]);
const unknown = createNFLTeamPerformanceEvidence({
  teamAbbreviation: "BAL",
  season: 2026,
  provenance: {},
});
const invalidSuccessRate = createNFLTeamPerformanceEvidence({
  ...performanceFixture,
  offense: { ...performanceFixture.offense, successRate: 1.2 },
});
const missingProvider = createNFLTeamPerformanceEvidence({
  ...performanceFixture,
  provenance: { ...performanceFixture.provenance, provider: null },
});

const here = path.dirname(fileURLToPath(import.meta.url));
const inputSource = fs.readFileSync(
  path.resolve(here, "../teamIntelligence/NFLTeamIntelligenceInputProjection.js"),
  "utf8"
);
const engineSource = fs.readFileSync(
  path.resolve(here, "../teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js"),
  "utf8"
);
const serviceSource = fs.readFileSync(
  path.resolve(here, "../../data/footballIntelligence/services/FootballIntelligenceService.js"),
  "utf8"
);

const checks = {
  contract_validates_fixture: normalized.validation.valid === true,
  confidence_reuses_existing_semantics:
    normalized.confidence === 0.82 &&
    normalized.confidenceKnown === true &&
    normalized.evidenceLevel === "STRONG",
  provider_resolves_team_season_week:
    provider.resolve("BAL", { season: 2026, throughWeek: 4 })?.teamAbbreviation === "BAL",
  unknown_metrics_remain_unknown:
    unknown.available === false &&
    unknown.confidence === null &&
    unknown.confidenceKnown === false,
  invalid_success_rate_not_promoted:
    invalidSuccessRate.offense.successRate === null,
  provider_required_for_modeled_metrics:
    missingProvider.validation.valid === false &&
    missingProvider.validation.errors.some(
      (entry) => entry.code === "PERFORMANCE_PROVIDER_REQUIRED"
    ),
  input_projection_accepts_injected_provider:
    inputSource.includes("performanceProvider = emptyNFLTeamPerformanceEvidenceProvider") &&
    inputSource.includes("performanceProvider?.resolve?."),
  missing_evidence_is_dynamic:
    inputSource.includes("performanceChecks") &&
    inputSource.includes("performance.offense.epaPerPlay"),
  engine_exposes_performance_evidence:
    engineSource.includes('type: "NFL_TEAM_PERFORMANCE"') &&
    engineSource.includes("performanceEvidence(input)"),
  scoring_remains_unmodeled:
    engineSource.includes("overallStrength: null") &&
    engineSource.includes("offense: null") &&
    engineSource.includes("predictive scoring model"),
  service_boundary_accepts_options:
    serviceSource.includes("buildNFLTeamIntelligenceProfile(team, options = {})") &&
    serviceSource.includes("getNFLTeamIntelligenceResult(team, options)"),
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({
  suite: "NFL Team Performance Evidence Foundation",
  contractVersion: "FIE-NFL-TEAM-PERFORMANCE-SPRINT2-1.0.0",
  status: failures.length === 0 ? "PASS" : "FAIL",
  passed: Object.values(checks).filter(Boolean).length,
  failed: failures.length,
  checks,
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 1;
