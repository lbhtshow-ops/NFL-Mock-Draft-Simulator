import fs from "node:fs";
import path from "node:path";
import {buildHistoricalAvailabilityMatchedATTEffect} from "./buildHistoricalAvailabilityMatchedATTEffect.mjs";
const DATA="./data/calibration/historical/v1";
const SOURCE=path.join(DATA,"historical-availability-matched-outcomes-v1.jsonl");
const OUTPUT=path.join(DATA,"historical-availability-matched-att-effects-v1.jsonl");
const REPORT=path.join(DATA,"historical-availability-matched-att-effects-v1-report.json");
function readJsonl(file){if(!fs.existsSync(file))return[];return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);}
const outcomeRows=readJsonl(SOURCE);
const {records,report}=buildHistoricalAvailabilityMatchedATTEffect({outcomeRows});
const executeWrite=process.argv.includes("--execute-write");
const finalReport={...report,mode:executeWrite?"EXECUTE_WRITE":"READ_ONLY",output:path.resolve(OUTPUT),report:path.resolve(REPORT)};
if(executeWrite){
  if(report?.readiness?.descriptiveATTEstimateConstructible!==true)throw new Error("Matched ATT effect dataset failed readiness; write prohibited.");
  fs.writeFileSync(OUTPUT,records.map(r=>JSON.stringify(r)).join("\n")+(records.length?"\n":""),"utf8");
  fs.writeFileSync(REPORT,JSON.stringify(finalReport,null,2)+"\n","utf8");
}
console.log(JSON.stringify(finalReport,null,2));
