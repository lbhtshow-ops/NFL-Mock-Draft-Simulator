import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const SCRIPT_ROOT=path.join(ROOT,"scripts");
const SRC_ROOT=path.join(ROOT,"src");

const TOKENS=[
  "NFLVERSE_INJURIES",
  "nflverse",
  "injuries",
  "injury",
  "LATEST_SAFE_PLAYER_WEEK_REPORT",
  "availabilityImpact",
  "reportStatus",
  "isOut",
  "isDoubtful",
  "isQuestionable",
  "dateModified",
  "practiceStatus",
  "reportPrimaryInjury",
  "observations-availability.jsonl"
];

const EXT=/\.(mjs|js|ts|tsx|jsx)$/i;
const EXCLUDED=new Set(["node_modules",".git","dist","build","coverage"]);

function walk(dir,out=[]){
  if(!fs.existsSync(dir)) return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(EXCLUDED.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p,out);
    else if(EXT.test(ent.name)) out.push(p);
  }
  return out;
}

function score(text,file){
  let score=0;
  const hits=[];
  for(const t of TOKENS){
    if(text.toLowerCase().includes(t.toLowerCase())){
      hits.push(t);
      if(t==="NFLVERSE_INJURIES") score+=5;
      else if(t==="LATEST_SAFE_PLAYER_WEEK_REPORT") score+=5;
      else if(t==="observations-availability.jsonl") score+=5;
      else if(t==="availabilityImpact") score+=4;
      else if(["reportStatus","isOut","isDoubtful","isQuestionable"].includes(t)) score+=3;
      else score+=1;
    }
  }
  if(/injur/i.test(path.basename(file))) score+=4;
  if(/availab/i.test(path.basename(file))) score+=3;
  if(/historical/i.test(path.basename(file))) score+=2;
  return {score,hits};
}

const files=[...walk(SCRIPT_ROOT),...walk(SRC_ROOT)];
const refs=[];

for(const file of files){
  let text="";
  try{text=fs.readFileSync(file,"utf8");}catch{continue;}
  const {score:sc,hits}=score(text,file);
  if(!hits.length) continue;

  const lines=text.split(/\r?\n/);
  const interesting=[];
  lines.forEach((line,index)=>{
    if(TOKENS.some(t=>line.toLowerCase().includes(t.toLowerCase()))){
      interesting.push({lineNumber:index+1,line});
    }
  });

  const urls=[
    ...text.matchAll(/https?:\/\/[^"'`\s)]+/g)
  ].map(m=>m[0]);

  const dataPaths=[
    ...text.matchAll(/["'`]([^"'`]*(?:injur|availab)[^"'`]*\.(?:csv|csv\.gz|json|jsonl|parquet))["'`]/gi)
  ].map(m=>m[1]);

  const seasonPatterns=[
    ...text.matchAll(/season\s*[:=]\s*(?:Number\()?([A-Za-z0-9_.?]+)/g)
  ].map(m=>m[1]);

  refs.push({
    file:path.relative(ROOT,file),
    score:sc,
    hits,
    urls:[...new Set(urls)].slice(0,30),
    dataPaths:[...new Set(dataPaths)].slice(0,30),
    seasonPatterns:[...new Set(seasonPatterns)].slice(0,20),
    interestingLines:interesting.slice(0,160)
  });
}

refs.sort((a,b)=>b.score-a.score||a.file.localeCompare(b.file));

const likelyAcquisition=refs.filter(x=>
  x.hits.includes("NFLVERSE_INJURIES") ||
  x.hits.includes("LATEST_SAFE_PLAYER_WEEK_REPORT") ||
  (
    x.hits.includes("nflverse") &&
    x.hits.includes("injuries")
  )
);

const historicalAvailabilityBuilders=refs.filter(x=>
  x.hits.includes("observations-availability.jsonl") ||
  x.hits.includes("availabilityImpact")
);

const externalSourceCandidates=likelyAcquisition
  .filter(x=>x.urls.length || x.dataPaths.length);

const season2025ExplicitRefs=refs.filter(x=>
  x.interestingLines.some(l=>/\b2025\b/.test(l.line))
);

const checks={
  acquisitionCodeCandidatesFound:likelyAcquisition.length>0,
  historicalAvailabilityBuilderCandidatesFound:historicalAvailabilityBuilders.length>0,
  externalSourceReferenceFound:externalSourceCandidates.length>0,
  explicit2025ReferenceFound:season2025ExplicitRefs.length>0,
  dataMutationPerformed:false,
  externalFetchPerformed:false,
  normalizationPerformed:false,
  outcomesUsed:false
};

let decision="ACQUISITION_LINEAGE_NOT_YET_IDENTIFIED";

if(
  checks.acquisitionCodeCandidatesFound &&
  checks.historicalAvailabilityBuilderCandidatesFound &&
  checks.externalSourceReferenceFound
){
  decision="HISTORICAL_NFLVERSE_INJURY_ACQUISITION_PATH_IDENTIFIED_FOR_2025_CAPABILITY_REVIEW";
}else if(
  checks.acquisitionCodeCandidatesFound &&
  checks.historicalAvailabilityBuilderCandidatesFound
){
  decision="HISTORICAL_ACQUISITION_CODE_IDENTIFIED_BUT_EXTERNAL_SOURCE_REFERENCE_NOT_RESOLVED";
}else if(checks.historicalAvailabilityBuilderCandidatesFound){
  decision="HISTORICAL_AVAILABILITY_BUILDER_IDENTIFIED_REQUIRES_UPSTREAM_FETCH_TRACE";
}

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-2025-AVAILABILITY-ACQUISITION-LINEAGE-AUDIT-1.0.0",
  sprint:"2.18.23-RC10",
  mode:"READ_ONLY_ACQUISITION_LINEAGE_AUDIT",

  scan:{
    scriptFilesInspected:files.length,
    referencesFound:refs.length
  },

  likelyAcquisition,
  historicalAvailabilityBuilders,
  externalSourceCandidates,
  season2025ExplicitRefs,

  checks,
  decision,

  readiness:{
    acquisitionLineageAuditComplete:true,

    historicalNFLVerseInjuryAcquisitionPathIdentified:
      decision==="HISTORICAL_NFLVERSE_INJURY_ACQUISITION_PATH_IDENTIFIED_FOR_2025_CAPABILITY_REVIEW",

    acquisitionPathMayAdvanceTo2025CapabilityAudit:
      decision==="HISTORICAL_NFLVERSE_INJURY_ACQUISITION_PATH_IDENTIFIED_FOR_2025_CAPABILITY_REVIEW",

    externalFetchAuthorized:false,
    "2025AcquisitionExecutionAuthorized":false,
    "2025NormalizationAuthorized":false,
    "2025TreatmentConstructionAuthorized":false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false
  },

  nextStep:
    decision==="HISTORICAL_NFLVERSE_INJURY_ACQUISITION_PATH_IDENTIFIED_FOR_2025_CAPABILITY_REVIEW"
      ? "AUDIT_IDENTIFIED_ACQUISITION_PATH_FOR_2025_SOURCE_AVAILABILITY_SCHEMA_AND_LEAKAGE_SAFE_CUTOFF_BEFORE_FETCH_EXECUTION"
      : decision==="HISTORICAL_ACQUISITION_CODE_IDENTIFIED_BUT_EXTERNAL_SOURCE_REFERENCE_NOT_RESOLVED"
        ? "TRACE_FETCH_ADAPTER_OR_SOURCE_URL_ONE_STAGE_UPSTREAM"
        : "INSPECT_TOP_HISTORICAL_AVAILABILITY_BUILDER_REFERENCES_AND_RESOLVE_THEIR_INPUT_ADAPTERS",

  safeguards:{
    repositoryFilesMutated:false,
    externalNetworkRequestExecuted:false,
    databaseMutationMethodsInvoked:false,
    persistenceMode:"READ_ONLY",
    historicalBackfillPerformed:false,
    statusValuesInvented:false,
    treatmentDefinitionChanged:false,
    questionablePromotedToTreatment:false,
    outcomesUsed:false,
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
