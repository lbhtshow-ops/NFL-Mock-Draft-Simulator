import fs from "node:fs";

const files = [
  "data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl",
  "data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl",
  "data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl",
  "data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl",
  "data/calibration/historical/v1/historical-availability-matched-outcomes-v1.jsonl",
  "data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-outcomes-2020-2021-v1.jsonl",
];

const report = files.map(path => ({
  path,
  exists: fs.existsSync(path),
  bytes: fs.existsSync(path) ? fs.statSync(path).size : null,
}));

const passed = report.every(x => x.exists);

console.log(JSON.stringify({
  contractVersion: "FIE-NFL-PLAYER-IMPACT-VALIDATION-JOIN-PREFLIGHT-2D4-R2-1.0.0",
  sprint: "2D.4-R2",
  decision: passed ? "JOIN_RECOVERY_INPUTS_PRESENT" : "JOIN_RECOVERY_INPUTS_MISSING",
  correctedExpansionObservationArtifact:
    "data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl",
  files: report,
  safeguards: {
    filesMutated: false,
    candidateRetuned: false,
    historicalConstructionReopened: false,
  }
}, null, 2));

if (!passed) process.exitCode = 2;
