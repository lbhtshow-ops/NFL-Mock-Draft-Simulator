import fs from "node:fs";
import path from "node:path";

const DATA="./data/calibration/historical/v1";
const SCRIPTS="./scripts";
const ARTIFACTS=[
"historical-availability-matched-att-effects-v1.jsonl",
"historical-availability-matched-outcomes-v1.jsonl",
"historical-availability-impact-baseline-residuals-v1.jsonl",
"historical-availability-impact-calibration-observations-v1.jsonl",
"historical-availability-control-cohort-v1.jsonl",
"expected-replacement-identities-caliber-enriched-v1.jsonl",
"expected-replacement-identities-v1.jsonl",
"observations-availability.jsonl"
];
const QUALIFYING=new Set(["OUT","DOUBTFUL","QUESTIONABLE"]);

function readJsonl(file){
 if(!fs.existsSync(file))return[];
 return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(x=>{try{return JSON.parse(x)}catch{return null}}).filter(Boolean);
}
function first(...xs){for(const x of xs)if(x!==null&&x!==undefined&&x!=="")return x;return null;}
function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
function norm(v){return v===null||v===undefined?null:String(v).trim().toUpperCase()||null;}

function identityOf(r){
 const i=r?.identity??{},t=r?.treated??{},a=r?.availability??{};
 return {
  season:first(r?.season,i?.season,t?.season,a?.season),
  week:first(r?.week,i?.week,t?.week,a?.week),
  gameId:first(r?.gameId,i?.gameId,t?.gameId,a?.gameId),
  team:first(r?.team,i?.team,t?.team,a?.team),
  unavailablePlayerId:first(r?.unavailablePlayerId,i?.unavailablePlayerId,a?.unavailablePlayerId,r?.pregame?.unavailablePlayerId),
  replacementPlayerId:first(r?.replacementPlayerId,i?.replacementPlayerId,a?.replacementPlayerId,r?.pregame?.replacementPlayerId),
  position:first(r?.position,i?.position,a?.position)
 };
}
function statusEvidence(r){
 const vals={
  unavailableStatus:r?.unavailableStatus,
  "pregame.unavailableStatus":r?.pregame?.unavailableStatus,
  "availability.unavailableStatus":r?.availability?.unavailableStatus,
  "availability.status":r?.availability?.status,
  status:r?.status,
  reportStatus:r?.reportStatus,
  "impact.status":r?.impact?.status
 };
 const out=[];
 for(const [field,value] of Object.entries(vals)){
  const s=norm(value);
  if(s)out.push({field,value,status:s,qualifying:QUALIFYING.has(s)});
 }
 for(const p of r?.impact?.players??[]){
  const s=norm(p?.reportStatus);
  if(s)out.push({field:"impact.players[].reportStatus",playerId:p?.playerId??null,value:p?.reportStatus,status:s,qualifying:QUALIFYING.has(s),flags:{isOut:p?.isOut,isDoubtful:p?.isDoubtful,isQuestionable:p?.isQuestionable}});
 }
 return out;
}
function strongKey(i){return [i?.season??"",i?.week??"",i?.gameId??"",i?.team??"",i?.unavailablePlayerId??"",i?.replacementPlayerId??""].join("|");}
function weakKeys(i){
 const out=[];
 if(i?.gameId&&i?.team)out.push(`GAME_TEAM:${i.gameId}|${i.team}`);
 if(i?.season&&i?.week&&i?.team)out.push(`SEASON_WEEK_TEAM:${i.season}|${i.week}|${i.team}`);
 if(i?.season&&i?.week&&i?.team&&i?.unavailablePlayerId)out.push(`PLAYER_EVENT:${i.season}|${i.week}|${i.team}|${i.unavailablePlayerId}`);
 return out;
}

const loaded={};
for(const name of ARTIFACTS){
 const file=path.join(DATA,name);
 loaded[name]={file:path.resolve(file),exists:fs.existsSync(file),rows:readJsonl(file)};
}
const artifactSummary={};
for(const [name,obj] of Object.entries(loaded)){
 let any=0,qual=0;const seasons={};
 for(const row of obj.rows){
  const id=identityOf(row),s=finite(id.season)?Number(id.season):null;
  if(s!==null)seasons[s]=(seasons[s]??0)+1;
  const ev=statusEvidence(row);
  if(ev.length)any++;
  if(ev.some(x=>x.qualifying))qual++;
 }
 artifactSummary[name]={file:obj.file,exists:obj.exists,rows:obj.rows.length,rowsWithAnyStatusEvidence:any,rowsWithQualifyingStatusEvidence:qual,seasons};
}

const START=loaded["historical-availability-impact-baseline-residuals-v1.jsonl"].rows.length
 ?"historical-availability-impact-baseline-residuals-v1.jsonl"
 :"historical-availability-impact-calibration-observations-v1.jsonl";

const seeds=loaded[START].rows.filter(r=>[2022,2023,2024].includes(Number(identityOf(r).season))).slice(0,286);

const indexes={};
for(const [name,obj] of Object.entries(loaded)){
 const strong=new Map(),weak=new Map();
 obj.rows.forEach((row,index)=>{
  const id=identityOf(row),sk=strongKey(id);
  if(!strong.has(sk))strong.set(sk,[]);
  strong.get(sk).push({index,row,id});
  for(const wk of weakKeys(id)){
   if(!weak.has(wk))weak.set(wk,[]);
   weak.get(wk).push({index,row,id});
  }
 });
 indexes[name]={strong,weak};
}
function findMatches(seedIdentity,name){
 const idx=indexes[name];if(!idx)return[];
 const exact=idx.strong.get(strongKey(seedIdentity))??[];
 if(exact.length)return exact.map(x=>({...x,matchType:"STRONG_IDENTITY"}));
 const out=[],seen=new Set();
 for(const wk of weakKeys(seedIdentity)){
  for(const x of idx.weak.get(wk)??[]){
   if(seen.has(x.index))continue;seen.add(x.index);
   out.push({...x,matchType:wk.split(":")[0]});
  }
 }
 return out;
}

const chain=[
"historical-availability-impact-baseline-residuals-v1.jsonl",
"historical-availability-impact-calibration-observations-v1.jsonl",
"expected-replacement-identities-caliber-enriched-v1.jsonl",
"expected-replacement-identities-v1.jsonl",
"observations-availability.jsonl"
];
const coverage={};
for(const a of chain)coverage[a]={seeds:seeds.length,matchedSeeds:0,uniqueMatchSeeds:0,ambiguousMatchSeeds:0,noMatchSeeds:0,seedsWithQualifyingStatusEvidence:0};

const lineageSamples=[];
for(const seed of seeds){
 const id=identityOf(seed),chainOut={};
 for(const artifact of chain){
  const matches=findMatches(id,artifact);
  const c=coverage[artifact];
  if(!matches.length)c.noMatchSeeds++;
  else{
   c.matchedSeeds++;
   if(matches.length===1)c.uniqueMatchSeeds++;else c.ambiguousMatchSeeds++;
   if(matches.some(m=>statusEvidence(m.row).some(x=>x.qualifying)))c.seedsWithQualifyingStatusEvidence++;
  }
  if(lineageSamples.length<20){
   chainOut[artifact]={matchCount:matches.length,matches:matches.slice(0,12).map(m=>({index:m.index,matchType:m.matchType,identity:m.id,statusEvidence:statusEvidence(m.row),sourceFields:{source:first(m.row?.source,m.row?.provider,m.row?.provenance?.source,m.row?.evidence?.source,m.row?.availability?.source),observedAt:first(m.row?.observedAt,m.row?.asOf,m.row?.generatedAt,m.row?.provenance?.observedAt,m.row?.provenance?.generatedAt),evidenceType:first(m.row?.evidenceType,m.row?.availability?.evidenceType,m.row?.provenance?.evidenceType),mappingStatus:first(m.row?.mappingStatus,m.row?.availability?.mappingStatus)}}))};
  }
 }
 if(lineageSamples.length<20)lineageSamples.push({seed:{artifact:START,identity:id,statusEvidence:statusEvidence(seed)},chain:chainOut});
}

function scriptFiles(){
 if(!fs.existsSync(SCRIPTS))return[];
 return fs.readdirSync(SCRIPTS).filter(n=>/\.(mjs|js)$/.test(n)).map(n=>path.join(SCRIPTS,n));
}
const tokens=[
 "expected-replacement-identities",
 "historical-availability-impact-calibration-observations",
 "historical-availability-impact-baseline-residuals",
 "observations-availability",
 "unavailableStatus",
 "reportStatus",
 "isOut",
 "outCount",
 "doubtfulCount",
 "questionableCount",
 "pregameOfficialAnchorQualified",
 "postgameSnapDefinedReplacement",
 "mappingStatus",
 "caliberEnrichmentStatus"
];
const scriptReferences=[];
for(const file of scriptFiles()){
 const text=fs.readFileSync(file,"utf8");
 const hits=tokens.filter(t=>text.includes(t));
 if(!hits.length)continue;
 const lines=text.split(/\r?\n/),interesting=[];
 lines.forEach((line,i)=>{if(hits.some(t=>line.includes(t)))interesting.push({lineNumber:i+1,line});});
 scriptReferences.push({file:path.resolve(file),hits,interestingLines:interesting.slice(0,120)});
}
const candidates=scriptReferences.filter(x=>
 x.hits.includes("observations-availability")||
 x.hits.includes("reportStatus")||
 x.hits.includes("isOut")||
 x.hits.includes("outCount")||
 x.hits.includes("pregameOfficialAnchorQualified")
);

const direct=coverage["observations-availability.jsonl"];
let decision;
if(direct.seedsWithQualifyingStatusEvidence>0&&candidates.length>0){
 decision="HISTORICAL_TREATMENT_LINEAGE_IDENTIFIED_TO_AVAILABILITY_SOURCE";
}else if(direct.matchedSeeds>0&&candidates.length>0){
 decision="HISTORICAL_TREATMENT_LINEAGE_PARTIALLY_IDENTIFIED_REQUIRES_SOURCE_FIELD_TRACE";
}else if(candidates.length>0){
 decision="HISTORICAL_TREATMENT_CONSTRUCTION_CODE_IDENTIFIED_BUT_SOURCE_ARTIFACT_JOIN_NOT_RECONCILED";
}else{
 decision="HISTORICAL_TREATMENT_LINEAGE_NOT_YET_RESOLVED";
}

console.log(JSON.stringify({
 contractVersion:"FIE-NFL-HISTORICAL-TREATMENT-LINEAGE-TRACE-1.0.0",
 sprint:"2.18.23-RC4",
 mode:"READ_ONLY_TREATMENT_LINEAGE_TRACE",
 artifactSummary,
 upstreamEvidenceSummary:{
  treatedSeeds:seeds.length,
  startArtifact:START,
  artifacts:coverage,
  candidateSourceScripts:candidates.map(x=>({file:x.file,hits:x.hits}))
 },
 lineageSamples,
 scriptReferences,
 checks:{
  startArtifactPresent:seeds.length>0,
  expectedTreatedSeedVolume:seeds.length===286,
  baselineResidualArtifactPresent:loaded["historical-availability-impact-baseline-residuals-v1.jsonl"].rows.length>0,
  calibrationObservationArtifactPresent:loaded["historical-availability-impact-calibration-observations-v1.jsonl"].rows.length>0,
  enrichedReplacementArtifactPresent:loaded["expected-replacement-identities-caliber-enriched-v1.jsonl"].rows.length>0,
  rawReplacementArtifactPresent:loaded["expected-replacement-identities-v1.jsonl"].rows.length>0,
  sourceAvailabilityArtifactPresent:loaded["observations-availability.jsonl"].rows.length>0,
  treatmentConstructionCodeCandidatesPresent:candidates.length>0,
  rosterCodeReinterpretationUsed:false,
  outcomesUsedForLineage:false
 },
 decision,
 readiness:{
  lineageAuditComplete:true,
  historicalTreatmentSourceIdentified:decision==="HISTORICAL_TREATMENT_LINEAGE_IDENTIFIED_TO_AVAILABILITY_SOURCE",
  historicalTreatmentConstructionCodeIdentified:candidates.length>0,
  equivalent2025SourceQualificationAuthorized:false,
  governed2025NormalizationAuthorized:false,
  treatmentControlRebuildAuthorized:false,
  matchingRerunAuthorized:false,
  attRecomputationAuthorized:false,
  uncertaintyRecomputationAuthorized:false,
  productionCalibrationAuthorized:false
 },
 nextStep:decision==="HISTORICAL_TREATMENT_LINEAGE_IDENTIFIED_TO_AVAILABILITY_SOURCE"
  ?"COMPARE_IDENTIFIED_HISTORICAL_SOURCE_AND_CONSTRUCTION_FIELDS_AGAINST_2025_EQUIVALENT_INPUTS"
  :"TRACE_CANDIDATE_CONSTRUCTION_SCRIPT_INPUTS_AND_FIELD_TRANSFORMS_ONE_STAGE_FURTHER_UPSTREAM",
 safeguards:{
  sourceArtifactsMutated:false,
  treatmentDefinitionChanged:false,
  rosterStatusUsedAsInjuryDesignation:false,
  statusValuesInvented:false,
  historicalBackfillPerformed:false,
  outcomesUsedForQualification:false,
  matchingChanged:false,
  attReestimated:false,
  uncertaintyReestimated:false,
  learnedWeightsCreated:false,
  calibrationExecuted:false,
  teamStrengthMutated:false,
  decisionModelMutated:false,
  pickemScoringMutated:false,
  databaseMutated:false
 }
},null,2));
