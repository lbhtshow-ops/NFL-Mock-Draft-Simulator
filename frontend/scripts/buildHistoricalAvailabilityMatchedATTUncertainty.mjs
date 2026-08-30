const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const n=v=>Number(v);
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;

function percentile(xs,p){
  if(!xs.length)return null;
  const s=[...xs].sort((a,b)=>a-b);
  const i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);
  return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);
}
function median(xs){return percentile(xs,.5);}
function mulberry32(seed){
  let a=seed>>>0;
  return function(){
    a|=0;a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function sampleCounts(items,draws,rng,keyFn=x=>x){
  const counts=new Map();
  for(let i=0;i<draws;i++){
    const item=items[Math.floor(rng()*items.length)];
    const key=keyFn(item);
    counts.set(key,(counts.get(key)??0)+1);
  }
  return counts;
}
function weightedMean(rows,weightFn){
  let sw=0,sy=0;
  for(const row of rows){
    const w=weightFn(row);
    if(!finite(w)||w<=0)continue;
    const y=row?.effect?.treatedMinusControlResidual;
    if(!finite(y))continue;
    sw+=n(w);sy+=n(w)*n(y);
  }
  return sw>0?sy/sw:null;
}
function summarizeDraws(draws,pointEstimate,confidence=.95){
  const usable=draws.filter(finite).map(n);
  const alpha=(1-confidence)/2;
  return Object.freeze({
    replicatesRequested:draws.length,
    replicatesUsable:usable.length,
    pointEstimate,
    bootstrapMean:mean(usable),
    bootstrapMedian:median(usable),
    interval:Object.freeze({
      confidenceLevel:confidence,
      lower:percentile(usable,alpha),
      upper:percentile(usable,1-alpha),
      method:"PERCENTILE"
    }),
    probabilityEffectBelowZero:usable.length?usable.filter(v=>v<0).length/usable.length:null,
    probabilityEffectAboveZero:usable.length?usable.filter(v=>v>0).length/usable.length:null
  });
}
function groupBySeason(rows){
  const map=new Map();
  for(const row of rows){
    const season=row?.treated?.season;
    if(!map.has(season))map.set(season,[]);
    map.get(season).push(row);
  }
  return map;
}
function primaryTwoWayBootstrap(rows,{replicates,seed,confidence}){
  const rng=mulberry32(seed);
  const bySeason=groupBySeason(rows);
  const seasons=[...bySeason.keys()].sort((a,b)=>Number(a)-Number(b));
  const draws=[];
  for(let r=0;r<replicates;r++){
    let totalSeasonN=0,totalNumerator=0;
    for(const season of seasons){
      const seasonRows=bySeason.get(season);
      const controls=[...new Set(seasonRows.map(x=>x.control.key))];
      const pairCounts=sampleCounts(seasonRows,seasonRows.length,rng,x=>x.pairId);
      const controlCounts=sampleCounts(controls,controls.length,rng,x=>x);
      const seasonMean=weightedMean(
        seasonRows,
        row=>(pairCounts.get(row.pairId)??0)*(controlCounts.get(row.control.key)??0)
      );
      if(finite(seasonMean)){
        totalNumerator+=n(seasonMean)*seasonRows.length;
        totalSeasonN+=seasonRows.length;
      }
    }
    draws.push(totalSeasonN>0?totalNumerator/totalSeasonN:null);
  }
  return summarizeDraws(
    draws,
    mean(rows.map(x=>n(x.effect.treatedMinusControlResidual))),
    confidence
  );
}
function controlClusterBootstrap(rows,{replicates,seed,confidence}){
  const rng=mulberry32(seed);
  const bySeason=groupBySeason(rows);
  const seasons=[...bySeason.keys()].sort((a,b)=>Number(a)-Number(b));
  const draws=[];
  for(let r=0;r<replicates;r++){
    let numerator=0,denominator=0;
    for(const season of seasons){
      const seasonRows=bySeason.get(season);
      const controls=[...new Set(seasonRows.map(x=>x.control.key))];
      const controlCounts=sampleCounts(controls,controls.length,rng,x=>x);
      const seasonMean=weightedMean(seasonRows,row=>controlCounts.get(row.control.key)??0);
      if(finite(seasonMean)){
        numerator+=n(seasonMean)*seasonRows.length;
        denominator+=seasonRows.length;
      }
    }
    draws.push(denominator>0?numerator/denominator:null);
  }
  return summarizeDraws(
    draws,
    mean(rows.map(x=>n(x.effect.treatedMinusControlResidual))),
    confidence
  );
}
function seasonPairBootstrap(rows,{replicates,seed,confidence}){
  const rng=mulberry32(seed);
  const bySeason=groupBySeason(rows);
  const seasons=[...bySeason.keys()].sort((a,b)=>Number(a)-Number(b));
  const draws=[];
  for(let r=0;r<replicates;r++){
    const sampledEffects=[];
    for(const season of seasons){
      const seasonRows=bySeason.get(season);
      for(let i=0;i<seasonRows.length;i++){
        const row=seasonRows[Math.floor(rng()*seasonRows.length)];
        sampledEffects.push(n(row.effect.treatedMinusControlResidual));
      }
    }
    draws.push(mean(sampledEffects));
  }
  return summarizeDraws(
    draws,
    mean(rows.map(x=>n(x.effect.treatedMinusControlResidual))),
    confidence
  );
}
function leaveOneSeasonOut(rows){
  const seasons=[...new Set(rows.map(r=>r.treated.season))].sort((a,b)=>Number(a)-Number(b));
  return Object.freeze(Object.fromEntries(seasons.map(season=>{
    const kept=rows.filter(r=>r.treated.season!==season);
    return [String(season),Object.freeze({
      omittedSeason:season,
      retainedRecords:kept.length,
      meanEffect:mean(kept.map(r=>n(r.effect.treatedMinusControlResidual))),
      negativeShare:kept.length?kept.filter(r=>n(r.effect.treatedMinusControlResidual)<0).length/kept.length:null
    })];
  })));
}
function seasonSpecificIntervals(rows,{replicates,seed,confidence}){
  const bySeason=groupBySeason(rows);
  const out={};
  let offset=0;
  for(const [season,seasonRows] of [...bySeason.entries()].sort(([a],[b])=>Number(a)-Number(b))){
    out[season]=primaryTwoWayBootstrap(
      seasonRows,
      {replicates,seed:seed+101+offset,confidence}
    );
    offset+=1000;
  }
  return Object.freeze(out);
}
export function buildHistoricalAvailabilityMatchedATTUncertainty({effectRows=[],designReport=null}={}){
  if(designReport?.decision!=="UNCERTAINTY_DESIGN_DEFINED_FOR_EXECUTION"){
    throw new Error("Uncertainty design is not authorized for execution.");
  }
  const cfg=designReport?.design?.primaryUncertaintyMethod??{};
  const replicates=Number(cfg.bootstrapReplicates);
  const confidence=Number(cfg.confidenceLevel);
  const seed=Number(cfg.randomSeed);
  const validRows=effectRows.filter(row=>
    finite(row?.effect?.treatedMinusControlResidual) &&
    row?.pairWeight===1 &&
    row?.effect?.orientation==="TREATED_MINUS_MATCHED_CONTROL"
  );
  const pointEstimate=mean(validRows.map(r=>n(r.effect.treatedMinusControlResidual)));
  const primary=primaryTwoWayBootstrap(validRows,{replicates,seed,confidence});
  const controlCluster=controlClusterBootstrap(validRows,{replicates,seed:seed+1,confidence});
  const seasonPair=seasonPairBootstrap(validRows,{replicates,seed:seed+2,confidence});
  const absEffects=validRows.map(r=>Math.abs(n(r.effect.treatedMinusControlResidual))).sort((a,b)=>a-b);
  const trimThreshold=percentile(absEffects,.95);
  const trimmedRows=validRows.filter(r=>Math.abs(n(r.effect.treatedMinusControlResidual))<=trimThreshold);
  const trimmed=primaryTwoWayBootstrap(trimmedRows,{replicates,seed:seed+3,confidence});
  const seasonIntervals=seasonSpecificIntervals(validRows,{replicates,seed:seed+10,confidence});
  const leaveOneOut=leaveOneSeasonOut(validRows);
  const controlReuse=new Map();
  for(const row of validRows)controlReuse.set(row.control.key,(controlReuse.get(row.control.key)??0)+1);

  const report=Object.freeze({
    contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-MATCHED-ATT-UNCERTAINTY-REPORT-1.0.0",
    sprint:"2.18.20-RC1",
    source:Object.freeze({
      effectRecordCount:effectRows.length,
      validEffectRecordCount:validRows.length,
      designContractVersion:designReport?.contractVersion??null,
      designSprint:designReport?.sprint??null
    }),
    lockedPointEstimate:Object.freeze({
      value:pointEstimate,
      expectedValue:-4.159193203877429,
      matchesPersistedDescriptiveATT:finite(pointEstimate)&&Math.abs(pointEstimate-(-4.159193203877429))<=1e-12
    }),
    dependenceDiagnostics:Object.freeze({
      uniqueControls:controlReuse.size,
      maximumControlReuse:controlReuse.size?Math.max(...controlReuse.values()):0,
      reusedControls:[...controlReuse.values()].filter(v=>v>1).length,
      pairIndependenceAssumed:false
    }),
    primaryUncertainty:Object.freeze({
      method:cfg.method??null,
      seed,
      replicates,
      confidenceLevel:confidence,
      result:primary
    }),
    sensitivity:Object.freeze({
      controlClusterBootstrap:Object.freeze({method:"CONTROL_CLUSTER_BOOTSTRAP",result:controlCluster}),
      seasonStratifiedPairBootstrap:Object.freeze({method:"SEASON_STRATIFIED_PAIR_BOOTSTRAP",result:seasonPair}),
      p95AbsoluteEffectTrimmedBootstrap:Object.freeze({
        method:"P95_ABSOLUTE_EFFECT_TRIMMED_BOOTSTRAP",
        threshold:trimThreshold,
        retainedRecords:trimmedRows.length,
        removedRecords:validRows.length-trimmedRows.length,
        result:trimmed
      }),
      leaveOneSeasonOut:leaveOneOut
    }),
    seasonSpecificIntervals:seasonIntervals,
    interpretationBoundary:Object.freeze({
      uncertaintyEstimated:true,
      confidenceIntervalsComputed:true,
      intervalsAreGovernedUncertaintyDiagnostics:true,
      inferentialClaimAuthorized:false,
      statisticalSignificanceLanguageAuthorized:false,
      pValueComputed:false,
      nullHypothesisTestPerformed:false,
      productionCalibrationAuthorized:false,
      playerCoefficientAuthorized:false,
      positionCoefficientAuthorized:false,
      teamStrengthPointValueAuthorized:false
    }),
    readiness:Object.freeze({
      uncertaintyExecutionComplete:
        validRows.length===131 &&
        controlReuse.size===76 &&
        (controlReuse.size?Math.max(...controlReuse.values()):0)===7 &&
        primary?.replicatesUsable===replicates &&
        controlCluster?.replicatesUsable===replicates &&
        seasonPair?.replicatesUsable===replicates &&
        trimmed?.replicatesUsable===replicates &&
        Object.values(seasonIntervals).every(x=>x?.replicatesUsable===replicates) &&
        Math.abs(pointEstimate-(-4.159193203877429))<=1e-12,
      inferenceReviewMayAdvance:true,
      inferentialClaimsAuthorized:false,
      calibrationAuthorized:false,
      productionImpactPolicyAuthorized:false
    }),
    safeguards:Object.freeze({
      sourceEffectsMutated:false,
      matchingMutated:false,
      pointEstimateChanged:false,
      pValueComputed:false,
      inferentialClaimCreated:false,
      learnedWeightsCreated:false,
      calibrationExecuted:false,
      teamStrengthMutated:false,
      decisionModelMutated:false,
      pickemScoringMutated:false,
      databaseMutated:false
    })
  });
  return report;
}
