import fs from "node:fs";

const ROOT = "./data/calibration/historical/v1";
const OBS = `${ROOT}/historical-availability-impact-calibration-observations-v1.jsonl`;
const EFFECTS = `${ROOT}/historical-availability-matched-att-effects-v1.jsonl`;
const REPLACEMENTS = `${ROOT}/expected-replacement-identities-caliber-enriched-v1.jsonl`;
const USAGE_DEP = `${ROOT}/historical-observed-usage-dependency-v1.jsonl`;

const finite = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const num = (v) => finite(v) ? Number(v) : null;
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
const readJsonl = (file) => fs.existsSync(file)
  ? fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  : [];

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
  const n=A.length;
  const M=A.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[pivot][col])) pivot=r;
    if(Math.abs(M[pivot][col])<1e-10) return null;
    [M[col],M[pivot]]=[M[pivot],M[col]];
    const d=M[col][col];
    for(let c=col;c<=n;c++) M[col][c]/=d;
    for(let r=0;r<n;r++){
      if(r===col) continue;
      const f=M[r][col];
      for(let c=col;c<=n;c++) M[r][c]-=f*M[col][c];
    }
  }
  return M.map(row=>row[n]);
}

function fitOLS(rows, featureNames){
  const usable=rows.filter(r=>finite(r.effect)&&featureNames.every(k=>finite(r[k])));
  const p=featureNames.length+1;
  if(usable.length<=p) return {n:usable.length,features:featureNames,beta:null,r2:null,adjustedR2:null,rmse:null,mae:null};
  const X=usable.map(r=>[1,...featureNames.map(k=>Number(r[k]))]);
  const y=usable.map(r=>Number(r.effect));
  const xtx=Array.from({length:p},()=>Array(p).fill(0));
  const xty=Array(p).fill(0);
  for(let i=0;i<X.length;i++){
    for(let a=0;a<p;a++){
      xty[a]+=X[i][a]*y[i];
      for(let b=0;b<p;b++) xtx[a][b]+=X[i][a]*X[i][b];
    }
  }
  const beta=solveLinear(xtx,xty);
  if(!beta) return {n:usable.length,features:featureNames,beta:null,r2:null,adjustedR2:null,rmse:null,mae:null};
  const pred=X.map(row=>row.reduce((s,v,j)=>s+v*beta[j],0));
  const ybar=mean(y);
  const sse=y.reduce((s,v,i)=>s+(v-pred[i])**2,0);
  const sst=y.reduce((s,v)=>s+(v-ybar)**2,0);
  const r2=sst>0?1-sse/sst:null;
  const adjustedR2=finite(r2)&&usable.length>p
    ? 1-(1-r2)*(usable.length-1)/(usable.length-p)
    : null;
  return {
    n:usable.length,features:featureNames,beta,
    r2,adjustedR2,
    rmse:Math.sqrt(sse/usable.length),
    mae:mean(y.map((v,i)=>Math.abs(v-pred[i]))),
  };
}

function groupedFiveFoldCV(rows, featureNames){
  const eligible=rows.filter(r=>finite(r.effect)&&featureNames.every(k=>finite(r[k])));
  const foldByCluster=new Map();
  const seasons=[...new Set(eligible.map(r=>r.season))].sort();
  for(const season of seasons){
    const controls=[...new Set(eligible.filter(r=>r.season===season).map(r=>r.controlKey))].sort();
    controls.forEach((control,i)=>foldByCluster.set(`${season}:${control}`,i%5));
  }
  const actual=[],predicted=[];
  for(let fold=0;fold<5;fold++){
    const train=eligible.filter(r=>foldByCluster.get(`${r.season}:${r.controlKey}`)!==fold);
    const test=eligible.filter(r=>foldByCluster.get(`${r.season}:${r.controlKey}`)===fold);
    const model=fitOLS(train,featureNames);
    if(!model.beta) continue;
    for(const row of test){
      const x=[1,...featureNames.map(k=>Number(row[k]))];
      predicted.push(x.reduce((s,v,j)=>s+v*model.beta[j],0));
      actual.push(Number(row.effect));
    }
  }
  if(!actual.length) return {n:0,rmse:null,mae:null,folds:5,grouping:"CONTROL_IDENTITY_WITHIN_SEASON"};
  const errors=actual.map((y,i)=>y-predicted[i]);
  return {
    n:actual.length,
    rmse:Math.sqrt(mean(errors.map(e=>e*e))),
    mae:mean(errors.map(Math.abs)),
    folds:5,
    grouping:"CONTROL_IDENTITY_WITHIN_SEASON",
  };
}

function summarize(rows){
  const ys=rows.map(r=>num(r.effect)).filter(finite);
  return {count:ys.length,meanEffect:mean(ys),negativeEffectShare:ys.length?ys.filter(v=>v<0).length/ys.length:null};
}

export function auditHeterogeneousPlayerImpactCalibration(){
  const observations=readJsonl(OBS);
  const effects=readJsonl(EFFECTS);
  const replacements=readJsonl(REPLACEMENTS);
  const usageDependency=readJsonl(USAGE_DEP);

  const obsByKey=new Map();
  for(const row of observations){
    const i=row?.identity||{};
    const key=`${i.gameId}:${i.team}`;
    if(!obsByKey.has(key)) obsByKey.set(key,[]);
    obsByKey.get(key).push(row);
  }
  const evidenceByKey=new Map();
  for(const row of usageDependency){
    const i=row?.identity||{};
    const key=`${i.gameId}:${i.team}`;
    if(!evidenceByKey.has(key)) evidenceByKey.set(key,[]);
    evidenceByKey.get(key).push(row);
  }
  const replacementByIdentity=new Map();
  for(const row of replacements){
    replacementByIdentity.set(`${row.season}:${row.week}:${row.team}:${row.unavailablePlayerId}`,row);
  }

  let missingObservationJoin=0,missingUsageJoin=0,missingReplacementJoin=0;
  const records=[];
  for(const effectRow of effects){
    const key=effectRow?.treated?.key;
    const obsRows=obsByKey.get(key)||[];
    const evidenceRows=evidenceByKey.get(key)||[];
    if(!obsRows.length){missingObservationJoin++;continue;}
    if(evidenceRows.length!==obsRows.length) missingUsageJoin++;

    const players=obsRows.map((o,index)=>{
      const i=o?.identity||{},p=o?.pregame||{};
      const e=evidenceRows.find(x=>x?.identity?.unavailablePlayerId===i.unavailablePlayerId) || evidenceRows[index] || null;
      const rr=replacementByIdentity.get(`${i.season}:${i.week}:${i.team}:${i.unavailablePlayerId}`)||null;
      if(!rr) missingReplacementJoin++;
      return {
        positionFamily:positionFamily(i.position),
        delta:num(p.expectedReplacementDelta),
        usage:num(e?.usageEvidence?.selectedSnapPct),
        dependency:num(e?.teamDependencyEvidence?.dependencyIndex),
        dependencyAvailable:e?.teamDependencyEvidence?.status==="AVAILABLE",
        depthRank:num(rr?.unavailableDepthRank),
      };
    });

    const usages=players.map(p=>p.usage).filter(finite);
    const deps=players.map(p=>p.dependency).filter(finite);
    const deltaSum=players.reduce((s,p)=>s+(finite(p.delta)?p.delta:0),0);
    const rank1Count=players.filter(p=>p.depthRank===1).length;
    records.push({
      pairId:effectRow.pairId,
      controlKey:effectRow?.control?.key,
      season:effectRow?.treated?.season,
      week:effectRow?.treated?.week,
      treatedKey:key,
      effect:num(effectRow?.effect?.treatedMinusControlResidual),
      deltaSum,
      maxUsage:usages.length?Math.max(...usages):null,
      meanUsage:usages.length?mean(usages):null,
      absenceCount:players.length,
      rank1Share:players.length?rank1Count/players.length:null,
      qbPresent:players.some(p=>p.positionFamily==="QB")?1:0,
      olPresent:players.some(p=>p.positionFamily==="OL")?1:0,
      skillPresent:players.some(p=>p.positionFamily==="SKILL")?1:0,
      front7Present:players.some(p=>p.positionFamily==="FRONT7")?1:0,
      secondaryPresent:players.some(p=>p.positionFamily==="SECONDARY")?1:0,
      maxDependency:deps.length?Math.max(...deps):null,
    });
  }

  const deltaFeatures=["deltaSum"];
  const coreFeatures=["deltaSum","maxUsage","rank1Share","absenceCount"];
  const qbFeatures=[...coreFeatures,"qbPresent"];
  const positionFeatures=[...coreFeatures,"qbPresent","olPresent","skillPresent","front7Present"];
  const dependencyFeatures=[...coreFeatures,"maxDependency"];

  const models={
    replacementCaliberOnly:fitOLS(records,deltaFeatures),
    corePlayerImpactResearch:fitOLS(records,coreFeatures),
    corePlusQBContext:fitOLS(records,qbFeatures),
    corePlusPositionContext:fitOLS(records,positionFeatures),
    dependencySupportedSubset:fitOLS(records,dependencyFeatures),
  };
  const cv={
    replacementCaliberOnly:groupedFiveFoldCV(records,deltaFeatures),
    corePlayerImpactResearch:groupedFiveFoldCV(records,coreFeatures),
    corePlusQBContext:groupedFiveFoldCV(records,qbFeatures),
    corePlusPositionContext:groupedFiveFoldCV(records,positionFeatures),
  };

  const coreIncrementalR2 =
    finite(models.corePlayerImpactResearch.r2)&&finite(models.replacementCaliberOnly.r2)
      ? models.corePlayerImpactResearch.r2-models.replacementCaliberOnly.r2 : null;
  const coreAdjustedR2Improves =
    finite(models.corePlayerImpactResearch.adjustedR2)&&finite(models.replacementCaliberOnly.adjustedR2)
      ? models.corePlayerImpactResearch.adjustedR2>models.replacementCaliberOnly.adjustedR2 : false;
  const coreCvImproves =
    finite(cv.corePlayerImpactResearch.rmse)&&finite(cv.replacementCaliberOnly.rmse)
      ? cv.corePlayerImpactResearch.rmse<cv.replacementCaliberOnly.rmse : false;

  const usageBands={
    LOW:summarize(records.filter(r=>finite(r.maxUsage)&&r.maxUsage<0.35)),
    ROTATION:summarize(records.filter(r=>finite(r.maxUsage)&&r.maxUsage>=0.35&&r.maxUsage<0.70)),
    HIGH:summarize(records.filter(r=>finite(r.maxUsage)&&r.maxUsage>=0.70)),
  };
  const highUsageLargeDelta=summarize(records.filter(r=>finite(r.maxUsage)&&r.maxUsage>=0.70&&r.deltaSum>=10));
  const highUsageSmallDelta=summarize(records.filter(r=>finite(r.maxUsage)&&r.maxUsage>=0.70&&r.deltaSum<10));
  const dependencyRows=records.filter(r=>finite(r.maxDependency));

  const signalSupported =
    coreAdjustedR2Improves &&
    coreCvImproves &&
    coreIncrementalR2!==null &&
    coreIncrementalR2>=0.02;

  const decision=signalSupported
    ? "MULTIVARIATE_PLAYER_IMPACT_SIGNAL_SUPPORTED_FOR_TEMPORAL_VALIDATION_SHADOW_ONLY"
    : "MULTIVARIATE_PLAYER_IMPACT_SIGNAL_NOT_YET_STABLE_HOLD_SHADOW";

  return {
    contractVersion:"FIE-NFL-HETEROGENEOUS-PLAYER-IMPACT-CALIBRATION-REPORT-1.0.0",
    sprint:"2.22.0-RC1",
    mode:"RESEARCH_ONLY_MULTIVARIATE_DESCRIPTIVE_CALIBRATION_AUDIT",
    decision,
    source:{
      observationCount:observations.length,
      matchedEffectCount:effects.length,
      usageDependencyEvidenceCount:usageDependency.length,
      replacementRecordCount:replacements.length,
      modelRecordCount:records.length,
    },
    reconciliation:{
      missingObservationJoin,missingUsageJoin,missingReplacementJoin,
      allMatchedEffectsReconciled:records.length===effects.length&&missingObservationJoin===0&&missingUsageJoin===0,
    },
    evidenceCoverage:{
      usageRecordCount:records.filter(r=>finite(r.maxUsage)).length,
      dependencyRecordCount:dependencyRows.length,
      dependencyCoverage:records.length?dependencyRows.length/records.length:0,
      fullCohortUsageCoverage:records.every(r=>finite(r.maxUsage)),
    },
    models,
    internalRobustness:{
      groupedFiveFoldCV:cv,
      coreIncrementalR2,
      coreAdjustedR2Improves,
      coreCvImproves,
      internalCVIsNotTemporalHoldout:true,
    },
    descriptiveInteractions:{
      usageBands,
      highUsageLargeDelta,
      highUsageSmallDelta,
      dependencySupportedSubsetCount:dependencyRows.length,
      resultsAreDescriptiveOnly:true,
    },
    interpretation:{
      multivariateSignalSupportedForNextTemporalValidation:signalSupported,
      noProductionCoefficientAuthorized:true,
      coefficientsAreResearchDiagnosticsOnly:true,
      dependencySubsetTooSmallForProductionPolicy:dependencyRows.length<50,
      reason:signalSupported
        ? "The predeclared core research representation improves adjusted fit and grouped internal CV versus replacement caliber alone. Temporal/season/era validation is still required before any shadow transformation."
        : "The predeclared core research representation does not show a sufficiently stable incremental improvement over replacement caliber alone. Continue to temporal/season/era validation as a falsification/stability gate; do not promote or convert these research coefficients into Team Strength."
    },
    readiness:{
      heterogeneousPlayerImpactCalibrationAuditComplete:
        records.length===131&&records.every(r=>finite(r.maxUsage))&&missingObservationJoin===0&&missingUsageJoin===0,
      temporalSeasonEraValidationMayAdvance:true,
      fullPlayerImpactTransformationReadyForHoldout:false,
      calibrationAuthorized:false,
      productionImpactPolicyAuthorized:false,
      shadowTeamStrengthTransformationAuthorized:false,
    },
    safeguards:{
      sourceDatasetsMutated:false,
      matchedDesignMutated:false,
      causalEstimandMutated:false,
      learnedProductionWeightCreated:false,
      researchOLSIsProductionWeight:false,
      playerCoefficientAuthorized:false,
      positionCoefficientAuthorized:false,
      dependencyCoefficientAuthorized:false,
      teamStrengthPointValueAuthorized:false,
      teamStrengthMutated:false,
      decisionModelMutated:false,
      pickemScoringMutated:false,
      databaseMutated:false,
      shadowOnlyPreserved:true,
    },
  };
}

const report=auditHeterogeneousPlayerImpactCalibration();
console.log(JSON.stringify(report,null,2));
