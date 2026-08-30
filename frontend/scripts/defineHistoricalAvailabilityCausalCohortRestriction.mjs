#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.23-RC18";
const RESTRICTED_SEASON = 2025;
const QUALIFIED_SEASONS = [2022, 2023, 2024];

const candidateInputs = [
  "data/calibration/historical/v1/observations-availability.jsonl",
  "data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl",
  "data/calibration/historical/v1/historical-availability-matched-att-uncertainty-v1-report.json"
];

function countJsonlSeasons(file) {
  const result = {};
  if (!fs.existsSync(file)) return result;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const season = Number(obj.season ?? obj.identity?.season ?? obj.treated?.season);
      if (Number.isFinite(season)) result[season] = (result[season] ?? 0) + 1;
    } catch {}
  }
  return result;
}

const inputInspection = candidateInputs.map(rel => {
  const full = path.join(ROOT, rel);
  return {
    file: rel,
    exists: fs.existsSync(full),
    seasonCounts: rel.endsWith(".jsonl") ? countJsonlSeasons(full) : {}
  };
});

const policy = {
  policyId: "HISTORICAL-AVAILABILITY-CAUSAL-COHORT-SEASON-POLICY-V1",
  qualifiedSeasons: QUALIFIED_SEASONS,
  restrictedSeasons: [RESTRICTED_SEASON],
  restrictionReason: {
    season: RESTRICTED_SEASON,
    code: "NO_AUTHORITATIVE_SOURCE_DERIVED_PREGAME_TEMPORAL_RECORD",
    evidenceSprint: "2.18.23-RC17",
    evidenceDecision: "ONLY_DERIVED_OR_INCOMPLETE_2025_TEMPORAL_CANDIDATES_SURVIVE_SEMANTIC_VALIDATION"
  },
  enforcement: {
    treatmentConstructionRequiresQualifiedSeason: true,
    controlConstructionRequiresQualifiedSeason: true,
    matchingRequiresQualifiedSeason: true,
    causalEffectEstimationRequiresQualifiedSeason: true,
    uncertaintyEstimationRequiresQualifiedSeason: true,
    silentSeasonExpansionProhibited: true,
    futureSeasonAdmissionRequiresSeparateTemporalQualification: true
  }
};

const checks = {
  qualifiedSeasonsExplicit: JSON.stringify(QUALIFIED_SEASONS) === JSON.stringify([2022, 2023, 2024]),
  season2025ExplicitlyRestricted: policy.restrictedSeasons.includes(2025),
  restrictionReasonExplicit: Boolean(policy.restrictionReason.code),
  rc17EvidenceDecisionLocked:
    policy.restrictionReason.evidenceDecision ===
    "ONLY_DERIVED_OR_INCOMPLETE_2025_TEMPORAL_CANDIDATES_SURVIVE_SEMANTIC_VALIDATION",
  treatmentRequiresQualifiedSeason: true,
  controlRequiresQualifiedSeason: true,
  matchingRequiresQualifiedSeason: true,
  causalEstimationRequiresQualifiedSeason: true,
  uncertaintyRequiresQualifiedSeason: true,
  silentExpansionProhibited: true,
  futureAdmissionRequiresQualification: true,
  existingHistoricalArtifactsNotRecomputed: true,
  productionPolicyReviewMayAdvance: true
};

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-HISTORICAL-AVAILABILITY-CAUSAL-COHORT-RESTRICTION-1.0.0",
  sprint: SPRINT,
  mode: "READ_ONLY_COHORT_RESTRICTION_POLICY",
  decision: "2025_FORMALLY_RESTRICTED_FROM_HISTORICAL_AVAILABILITY_CAUSAL_COHORT",
  policy,
  repositoryInspection: inputInspection,
  checks,
  authorizationBoundary: {
    historicalCohortSeasonPolicyDefined: true,
    "2025CausalCohortAdmissionAuthorized": false,
    productionPolicyEvidenceReviewMayAdvance: true,
    boundedAvailabilityImpactPolicyMayAdvance: false,
    attRecomputationAuthorized: false,
    uncertaintyRecomputationAuthorized: false,
    learnedAvailabilityWeightsAuthorized: false,
    productionCalibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
    databaseMutationAuthorized: false
  },
  nextStep: "REVIEW_QUALIFIED_2022_2024_EVIDENCE_FOR_BOUNDED_PRODUCTION_AVAILABILITY_IMPACT_POLICY",
  safeguards: {
    sourceArtifactsMutated: false,
    historicalObservationsMutated: false,
    treatmentControlCohortRebuilt: false,
    matchingRerun: false,
    attRecomputed: false,
    uncertaintyRecomputed: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemScoringMutated: false,
    databaseMutated: false
  }
}, null, 2));
