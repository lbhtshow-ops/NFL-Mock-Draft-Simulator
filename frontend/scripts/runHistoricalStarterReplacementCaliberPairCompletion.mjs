import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const data = path.join(root, "data/calibration/historical/v1");

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("node", [
  "./scripts/materializeHistoricalCanonicalPlayerCaliberSnapshots.mjs",
]);

run("node", [
  "./scripts/auditHistoricalStarterReplacementCaliberPairCoverage.mjs",
]);

run("python", [
  "./scripts/enrichHistoricalReplacementPairsWithCaliber.py",
  "--replacement-identities",
  "./data/calibration/historical/v1/expected-replacement-identities-v1.jsonl",
  "--caliber-snapshots",
  "./data/calibration/historical/v1/historical-player-caliber-snapshots-v1.jsonl",
  "--output",
  "./data/calibration/historical/v1/expected-replacement-identities-caliber-enriched-v1.jsonl",
  "--report",
  "./data/calibration/historical/v1/expected-replacement-identities-caliber-enriched-v1-report.json",
]);

const reportPath = path.join(
  data,
  "expected-replacement-identities-caliber-enriched-v1-report.json"
);

const report = fs.existsSync(reportPath)
  ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
  : null;

console.log(JSON.stringify({
  acceptance:
    "HISTORICAL_STARTER_REPLACEMENT_CALIBER_PAIR_COMPLETION",
  status:
    report &&
    report.replacementPairs > 0 &&
    report.caliberDeltaReadyPairs > 0
      ? "PASS"
      : "FAIL",
  report,
  interpretation: {
    calibrationExecuted: false,
    learnedWeightsCreated: false,
    readyForCalibrationObservationConstruction:
      Boolean(report?.caliberDeltaReadyPairs > 0),
  },
}, null, 2));

if (!report || !(report.caliberDeltaReadyPairs > 0)) {
  process.exitCode = 1;
}
