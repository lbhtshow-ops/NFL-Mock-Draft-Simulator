import fs from "node:fs";

const FILE =
  "./data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl";

const rows = fs.existsSync(FILE)
  ? fs
      .readFileSync(FILE, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse)
  : [];

const reuse = new Map();

for (const row of rows) {
  reuse.set(
    row?.control?.key,
    (reuse.get(row?.control?.key) ?? 0) + 1
  );
}

const violations = {
  missingTreatedOutcome:
    rows.filter(
      (row) =>
        !Number.isFinite(
          Number(
            row?.treated?.outcome?.gamePerformanceResidual
          )
        )
    ).length,

  missingControlOutcome:
    rows.filter(
      (row) =>
        !Number.isFinite(
          Number(
            row?.control?.outcome?.gamePerformanceResidual
          )
        )
    ).length,

  treatedResidualNotReconciled:
    rows.filter(
      (row) =>
        row?.treated?.reconciliation
          ?.recomputedResidualMatchesSource !== true
    ).length,

  pairDifferencePresent:
    rows.filter(
      (row) =>
        row?.effect?.pairDifferenceComputed !== false ||
        row?.effect?.treatedMinusControlResidual !== null
    ).length,

  causalEffectEstimated:
    rows.filter(
      (row) =>
        row?.effect?.causalEffectEstimated !== false
    ).length,
};

console.log(
  JSON.stringify(
    {
      audit:
        "HISTORICAL_AVAILABILITY_MATCHED_OUTCOME_JOIN",
      mode: "READ_ONLY",

      records: rows.length,
      uniqueControls: reuse.size,
      maximumControlReuse:
        reuse.size
          ? Math.max(...reuse.values())
          : 0,

      violations,

      boundary: {
        outcomesJoined: rows.length > 0,
        pairDifferenceComputed: false,
        causalEffectEstimated: false,
        causalEffectEstimationAuthorized: false,
        uncertaintyEstimationAuthorized: false,
        calibrationAuthorized: false,
      },

      safeguards: {
        datasetMutated: false,
        learnedWeightsCreated: false,
        calibrationExecuted: false,
        teamStrengthMutated: false,
        decisionModelMutated: false,
        pickemScoringMutated: false,
      },
    },
    null,
    2
  )
);
