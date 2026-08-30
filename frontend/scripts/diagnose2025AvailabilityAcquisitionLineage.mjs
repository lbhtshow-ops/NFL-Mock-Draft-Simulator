import fs from "node:fs";
const target="./scripts/audit2025AvailabilityAcquisitionLineage.mjs";
const text=fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";

const tests=[
  ["audit-script-present",fs.existsSync(target)],
  ["nflverse-injury-token",text.includes("NFLVERSE_INJURIES")],
  ["latest-safe-join-token",text.includes("LATEST_SAFE_PLAYER_WEEK_REPORT")],
  ["availability-output-token",text.includes("observations-availability.jsonl")],
  ["availability-impact-token",text.includes("availabilityImpact")],
  ["report-status-token",text.includes("reportStatus")],
  ["out-doubtful-questionable-token",["isOut","isDoubtful","isQuestionable"].every(x=>text.includes(x))],
  ["external-fetch-prohibited",text.includes("externalFetchAuthorized:false")],
  ["2025-acquisition-execution-locked",text.includes('"2025AcquisitionExecutionAuthorized":false')],
  ["2025-normalization-locked",text.includes('"2025NormalizationAuthorized":false')],
  ["treatment-rebuild-locked",text.includes("treatmentControlRebuildAuthorized:false")],
  ["matching-locked",text.includes("matchingRerunAuthorized:false")],
  ["att-locked",text.includes("attRecomputationAuthorized:false")],
  ["production-calibration-locked",text.includes("productionCalibrationAuthorized:false")],
  ["database-read-only",text.includes("databaseMutated:false")]
].map(([name,passed])=>({name,passed}));

const passed=tests.filter(t=>t.passed).length;
console.log(JSON.stringify({
  suite:"2025 Availability Acquisition Lineage RC10 Diagnostics",
  sprint:"2.18.23-RC10",
  passed,
  failed:tests.length-passed,
  tests
},null,2));
if(passed!==tests.length) process.exitCode=1;
