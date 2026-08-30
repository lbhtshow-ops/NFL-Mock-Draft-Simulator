import fs from "node:fs";

const ROOT = "./data/calibration/historical/v1";
const OBS = `${ROOT}/historical-availability-impact-calibration-observations-v1.jsonl`;
const EFFECTS = `${ROOT}/historical-availability-matched-att-effects-v1.jsonl`;
const REPLACEMENTS = `${ROOT}/expected-replacement-identities-caliber-enriched-v1.jsonl`;

const finite = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const n = (v) => Number(v);
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
const median = (xs) => {
  if(!xs.length) return null;
  const s=[...xs].sort((a,b)=>a-b), m=Math.floor(s.length/2);
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
};
const readJsonl = (file) => fs.existsSync(file)
  ? fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  : [];
const summarize = (rows) => {
  const ys=rows.map(r=>r.effect).filter(finite).map(n);
  return Object.freeze({
    count: ys.length,
    meanEffect: mean(ys),
    medianEffect: median(ys),
    negativeEffectShare: ys.length ? ys.filter(v=>v<0).length/ys.length : null,
  });
};
const positionFamily = (p) => {
  const x=String(p||"").toUpperCase();
  if(x==="QB") return "QB";
  if(["C","G","T","OT","OG","IOL"].includes(x)) return "OL";
  if(["RB","WR","TE","FB"].includes(x)) return "SKILL";
  if(["DE","DT","NT","EDGE","LB"].includes(x)) return "FRONT7";
  if(["CB","S","DB"].includes(x)) return "SECONDARY";
  return "OTHER";
};
function mulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function percentile(xs,p){if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b),i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);}
function clusterBootstrapMean(rows,{replicates=10000,seed=2200001}={}){
  if(!rows.length) return Object.freeze({replicatesRequested:replicates,replicatesUsable:0,interval:{lower:null,upper:null},probabilityBelowZero:null});
  const rng=mulberry32(seed), bySeason=new Map();
  for(const row of rows){const s=row.season;if(!bySeason.has(s))bySeason.set(s,[]);bySeason.get(s).push(row);}
  const draws=[];
  for(let r=0;r<replicates;r++){
    let num=0,den=0;
    for(const seasonRows of bySeason.values()){
      const controls=[...new Set(seasonRows.map(x=>x.controlKey))];
      const cc=new Map(); for(let i=0;i<controls.length;i++){const c=controls[Math.floor(rng()*controls.length)];cc.set(c,(cc.get(c)||0)+1);}
      const pc=new Map(); for(let i=0;i<seasonRows.length;i++){const x=seasonRows[Math.floor(rng()*seasonRows.length)];pc.set(x.pairId,(pc.get(x.pairId)||0)+1);}
      let sw=0,sy=0;
      for(const row of seasonRows){const w=(cc.get(row.controlKey)||0)*(pc.get(row.pairId)||0);if(w>0){sw+=w;sy+=w*row.effect;}}
      if(sw>0){num+=(sy/sw)*seasonRows.length;den+=seasonRows.length;}
    }
    if(den>0)draws.push(num/den);
  }
  return Object.freeze({
    replicatesRequested:replicates,replicatesUsable:draws.length,
    pointEstimate:mean(rows.map(r=>r.effect)),
    interval:Object.freeze({confidenceLevel:0.95,lower:percentile(draws,.025),upper:percentile(draws,.975),method:"PERCENTILE"}),
    probabilityBelowZero:draws.length?draws.filter(v=>v<0).length/draws.length:null,
  });
}

const observations=readJsonl(OBS);
const effects=readJsonl(EFFECTS);
const replacements=readJsonl(REPLACEMENTS);
const obsByKey=new Map();
for(const row of observations){const i=row?.identity||{};const key=`${i.gameId}:${i.team}`;if(!obsByKey.has(key))obsByKey.set(key,[]);obsByKey.get(key).push(row);}
const replByPlayerWeek=new Map();
for(const row of replacements){replByPlayerWeek.set(`${row.season}:${row.week}:${row.team}:${row.unavailablePlayerId}`,row);}

let missingObservationJoin=0, missingReplacementJoin=0, missingDepthRank=0, historicalUsagePresent=0, historicalDependencyPresent=0;
const records=[];
for(const effectRow of effects){
  const key=effectRow?.treated?.key;
  const obsRows=obsByKey.get(key)||[];
  if(!obsRows.length){missingObservationJoin++;continue;}
  const players=[];
  for(const o of obsRows){
    const i=o.identity||{}, p=o.pregame||{};
    const rr=replByPlayerWeek.get(`${i.season}:${i.week}:${i.team}:${i.unavailablePlayerId}`)||null;
    if(!rr) missingReplacementJoin++;
    const depthRank=rr?.unavailableDepthRank??null;
    if(depthRank==null) missingDepthRank++;
    if(p.usage!=null) historicalUsagePresent++;
    if(p.teamDependency!=null || p.dependencyIndex!=null) historicalDependencyPresent++;
    players.push(Object.freeze({
      playerId:i.unavailablePlayerId??null, position:i.position??null, positionFamily:positionFamily(i.position),
      status:p.unavailableStatus??null, playerCaliber:p.playerCaliber??null, replacementCaliber:p.replacementCaliber??null,
      expectedReplacementDelta:p.expectedReplacementDelta??null, depthRank,
      roleClass:depthRank===1?"DEPTH_RANK_1":depthRank===2?"DEPTH_RANK_2":"UNRESOLVED",
      usage:p.usage??null, teamDependency:p.teamDependency??null, dependencyIndex:p.dependencyIndex??null,
    }));
  }
  records.push(Object.freeze({
    pairId:effectRow.pairId, controlKey:effectRow?.control?.key, season:effectRow?.treated?.season,
    week:effectRow?.treated?.week, treatedKey:key, effect:n(effectRow?.effect?.treatedMinusControlResidual), players:Object.freeze(players),
    absenceCount:players.length, deltaSum:players.reduce((a,x)=>a+(finite(x.expectedReplacementDelta)?n(x.expectedReplacementDelta):0),0),
  }));
}

const single=records.filter(r=>r.absenceCount===1);
const byPositionFamily={};
for(const family of ["QB","OL","SKILL","FRONT7","SECONDARY","OTHER"]){
  const rows=single.filter(r=>r.players[0].positionFamily===family);
  byPositionFamily[family]=Object.freeze({...summarize(rows), uncertainty:clusterBootstrapMean(rows,{seed:2200100+Object.keys(byPositionFamily).length})});
}
const byDepthRole={};
for(const role of ["DEPTH_RANK_1","DEPTH_RANK_2","UNRESOLVED"]){
  const rows=single.filter(r=>r.players[0].roleClass===role);
  byDepthRole[role]=Object.freeze({...summarize(rows), uncertainty:clusterBootstrapMean(rows,{seed:2200200+Object.keys(byDepthRole).length})});
}
const byAbsenceCount={};
for(const count of [1,2,3,4]){const rows=records.filter(r=>r.absenceCount===count);byAbsenceCount[count]=Object.freeze({...summarize(rows),uncertainty:clusterBootstrapMean(rows,{seed:2200300+count})});}
const byStatus={};
for(const status of ["OUT","DOUBTFUL"]){const rows=single.filter(r=>r.players[0].status===status);byStatus[status]=Object.freeze({...summarize(rows),uncertainty:clusterBootstrapMean(rows,{seed:2200400+(status==="OUT"?1:2)})});}

const rank1Single=single.filter(r=>r.players[0].roleClass==="DEPTH_RANK_1");
const rank2Single=single.filter(r=>r.players[0].roleClass==="DEPTH_RANK_2");
const qbSingle=single.filter(r=>r.players[0].positionFamily==="QB");
const front7Single=single.filter(r=>r.players[0].positionFamily==="FRONT7");
const secondarySingle=single.filter(r=>r.players[0].positionFamily==="SECONDARY");

const report=Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-POSITION-ROLE-DEPENDENCY-SENSITIVITY-REPORT-1.0.0",
  sprint:"2.20.0-RC1",mode:"READ_ONLY_POSITION_ROLE_DEPENDENCY_SENSITIVITY_AUDIT",
  decision:"POSITION_ROLE_SIGNAL_DESCRIPTIVE_DEPENDENCY_EVIDENCE_BLOCKED_HOLD_SHADOW",
  source:Object.freeze({observationCount:observations.length,replacementRecordCount:replacements.length,matchedEffectCount:effects.length,sensitivityRecordCount:records.length,singleAbsenceCount:single.length}),
  reconciliation:Object.freeze({missingObservationJoin,missingReplacementJoin,missingDepthRank,allMatchedEffectsReconciled:records.length===effects.length&&missingObservationJoin===0}),
  evidenceCoverage:Object.freeze({
    depthRankRecordCount:records.reduce((a,r)=>a+r.players.filter(p=>p.depthRank!=null).length,0),
    depthRank1Count:records.reduce((a,r)=>a+r.players.filter(p=>p.depthRank===1).length,0),
    depthRank2Count:records.reduce((a,r)=>a+r.players.filter(p=>p.depthRank===2).length,0),
    historicalUsagePresentCount:historicalUsagePresent,
    historicalTeamDependencyPresentCount:historicalDependencyPresent,
    dependencySensitivityTestable:historicalDependencyPresent>0,
    snapShareSensitivityTestable:historicalUsagePresent>0,
    roleSensitivityBoundary:"DEPTH_CHART_RANK_IS_EVIDENCE_BACKED_ROLE_PROXY_ONLY; NOT A LEARNED ROLE COEFFICIENT",
  }),
  descriptive:Object.freeze({overall:summarize(records),byPositionFamily:Object.freeze(byPositionFamily),byDepthRole:Object.freeze(byDepthRole),byAbsenceCount:Object.freeze(byAbsenceCount),byStatus:Object.freeze(byStatus)}),
  supportChecks:Object.freeze({
    qbSingleSample:qbSingle.length,front7SingleSample:front7Single.length,secondarySingleSample:secondarySingle.length,
    depthRank1SingleSample:rank1Single.length,depthRank2SingleSample:rank2Single.length,
    positionFamiliesWithAtLeast15SingleAbsences:Object.entries(byPositionFamily).filter(([,v])=>v.count>=15).map(([k])=>k),
    positionFamiliesWithAtLeast30SingleAbsences:Object.entries(byPositionFamily).filter(([,v])=>v.count>=30).map(([k])=>k),
  }),
  interpretation:Object.freeze({
    positionSignalIsDescriptiveOnly:true,depthRankRoleSignalIsDescriptiveOnly:true,multipleAbsenceSignalIsDescriptiveOnly:true,
    dependencySignalNotEstimated:historicalDependencyPresent===0,snapShareSignalNotEstimated:historicalUsagePresent===0,
    noPositionCoefficientAuthorized:true,noRoleCoefficientAuthorized:true,noDependencyCoefficientAuthorized:true,
    reason:"Historical matched cohort supports descriptive position/depth-rank/multi-absence sensitivity. Canonical historical team-dependency and usage/snap-share fields are absent from the calibration observations, so those dimensions cannot be responsibly estimated in this sprint."
  }),
  readiness:Object.freeze({
    positionSensitivityAuditComplete:true,roleProxySensitivityAuditComplete:true,multiAbsenceSensitivityAuditComplete:true,
    teamDependencySensitivityComplete:false,historicalDependencyEvidenceCompletionRequired:true,
    holdoutValidationMayAdvanceForCurrentDescriptiveDimensions:true,fullPlayerImpactTransformationReadyForHoldout:false,
    calibrationAuthorized:false,productionImpactPolicyAuthorized:false,
  }),
  safeguards:Object.freeze({sourceDatasetsMutated:false,matchedDesignMutated:false,causalEstimandMutated:false,learnedProductionWeightCreated:false,playerCoefficientAuthorized:false,positionCoefficientAuthorized:false,roleCoefficientAuthorized:false,dependencyCoefficientAuthorized:false,teamStrengthPointValueAuthorized:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false,shadowOnlyPreserved:true})
});
console.log(JSON.stringify(report,null,2));
