#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/calibration/historical/v1");
const EXPANSION = path.resolve(
  "data/calibration/historical/expansion-2020-2021",
);

const exists = (p) => fs.existsSync(p);
const readJson = (p) =>
  exists(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
const readJsonl = (p) =>
  exists(p)
    ? fs.readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
    : [];

const files = {
  legacyObservations:
    `${ROOT}/historical-availability-impact-calibration-observations-v1.jsonl`,
  legacyEffects:
    `${ROOT}/historical-availability-matched-att-effects-v1.jsonl`,
  legacyUsage:
    `${ROOT}/historical-observed-usage-dependency-v1.jsonl`,
  legacyReplacements:
    `${ROOT}/expected-replacement-identities-caliber-enriched-v1.jsonl`,
  expansionBase:
    `${EXPANSION}/base/observations.jsonl`,
  expansionBaseQuality:
    `${EXPANSION}/base/quality-report.json`,
  expansionSnaps:
    `${EXPANSION}/snap-counts/historical-snap-counts-resolved-v1.jsonl`,
  expansionSnapReport:
    `${EXPANSION}/snap-counts/historical-snap-identity-materialization-report.json`,
  expansionDepth:
    `${EXPANSION}/depth-charts/historical-depth-charts.jsonl`,
  expansionDepthManifest:
    `${EXPANSION}/depth-charts/historical-depth-charts-manifest.json`,
  availabilityQualification:
    `${ROOT}/audits/2d1c-availability-qualification-2020-2021.json`,
};

function seasons(rows, getter = (r) => r?.identity?.season ?? r?.season) {
  return [...new Set(rows.map(getter).filter((v) => Number.isFinite(Number(v))).map(Number))].sort();
}

const legacyObs = readJsonl(files.legacyObservations);
const legacyEffects = readJsonl(files.legacyEffects);
const legacyUsage = readJsonl(files.legacyUsage);
const legacyReplacements = readJsonl(files.legacyReplacements);
const expansionBase = readJsonl(files.expansionBase);
const expansionSnaps = readJsonl(files.expansionSnaps);
const expansionDepth = readJsonl(files.expansionDepth);

const baseQuality = readJson(files.expansionBaseQuality);
const snapReport = readJson(files.expansionSnapReport);
const depthManifest = readJson(files.expansionDepthManifest);
const availability = readJson(files.availabilityQualification);

const availabilityResults = availability?.results ?? [];
const qualifiedAvailabilitySeasons =
  availability?.qualifiedSeasons ?? [];

const requiredExpansionFiles = [
  "expansionBase",
  "expansionBaseQuality",
  "expansionSnaps",
  "expansionSnapReport",
  "expansionDepth",
  "expansionDepthManifest",
  "availabilityQualification",
];

const missingExpansionFiles = requiredExpansionFiles
  .filter((key) => !exists(files[key]))
  .map((key) => ({ key, file: files[key] }));

const expansionEvidenceChecks = {
  baseObservationsPresent: expansionBase.length > 0,
  baseSeasons2020And2021:
    JSON.stringify(seasons(expansionBase, (r) => r?.season)) ===
    JSON.stringify([2020, 2021]),
  finalOutcomeCoverageComplete:
    Number(baseQuality?.finalOutcomeCount) === Number(baseQuality?.observationCount) &&
    Number(baseQuality?.observationCount) > 0,
  rosterCoverageComplete: Number(baseQuality?.rosterCoverageRate) === 1,
  snapIdentityCoverageAtLeast95:
    Number(snapReport?.totals?.exactResolutionRate) >= 0.95,
  snapRowReconciliation:
    snapReport?.totals?.rowReconciliationPassed === true,
  snapPostgameDependencyCandidate:
    snapReport?.dependencyReadiness?.qualifiedForPostgameDependencyCandidate === true,
  snapNotPregameReplacementEvidence:
    snapReport?.dependencyReadiness?.qualifiedForPregameReplacementDetermination === false,
  depthCanonicalIdentityComplete:
    Number(depthManifest?.canonicalIdentityCoverageRate) === 1,
  depthCandidateForRoleEvidence:
    depthManifest?.candidateForDepthRoleEvidence === true,
  depthNotTemporallyQualifiedForPregameProof:
    depthManifest?.pregameTemporalSafetyVerified === false,
  availability2020Qualified:
    qualifiedAvailabilitySeasons.includes(2020),
  availability2021Qualified:
    qualifiedAvailabilitySeasons.includes(2021),
  availabilityIdentityComplete:
    availabilityResults.length === 2 &&
    availabilityResults.every((r) => Number(r?.gsisCoverageRate) === 1),
  availabilityTemporalQualified:
    availabilityResults.length === 2 &&
    availabilityResults.every((r) => r?.temporalQualified === true),
};

const legacyChecks = {
  legacyObservationCorpusPresent: legacyObs.length > 0,
  legacyMatchedEffectsPresent: legacyEffects.length > 0,
  legacyUsageDependencyPresent: legacyUsage.length > 0,
  legacyReplacementCaliberPresent: legacyReplacements.length > 0,
  legacySeasons2022To2024:
    JSON.stringify(seasons(legacyObs)) === JSON.stringify([2022, 2023, 2024]),
};

const constructionGaps = {
  expansionAvailabilityJoinedObservations:
    !exists(`${EXPANSION}/availability/observations-availability.jsonl`),
  expansionPregameReplacementAnchorArtifact:
    !exists(`${EXPANSION}/replacement/pregame-temporal-anchors.jsonl`),
  expansionReplacementIdentityArtifact:
    !exists(`${EXPANSION}/replacement/expected-replacement-identities-v1.jsonl`),
  expansionCanonicalCaliberSnapshots:
    !exists(`${EXPANSION}/caliber/historical-player-caliber-snapshots-v1.jsonl`),
  expansionCaliberEnrichedReplacementPairs:
    !exists(`${EXPANSION}/replacement/expected-replacement-identities-caliber-enriched-v1.jsonl`),
  expansionCalibrationObservations:
    !exists(`${EXPANSION}/player-impact/historical-availability-impact-calibration-observations-v1.jsonl`),
  expansionMatchedEffects:
    !exists(`${EXPANSION}/player-impact/historical-availability-matched-att-effects-v1.jsonl`),
  expansionObservedUsageDependency:
    !exists(`${EXPANSION}/player-impact/historical-observed-usage-dependency-v1.jsonl`),
};

const nextRequiredArtifacts = Object.entries(constructionGaps)
  .filter(([, missing]) => missing)
  .map(([artifact]) => artifact);

const checks = {
  noMissingRequiredExpansionInputs: missingExpansionFiles.length === 0,
  ...legacyChecks,
  ...expansionEvidenceChecks,
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const constructionReady =
  failures.length === 0 &&
  nextRequiredArtifacts.length > 0;

const report = {
  contractVersion:
    "FIE-NFL-PLAYER-IMPACT-FIVE-SEASON-EXPANSION-READINESS-AUDIT-2D2A-1.0.0",
  sprint: "2D.2A",
  mode: "READ_ONLY_PREDECLARED_VALIDATION_READINESS",
  decision:
    failures.length
      ? "FIVE_SEASON_EXPANSION_INPUTS_NOT_READY"
      : nextRequiredArtifacts.length
        ? "FIVE_SEASON_FOUNDATION_READY_CONSTRUCT_EXPANSION_PLAYER_IMPACT_CHAIN"
        : "FIVE_SEASON_EXPANSION_PLAYER_IMPACT_CHAIN_ALREADY_PRESENT",
  predeclaredSpecification: {
    researchSeasons: [2020, 2021, 2022, 2023, 2024],
    legacyDevelopmentSeasons: [2022, 2023, 2024],
    frozenExternalValidationSeasons: [2020, 2021],
    externalValidationMayTuneSpecification: false,
    fiveSeasonCoverageTarget: true,
    newlyAddedSeasonsCountAsFutureChronologicalHoldout: false,
    futureChronologicalHoldoutSatisfied: false,
    consequence:
      "2020-2021 may falsify or externally validate the frozen 2022-2024 research specification. They do not satisfy a forward untouched chronological holdout gate.",
  },
  sourceEvidence: {
    legacy: {
      observations: legacyObs.length,
      observationSeasons: seasons(legacyObs),
      matchedEffects: legacyEffects.length,
      usageDependencyRecords: legacyUsage.length,
      replacementCaliberRecords: legacyReplacements.length,
    },
    expansion: {
      baseObservations: expansionBase.length,
      baseSeasons: seasons(expansionBase, (r) => r?.season),
      resolvedSnapRows: expansionSnaps.length,
      depthRows: expansionDepth.length,
      availabilityQualifiedSeasons: qualifiedAvailabilitySeasons,
      snapExactIdentityResolutionRate:
        snapReport?.totals?.exactResolutionRate ?? null,
      snapDependencyCandidate:
        snapReport?.dependencyReadiness?.qualifiedForPostgameDependencyCandidate ?? false,
    },
  },
  checks,
  failures,
  missingExpansionFiles,
  constructionGaps,
  nextRequiredArtifacts,
  readiness: {
    constructionReady,
    calibrationFitAuthorized: false,
    productionWeightFitAuthorized: false,
    teamStrengthPromotionAuthorized: false,
    pickemHandoffAuthorized: false,
  },
  pickemSprint2BValidationChecklist: {
    historicalBacktesting: "PENDING_FIVE_SEASON_CONSTRUCTION",
    expectedReplacement: "PENDING_2020_2021_EXPANSION",
    replacementCaliber: "PENDING_2020_2021_EXPANSION",
    availabilityImpact: "PENDING_2020_2021_EXPANSION",
    positionReplacementSensitivity: "PENDING_FIVE_SEASON_EFFECTS",
    dependencyUsage: "SOURCE_READY_2020_2021_CONSTRUCTION_PENDING",
    injuryAvailabilityCalibration: "SOURCE_QUALIFIED_2020_2021",
    performanceWindowCalibration: "PENDING_FIVE_SEASON_VALIDATION",
    opponentAdjustmentValidation: "PENDING_FIVE_SEASON_VALIDATION",
    seasonEraValidation: "PENDING_FIVE_SEASON_EFFECTS",
    holdoutValidation:
      "EXTERNAL_VALIDATION_2020_2021_PREDECLARED_FORWARD_UNTOUCHED_HOLDOUT_STILL_UNSATISFIED",
  },
  safeguards: {
    specificationRefitOn2020Or2021: false,
    externalValidationOutcomeUsedForThresholdTuning: false,
    calibrationExecuted: false,
    learnedWeightsCreated: false,
    playerImpactTeamStrengthMode: "SHADOW_ONLY",
    playerImpactTeamStrengthAuthorized: false,
    numericDelta: null,
    adjustedTeamStrength: null,
    teamStrengthMutated: false,
    decisionModelMutated: false,
    pickemMutated: false,
    independentPickemInjuryWeightsAllowed: false,
  },
};

console.log(JSON.stringify(report, null, 2));

if (failures.length) process.exitCode = 1;
