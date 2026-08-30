const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const sd=x=>{if(x.length<2)return 0;const m=mean(x);return Math.sqrt(x.reduce((s,v)=>s+(v-m)**2,0)/(x.length-1))};
export const DEFAULT_NFL_PROMOTION_POLICY=Object.freeze({minimumHoldoutSeasons:5,minimumAggregateAccuracyGain:.03,minimumSeasonsBeatingBaselineAccuracy:.70,minimumSeasonsBeatingBaselineBrier:.70,minimumSeasonsBeatingBaselineLogLoss:.70,maximumAccuracyGainStdDev:.06,requireDistinctCandidateBehavior:true});
export function summarizeCandidateAgainstBaseline(experiments,candidateId,baselineId="BASELINE_HOME_FIELD"){
 const rows=experiments.map(e=>{const b=e.candidates.find(c=>c.modelId===baselineId)?.holdout,c=e.candidates.find(c=>c.modelId===candidateId)?.holdout;if(!b||!c)return null;return{season:e.holdoutSeason,accuracyGain:c.winnerAccuracy-b.winnerAccuracy,brierGain:b.brierScore-c.brierScore,logLossGain:b.logLoss-c.logLoss,marginMAEGain:b.marginMAE-c.marginMAE}}).filter(Boolean);
 if(!rows.length)throw new Error("No comparable holdouts");
 const a=rows.map(r=>r.accuracyGain);
 return{candidateId,baselineId,holdoutSeasons:rows.length,rows,aggregate:{meanAccuracyGain:mean(a),accuracyGainStdDev:sd(a),seasonsBeatingBaselineAccuracy:rows.filter(r=>r.accuracyGain>0).length/rows.length,seasonsBeatingBaselineBrier:rows.filter(r=>r.brierGain>0).length/rows.length,seasonsBeatingBaselineLogLoss:rows.filter(r=>r.logLossGain>0).length/rows.length,seasonsBeatingBaselineMarginMAE:rows.filter(r=>r.marginMAEGain>0).length/rows.length}};
}
export function detectEmpiricallyIndistinguishableCandidates(experiments,tolerance=1e-12){
 const ids=[...new Set(experiments.flatMap(e=>e.candidates.map(c=>c.modelId)))].filter(x=>x!=="BASELINE_HOME_FIELD"),pairs=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){let n=0,same=true;for(const e of experiments){const a=e.candidates.find(c=>c.modelId===ids[i])?.holdout,b=e.candidates.find(c=>c.modelId===ids[j])?.holdout;if(!a||!b)continue;n++;for(const k of ["winnerAccuracy","brierScore","logLoss","marginMAE"])if(Math.abs(a[k]-b[k])>tolerance)same=false}if(n&&same)pairs.push({candidateA:ids[i],candidateB:ids[j],holdoutsCompared:n})}return pairs;
}
export function evaluateNFLDecisionModelPromotionGate({experiments=[],candidateId,policy=DEFAULT_NFL_PROMOTION_POLICY}={}){
 const summary=summarizeCandidateAgainstBaseline(experiments,candidateId),indistinguishable=detectEmpiricallyIndistinguishableCandidates(experiments).filter(p=>p.candidateA===candidateId||p.candidateB===candidateId),a=summary.aggregate;
 const checks=[["minimum-holdout-seasons",summary.holdoutSeasons>=policy.minimumHoldoutSeasons],["aggregate-accuracy-gain",a.meanAccuracyGain>=policy.minimumAggregateAccuracyGain],["seasonal-accuracy-consistency",a.seasonsBeatingBaselineAccuracy>=policy.minimumSeasonsBeatingBaselineAccuracy],["seasonal-brier-consistency",a.seasonsBeatingBaselineBrier>=policy.minimumSeasonsBeatingBaselineBrier],["seasonal-logloss-consistency",a.seasonsBeatingBaselineLogLoss>=policy.minimumSeasonsBeatingBaselineLogLoss],["accuracy-gain-stability",a.accuracyGainStdDev<=policy.maximumAccuracyGainStdDev],["empirical-distinctness",!policy.requireDistinctCandidateBehavior||!indistinguishable.length]].map(([name,passed])=>({name,passed}));
 const failed=checks.filter(x=>!x.passed);
 return{contract:"NFLDecisionModelPromotionGateResult",version:"1.0.0",candidateId,status:failed.length?"HOLD_RESEARCH_ONLY":"PROMOTION_ELIGIBLE",authoritative:false,automaticPromotion:false,summary,indistinguishable,checks,failedChecks:failed.map(x=>x.name),note:"Eligibility never grants production authority automatically."};
}
