import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {buildHistoricalAvailabilityMatchedATTUncertainty} from "./buildHistoricalAvailabilityMatchedATTUncertainty.mjs";

const DATA="./data/calibration/historical/v1";
const SOURCE=path.join(DATA,"historical-availability-matched-att-effects-v1.jsonl");
const REPORT=path.join(DATA,"historical-availability-matched-att-uncertainty-v1-report.json");

function readJsonl(file){
  if(!fs.existsSync(file))return[];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
function runJson(script){
  return JSON.parse(execFileSync(process.execPath,[path.resolve(script)],{
    cwd:process.cwd(),encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024
  }));
}

const effectRows=readJsonl(SOURCE);
const designReport=runJson("./scripts/defineHistoricalAvailabilityUncertaintyDesign.mjs");

const report=buildHistoricalAvailabilityMatchedATTUncertainty({
  effectRows,
  designReport
});

const executeWrite=process.argv.includes("--execute-write");
const finalReport={
  ...report,
  mode:executeWrite?"EXECUTE_WRITE":"READ_ONLY",
  report:path.resolve(REPORT)
};

if(executeWrite){
  if(report?.readiness?.uncertaintyExecutionComplete!==true){
    throw new Error("Uncertainty execution failed readiness; write prohibited.");
  }
  fs.writeFileSync(REPORT,JSON.stringify(finalReport,null,2)+"\n","utf8");
}

console.log(JSON.stringify(finalReport,null,2));
