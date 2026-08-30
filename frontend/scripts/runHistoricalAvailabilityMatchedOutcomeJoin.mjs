import fs from "node:fs";
import path from "node:path";
import {
  buildHistoricalAvailabilityMatchedOutcomeJoin
} from "./buildHistoricalAvailabilityMatchedOutcomeJoin.mjs";

const DATA = "./data/calibration/historical/v1";

const MATCHED = path.join(
  DATA,
  "historical-availability-matched-cohort-v1.jsonl"
);

const TREATED_RESIDUALS = path.join(
  DATA,
  "historical-availability-impact-baseline-residuals-v1.jsonl"
);

const OUTPUT = path.join(
  DATA,
  "historical-availability-matched-outcomes-v1.jsonl"
);

const REPORT = path.join(
  DATA,
  "historical-availability-matched-outcomes-v1-report.json"
);

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];

  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);
}

const matchedPairs = readJsonl(MATCHED);
const treatedResidualRows = readJsonl(TREATED_RESIDUALS);

const { records, report } =
  buildHistoricalAvailabilityMatchedOutcomeJoin({
    matchedPairs,
    treatedResidualRows,
  });

const executeWrite =
  process.argv.includes("--execute-write");

const finalReport = {
  ...report,
  mode: executeWrite ? "EXECUTE_WRITE" : "READ_ONLY",
  output: path.resolve(OUTPUT),
  report: path.resolve(REPORT),
};

if (executeWrite) {
  if (
    report?.readiness?.outcomeJoinedCohortConstructible !== true
  ) {
    throw new Error(
      "Outcome-joined cohort failed readiness; write prohibited."
    );
  }

  fs.writeFileSync(
    OUTPUT,
    records.map((row) => JSON.stringify(row)).join("\n") +
      (records.length ? "\n" : ""),
    "utf8"
  );

  fs.writeFileSync(
    REPORT,
    JSON.stringify(finalReport, null, 2) + "\n",
    "utf8"
  );
}

console.log(JSON.stringify(finalReport, null, 2));
