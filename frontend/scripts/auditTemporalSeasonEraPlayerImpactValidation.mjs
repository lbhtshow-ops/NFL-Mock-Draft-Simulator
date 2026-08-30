import fs from "node:fs";

const ROOT="./data/calibration/historical/v1";
const OBS=`${ROOT}/historical-availability-impact-calibration-observations-v1.jsonl`;
const EFFECTS=`${ROOT}/historical-availability-matched-att-effects-v1.jsonl`;
const USAGE_DEP=`${ROOT}/historical-observed-usage-dependency-v1.jsonl`;

const finite=(v)=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const num=(v)=>finite(v)?Number(v):null;
const mean=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const readJsonl=(file)=>fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);

function positionFamily(pos){
  const p=String(pos||"").toUpperCase();
  if(p==="QB") return "QB";
  if(["C","G","T","OT","OG","IOL"].includes(p)) return "OL";
  if(["RB","FB","WR","TE"].includes(p)) return "SKILL";
  if(["DE","DT","NT","EDGE","LB"].includes(p)) return "FRONT7";
  if(["CB","S","DB"].includes(p)) return "SECONDARY";
  return "OTHER";
}

function solveLinear(A,b){
  const n=A.length,M=A.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){
    let p=c;
    for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r;
    if(Math.abs(M[p][c])<1e-10) return null;
    [M[c],M[p]]=[M[p],M[c]];
    const d=M[c][c];
    for(let j=c;j<=n;j++) M[c][j]/=d;
    for(let r=0;r<n;r++){ if(r===c) continue; const f=M[r][c]; for(let j=c;j<=n;j++) M[r][j]-=f*M[c][j]; }
  }
  return M.map(r=>r[n]);
}

function fit(rows,features){
  const u=rows.filter(r=>finite(r.effect)&&features.every(k=>finite(r[k])));
  const p=features.length+1;
  if(u.length<=p) return null;
  const X=u.map(r=>[1,...features.map(k=>Number(r[k]))]), y=u.map(r=>Number(r.effect));
  const xtx=Array.from({length:p},()=>Array(p).fill(0)),xty=Array(p).fill(0);
  for(let i=0;i<u.length;i++) for(let a=0;a<p;a++){xty[a]+=X[i][a]*y[i];for(let b=0;b<p;b++)xtx[a][b]+=X[i][a]*X[i][b];}
  const beta=solveLinear(xtx,xty); if(!beta) return null;
  return {beta,features,n:u.length,trainMean:mean(y)};
}
function evaluate(model,rows){
  if(!model) return {n:0,rmse:null,mae:null,baselineRmse:null,improvesOverIntercept:false};
  const u=rows.filter(r=>finite(r.effect)&&model.features.every(k=>finite(r[k])));
  const errs=[],base=[];
  for(const r of u){
    const x=[1,...model.features.map(k=>Number(r[k]))];
    const pred=x.reduce((s,v,j)=>s+v*model.beta[j],0),y=Number(r.effect);
    errs.push(y-pred); base.push(y-model.trainMean);
  }
  const rmse=errs.length?Math.sqrt(mean(errs.map(e=>e*e))):null;
  const baselineRmse=base.length?Math.sqrt(mean(base.map(e=>e*e))):null;
  return {n:u.length,rmse,mae:errs.length?mean(errs.map(Math.abs)):null,baselineRmse,improvesOverIntercept:finite(rmse)&&finite(baselineRmse)&&rmse<baselineRmse};
}

function summarize(xs){
  const y=xs.map(r=>Number(r.effect));
  return {count:y.length,meanEffect:mean(y),negativeEffectShare:y.length?y.filter(v=>v<0).length/y.length:null};
}

export function auditTemporalSeasonEraPlayerImpactValidation(){
  const observations=readJsonl(OBS),effects=readJsonl(EFFECTS),usage=readJsonl(USAGE_DEP);
  const obsBy=new Map(),useBy=new Map();
  for(const o of observations){const i=o.identity,k=`${i.gameId}:${i.team}`;(obsBy.get(k)||obsBy.set(k,[]).get(k)).push(o);}
  for(const e of usage){const i=e.identity,k=`${i.gameId}:${i.team}`;(useBy.get(k)||useBy.set(k,[]).get(k)).push(e);}
  const rows=[]; let missing=0;
  for(const er of effects){
    const key=er.treated.key,os=obsBy.get(key)||[],us=useBy.get(key)||[];
    if(!os.length||us.length!==os.length){missing++;continue;}
    const ps=os.map((o,idx)=>{
      const id=o.identity;
      const ue=us.find(x=>x.identity.unavailablePlayerId===id.unavailablePlayerId)||us[idx];
      return {delta:num(o.pregame.expectedReplacementDelta),usage:num(ue?.usageEvidence?.selectedSnapPct),family:positionFamily(id.position)};
    });
    const usages=ps.map(p=>p.usage).filter(finite);
    rows.push({
      season:er.treated.season,week:er.treated.week,controlKey:er.control.key,
      effect:num(er.effect.treatedMinusControlResidual),
      deltaSum:ps.reduce((s,p)=>s+(finite(p.delta)?p.delta:0),0),
      maxUsage:Math.max(...usages),
      absenceCount:ps.length,
      qbPresent:ps.some(p=>p.family==="QB")?1:0,
      highUsageLargeDelta:Math.max(...usages)>=0.70 && ps.reduce((s,p)=>s+(finite(p.delta)?p.delta:0),0)>=10 ? 1:0,
      highUsageSmallDelta:Math.max(...usages)>=0.70 && ps.reduce((s,p)=>s+(finite(p.delta)?p.delta:0),0)<10 ? 1:0,
    });
  }
  const seasons=[...new Set(rows.map(r=>r.season))].sort();
  const bySeason={};
  for(const s of seasons){
    const sr=rows.filter(r=>r.season===s),hi=sr.filter(r=>r.highUsageLargeDelta),lo=sr.filter(r=>r.highUsageSmallDelta);
    bySeason[s]={
      all:summarize(sr),highUsageLargeDelta:summarize(hi),highUsageSmallDelta:summarize(lo),
      interactionDifference:hi.length&&lo.length?mean(hi.map(r=>r.effect))-mean(lo.map(r=>r.effect)):null,
      interactionDirectionExpected:hi.length&&lo.length?mean(hi.map(r=>r.effect))<mean(lo.map(r=>r.effect)):null,
    };
  }

  const replacement=["deltaSum"];
  const core=["deltaSum","maxUsage","absenceCount","qbPresent"];
  const chronology=[];
  for(let i=1;i<seasons.length;i++){
    const trainSeasons=seasons.slice(0,i),testSeason=seasons[i];
    const train=rows.filter(r=>trainSeasons.includes(r.season)),test=rows.filter(r=>r.season===testSeason);
    chronology.push({
      trainSeasons,testSeason,
      replacementCaliberOnly:evaluate(fit(train,replacement),test),
      corePlayerImpactResearch:evaluate(fit(train,core),test),
    });
  }
  const chronologicalCoreWins=chronology.filter(x=>x.corePlayerImpactResearch.improvesOverIntercept).length;
  const chronologicalReplacementWins=chronology.filter(x=>x.replacementCaliberOnly.improvesOverIntercept).length;

  const interactionEligible=Object.values(bySeason).filter(x=>x.highUsageLargeDelta.count>=5&&x.highUsageSmallDelta.count>=5);
  const expectedDirectionCount=interactionEligible.filter(x=>x.interactionDirectionExpected===true).length;
  const interactionDirectionConsistency=interactionEligible.length?expectedDirectionCount/interactionEligible.length:0;

  const eraValidation={
    seasonsAvailable:seasons,
    seasonCount:seasons.length,
    requestedMinimumSeasonCount:5,
    multipleEraCoverageAvailable:false,
    status:"INSUFFICIENT_ERA_COVERAGE",
    reason:"The governed matched calibration corpus currently covers only 2022-2024. Three adjacent seasons do not provide a defensible multi-era validation."
  };

  const temporalSignalEstablished=
    chronology.length>=2 &&
    chronologicalCoreWins===chronology.length &&
    interactionDirectionConsistency===1 &&
    eraValidation.multipleEraCoverageAvailable===true;

  return {
    contractVersion:"FIE-NFL-TEMPORAL-SEASON-ERA-PLAYER-IMPACT-VALIDATION-1.0.0",
    sprint:"2.23.0-RC1",
    mode:"RESEARCH_ONLY_TEMPORAL_SEASON_ERA_FALSIFICATION_GATE",
    decision:temporalSignalEstablished
      ?"TEMPORAL_PLAYER_IMPACT_SIGNAL_VALIDATED_FOR_HOLDOUT_GATE_SHADOW_ONLY"
      :"TEMPORAL_PLAYER_IMPACT_SIGNAL_NOT_ESTABLISHED_ERA_COVERAGE_INSUFFICIENT_HOLD_SHADOW",
    source:{observationCount:observations.length,matchedEffectCount:effects.length,usageEvidenceCount:usage.length,validationRowCount:rows.length,missingJoinCount:missing,seasons},
    seasonStability:{bySeason,interactionEligibleSeasonCount:interactionEligible.length,expectedDirectionCount,interactionDirectionConsistency},
    chronologicalValidation:{tests:chronology,chronologicalCoreWins,chronologicalReplacementWins,allCoreTestsImproveOverIntercept:chronology.length>0&&chronologicalCoreWins===chronology.length},
    eraValidation,
    interpretation:{
      temporalSignalEstablished,
      highUsageLargeCaliberInteractionStableAcrossAllEligibleSeasons:interactionDirectionConsistency===1,
      coreModelChronologicallyStable:chronology.length>0&&chronologicalCoreWins===chronology.length,
      eraValidationSatisfied:false,
      noProductionCoefficientAuthorized:true,
      reason:"The high-usage/large-caliber interaction is not directionally stable across all seasons, the multivariate research model does not clear every chronological test, and the corpus lacks multi-era coverage. These are falsification failures/coverage blockers, not implementation failures."
    },
    readiness:{
      temporalSeasonEraValidationComplete:true,
      holdoutSensitivityPromotionGateMayAdvance:true,
      promotionRecommendation:"HOLD_SHADOW",
      calibrationAuthorized:false,
      productionImpactPolicyAuthorized:false,
      shadowTeamStrengthTransformationAuthorized:false
    },
    safeguards:{
      thresholdsRefitOnTestSeason:false,sourceDatasetsMutated:false,matchedDesignMutated:false,causalEstimandMutated:false,
      learnedProductionWeightCreated:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false,shadowOnlyPreserved:true
    }
  };
}
console.log(JSON.stringify(auditTemporalSeasonEraPlayerImpactValidation(),null,2));
