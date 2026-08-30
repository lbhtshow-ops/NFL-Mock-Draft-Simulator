import {
  generatedNFLHistoricalPregameSnapshots as snapshots
} from "../../data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalPregameSnapshots.js";

import {
  assessNFLProtectionPressureEvidence,
} from "../teamIntelligence/performance/protectionPressure/NFLProtectionPressureEvidenceContract.js";

import {
  buildNFLProtectionPressureHistoricalEvidenceIndex,
} from "../teamIntelligence/performance/protectionPressure/NFLHistoricalProtectionPressureSnapshotAdapter.js";

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function uniqueFinite(values) {
  return new Set(
    values.filter(finite)
      .map(value => value.toFixed(12))
  ).size;
}

function mean(values) {
  const finiteValues = values.filter(finite);
  return finiteValues.length
    ? finiteValues.reduce(
        (sum, value) => sum + value,
        0
      ) / finiteValues.length
    : null;
}

if (!Array.isArray(snapshots) || snapshots.length === 0) {
  throw new Error(
    "STOP: Historical pregame snapshots unavailable."
  );
}

console.log(
  "\n=================================================="
);
console.log(
  "GI-V2 SPRINT 3 — GATE 2A"
);
console.log(
  "PROTECTION / PRESSURE HISTORICAL SHADOW EVIDENCE"
);
console.log(
  "=================================================="
);
console.log("READ ONLY");
console.log("SHADOW ONLY");

const evidenceRecords =
  buildNFLProtectionPressureHistoricalEvidenceIndex(
    snapshots
  );

const assessments =
  evidenceRecords.map(
    assessNFLProtectionPressureEvidence
  );

const complete =
  assessments.filter(
    result => result.complete
  );

const incomplete =
  assessments.filter(
    result => !result.complete
  );

const offenseRates =
  evidenceRecords.map(
    record =>
      record.offense.pressureAllowedRate
  );

const offenseSackRates =
  evidenceRecords.map(
    record =>
      record.offense.sackAllowedRate
  );

const defenseRates =
  evidenceRecords.map(
    record =>
      record.defense.pressureGeneratedRate
  );

const defenseSackRates =
  evidenceRecords.map(
    record =>
      record.defense.sackGeneratedRate
  );

const offensiveDropbacks =
  evidenceRecords.map(
    record =>
      record.sample.offensiveDropbacks
  );

const defensiveDropbacks =
  evidenceRecords.map(
    record =>
      record.sample.defensiveDropbacks
  );

console.log(
  "\n=== SHADOW COVERAGE ==="
);

console.table([
  {
    snapshots:
      snapshots.length,

    extractedEvidenceRecords:
      evidenceRecords.length,

    complete:
      complete.length,

    incomplete:
      incomplete.length,

    completePct:
      evidenceRecords.length
        ? Number(
            (
              complete.length /
              evidenceRecords.length *
              100
            ).toFixed(2)
          )
        : 0,
  }
]);

console.log(
  "\n=== RATE VARIATION ==="
);

console.table([
  {
    metric:
      "pressureAllowedRate",

    uniqueValues:
      uniqueFinite(offenseRates),

    mean:
      mean(offenseRates),
  },

  {
    metric:
      "sackAllowedRate",

    uniqueValues:
      uniqueFinite(offenseSackRates),

    mean:
      mean(offenseSackRates),
  },

  {
    metric:
      "pressureGeneratedRate",

    uniqueValues:
      uniqueFinite(defenseRates),

    mean:
      mean(defenseRates),
  },

  {
    metric:
      "sackGeneratedRate",

    uniqueValues:
      uniqueFinite(defenseSackRates),

    mean:
      mean(defenseSackRates),
  }
]);

console.log(
  "\n=== SAMPLE MATURITY ==="
);

console.table([
  {
    metric:
      "offensiveDropbacks",

    populated:
      offensiveDropbacks.filter(
        value =>
          Number.isInteger(value) &&
          value >= 0
      ).length,

    mean:
      mean(offensiveDropbacks),
  },

  {
    metric:
      "defensiveDropbacks",

    populated:
      defensiveDropbacks.filter(
        value =>
          Number.isInteger(value) &&
          value >= 0
      ).length,

    mean:
      mean(defensiveDropbacks),
  }
]);

console.log(
  "\n=== SAMPLE EVIDENCE RECORDS ==="
);

console.table(
  evidenceRecords.slice(0, 20).map(
    record => ({
      team:
        record.team,

      season:
        record.season,

      throughWeek:
        record.throughWeek,

      offensiveDropbacks:
        record.sample.offensiveDropbacks,

      defensiveDropbacks:
        record.sample.defensiveDropbacks,

      pressureAllowedRate:
        record.offense.pressureAllowedRate,

      sackAllowedRate:
        record.offense.sackAllowedRate,

      pressureGeneratedRate:
        record.defense.pressureGeneratedRate,

      sackGeneratedRate:
        record.defense.sackGeneratedRate,
    })
  )
);

console.log(
  "\n=== GOVERNANCE ASSERTIONS ==="
);

const observedVariation =
  uniqueFinite(offenseRates) > 1 &&
  uniqueFinite(defenseRates) > 1;

const hasCompleteEvidence =
  complete.length > 0;

const noProductionAuthority =
  assessments.every(
    result =>
      result.scoreAuthorityGranted === false &&
      result.evidenceQualityAuthorityGranted === false &&
      result.productionAuthorityGranted === false
  );

console.log({
  observedVariation,
  hasCompleteEvidence,
  noProductionAuthority,
});

if (!observedVariation) {
  throw new Error(
    "STOP: Protection/Pressure shadow evidence does not demonstrate historical variation."
  );
}

if (!hasCompleteEvidence) {
  throw new Error(
    "STOP: No complete historical Protection/Pressure evidence was extracted."
  );
}

if (!noProductionAuthority) {
  throw new Error(
    "STOP: Shadow evidence unexpectedly granted production authority."
  );
}

console.log(
  "\nPASS: Historical Protection/Pressure evidence exists with real variation."
);

console.log(
  "PASS: Shadow contract preserves zero production authority."
);

console.log(
  "\nNo Protection/Pressure matchup score was created."
);

console.log(
  "No Matchup Edge was recalculated."
);

console.log(
  "No Evidence Quality value was recalculated."
);

console.log(
  "No Decision Model output was modified."
);

console.log(
  "\n=================================================="
);
console.log(
  "GI-V2 SPRINT 3 — GATE 2A COMPLETE"
);
console.log(
  "EVIDENCE FOUNDATION ONLY"
);
console.log(
  "NO MATCHUP SCORE AUTHORITY"
);
console.log(
  "NO MODEL CHANGE"
);
console.log(
  "NO WEIGHT CHANGE"
);
console.log(
  "NO EVIDENCE QUALITY CHANGE"
);
console.log(
  "NO PLAYER IMPACT CHANGE"
);
console.log(
  "NO PRODUCTION CHANGE"
);
console.log(
  "=================================================="
);
