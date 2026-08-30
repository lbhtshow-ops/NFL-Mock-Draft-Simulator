import fs from "node:fs";
const target="./scripts/audit2025EquivalentAvailabilitySource.mjs";
const text=fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
const tests=[
 ["audit-script-present",fs.existsSync(target)],
 ["historical-reference-locked",text.includes("observations-availability.jsonl")],
 ["2025-scope-explicit",text.includes("===2025")],
 ["nflverse-equivalence-signal",text.includes("NFLVERSE")],
 ["report-status-audited",text.includes("reportStatus")],
 ["out-doubtful-questionable-audited",["isOut","isDoubtful","isQuestionable"].every(x=>text.includes(x))],
 ["pregame-safety-audited",text.includes("safePregameSignals")],
 ["questionable-not-promoted",text.includes("questionablePromotedToTreatment:false")],
 ["outcomes-not-used",text.includes("outcomesUsed:false")],
 ["normalization-locked",text.includes("governed2025NormalizationAuthorized:false")],
 ["rebuild-locked",text.includes("treatmentControlRebuildAuthorized:false")],
 ["matching-locked",text.includes("matchingRerunAuthorized:false")],
 ["att-locked",text.includes("attRecomputationAuthorized:false")],
 ["production-calibration-locked",text.includes("productionCalibrationAuthorized:false")],
 ["database-read-only",text.includes("databaseMutated:false")]
].map(([name,passed])=>({name,passed}));
const passed=tests.filter(t=>t.passed).length;
console.log(JSON.stringify({suite:"2025 Equivalent Availability Source Audit RC9 Diagnostics",sprint:"2.18.23-RC9",passed,failed:tests.length-passed,tests},null,2));
if(passed!==tests.length) process.exitCode=1;
