
import {predictNFLCandidate} from "./NFLCandidateDecisionModels.js";
const eps=1e-15, clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function evaluateNFLCandidateModel({modelId,records=[],parameters={}}={}){
 if(!records.length) throw new Error("records are required");
 let correct=0,brier=0,ll=0,mae=0;
 const bins=Array.from({length:10},(_,i)=>({lower:i/10,upper:(i+1)/10,count:0,predicted:0,actual:0}));
 for(const r of records){
   const hm=Number(r?.outcome?.homeScore)-Number(r?.outcome?.awayScore), y=hm>0?1:0;
   const p=predictNFLCandidate(modelId,r,parameters), pr=clamp(p.homeWinProbability,eps,1-eps);
   if((pr>=.5?1:0)===y) correct++;
   brier+=(pr-y)**2; ll+=-(y*Math.log(pr)+(1-y)*Math.log(1-pr)); mae+=Math.abs(p.expectedHomeMargin-hm);
   const b=bins[Math.min(9,Math.floor(pr*10))]; b.count++; b.predicted+=pr; b.actual+=y;
 }
 return {modelId,status:"RESEARCH_ONLY",sampleSize:records.length,winnerAccuracy:correct/records.length,
 brierScore:brier/records.length,logLoss:ll/records.length,marginMAE:mae/records.length,
 calibrationBins:bins.filter(b=>b.count).map(b=>({...b,meanPredicted:b.predicted/b.count,observedHomeWinRate:b.actual/b.count}))};
}
