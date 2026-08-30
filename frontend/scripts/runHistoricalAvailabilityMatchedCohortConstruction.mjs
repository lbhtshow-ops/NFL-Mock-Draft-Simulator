import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildHistoricalAvailabilityMatchedCohort } from "./buildHistoricalAvailabilityMatchedCohort.mjs";

const DATA="./data/calibration/historical/v1";
const COHORT=path.join(DATA,"historical-availability-control-cohort-v1.jsonl");
const OUTPUT=path.join(DATA,"historical-availability-matched-cohort-v1.jsonl");
const REPORT=path.join(DATA,"historical-availability-matched-cohort-v1-report.json");

function readJsonl(file){
  if(!fs.existsSync(file))return[];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
function runJson(script){
  return JSON.parse(execFileSync(process.execPath,[path.resolve(script)],{
    cwd:process.cwd(),encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024
  }));
}

const selector=runJson("./scripts/selectHistoricalAvailabilityMatchingSpecification.mjs");
const estimand=runJson("./scripts/defineHistoricalAvailabilityCausalEstimand.mjs");
const cohortRows=readJsonl(COHORT);

const {pairs,report}=buildHistoricalAvailabilityMatchedCohort({
  cohortRows,selectorReport:selector,estimandReport:estimand
});

const executeWrite=process.argv.includes("--execute-write");
const finalReport={
  ...report,
  mode:executeWrite?"EXECUTE_WRITE":"READ_ONLY",
  output:path.resolve(OUTPUT),
  report:path.resolve(REPORT)
};

if(executeWrite){
  if(report?.readiness?.matchedCohortConstructible!==true){
    throw new Error("Matched cohort failed construction readiness; write prohibited.");
  }
  fs.writeFileSync(OUTPUT,pairs.map(p=>JSON.stringify(p)).join("\n")+(pairs.length?"\n":""),"utf8");
  fs.writeFileSync(REPORT,JSON.stringify(finalReport,null,2)+"\n","utf8");
}

console.log(JSON.stringify(finalReport,null,2));
