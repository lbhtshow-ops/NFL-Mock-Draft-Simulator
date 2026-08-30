import fs from "node:fs";
import path from "node:path";

const DATA_ROOT = path.resolve("./data/calibration/historical/v1");
const OBSERVATIONS = path.join(DATA_ROOT, "historical-availability-impact-calibration-observations-v1.jsonl");
const COHORT = path.join(DATA_ROOT, "historical-availability-control-cohort-v1.jsonl");
const EFFECTS = path.join(DATA_ROOT, "historical-availability-matched-att-effects-v1.jsonl");

const finite = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const n = (v) => Number(v);
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;

function readJsonl(file) {
  if (!fs.existsSync(file)) throw new Error(`Required dataset missing: ${file}`);
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function percentile(xs,p){
  if(!xs.length) return null;
  const s=[...xs].sort((a,b)=>a-b);
  const i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);
  return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);
}

function summarize(rows){
  const ys=rows.map(r=>r.effect).filter(finite).map(n);
  const xs=rows.map(r=>r.deltaSum).filter(finite).map(n);
  return Object.freeze({
    count: rows.length,
    meanEffect: mean(ys),
    medianEffect: percentile(ys,.5),
    negativeEffectShare: ys.length ? ys.filter(v=>v<0).length/ys.length : null,
    meanDeltaSum: mean(xs),
    medianDeltaSum: percentile(xs,.5),
  });
}

function regression(rows){
  const usable=rows.filter(r=>finite(r.deltaSum)&&finite(r.effect));
  if(usable.length<3) return Object.freeze({count:usable.length,slope:null,intercept:null,correlation:null});
  const xs=usable.map(r=>n(r.deltaSum)), ys=usable.map(r=>n(r.effect));
  const mx=mean(xs), my=mean(ys);
  const sxx=xs.reduce((s,x)=>s+(x-mx)**2,0);
  const sxy=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const syy=ys.reduce((s,y)=>s+(y-my)**2,0);
  const slope=sxx>0?sxy/sxx:null;
  const intercept=finite(slope)?my-slope*mx:null;
  const correlation=sxx>0&&syy>0?sxy/Math.sqrt(sxx*syy):null;
  return Object.freeze({count:usable.length,slope,intercept,correlation});
}

function weightedRegression(rows, weightFn){
  let sw=0,sx=0,sy=0;
  for(const row of rows){
    const w=weightFn(row);
    if(!finite(w)||n(w)<=0||!finite(row.deltaSum)||!finite(row.effect)) continue;
    sw+=n(w);sx+=n(w)*n(row.deltaSum);sy+=n(w)*n(row.effect);
  }
  if(sw<=0) return null;
  const mx=sx/sw,my=sy/sw;
  let sxx=0,sxy=0;
  for(const row of rows){
    const w=weightFn(row);
    if(!finite(w)||n(w)<=0||!finite(row.deltaSum)||!finite(row.effect)) continue;
    sxx+=n(w)*(n(row.deltaSum)-mx)**2;
    sxy+=n(w)*(n(row.deltaSum)-mx)*(n(row.effect)-my);
  }
  return sxx>0?sxy/sxx:null;
}

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

function clusteredSlopeBootstrap(rows,{replicates=10000,seed=2190001,confidence=.95}={}){
  const rng=mulberry32(seed);
  const bySeason=new Map();
  for(const row of rows){
    if(!bySeason.has(row.season)) bySeason.set(row.season,[]);
    bySeason.get(row.season).push(row);
  }
  const draws=[];
  const seasons=[...bySeason.keys()].sort((a,b)=>Number(a)-Number(b));
  for(let r=0;r<replicates;r++){
    const weighted=[];
    for(const season of seasons){
      const seasonRows=bySeason.get(season);
      const controls=[...new Set(seasonRows.map(x=>x.controlKey))];
      const pairCounts=sampleCounts(seasonRows,seasonRows.length,rng,x=>x.pairId);
      const controlCounts=sampleCounts(controls,controls.length,rng,x=>x);
      for(const row of seasonRows){
        const weight=(pairCounts.get(row.pairId)??0)*(controlCounts.get(row.controlKey)??0);
        if(weight>0) weighted.push({...row,__weight:weight});
      }
    }
    const slope=weightedRegression(weighted,row=>row.__weight);
    draws.push(slope);
  }
  const usable=draws.filter(finite).map(n);
  const alpha=(1-confidence)/2;
  return Object.freeze({
    method:"TWO_WAY_CLUSTER_BOOTSTRAP_BY_TREATED_PAIR_AND_CONTROL_IDENTITY_STRATIFIED_BY_SEASON",
    replicatesRequested:replicates,
    replicatesUsable:usable.length,
    confidenceLevel:confidence,
    seed,
    interval:Object.freeze({lower:percentile(usable,alpha),upper:percentile(usable,1-alpha),method:"PERCENTILE"}),
    probabilitySlopeBelowZero:usable.length?usable.filter(v=>v<0).length/usable.length:null,
    probabilitySlopeAboveZero:usable.length?usable.filter(v=>v>0).length/usable.length:null,
  });
}

function bandFor(delta){
  if(delta<=0) return "NON_POSITIVE_DELTA";
  if(delta<=5) return "POSITIVE_1_TO_5";
  if(delta<=10) return "POSITIVE_6_TO_10";
  return "POSITIVE_11_PLUS";
}

export function auditHistoricalReplacementCaliberHeterogeneousEffect({replicates=10000}={}){
  const observations=readJsonl(OBSERVATIONS);
  const cohort=readJsonl(COHORT);
  const effects=readJsonl(EFFECTS);

  let arithmeticViolations=0,completeObservationCount=0;
  const observationsByTeamGame=new Map();
  for(const row of observations){
    const key=`${row?.identity?.gameId}:${row?.identity?.team}`;
    if(!observationsByTeamGame.has(key)) observationsByTeamGame.set(key,[]);
    observationsByTeamGame.get(key).push(row);
    const p=row?.pregame?.playerCaliber,r=row?.pregame?.replacementCaliber,d=row?.pregame?.expectedReplacementDelta;
    if(finite(p)&&finite(r)&&finite(d)){
      completeObservationCount++;
      if(Math.abs((n(p)-n(r))-n(d))>1e-12) arithmeticViolations++;
    }
  }

  const cohortByKey=new Map(cohort.map(row=>[row?.key,row]));
  const records=[];
  let missingCohortCount=0,nonTreatedCohortCount=0,cohortDeltaMismatchCount=0,incompleteMatchedTreatmentCount=0;

  for(const effectRow of effects){
    const treatedKey=effectRow?.treated?.key;
    const cohortRow=cohortByKey.get(treatedKey);
    if(!cohortRow){missingCohortCount++;continue;}
    if(cohortRow?.classification!=="TREATED"){nonTreatedCohortCount++;continue;}
    const obsRows=observationsByTeamGame.get(treatedKey)??[];
    const complete=obsRows.filter(o=>finite(o?.pregame?.expectedReplacementDelta));
    const deltaSum=complete.reduce((s,o)=>s+n(o.pregame.expectedReplacementDelta),0);
    const cohortDelta=cohortRow?.treatment?.expectedReplacementDeltaSum;
    const cohortCount=cohortRow?.treatment?.completeReplacementDeltaCount;
    if(!finite(cohortDelta)||Math.abs(n(cohortDelta)-deltaSum)>1e-12||Number(cohortCount)!==complete.length) cohortDeltaMismatchCount++;
    if(complete.length!==obsRows.length) incompleteMatchedTreatmentCount++;

    records.push(Object.freeze({
      contract:"NFLHistoricalReplacementCaliberHeterogeneousEffectRecord",
      contractVersion:"FIE-NFL-HISTORICAL-REPLACEMENT-CALIBER-HETEROGENEOUS-EFFECT-1.0.0",
      pairId:effectRow?.pairId??null,
      treatedKey,
      controlKey:effectRow?.control?.key??null,
      season:effectRow?.treated?.season??null,
      week:effectRow?.treated?.week??null,
      team:effectRow?.treated?.team??null,
      unavailablePlayerCount:complete.length,
      expectedReplacementDeltaSum:deltaSum,
      expectedReplacementDeltaMean:complete.length?deltaSum/complete.length:null,
      positions:Object.freeze([...(cohortRow?.treatment?.positions??[])]),
      statuses:Object.freeze([...(cohortRow?.treatment?.statuses??[])]),
      effect:effectRow?.effect?.treatedMinusControlResidual??null,
      matchingDistance:effectRow?.matching?.distance??null,
      interpretation:Object.freeze({
        deltaConvention:"UNAVAILABLE_PLAYER_CALIBER_MINUS_EXPECTED_REPLACEMENT_CALIBER",
        positiveDeltaMeaning:"UNAVAILABLE_PLAYER_CALIBER_EXCEEDS_EXPECTED_REPLACEMENT_CALIBER",
        effectOrientation:"TREATED_MINUS_MATCHED_CONTROL_RESIDUAL",
      }),
    }));
  }

  const regressionOverall=regression(records.map(r=>({...r,deltaSum:r.expectedReplacementDeltaSum})));
  const normalized=records.map(r=>({...r,deltaSum:r.expectedReplacementDeltaSum}));
  const bands={};
  for(const label of ["NON_POSITIVE_DELTA","POSITIVE_1_TO_5","POSITIVE_6_TO_10","POSITIVE_11_PLUS"]){
    bands[label]=summarize(normalized.filter(r=>bandFor(r.deltaSum)===label));
  }
  const orderedMeans=[bands.NON_POSITIVE_DELTA,bands.POSITIVE_1_TO_5,bands.POSITIVE_6_TO_10,bands.POSITIVE_11_PLUS].map(x=>x.meanEffect);
  const monotonicNonIncreasing=orderedMeans.every((v,i)=>i===0||!finite(v)||!finite(orderedMeans[i-1])||v<=orderedMeans[i-1]);
  const positiveOnlyMeans=[bands.POSITIVE_1_TO_5.meanEffect,bands.POSITIVE_6_TO_10.meanEffect,bands.POSITIVE_11_PLUS.meanEffect];
  const positiveLossMonotonicNonIncreasing=positiveOnlyMeans.every((v,i)=>i===0||!finite(v)||!finite(positiveOnlyMeans[i-1])||v<=positiveOnlyMeans[i-1]);

  const bySeason=Object.fromEntries([...new Set(normalized.map(r=>r.season))].sort().map(season=>[
    String(season),Object.freeze({...summarize(normalized.filter(r=>r.season===season)),regression:regression(normalized.filter(r=>r.season===season))})
  ]));

  const byPosition={};
  const positions=[...new Set(normalized.flatMap(r=>r.positions))].sort();
  for(const position of positions){
    const subset=normalized.filter(r=>r.positions.includes(position));
    byPosition[position]=Object.freeze({count:subset.length,descriptiveOnly:true,regression:regression(subset)});
  }

  const absEffects=normalized.map(r=>Math.abs(n(r.effect))).sort((a,b)=>a-b);
  const p95=percentile(absEffects,.95);
  const trimmed=normalized.filter(r=>Math.abs(n(r.effect))<=p95);
  const bootstrap=clusteredSlopeBootstrap(normalized,{replicates});
  const trimmedBootstrap=clusteredSlopeBootstrap(trimmed,{replicates,seed:2190004});

  const slopeIntervalExcludesZero=finite(bootstrap?.interval?.lower)&&finite(bootstrap?.interval?.upper)&&
    ((bootstrap.interval.lower>0&&bootstrap.interval.upper>0)||(bootstrap.interval.lower<0&&bootstrap.interval.upper<0));
  const trimmedSlopeIntervalExcludesZero=finite(trimmedBootstrap?.interval?.lower)&&finite(trimmedBootstrap?.interval?.upper)&&
    ((trimmedBootstrap.interval.lower>0&&trimmedBootstrap.interval.upper>0)||(trimmedBootstrap.interval.lower<0&&trimmedBootstrap.interval.upper<0));

  const relationshipEvidence = slopeIntervalExcludesZero && trimmedSlopeIntervalExcludesZero && positiveLossMonotonicNonIncreasing;
  const decision = relationshipEvidence
    ? "REPLACEMENT_CALIBER_INCREMENTAL_SIGNAL_SUPPORTED_FOR_NEXT_GOVERNED_SENSITIVITY_STAGE"
    : "REPLACEMENT_CALIBER_INCREMENTAL_SIGNAL_NOT_YET_ESTABLISHED_HOLD_SHADOW";

  const report=Object.freeze({
    contractVersion:"FIE-NFL-HISTORICAL-REPLACEMENT-CALIBER-HETEROGENEOUS-EFFECT-REPORT-1.0.0",
    sprint:"2.19.0-RC1",
    mode:"READ_ONLY_HETEROGENEOUS_EFFECT_AUDIT",
    decision,
    source:Object.freeze({
      observationCount:observations.length,
      completeObservationCount,
      matchedEffectCount:effects.length,
      matchedHeterogeneousRecordCount:records.length,
    }),
    deltaSemantics:Object.freeze({
      formula:"PLAYER_CALIBER_MINUS_EXPECTED_REPLACEMENT_CALIBER",
      arithmeticViolationCount:arithmeticViolations,
      positiveMeansLargerExpectedCaliberLoss:true,
    }),
    reconciliation:Object.freeze({
      missingCohortCount,nonTreatedCohortCount,cohortDeltaMismatchCount,incompleteMatchedTreatmentCount,
      all131MatchedEffectsReconciled:records.length===131&&missingCohortCount===0&&nonTreatedCohortCount===0,
    }),
    descriptive:Object.freeze({
      overall:summarize(normalized),
      regression:regressionOverall,
      bands:Object.freeze(bands),
      allBandMeansMonotonicNonIncreasing:monotonicNonIncreasing,
      positiveLossBandMeansMonotonicNonIncreasing:positiveLossMonotonicNonIncreasing,
      bySeason:Object.freeze(bySeason),
      byPosition:Object.freeze(byPosition),
      positionResultsAreDescriptiveOnly:true,
    }),
    outlierSensitivity:Object.freeze({
      p95AbsoluteEffectThreshold:p95,
      retainedRecords:trimmed.length,
      removedRecords:normalized.length-trimmed.length,
      regression:regression(trimmed),
    }),
    uncertainty:Object.freeze({
      primarySlope:bootstrap,
      trimmedSlope:trimmedBootstrap,
      primarySlopeIntervalExcludesZero:slopeIntervalExcludesZero,
      trimmedSlopeIntervalExcludesZero,
      inferentialClaimAuthorized:false,
      statisticalSignificanceLanguageAuthorized:false,
    }),
    readiness:Object.freeze({
      heterogeneousEffectAuditComplete:
        observations.length===286&&completeObservationCount===286&&effects.length===131&&records.length===131&&
        arithmeticViolations===0&&missingCohortCount===0&&nonTreatedCohortCount===0&&cohortDeltaMismatchCount===0&&
        incompleteMatchedTreatmentCount===0&&bootstrap.replicatesUsable===replicates&&trimmedBootstrap.replicatesUsable===replicates,
      replacementCaliberIncrementalSignalSupported:relationshipEvidence,
      positionRoleDependencySensitivityMayAdvance:true,
      calibrationAuthorized:false,
      productionImpactPolicyAuthorized:false,
    }),
    safeguards:Object.freeze({
      sourceDatasetsMutated:false,
      matchedDesignMutated:false,
      causalEstimandMutated:false,
      learnedProductionWeightCreated:false,
      playerCoefficientAuthorized:false,
      positionCoefficientAuthorized:false,
      teamStrengthPointValueAuthorized:false,
      teamStrengthMutated:false,
      decisionModelMutated:false,
      pickemScoringMutated:false,
      databaseMutated:false,
      shadowOnlyPreserved:true,
    }),
  });

  return Object.freeze({records:Object.freeze(records),report});
}

const result=auditHistoricalReplacementCaliberHeterogeneousEffect();
console.log(JSON.stringify(result.report,null,2));
