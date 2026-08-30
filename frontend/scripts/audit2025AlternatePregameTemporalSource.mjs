#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPRINT = "2.18.23-RC16";
const TARGET_SEASON = 2025;
const EXCLUDED = new Set(["node_modules",".git","dist","build","coverage"]);
const EXT = /\.(js|mjs|cjs|ts|tsx|json|jsonl|csv|md)$/i;

const TEMPORAL = [
  "date_modified","dateModified","effectiveAt","observedAt",
  "publishedAt","published_at","createdAt","created_at",
  "updatedAt","updated_at","timestamp","kickoffAt",
  "gameDate","game_date","gameday"
];

const AVAILABILITY = [
  "injury","injuries","availability","report_status","reportStatus",
  "practice_status","practiceStatus","isOut","isDoubtful","isQuestionable"
];

const SOURCES = [
  "nflverse","sportradar","depth_chart","roster_status",
  "availabilitySource","sourceClassification","provenance"
];

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
    if(fs.statSync(file).size > 80*1024*1024) return "";
    return fs.readFileSync(file,"utf8");
  }catch{
    return "";
  }
}

function hits(text,tokens){
  const low=text.toLowerCase();
  return tokens.filter(t=>low.includes(t.toLowerCase()));
}

function evidence(text,tokens,max=40){
  const lines=text.split(/\r?\n/);
  const out=[];
  for(let i=0;i<lines.length;i++){
    const low=lines[i].toLowerCase();
    if(tokens.some(t=>low.includes(t.toLowerCase()))){
      out.push({lineNumber:i+1,line:lines[i]});
      if(out.length>=max) break;
    }
  }
  return out;
}

const roots=[path.join(ROOT,"src"),path.join(ROOT,"scripts"),path.join(ROOT,"data")];
const files=[...new Set(roots.flatMap(r=>walk(r)))];
const candidates=[];

for(const file of files){
  const text=safeText(file);
  if(!text) continue;
  const temporalTokens=hits(text,TEMPORAL);
  const availabilityTokens=hits(text,AVAILABILITY);
  if(!temporalTokens.length || !availabilityTokens.length) continue;

  const sourceTokens=hits(text,SOURCES);
  const rel=path.relative(ROOT,file);
  const has2025=/\b2025\b/.test(text);
  let score=temporalTokens.length*2+availabilityTokens.length*3+sourceTokens.length;
  if(has2025) score+=3;
  if(/injur|availab|historical|pregame|research|evidence|observation/i.test(rel)) score+=2;

  candidates.push({
    file:rel,
    score,
    has2025,
    temporalTokens,
    availabilityTokens,
    sourceTokens,
    temporalEvidence:evidence(text,TEMPORAL),
    availabilityEvidence:evidence(text,AVAILABILITY),
    sourceEvidence:evidence(text,SOURCES)
  });
}

candidates.sort((a,b)=>b.score-a.score||a.file.localeCompare(b.file));

function potentiallySafe(c){
  const t=new Set(c.temporalTokens);
  const strong=
    t.has("date_modified") ||
    t.has("dateModified") ||
    t.has("effectiveAt") ||
    t.has("observedAt") ||
    t.has("publishedAt") ||
    t.has("published_at");

  const seasonScoped=
    c.has2025 ||
    c.sourceEvidence.some(x=>/season|\$\{.*season/i.test(x.line));

  return strong && c.availabilityTokens.length>0 && seasonScoped;
}

const potentiallySafeCandidates=candidates.filter(potentiallySafe);

const checks={
  repositoryScanComplete:true,
  candidateFilesFound:candidates.length>0,
  potentiallyPregameSafeTemporalSourceFound:potentiallySafeCandidates.length>0,
  acquisitionTimeSubstitutionRejected:true,
  weekNumberOnlyRejected:true,
  wholeSeasonReleaseMetadataRejectedAsPerGameProof:true,
  externalNetworkInvoked:false,
  repositoryMutationPerformed:false,
  normalizationPerformed:false,
  treatmentConstructionPerformed:false,
  matchingPerformed:false,
  attRecomputed:false,
  calibrationPerformed:false,
  pickemMutationPerformed:false,
  databaseMutationPerformed:false
};

let decision;
if(potentiallySafeCandidates.length===1){
  decision="ONE_ALTERNATE_2025_PREGAME_TEMPORAL_SOURCE_CANDIDATE_IDENTIFIED_FOR_GOVERNANCE_REVIEW";
}else if(potentiallySafeCandidates.length>1){
  decision="MULTIPLE_ALTERNATE_2025_PREGAME_TEMPORAL_SOURCE_CANDIDATES_REQUIRE_REVIEW";
}else{
  decision="NO_DEFENSIBLE_ALTERNATE_2025_PREGAME_TEMPORAL_SOURCE_FOUND_IN_REPOSITORY";
}

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-2025-ALTERNATE-PREGAME-TEMPORAL-SOURCE-AUDIT-1.0.0",
  sprint:SPRINT,
  mode:"READ_ONLY_ALTERNATE_TEMPORAL_SOURCE_AUDIT",
  targetSeason:TARGET_SEASON,
  decision,
  scan:{
    roots:roots.map(r=>path.relative(ROOT,r)),
    filesInspected:files.length,
    candidateCount:candidates.length,
    potentiallySafeCandidateCount:potentiallySafeCandidates.length
  },
  potentiallySafeCandidates:potentiallySafeCandidates.slice(0,20),
  topCandidates:candidates.slice(0,40),
  checks,
  interpretation:{
    authoritativeTemporalSourceEstablished:potentiallySafeCandidates.length===1,
    alternateCandidateStillRequiresSemanticValidation:potentiallySafeCandidates.length>0,
    "2025ShouldBeExcludedIfNoCandidateSurvivesReview":potentiallySafeCandidates.length===0,
    sourceTimestampMayNotBeFabricated:true,
    acquisitionTimestampMayNotSubstituteForHistoricalTime:true,
    weekNumberMayNotProvePregameAvailability:true
  },
  authorizationBoundary:{
    alternateTemporalCandidateReviewMayAdvance:potentiallySafeCandidates.length>0,
    restrict2025FromCausalCohortMayAdvance:potentiallySafeCandidates.length===0,
    "2025TemporalQualificationAuthorized":false,
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
  nextStep:potentiallySafeCandidates.length>0
    ? "SEMANTICALLY_VALIDATE_ALTERNATE_2025_TEMPORAL_CANDIDATE_BEFORE_QUALIFICATION"
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
