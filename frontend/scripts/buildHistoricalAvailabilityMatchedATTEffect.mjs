const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const n=v=>Number(v);
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function median(xs){if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function percentile(xs,p){if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b);const i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);}
function summarizeEffects(rows){
  const effects=rows.map(r=>r?.effect?.treatedMinusControlResidual).filter(finite).map(n);
  const negative=effects.filter(v=>v<0).length,positive=effects.filter(v=>v>0).length,zero=effects.filter(v=>v===0).length;
  return {records:rows.length,usableEffects:effects.length,meanEffect:mean(effects),medianEffect:median(effects),
    minEffect:effects.length?Math.min(...effects):null,p10Effect:percentile(effects,.10),p25Effect:percentile(effects,.25),
    p75Effect:percentile(effects,.75),p90Effect:percentile(effects,.90),maxEffect:effects.length?Math.max(...effects):null,
    negativeEffectCount:negative,zeroEffectCount:zero,positiveEffectCount:positive,
    negativeEffectShare:effects.length?negative/effects.length:null,positiveEffectShare:effects.length?positive/effects.length:null};
}
export function buildHistoricalAvailabilityMatchedATTEffect({outcomeRows=[]}={}){
  const effects=[];let invalidOutcomeCount=0,pairWeightViolationCount=0,pairDifferenceAlreadyPresentCount=0,orientationMismatchCount=0;
  for(const row of outcomeRows){
    const tr=row?.treated?.outcome?.gamePerformanceResidual,cr=row?.control?.outcome?.gamePerformanceResidual;
    if(!finite(tr)||!finite(cr)){invalidOutcomeCount++;continue;}
    if(row?.pairWeight!==1){pairWeightViolationCount++;continue;}
    if(row?.effect?.pairDifferenceComputed!==false||row?.effect?.treatedMinusControlResidual!==null){pairDifferenceAlreadyPresentCount++;continue;}
    if(row?.estimand?.orientation!=="TREATED_MINUS_MATCHED_CONTROL"){orientationMismatchCount++;continue;}
    const pairEffect=n(tr)-n(cr);
    effects.push(Object.freeze({
      contract:"NFLHistoricalAvailabilityMatchedATTEffectRecord",
      contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHED-ATT-EFFECT-1.0.0",
      pairId:row?.pairId??null,pairWeight:1,
      treated:Object.freeze({key:row?.treated?.key??null,gameId:row?.treated?.gameId??null,team:row?.treated?.team??null,season:row?.treated?.season??null,week:row?.treated?.week??null,side:row?.treated?.side??null,residual:n(tr)}),
      control:Object.freeze({key:row?.control?.key??null,gameId:row?.control?.gameId??null,team:row?.control?.team??null,season:row?.control?.season??null,week:row?.control?.week??null,side:row?.control?.side??null,residual:n(cr)}),
      matching:Object.freeze({distance:row?.matching?.distance??null,caliper:row?.matching?.caliper??null,mode:row?.matching?.mode??null,method:row?.matching?.method??null}),
      effect:Object.freeze({orientation:"TREATED_MINUS_MATCHED_CONTROL",treatedMinusControlResidual:pairEffect,pairDifferenceComputed:true,causalInterpretation:"DESCRIPTIVE_MATCHED_ATT_COMPONENT_ONLY"}),
      safeguards:Object.freeze({uncertaintyEstimated:false,inferentialClaimCreated:false,learnedWeightCreated:false,calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false})
    }));
  }
  const overall=summarizeEffects(effects);
  const bySeason={};for(const season of [...new Set(effects.map(r=>r?.treated?.season).filter(v=>v!=null))].sort()){bySeason[season]=summarizeEffects(effects.filter(r=>r.treated.season===season));}
  const distances=effects.map(r=>r?.matching?.distance).filter(finite).map(n),d25=percentile(distances,.25),d50=percentile(distances,.50),d75=percentile(distances,.75);
  const distanceBands={
    Q1_NEAREST:summarizeEffects(effects.filter(r=>finite(r?.matching?.distance)&&n(r.matching.distance)<=d25)),
    Q2:summarizeEffects(effects.filter(r=>finite(r?.matching?.distance)&&n(r.matching.distance)>d25&&n(r.matching.distance)<=d50)),
    Q3:summarizeEffects(effects.filter(r=>finite(r?.matching?.distance)&&n(r.matching.distance)>d50&&n(r.matching.distance)<=d75)),
    Q4_FARTHEST:summarizeEffects(effects.filter(r=>finite(r?.matching?.distance)&&n(r.matching.distance)>d75))
  };
  const absEffects=effects.map(r=>Math.abs(r.effect.treatedMinusControlResidual)).sort((a,b)=>a-b),p95Abs=percentile(absEffects,.95);
  const trimmed=effects.filter(r=>Math.abs(r.effect.treatedMinusControlResidual)<=p95Abs);
  const controlReuse=new Map();for(const row of effects)controlReuse.set(row.control.key,(controlReuse.get(row.control.key)??0)+1);
  const reuseGroups={
    REUSE_1:summarizeEffects(effects.filter(r=>(controlReuse.get(r.control.key)??0)===1)),
    REUSE_2_3:summarizeEffects(effects.filter(r=>{const c=controlReuse.get(r.control.key)??0;return c>=2&&c<=3;})),
    REUSE_4_PLUS:summarizeEffects(effects.filter(r=>(controlReuse.get(r.control.key)??0)>=4))
  };
  const report=Object.freeze({
    contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHED-ATT-EFFECT-REPORT-1.0.0",sprint:"2.18.18-RC1",
    source:Object.freeze({outcomeJoinedRecordCount:outcomeRows.length}),
    construction:Object.freeze({effectRecordCount:effects.length,invalidOutcomeCount,pairWeightViolationCount,pairDifferenceAlreadyPresentCount,orientationMismatchCount,uniquePairCount:new Set(effects.map(r=>r.pairId)).size}),
    estimand:Object.freeze({family:"ATT",population:"SUPPORTED_MATCHED_TREATED_TEAM_GAMES",estimator:"MEAN_OF_PAIR_LEVEL_TREATED_MINUS_CONTROL_RESIDUAL_DIFFERENCES",unit:"TEAM_GAME_PERFORMANCE_RESIDUAL_POINTS",interpretationBoundary:"DESCRIPTIVE_POINT_ESTIMATE_ONLY"}),
    overall,bySeason:Object.freeze(bySeason),
    outlierSensitivity:Object.freeze({p95AbsoluteEffect:p95Abs,retainedRecords:trimmed.length,removedRecords:effects.length-trimmed.length,trimmed:summarizeEffects(trimmed)}),
    matchingDistanceSensitivity:Object.freeze({distanceP25:d25,distanceP50:d50,distanceP75:d75,bands:Object.freeze(distanceBands)}),
    controlReuseDiagnostics:Object.freeze({uniqueControls:controlReuse.size,maximumControlReuse:controlReuse.size?Math.max(...controlReuse.values()):0,groups:Object.freeze(reuseGroups)}),
    readiness:Object.freeze({descriptiveATTEstimateConstructible:effects.length===131&&new Set(effects.map(r=>r.pairId)).size===131&&invalidOutcomeCount===0&&pairWeightViolationCount===0&&pairDifferenceAlreadyPresentCount===0&&orientationMismatchCount===0,uncertaintyAnalysisAuthorized:false,inferentialClaimsAuthorized:false,calibrationAuthorized:false,productionImpactPolicyAuthorized:false}),
    safeguards:Object.freeze({matchedPairsMutated:false,outcomeJoinedDatasetMutated:false,uncertaintyEstimated:false,inferentialClaimCreated:false,learnedWeightsCreated:false,calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false})
  });
  return Object.freeze({records:Object.freeze(effects),report});
}
