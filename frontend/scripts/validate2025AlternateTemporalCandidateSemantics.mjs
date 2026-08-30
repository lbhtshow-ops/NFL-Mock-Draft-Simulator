#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.23-RC17";
const TARGET_SEASON = 2025;
const EXCLUDED = new Set(["node_modules",".git","dist","build","coverage"]);
const EXT = /\.(json|jsonl|js|mjs|cjs|ts|tsx)$/i;

const SOURCE_PROVENANCE_VALUES = ["NFLVERSE_INJURIES","nflverse","SPORTRADAR"];
const TEMPORAL_FIELDS = ["dateModified","date_modified","effectiveAt","observedAt","publishedAt","published_at"];
const STATUS_FIELDS = ["reportStatus","report_status","status"];
const PRACTICE_FIELDS = ["practiceStatus","practice_status"];
const ID_FIELDS = ["playerId","player_id","gsis_id"];
const TEAM_FIELDS = ["team","teamCode","club"];

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

function safeText(file){
  try{
    if(fs.statSync(file).size>100*1024*1024) return "";
    return fs.readFileSync(file,"utf8");
  }catch{return "";}
}

function getAny(obj,fields){
  for(const f of fields){
    if(obj && Object.prototype.hasOwnProperty.call(obj,f)) return obj[f];
  }
  return undefined;
}

function temporalValue(obj){
  for(const f of TEMPORAL_FIELDS){
    if(obj && obj[f]!=null && String(obj[f]).trim()!==""){
      const d=new Date(obj[f]);
      if(!Number.isNaN(d.getTime())) return {field:f,value:String(obj[f])};
    }
  }
  return null;
}

function provenanceSignals(obj,lineText){
  const vals=[];
  const add=v=>{ if(v!=null && !vals.includes(String(v))) vals.push(String(v)); };

  if(obj && typeof obj==="object"){
    add(obj.source); add(obj.provider); add(obj.availabilitySource);
    add(obj.sourceClassification); add(obj.provenance?.availabilitySource);
    add(obj.provenance?.source); add(obj.provenance?.provider);
  }

  for(const token of SOURCE_PROVENANCE_VALUES){
    if(String(lineText).toLowerCase().includes(token.toLowerCase())) add(token);
  }
  return vals;
}

function isDerivedArtifactPath(rel){
  return /(control-cohort|matched|matching|att|uncertainty|calibration|residual|report|audit|diagnostic|selection)/i.test(rel);
}

function isLikelySourceArtifactPath(rel){
  return /(source|acquisition|observation|availability|injur|research|evidence)/i.test(rel) &&
    !isDerivedArtifactPath(rel);
}

function inspectObject(obj,rel,lineNumber,lineText){
  if(!obj || typeof obj!=="object") return null;

  const season=obj.season ?? obj.identity?.season ?? null;
  if(Number(season)!==TARGET_SEASON) return null;

  const week=obj.week ?? obj.identity?.week ?? null;
  const team=getAny(obj,TEAM_FIELDS) ?? obj.identity?.team ?? null;
  const playerId=getAny(obj,ID_FIELDS) ?? obj.player?.id ?? null;
  const status=String(getAny(obj,STATUS_FIELDS) ?? obj.availability?.status ?? "").toUpperCase();
  const practiceStatus=getAny(obj,PRACTICE_FIELDS) ?? obj.availability?.practiceStatus ?? null;

  const temporal=temporalValue(obj) ?? temporalValue(obj.availability) ?? temporalValue(obj.provenance);
  const provenance=provenanceSignals(obj,lineText);

  const hasSourceProvenance=provenance.some(v=>
    SOURCE_PROVENANCE_VALUES.some(token=>String(v).toLowerCase().includes(token.toLowerCase()))
  );

  const hasAvailabilitySemantics=
    ["OUT","DOUBTFUL","QUESTIONABLE","NOTE"].includes(status) ||
    practiceStatus!=null ||
    /injur|availability/i.test(String(lineText));

  const directRecordIdentity=week!=null && team!=null && playerId!=null;
  const sameRecordTemporal=Boolean(temporal);
  const derivedArtifact=isDerivedArtifactPath(rel);
  const likelySourceArtifact=isLikelySourceArtifactPath(rel);

  const directCandidate=
    directRecordIdentity &&
    hasAvailabilitySemantics &&
    sameRecordTemporal &&
    hasSourceProvenance &&
    likelySourceArtifact &&
    !derivedArtifact;

  let classification="NONQUALIFYING_2025_REFERENCE";
  if(directCandidate) classification="DIRECT_2025_SOURCE_DERIVED_TEMPORAL_CANDIDATE";
  else if(directRecordIdentity && hasAvailabilitySemantics && sameRecordTemporal && derivedArtifact)
    classification="DERIVED_2025_TEMPORAL_RECORD";
  else if(hasAvailabilitySemantics && sameRecordTemporal)
    classification="INCOMPLETE_2025_TEMPORAL_RECORD";

  return {
    file:rel,
    lineNumber,
    classification,
    identity:{season:Number(season),week,team,playerId},
    availability:{status:status||null,practiceStatus},
    temporal,
    provenance,
    semantics:{
      directRecordIdentity,
      hasAvailabilitySemantics,
      sameRecordTemporal,
      hasSourceProvenance,
      likelySourceArtifact,
      derivedArtifact,
      directCandidate
    }
  };
}

function inspectFile(file,rel){
  const text=safeText(file);
  if(!text) return [];

  if(/\.jsonl$/i.test(rel)){
    return text.split(/\r?\n/).flatMap((line,i)=>{
      const t=line.trim();
      if(!t.startsWith("{")) return [];
      try{
        const obj=JSON.parse(t);
        const hit=inspectObject(obj,rel,i+1,line);
        return hit?[hit]:[];
      }catch{return [];}
    });
  }

  if(/\.json$/i.test(rel)){
    try{
      const parsed=JSON.parse(text);
      const out=[];
      const queue=[parsed];
      let visited=0;
      while(queue.length && visited<250000){
        const cur=queue.shift();
        visited++;
        if(Array.isArray(cur)){ queue.push(...cur); continue; }
        if(cur && typeof cur==="object"){
          const hit=inspectObject(cur,rel,null,JSON.stringify(cur));
          if(hit) out.push(hit);
          for(const v of Object.values(cur)) if(v && typeof v==="object") queue.push(v);
        }
      }
      return out;
    }catch{return [];}
  }

  const low=text.toLowerCase();
  if(/\b2025\b/.test(text) && /injur|availability|report_status|reportStatus/i.test(text) &&
     TEMPORAL_FIELDS.some(f=>low.includes(f.toLowerCase()))){
    return [{
      file:rel,
      lineNumber:null,
      classification:"CODE_REFERENCE_ONLY",
      identity:{season:2025,week:null,team:null,playerId:null},
      availability:{status:null,practiceStatus:null},
      temporal:null,
      provenance:provenanceSignals(null,text),
      semantics:{
        directRecordIdentity:false,
        hasAvailabilitySemantics:true,
        sameRecordTemporal:false,
        hasSourceProvenance:SOURCE_PROVENANCE_VALUES.some(t=>low.includes(t.toLowerCase())),
        likelySourceArtifact:isLikelySourceArtifactPath(rel),
        derivedArtifact:isDerivedArtifactPath(rel),
        directCandidate:false
      }
    }];
  }

  return [];
}

const roots=[
  path.join(ROOT,"data"),
  path.join(ROOT,"src","data"),
  path.join(ROOT,"src","engines"),
  path.join(ROOT,"scripts")
];

const files=[...new Set(roots.flatMap(r=>walk(r)))];
const records=[];

for(const file of files){
  records.push(...inspectFile(file,path.relative(ROOT,file)));
}

const directCandidates=records.filter(r=>r.classification==="DIRECT_2025_SOURCE_DERIVED_TEMPORAL_CANDIDATE");
const derivedRecords=records.filter(r=>r.classification==="DERIVED_2025_TEMPORAL_RECORD");
const incompleteRecords=records.filter(r=>r.classification==="INCOMPLETE_2025_TEMPORAL_RECORD");
const codeReferences=records.filter(r=>r.classification==="CODE_REFERENCE_ONLY");

let decision;
if(directCandidates.length>0){
  decision="AUTHORITATIVE_2025_SOURCE_DERIVED_TEMPORAL_CANDIDATE_IDENTIFIED_FOR_QUALIFICATION_DESIGN_REVIEW";
}else if(derivedRecords.length>0 || incompleteRecords.length>0 || codeReferences.length>0){
  decision="ONLY_DERIVED_OR_INCOMPLETE_2025_TEMPORAL_CANDIDATES_SURVIVE_SEMANTIC_VALIDATION";
}else{
  decision="NO_2025_TEMPORAL_RECORD_CANDIDATES_SURVIVE_SEMANTIC_VALIDATION";
}

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-2025-ALTERNATE-TEMPORAL-CANDIDATE-SEMANTIC-VALIDATION-1.0.0",
  sprint:SPRINT,
  mode:"READ_ONLY_SEMANTIC_VALIDATION",
  targetSeason:TARGET_SEASON,
  decision,
  scan:{
    roots:roots.map(r=>path.relative(ROOT,r)),
    filesInspected:files.length,
    semanticRecordCount:records.length,
    directCandidateCount:directCandidates.length,
    derivedRecordCount:derivedRecords.length,
    incompleteRecordCount:incompleteRecords.length,
    codeReferenceCount:codeReferences.length,
    uniqueDirectCandidateFiles:[...new Set(directCandidates.map(r=>r.file))]
  },
  directSourceDerivedCandidates:directCandidates.slice(0,100),
  derivedTemporalRecords:derivedRecords.slice(0,50),
  incompleteTemporalRecords:incompleteRecords.slice(0,50),
  codeReferenceEvidence:codeReferences.slice(0,30),
  checks:{
    semanticScanComplete:true,
    direct2025SourceDerivedTemporalCandidatesFound:directCandidates.length>0,
    derived2025TemporalRecordsFound:derivedRecords.length>0,
    codeReferencesCannotAuthorizeQualification:true,
    derivedArtifactsCannotAuthorizeQualification:true,
    sameRecordSeasonRequired:true,
    sameRecordWeekTeamPlayerRequired:true,
    sameRecordTemporalFieldRequired:true,
    sourceProvenanceRequired:true,
    timestampFabricationProhibited:true,
    acquisitionTimeSubstitutionProhibited:true,
    normalizationPerformed:false,
    treatmentConstructionPerformed:false,
    matchingPerformed:false,
    attRecomputed:false,
    calibrationPerformed:false,
    pickemMutationPerformed:false,
    databaseMutationPerformed:false
  },
  interpretation:{
    authoritative2025TemporalSourceEstablished:directCandidates.length>0,
    directCandidateStillRequiresPregameCutoffValidation:directCandidates.length>0,
    derivedHistoricalArtifactsAreNotSourceProof:true,
    codeReferencesAreNotSourceProof:true,
    "2025ShouldBeRestrictedIfNoDirectCandidateSurvives":directCandidates.length===0
  },
  authorizationBoundary:{
    "2025TemporalQualificationContractMayAdvance":directCandidates.length>0,
    restrict2025FromCausalCohortMayAdvance:directCandidates.length===0,
    "2025NormalizationAuthorized":false,
    "2025TreatmentConstructionAuthorized":false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false,
    teamStrengthMutationAuthorized:false,
    decisionModelMutationAuthorized:false,
    pickemMutationAuthorized:false
  },
  nextStep:directCandidates.length>0
    ? "VALIDATE_DIRECT_2025_TEMPORAL_CANDIDATES_AGAINST_TEAM_GAME_KICKOFF_AND_DEFINE_TEMPORAL_QUALIFICATION_CONTRACT"
    : "FORMALLY_RESTRICT_2025_FROM_CAUSAL_AVAILABILITY_COHORT_AND_RESUME_PRODUCTION_POLICY_PATH",
  safeguards:{
    externalNetworkInvoked:false,
    repositoryFilesMutated:false,
    sourceSchemaReinterpreted:false,
    timestampFabricated:false,
    acquisitionTimeSubstituted:false,
    weekNumberUsedAsProofOfPregameAvailability:false,
    normalizationExecuted:false,
    treatmentConstructionExecuted:false,
    matchingExecuted:false,
    attEstimated:false,
    uncertaintyEstimated:false,
    calibrationExecuted:false,
    teamStrengthMutated:false,
    decisionModelMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false
  }
},null,2));
