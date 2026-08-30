import { execFileSync } from "node:child_process";
import path from "node:path";

const MATCHING_AUDIT = path.resolve(
  "./scripts/auditHistoricalAvailabilityMatchingDesign.mjs"
);

const RULES = Object.freeze({
  minimumTreatedRetentionRate: 0.65,
  maximumAbsoluteSMD: 0.20,
  maximumMeanAbsoluteSMD: 0.10,
  minimumFeaturesAtOrBelowPoint10: 7,
  minimumFeaturesAtOrBelowPoint20: 10,
  minimumUniqueControlsUsed: 50,
  maximumControlReuse: 10,
  minimumSeasonRetentionRate: 0.50,
  minimumSideRetentionRate: 0.50,
  rankMustEqual: 1,
});

function finite(v) {
  return v !== null &&
    v !== undefined &&
    v !== "" &&
    Number.isFinite(Number(v));
}

function readMatchingDesignReport() {
  const stdout = execFileSync(
    process.execPath,
    [MATCHING_AUDIT],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

function retentionRate(entry) {
  const available = Number(entry?.available ?? entry?.treatedAvailable);
  const retained = Number(entry?.retained ?? entry?.treatedRetained);

  if (!Number.isFinite(available) || available <= 0 || !Number.isFinite(retained)) {
    return null;
  }

  return retained / available;
}

export function evaluateMatchingSpecificationSelection(report, rules = RULES) {
  const ranked = Array.isArray(report?.rankedSpecifications)
    ? report.rankedSpecifications
    : [];

  const candidate = ranked.find((row) => Number(row?.rank) === Number(rules.rankMustEqual)) ?? null;

  if (!candidate) {
    return {
      decision: "REJECTED_REQUIRES_REVIEW",
      reason: "RANK_1_SPECIFICATION_NOT_FOUND",
      candidate: null,
      checks: {},
    };
  }

  const seasonRates = Object.fromEntries(
    Object.entries(candidate?.bySeason ?? {}).map(([season, row]) => [
      season,
      retentionRate(row),
    ])
  );

  const sideRates = Object.fromEntries(
    Object.entries(candidate?.bySide ?? {}).map(([side, row]) => [
      side,
      retentionRate(row),
    ])
  );

  const checks = {
    rankIsOne:
      Number(candidate.rank) === Number(rules.rankMustEqual),

    retentionPass:
      finite(candidate?.treatedRetentionRate) &&
      Number(candidate.treatedRetentionRate) >= rules.minimumTreatedRetentionRate,

    maxSmdPass:
      finite(candidate?.balance?.maxAbsoluteSMD) &&
      Number(candidate.balance.maxAbsoluteSMD) <= rules.maximumAbsoluteSMD,

    meanSmdPass:
      finite(candidate?.balance?.meanAbsoluteSMD) &&
      Number(candidate.balance.meanAbsoluteSMD) <= rules.maximumMeanAbsoluteSMD,

    point10FeatureCountPass:
      finite(candidate?.balance?.featuresAtOrBelowPoint10) &&
      Number(candidate.balance.featuresAtOrBelowPoint10) >= rules.minimumFeaturesAtOrBelowPoint10,

    point20FeatureCountPass:
      finite(candidate?.balance?.featuresAtOrBelowPoint20) &&
      Number(candidate.balance.featuresAtOrBelowPoint20) >= rules.minimumFeaturesAtOrBelowPoint20,

    uniqueControlCountPass:
      finite(candidate?.uniqueControlsUsed) &&
      Number(candidate.uniqueControlsUsed) >= rules.minimumUniqueControlsUsed,

    reusePass:
      finite(candidate?.maximumControlReuse) &&
      Number(candidate.maximumControlReuse) <= rules.maximumControlReuse,

    seasonCoveragePass:
      Object.keys(seasonRates).length > 0 &&
      Object.values(seasonRates).every(
        (rate) => finite(rate) && Number(rate) >= rules.minimumSeasonRetentionRate
      ),

    sideCoveragePass:
      Object.keys(sideRates).length > 0 &&
      Object.values(sideRates).every(
        (rate) => finite(rate) && Number(rate) >= rules.minimumSideRetentionRate
      ),

    outcomeBlindRankingConfirmed:
      report?.selectionBoundary?.rankingUsesOutcome === false &&
      report?.safeguards?.outcomesNotReadForSelection === true,

    noPriorSelectionConfirmed:
      report?.selectionBoundary?.matchingSpecificationSelected === false,

    fittingStillLocked:
      report?.selectionBoundary?.fittingAuthorized === false,

    causalTargetStillLocked:
      report?.selectionBoundary?.causalTargetDefined === false,
  };

  const allChecksPass = Object.values(checks).every(Boolean);

  return {
    decision: allChecksPass
      ? "SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN"
      : "REJECTED_REQUIRES_REVIEW",

    reason: allChecksPass
      ? "RANK_1_PASSES_PREDECLARED_OUTCOME_BLIND_GOVERNANCE_GATES"
      : "ONE_OR_MORE_PREDECLARED_GOVERNANCE_GATES_FAILED",

    candidate: {
      rank: candidate.rank,
      specification: candidate.specification,
      treatedAvailable: candidate.treatedAvailable,
      treatedRetained: candidate.treatedRetained,
      treatedRetentionRate: candidate.treatedRetentionRate,
      treatedUnmatched: candidate.treatedUnmatched,
      uniqueControlsUsed: candidate.uniqueControlsUsed,
      maximumControlReuse: candidate.maximumControlReuse,
      controlsReusedMoreThanOnce: candidate.controlsReusedMoreThanOnce,
      distance: candidate.distance,
      balance: candidate.balance,
      bySeason: candidate.bySeason,
      bySide: candidate.bySide,
      seasonRetentionRates: seasonRates,
      sideRetentionRates: sideRates,
    },

    rules,
    checks,
  };
}

const report = readMatchingDesignReport();
const evaluation = evaluateMatchingSpecificationSelection(report, RULES);

const output = {
  contractVersion:
    "FIE-NFL-HISTORICAL-AVAILABILITY-MATCHING-SPECIFICATION-SELECTION-1.0.0",
  sprint: "2.18.14-RC1",
  mode: "READ_ONLY_GOVERNANCE_SELECTION",
  sourceMatchingDesign: {
    contractVersion: report?.contractVersion ?? null,
    sprint: report?.sprint ?? null,
    evaluatedSpecificationCount: report?.evaluatedSpecificationCount ?? null,
  },
  ...evaluation,
  authorizationBoundary: {
    selectedSpecificationMayAdvanceToCausalEstimandDesign:
      evaluation.decision === "SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN",

    matchedDatasetPersistenceAuthorized: false,
    outcomesAuthorizedForSpecificationSelection: false,
    causalEffectEstimationAuthorized: false,
    causalTargetDefined: false,
    learnedWeightsAuthorized: false,
    calibrationAuthorized: false,
    teamStrengthMutationAuthorized: false,
    decisionModelMutationAuthorized: false,
    pickemMutationAuthorized: false,
  },
  safeguards: {
    selectionUsesPregameBalanceOnly: true,
    matchingDesignAuditReexecutedReadOnly: true,
    outcomesReadForSelection: false,
    matchedDatasetPersisted: false,
    learnedWeightsCreated: false,
    calibrationExecuted: false,
    decisionModelMutated: false,
    teamStrengthMutated: false,
    pickemScoringMutated: false,
    databaseMutated: false,
  },
};

console.log(JSON.stringify(output, null, 2));

if (evaluation.decision !== "SELECTED_FOR_CAUSAL_ESTIMAND_DESIGN") {
  process.exitCode = 2;
}
