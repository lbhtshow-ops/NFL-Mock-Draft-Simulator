import fs from "node:fs";
import path from "node:path";

const FRONTEND = ".";
const DATA_ROOT = "./data/calibration/historical/v1";
const SCRIPT_ROOT = "./scripts";
const TARGET_FILE = path.join(DATA_ROOT,"expected-replacement-identities-v1.jsonl");

const TOKENS = [
  "expected-replacement-identities-v1.jsonl",
  "expected-replacement-identities",
  "unavailableStatus",
  "pregameOfficialAnchorQualified",
  "postgameSnapDefinedReplacement",
  "replacementPlayerId",
  "mappingStatus",
  "evidenceType",
  "reportStatus",
  "isOut",
  "isDoubtful",
  "isQuestionable",
  "outCount",
  "doubtfulCount",
  "questionableCount",
  "observations-availability",
  "rosterDepth",
  "depthChart",
  "snap"
];

const QUALIFYING = new Set(["OUT","DOUBTFUL"]);

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line=>{
      try{return JSON.parse(line);}
      catch{return null;}
    })
    .filter(Boolean);
}

function walk(dir){
  if(!fs.existsSync(dir)) return [];
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function first(...values){
  for(const v of values){
    if(v!==null && v!==undefined && v!=="") return v;
  }
  return null;
}

function finite(v){
  return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v));
}

function norm(v){
  if(v===null || v===undefined) return null;
  const s=String(v).trim().toUpperCase();
  return s||null;
}

function identityOf(row){
  return {
    season:first(row?.season,row?.identity?.season,row?.availability?.season),
    week:first(row?.week,row?.identity?.week,row?.availability?.week),
    team:first(row?.team,row?.identity?.team,row?.availability?.team),
    unavailablePlayerId:first(
      row?.unavailablePlayerId,
      row?.identity?.unavailablePlayerId,
      row?.availability?.unavailablePlayerId
    ),
    replacementPlayerId:first(
      row?.replacementPlayerId,
      row?.identity?.replacementPlayerId,
      row?.availability?.replacementPlayerId
    ),
    position:first(row?.position,row?.identity?.position,row?.availability?.position)
  };
}

function strongKey(id){
  return [
    id?.season??"",
    id?.week??"",
    id?.team??"",
    id?.unavailablePlayerId??"",
    id?.replacementPlayerId??""
  ].join("|");
}

function playerEventKey(id){
  return [
    id?.season??"",
    id?.week??"",
    id?.team??"",
    id?.unavailablePlayerId??""
  ].join("|");
}

function statusOf(row){
  return norm(first(
    row?.unavailableStatus,
    row?.availability?.unavailableStatus,
    row?.pregame?.unavailableStatus,
    row?.status
  ));
}

function provenanceOf(row){
  return {
    evidenceType:first(
      row?.evidenceType,
      row?.replacementEvidenceType,
      row?.availability?.evidenceType
    ),
    mappingStatus:first(
      row?.mappingStatus,
      row?.availability?.mappingStatus
    ),
    unavailableDepthPosition:first(
      row?.unavailableDepthPosition,
      row?.availability?.unavailableDepthPosition
    ),
    unavailableDepthRank:first(
      row?.unavailableDepthRank,
      row?.availability?.unavailableDepthRank
    ),
    pregameOfficialAnchorQualified:first(
      row?.pregameOfficialAnchorQualified,
      row?.availability?.pregameOfficialAnchorQualified
    ),
    inferredFromRosterOrder:first(
      row?.inferredFromRosterOrder,
      row?.availability?.inferredFromRosterOrder
    ),
    postgameSnapDefinedReplacement:first(
      row?.postgameSnapDefinedReplacement,
      row?.availability?.postgameSnapDefinedReplacement
    ),
    source:first(
      row?.source,
      row?.provider,
      row?.provenance?.source,
      row?.availability?.source
    ),
    observedAt:first(
      row?.observedAt,
      row?.asOf,
      row?.generatedAt,
      row?.provenance?.observedAt,
      row?.provenance?.generatedAt
    )
  };
}

const targetRows = readJsonl(TARGET_FILE);

const targetSummary = {
  file:path.resolve(TARGET_FILE),
  exists:fs.existsSync(TARGET_FILE),
  rows:targetRows.length,
  bySeason:{},
  byStatus:{},
  byMappingStatus:{},
  byEvidenceType:{},
  pregameOfficialAnchorQualified:{
    true:0,false:0,null:0
  },
  postgameSnapDefinedReplacement:{
    true:0,false:0,null:0
  },
  inferredFromRosterOrder:{
    true:0,false:0,null:0
  }
};

for(const row of targetRows){
  const id=identityOf(row);
  const season=finite(id.season)?String(Number(id.season)):"UNKNOWN";
  const status=statusOf(row)??"UNKNOWN";
  const p=provenanceOf(row);

  targetSummary.bySeason[season]=(targetSummary.bySeason[season]??0)+1;
  targetSummary.byStatus[status]=(targetSummary.byStatus[status]??0)+1;
  targetSummary.byMappingStatus[p.mappingStatus??"UNKNOWN"]=
    (targetSummary.byMappingStatus[p.mappingStatus??"UNKNOWN"]??0)+1;
  targetSummary.byEvidenceType[p.evidenceType??"UNKNOWN"]=
    (targetSummary.byEvidenceType[p.evidenceType??"UNKNOWN"]??0)+1;

  const a=p.pregameOfficialAnchorQualified===true?"true":
          p.pregameOfficialAnchorQualified===false?"false":"null";
  targetSummary.pregameOfficialAnchorQualified[a]++;

  const s=p.postgameSnapDefinedReplacement===true?"true":
          p.postgameSnapDefinedReplacement===false?"false":"null";
  targetSummary.postgameSnapDefinedReplacement[s]++;

  const r=p.inferredFromRosterOrder===true?"true":
          p.inferredFromRosterOrder===false?"false":"null";
  targetSummary.inferredFromRosterOrder[r]++;
}

const scripts = walk(SCRIPT_ROOT)
  .filter(f=>/\.(mjs|js)$/.test(f));

const builderCandidates=[];

for(const file of scripts){
  const text=fs.readFileSync(file,"utf8");
  if(!text.includes("expected-replacement-identities")) continue;

  const hits=TOKENS.filter(t=>text.includes(t));
  const lines=text.split(/\r?\n/);
  const interesting=[];

  lines.forEach((line,index)=>{
    if(TOKENS.some(t=>line.includes(t))){
      interesting.push({lineNumber:index+1,line});
    }
  });

  const pathLiterals = [
    ...text.matchAll(/["'`](\.{0,2}\/[^"'`]+\.(?:jsonl|json|js))["'`]/g)
  ].map(m=>m[1]);

  builderCandidates.push({
    file:path.resolve(file),
    hits,
    pathLiterals:[...new Set(pathLiterals)],
    interestingLines:interesting.slice(0,180)
  });
}

const likelyBuilders = builderCandidates.filter(x=>
  x.hits.includes("unavailableStatus") &&
  (
    x.file.includes("Replacement") ||
    x.file.includes("replacement") ||
    x.hits.includes("pregameOfficialAnchorQualified") ||
    x.hits.includes("postgameSnapDefinedReplacement")
  )
);

const candidateInputPaths = [
  ...new Set(
    likelyBuilders.flatMap(x=>x.pathLiterals)
      .filter(p=>!p.includes("expected-replacement-identities-v1.jsonl"))
      .filter(p=>!p.includes("expected-replacement-identities-caliber-enriched-v1.jsonl"))
  )
];

function resolveCandidatePath(p){
  const normalized=p.replace(/\\/g,"/");
  const tries=[
    path.resolve(normalized),
    path.resolve(SCRIPT_ROOT,normalized),
    path.resolve(FRONTEND,normalized)
  ];
  return tries.find(fs.existsSync)??path.resolve(normalized);
}

const inputArtifacts=[];

for(const literal of candidateInputPaths){
  const file=resolveCandidatePath(literal);
  if(!fs.existsSync(file)) {
    inputArtifacts.push({
      literal,
      resolved:file,
      exists:false
    });
    continue;
  }

  const ext=path.extname(file).toLowerCase();
  let rows=[];
  if(ext===".jsonl") rows=readJsonl(file);
  else if(ext===".json"){
    try{
      const parsed=JSON.parse(fs.readFileSync(file,"utf8"));
      rows=Array.isArray(parsed)?parsed:
        Array.isArray(parsed?.records)?parsed.records:
        Array.isArray(parsed?.observations)?parsed.observations:
        Array.isArray(parsed?.data)?parsed.data:
        parsed&&typeof parsed==="object"?[parsed]:[];
    }catch{}
  }

  const statusCounts={};
  let withReportStatus=0;
  let withImpactPlayers=0;
  let withOutFlag=0;
  let withDoubtfulFlag=0;
  let withQuestionableFlag=0;
  let withPregameAnchor=0;
  let withUnavailableStatus=0;

  for(const row of rows){
    const s=statusOf(row);
    if(s){
      withUnavailableStatus++;
      statusCounts[s]=(statusCounts[s]??0)+1;
    }

    if(row?.reportStatus!=null || row?.report_status!=null) withReportStatus++;

    const players=Array.isArray(row?.impact?.players)?row.impact.players:[];
    if(players.length) withImpactPlayers++;

    if(players.some(p=>p?.isOut===true)) withOutFlag++;
    if(players.some(p=>p?.isDoubtful===true)) withDoubtfulFlag++;
    if(players.some(p=>p?.isQuestionable===true)) withQuestionableFlag++;

    if(
      row?.pregameOfficialAnchorQualified===true ||
      row?.availability?.pregameOfficialAnchorQualified===true
    ) withPregameAnchor++;
  }

  inputArtifacts.push({
    literal,
    resolved:file,
    exists:true,
    rows:rows.length,
    statusCounts,
    signalCoverage:{
      withUnavailableStatus,
      withReportStatus,
      withImpactPlayers,
      withOutFlag,
      withDoubtfulFlag,
      withQuestionableFlag,
      withPregameAnchor
    }
  });
}

const targetByPlayerEvent=new Map();
for(const row of targetRows){
  const id=identityOf(row);
  const k=playerEventKey(id);
  if(!targetByPlayerEvent.has(k))targetByPlayerEvent.set(k,[]);
  targetByPlayerEvent.get(k).push(row);
}

const lineageMatches=[];

for(const artifact of inputArtifacts.filter(x=>x.exists && x.rows>0)){
  const ext=path.extname(artifact.resolved).toLowerCase();
  let rows=[];
  if(ext===".jsonl")rows=readJsonl(artifact.resolved);
  else if(ext===".json"){
    try{
      const parsed=JSON.parse(fs.readFileSync(artifact.resolved,"utf8"));
      rows=Array.isArray(parsed)?parsed:
        Array.isArray(parsed?.records)?parsed.records:
        Array.isArray(parsed?.observations)?parsed.observations:
        Array.isArray(parsed?.data)?parsed.data:
        parsed&&typeof parsed==="object"?[parsed]:[];
    }catch{}
  }

  const candidateIndex=new Map();

  rows.forEach((row,index)=>{
    const id=identityOf(row);
    const k=playerEventKey(id);
    if(!candidateIndex.has(k))candidateIndex.set(k,[]);
    candidateIndex.get(k).push({index,row,id});
  });

  let matchedTargetRows=0;
  let matchedQualifyingTargetRows=0;
  let sourceRowsWithQualifyingSignal=0;
  const samples=[];

  for(const target of targetRows){
    const tid=identityOf(target);
    const matches=candidateIndex.get(playerEventKey(tid))??[];

    if(matches.length){
      matchedTargetRows++;
      if(QUALIFYING.has(statusOf(target))) matchedQualifyingTargetRows++;

      const sourceHasSignal=matches.some(m=>{
        const s=statusOf(m.row);
        if(QUALIFYING.has(s))return true;

        const players=Array.isArray(m.row?.impact?.players)?m.row.impact.players:[];
        return players.some(p=>
          p?.isOut===true ||
          p?.isDoubtful===true ||
          QUALIFYING.has(norm(p?.reportStatus??p?.report_status))
        );
      });

      if(sourceHasSignal)sourceRowsWithQualifyingSignal++;

      if(samples.length<12){
        samples.push({
          target:{
            identity:tid,
            unavailableStatus:statusOf(target),
            provenance:provenanceOf(target)
          },
          sourceMatches:matches.slice(0,8).map(m=>({
            index:m.index,
            identity:m.id,
            unavailableStatus:statusOf(m.row),
            reportStatus:first(m.row?.reportStatus,m.row?.report_status),
            impact:m.row?.impact??null,
            pregameOfficialAnchorQualified:first(
              m.row?.pregameOfficialAnchorQualified,
              m.row?.availability?.pregameOfficialAnchorQualified
            ),
            source:first(
              m.row?.source,
              m.row?.provider,
              m.row?.provenance?.source
            ),
            observedAt:first(
              m.row?.observedAt,
              m.row?.asOf,
              m.row?.generatedAt,
              m.row?.provenance?.observedAt
            )
          }))
        });
      }
    }
  }

  lineageMatches.push({
    artifact:artifact.resolved,
    targetRows:targetRows.length,
    matchedTargetRows,
    matchedQualifyingTargetRows,
    sourceRowsWithQualifyingSignal,
    matchCoverage:targetRows.length?matchedTargetRows/targetRows.length:0,
    qualifyingSignalCoverage:matchedTargetRows?sourceRowsWithQualifyingSignal/matchedTargetRows:0,
    samples
  });
}

const directSourceCandidates = lineageMatches
  .filter(x=>x.matchedTargetRows>0)
  .sort((a,b)=>
    b.sourceRowsWithQualifyingSignal-a.sourceRowsWithQualifyingSignal ||
    b.matchedTargetRows-a.matchedTargetRows
  );

const checks={
  targetReplacementArtifactExists:fs.existsSync(TARGET_FILE),
  targetReplacementRowsPresent:targetRows.length>0,
  expectedReplacementRows307:targetRows.length===307,
  qualifyingOutOrDoubtfulRowsPresent:
    targetRows.some(r=>QUALIFYING.has(statusOf(r))),
  builderCandidatesPresent:builderCandidates.length>0,
  likelyReplacementBuildersPresent:likelyBuilders.length>0,
  candidateInputPathsDiscovered:candidateInputPaths.length>0,
  candidateInputsResolved:inputArtifacts.some(x=>x.exists),
  upstreamLineageMatchesPresent:directSourceCandidates.length>0,
  rosterStatusReinterpretationUsed:false,
  treatmentDefinitionChanged:false,
  outcomesUsedForSourceTrace:false
};

let decision;

if(
  directSourceCandidates.length>0 &&
  directSourceCandidates[0].sourceRowsWithQualifyingSignal>0
){
  decision =
    "UPSTREAM_QUALIFYING_STATUS_SOURCE_CANDIDATE_IDENTIFIED_REQUIRES_EXACT_FIELD_PROVENANCE_VALIDATION";
}else if(directSourceCandidates.length>0){
  decision =
    "UPSTREAM_ARTIFACT_JOIN_IDENTIFIED_BUT_QUALIFYING_STATUS_FIELD_NOT_RECONCILED";
}else if(likelyBuilders.length>0){
  decision =
    "REPLACEMENT_IDENTITY_BUILDER_IDENTIFIED_REQUIRES_INPUT_ARTIFACT_RESOLUTION";
}else{
  decision =
    "REPLACEMENT_IDENTITY_SOURCE_LINEAGE_NOT_YET_RESOLVED";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-REPLACEMENT-IDENTITY-SOURCE-LINEAGE-TRACE-1.0.0",
  sprint:"2.18.23-RC5",
  mode:"READ_ONLY_REPLACEMENT_IDENTITY_SOURCE_TRACE",

  targetSummary,

  builderCandidates,
  likelyBuilders,

  candidateInputPaths,
  inputArtifacts,
  lineageMatches,
  directSourceCandidates,

  checks,
  decision,

  readiness:{
    replacementIdentityBuilderIdentified:
      likelyBuilders.length>0,

    upstreamStatusSourceCandidateIdentified:
      directSourceCandidates.length>0 &&
      directSourceCandidates[0].sourceRowsWithQualifyingSignal>0,

    exactQualifyingStatusProvenanceValidated:false,

    equivalent2025SourceQualificationAuthorized:false,
    governed2025NormalizationAuthorized:false,
    governed2025TreatmentConstructionAuthorized:false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false
  },

  nextStep:
    decision==="UPSTREAM_QUALIFYING_STATUS_SOURCE_CANDIDATE_IDENTIFIED_REQUIRES_EXACT_FIELD_PROVENANCE_VALIDATION"
      ? "VALIDATE_EXACT_SOURCE_FIELD_TO_UNAVAILABLE_STATUS_TRANSFORM_AND_TEST_EQUIVALENT_2025_INPUT_COVERAGE"
      : decision==="UPSTREAM_ARTIFACT_JOIN_IDENTIFIED_BUT_QUALIFYING_STATUS_FIELD_NOT_RECONCILED"
        ? "TRACE_BUILDER_FIELD_TRANSFORMS_FROM_MATCHED_UPSTREAM_ROWS_TO_UNAVAILABLE_STATUS"
        : "INSPECT_LIKELY_REPLACEMENT_BUILDERS_AND_RESOLVE_THEIR_DECLARED_INPUT_ARTIFACTS",

  safeguards:{
    sourceArtifactsMutated:false,
    replacementArtifactMutated:false,
    rosterStatusUsedAsInjuryDesignation:false,
    statusValuesInvented:false,
    historicalBackfillPerformed:false,
    outcomesUsedForQualification:false,
    treatmentDefinitionChanged:false,
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
