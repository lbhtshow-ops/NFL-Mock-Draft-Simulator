
import fs from "fs";
import path from "path";
import {pathToFileURL} from "url";
import {runNFLSeasonHoldoutExperiment} from "../src/engines/gameDecisionSupport/models/NFLCandidateModelExperiment.js";

const source=path.resolve("src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js");
const mod=await import(`${pathToFileURL(source).href}?t=${Date.now()}`);
const records=mod.default||[];
if(!records.length) throw new Error("Historical decision dataset is empty");

const seasons=[...new Set(records.map(r=>Number(r?.game?.season)).filter(Number.isFinite))].sort((a,b)=>a-b);
const experiments=seasons.slice(1).map(holdoutSeason=>runNFLSeasonHoldoutExperiment({
  records:records.filter(r=>Number(r?.game?.season)<=holdoutSeason),
  holdoutSeason
}));

const report={contract:"NFLCandidateDecisionModelEmpiricalReport",version:"1.0.0",status:"RESEARCH_ONLY",records:records.length,seasons,experiments};
const out=path.resolve("src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLCandidateDecisionModelEvaluation.json");
fs.writeFileSync(out,JSON.stringify(report,null,2),"utf8");

console.log(`Historical decision records: ${records.length}`);
console.log(`Seasons: ${seasons.join(", ")}`);
for(const e of experiments){
  console.log(`\nHoldout ${e.holdoutSeason} (${e.holdoutRecords} games)`);
  for(const c of e.candidates){
    const h=c.holdout;
    console.log(`${c.modelId}: accuracy=${(h.winnerAccuracy*100).toFixed(2)}% brier=${h.brierScore.toFixed(4)} logloss=${h.logLoss.toFixed(4)} marginMAE=${h.marginMAE.toFixed(3)}`);
  }
}
console.log(`\nWrote research-only evaluation report to:\n${out}`);
