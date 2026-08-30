import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HISTORICAL = path.join(ROOT,"data","calibration","historical","v1","observations-availability.jsonl");
const EXCLUDED = new Set(["node_modules",".git","dist","build","coverage"]);
const MAX_BYTES = 75 * 1024 * 1024;

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(x=>{try{return JSON.parse(x)}catch{return null}}).filter(Boolean);
}
function first(...xs){for(const x of xs) if(x!==null&&x!==undefined&&x!=="") return x; return null;}
function norm(v){if(v===null||v===undefined)return null; const s=String(v).trim().toUpperCase(); return s||null;}
function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
function seasonOf(row){const v=first(row?.season,row?.identity?.season,row?.game?.season); return finite(v)?Number(v):null;}
function weekOf(row){const v=first(row?.week,row?.identity?.week,row?.game?.week); return finite(v)?Number(v):null;}
function teamOf(row){const v=first(row?.team,row?.identity?.team,row?.game?.team); return v?String(v).toUpperCase():null;}
function gameIdOf(row){const v=first(row?.gameId,row?.identity?.gameId,row?.game?.gameId); return v?String(v):null;}
function playersOf(row){
  const candidates=[row?.evidence?.availabilityImpact?.players,row?.availabilityImpact?.players,row?.players,row?.injuries];
  for(const p of candidates) if(Array.isArray(p)) return p;
  return [];
}
function playerId(p){return first(p?.playerId,p?.player_id,p?.gsisId,p?.gsis_id,p?.id);}
function statusOf(p){return norm(first(p?.reportStatus,p?.report_status,p?.designation,p?.injuryStatus,p?.gameStatus));}
function sourceOf(row){return first(row?.datasetGovernance?.availabilitySource,row?.availabilitySource,row?.source,row?.provider);}
function joinOf(row){return first(row?.datasetGovernance?.availabilityJoin,row?.availabilityJoin,row?.joinMode);}

function walk(dir,out=[]){
  if(!fs.existsSync(dir)) return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(EXCLUDED.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p,out);
    else if(/\.(jsonl|json)$/i.test(ent.name)){
      try{ if(fs.statSync(p).size<=MAX_BYTES) out.push(p); }catch{}
    }
  }
  return out;
}
function readRows(file){
  try{
    if(file.toLowerCase().endsWith('.jsonl')) return readJsonl(file);
    const x=JSON.parse(fs.readFileSync(file,'utf8'));
    if(Array.isArray(x)) return x;
    for(const k of ['records','observations','games','data','items']) if(Array.isArray(x?.[k])) return x[k];
  }catch{}
  return [];
}

const historicalRows=readJsonl(HISTORICAL);
const historicalPlayers=[];
for(const row of historicalRows){
  for(const p of playersOf(row)) historicalPlayers.push({row,p});
}
const histFields={
  sourceValues:[...new Set(historicalRows.map(sourceOf).filter(Boolean))],
  joinValues:[...new Set(historicalRows.map(joinOf).filter(Boolean))],
  reportStatuses:[...new Set(historicalPlayers.map(x=>statusOf(x.p)).filter(Boolean))].sort(),
  playerFieldCoverage:{
    playerId:historicalPlayers.filter(x=>playerId(x.p)).length,
    reportStatus:historicalPlayers.filter(x=>statusOf(x.p)).length,
    isOut:historicalPlayers.filter(x=>typeof x.p?.isOut==='boolean').length,
    isDoubtful:historicalPlayers.filter(x=>typeof x.p?.isDoubtful==='boolean').length,
    isQuestionable:historicalPlayers.filter(x=>typeof x.p?.isQuestionable==='boolean').length,
    dateModified:historicalPlayers.filter(x=>x.p?.dateModified).length,
    practiceStatus:historicalPlayers.filter(x=>x.p?.practiceStatus).length,
    reportPrimaryInjury:historicalPlayers.filter(x=>x.p?.reportPrimaryInjury).length
  }
};

const roots=[path.join(ROOT,'data'),path.join(ROOT,'src','data')];
const files=[...new Set(roots.flatMap(r=>walk(r)))].filter(f=>path.resolve(f)!==path.resolve(HISTORICAL));
const candidates=[];
for(const file of files){
  const rows=readRows(file);
  if(!rows.length) continue;
  const rows2025=rows.filter(r=>seasonOf(r)===2025);
  if(!rows2025.length) continue;
  let playerRows=0, withId=0, withStatus=0, out=0, doubtful=0, questionable=0, withDate=0, withPractice=0, withInjury=0;
  const sourceValues=new Set(), joinValues=new Set(), statuses=new Set();
  let identityRows=0;
  for(const row of rows2025){
    if(weekOf(row)!==null && teamOf(row) && gameIdOf(row)) identityRows++;
    const s=sourceOf(row); if(s) sourceValues.add(String(s));
    const j=joinOf(row); if(j) joinValues.add(String(j));
    for(const p of playersOf(row)){
      playerRows++;
      if(playerId(p)) withId++;
      const st=statusOf(p); if(st){withStatus++;statuses.add(st);}
      if(p?.isOut===true || st==='OUT') out++;
      if(p?.isDoubtful===true || st==='DOUBTFUL') doubtful++;
      if(p?.isQuestionable===true || st==='QUESTIONABLE') questionable++;
      if(p?.dateModified) withDate++;
      if(p?.practiceStatus) withPractice++;
      if(p?.reportPrimaryInjury) withInjury++;
    }
  }
  const nflverse=[...sourceValues].some(v=>/NFLVERSE/i.test(v)) || /nflverse/i.test(file);
  const equivalentCore = playerRows>0 && withId>0 && withStatus>0 && (out>0 || doubtful>0 || questionable>0);
  const safePregameSignals = withDate>0 || [...joinValues].some(v=>/SAFE|PREGAME|LATEST/i.test(v));
  let score=0;
  if(nflverse) score+=4; if(equivalentCore) score+=4; if(safePregameSignals) score+=2; if(identityRows>0) score+=2;
  candidates.push({file:path.relative(ROOT,file),rows2025:rows2025.length,identityRows,playerRows,withId,withStatus,out,doubtful,questionable,withDate,withPractice,withInjury,sourceValues:[...sourceValues],joinValues:[...joinValues],reportStatuses:[...statuses].sort(),nflverseSignal:nflverse,equivalentCoreFieldsPresent:equivalentCore,safePregameSignalsPresent:safePregameSignals,score});
}
candidates.sort((a,b)=>b.score-a.score||b.playerRows-a.playerRows||a.file.localeCompare(b.file));
const qualified=candidates.filter(c=>c.nflverseSignal&&c.equivalentCoreFieldsPresent&&c.safePregameSignalsPresent&&c.identityRows>0);
const near=candidates.filter(c=>c.score>=6&&!qualified.includes(c));
const checks={
  historicalSourceExists:fs.existsSync(HISTORICAL),
  historicalPlayerRowsPresent:historicalPlayers.length>0,
  historicalOutDoubtfulQuestionableFieldsObserved:['OUT','DOUBTFUL','QUESTIONABLE'].every(s=>histFields.reportStatuses.includes(s)),
  repository2025CandidatesFound:candidates.length>0,
  equivalent2025NFLVerseCandidateFound:qualified.length>0,
  qualifiedCandidateHasPregameSafetySignal:qualified.some(c=>c.safePregameSignalsPresent),
  outcomesUsedForQualification:false,
  treatmentDefinitionChanged:false
};
let decision='NO_EQUIVALENT_2025_SOURCE_FOUND';
if(qualified.length===1) decision='ONE_EQUIVALENT_2025_SOURCE_CANDIDATE_IDENTIFIED_FOR_GOVERNANCE_REVIEW';
else if(qualified.length>1) decision='MULTIPLE_EQUIVALENT_2025_SOURCE_CANDIDATES_REQUIRE_SELECTION_REVIEW';
else if(near.length) decision='2025_SOURCE_CANDIDATES_FOUND_BUT_EQUIVALENCE_NOT_YET_ESTABLISHED';

console.log(JSON.stringify({
  contractVersion:'FIE-NFL-2025-EQUIVALENT-AVAILABILITY-SOURCE-AUDIT-1.0.0',
  sprint:'2.18.23-RC9',
  mode:'READ_ONLY_EQUIVALENT_SOURCE_AUDIT',
  historicalReference:{file:path.relative(ROOT,HISTORICAL),rows:historicalRows.length,playerRows:historicalPlayers.length,...histFields},
  scan:{roots:roots.map(r=>path.relative(ROOT,r)),filesInspected:files.length,candidateFilesWith2025Rows:candidates.length},
  qualifiedCandidates:qualified.slice(0,20),
  nearCandidates:near.slice(0,20),
  allCandidates:candidates.slice(0,50),
  checks,
  decision,
  readiness:{
    equivalent2025SourceAuditComplete:true,
    equivalent2025SourceCandidateIdentified:qualified.length>0,
    equivalent2025SourceQualificationAuthorized:false,
    governed2025NormalizationAuthorized:false,
    governed2025TreatmentConstructionAuthorized:false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false
  },
  nextStep: qualified.length===1
    ? 'AUDIT_SELECTED_2025_SOURCE_SCHEMA_PROVENANCE_AND_PREGAME_CUTOFF_BEFORE_QUALIFICATION'
    : qualified.length>1
      ? 'COMPARE_QUALIFIED_2025_CANDIDATES_AND_SELECT_CANONICAL_EQUIVALENT_SOURCE'
      : 'TRACE_2025_AVAILABILITY_ACQUISITION_ARTIFACT_OR_BUILD_PATH_WITHOUT_NORMALIZING_DATA',
  safeguards:{
    repositoryFilesMutated:false,databaseMutationMethodsInvoked:false,persistenceMode:'READ_ONLY',historicalBackfillPerformed:false,statusValuesInvented:false,questionablePromotedToTreatment:false,outcomesUsed:false,matchingChanged:false,attReestimated:false,uncertaintyReestimated:false,learnedWeightsCreated:false,calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false
  }
},null,2));
