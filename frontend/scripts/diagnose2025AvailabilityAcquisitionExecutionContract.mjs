import fs from "node:fs";
import path from "node:path";

const target =
  path.join(process.cwd(),
    "scripts",
    "define2025AvailabilityAcquisitionExecutionContract.mjs"
  );

const text =
  fs.existsSync(target)
    ? fs.readFileSync(target,"utf8")
    : "";

const tests = [
  ["contract-script-present",fs.existsSync(target)],
  ["season-2025-locked",/season:\s*TARGET_SEASON/.test(text)],
  ["provider-nflverse-locked",/provider:\s*"nflverse"/.test(text)],
  ["dataset-injuries-locked",/dataset:\s*"injuries"/.test(text)],
  ["csv-url-locked",text.includes("injuries_2025.csv")],
  ["csv-gz-url-locked",text.includes("injuries_2025.csv.gz")],

  ["player-id-required",text.includes('"playerId"')],
  ["report-status-required",text.includes('"reportStatus"')],
  ["practice-status-required",text.includes('"practiceStatus"')],
  ["primary-injury-required",text.includes('"primaryInjury"')],
  ["date-modified-required",text.includes('"dateModified"')],

  ["out-treatment",text.includes('"OUT"')],
  ["doubtful-treatment",text.includes('"DOUBTFUL"')],
  ["questionable-not-treatment",
    text.includes("questionableAloneIsTreatment: false")],

  ["roster-substitution-prohibited",
    text.includes("rosterStatusMaySubstituteForReportStatus: false")],

  ["latest-safe-player-week-report-locked",
    text.includes('joinPolicy: "LATEST_SAFE_PLAYER_WEEK_REPORT"')],

  ["late-report-prohibited",
    text.includes("prohibitReportsAfterCutoff: true")],

  ["fail-closed-cutoff",
    text.includes('"FAIL_CLOSED_NULL_AVAILABILITY"')],

  ["external-fetch-still-locked",
    text.includes("externalFetchAuthorized: false")],

  ["normalization-still-locked",
    text.includes("normalization: false")],

  ["matching-still-locked",
    text.includes("matching: false")],

  ["att-still-locked",
    text.includes("attEstimation: false")],

  ["calibration-still-locked",
    text.includes("calibration: false")],

  ["pickem-still-locked",
    text.includes("pickemMutation: false")],

  ["database-read-only",
    text.includes("databaseWriteAuthorized: false")]
].map(([name,passed])=>({name,passed}));

const passed =
  tests.filter(t=>t.passed).length;

const failed =
  tests.length-passed;

console.log(JSON.stringify({
  suite:
    "2025 Availability Acquisition Execution Contract RC12 Diagnostics",
  sprint:"2.18.23-RC12",
  passed,
  failed,
  tests
},null,2));

if(failed){
  process.exitCode=1;
}
