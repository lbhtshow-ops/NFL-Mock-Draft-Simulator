import fs from "node:fs";
import path from "node:path";

const ROOTS = [
  "./data/calibration/historical/v1",
  "./data/footballIntelligence",
  "./src/data/footballIntelligence/nfl",
  "./scripts"
];

const TARGET_DESIGNATIONS = new Set([
  "OUT",
  "DOUBTFUL",
  "QUESTIONABLE"
]);

const BASELINE_SEASONS = new Set([2022, 2023, 2024]);
const TARGET_SEASON = 2025;

const EXTENSIONS = new Set([
  ".jsonl",
  ".json",
  ".js",
  ".mjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".md"
]);

const finite = v =>
  v !== null &&
  v !== undefined &&
  v !== "" &&
  Number.isFinite(Number(v));

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

function safeJson(text){
  try{return JSON.parse(text);}catch{return null;}
}

function readStructuredRows(file){
  const ext=path.extname(file).toLowerCase();

  if(ext===".jsonl"){
    return fs.readFileSync(file,"utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map(safeJson)
      .filter(Boolean);
  }

  if(ext===".json"){
    const parsed=safeJson(fs.readFileSync(file,"utf8"));
    if(Array.isArray(parsed)) return parsed;
    if(Array.isArray(parsed?.records)) return parsed.records;
    if(Array.isArray(parsed?.observations)) return parsed.observations;
    if(Array.isArray(parsed?.data)) return parsed.data;
    return parsed && typeof parsed==="object" ? [parsed] : [];
  }

  return [];
}

function first(...values){
  for(const v of values){
    if(v!==null && v!==undefined && v!=="") return v;
  }
  return null;
}

function normalizeDesignation(value){
  if(value===null || value===undefined) return null;
  const s=String(value).trim().toUpperCase();
  return TARGET_DESIGNATIONS.has(s) ? s : null;
}

const DESIGNATION_PATHS = [
  ["status", r=>r?.status],
  ["availabilityStatus", r=>r?.availabilityStatus],
  ["playerStatus", r=>r?.playerStatus],
  ["gameStatus", r=>r?.gameStatus],
  ["injuryStatus", r=>r?.injuryStatus],
  ["designation", r=>r?.designation],
  ["availability.status", r=>r?.availability?.status],
  ["availability.availabilityStatus", r=>r?.availability?.availabilityStatus],
  ["availability.gameStatus", r=>r?.availability?.gameStatus],
  ["availability.injuryStatus", r=>r?.availability?.injuryStatus],
  ["availability.designation", r=>r?.availability?.designation],
  ["evidence.status", r=>r?.evidence?.status],
  ["evidence.designation", r=>r?.evidence?.designation],
  ["injury.status", r=>r?.injury?.status],
  ["injury.designation", r=>r?.injury?.designation],
  ["pregame.status", r=>r?.pregame?.status],
  ["pregame.designation", r=>r?.pregame?.designation]
];

function designationCandidates(row){
  return DESIGNATION_PATHS
    .map(([field,get])=>({field,value:get(row)}))
    .map(x=>({...x,designation:normalizeDesignation(x.value)}))
    .filter(x=>x.designation);
}

function seasonOf(row){
  const v=first(
    row?.season,
    row?.identity?.season,
    row?.game?.season,
    row?.availability?.season,
    row?.pregame?.season
  );
  return finite(v) ? Number(v) : null;
}

function weekOf(row){
  const v=first(
    row?.week,
    row?.identity?.week,
    row?.game?.week,
    row?.availability?.week,
    row?.pregame?.week
  );
  return finite(v) ? Number(v) : null;
}

function teamOf(row){
  const v=first(
    row?.team,
    row?.identity?.team,
    row?.availability?.team,
    row?.pregame?.team,
    row?.teamAbbr,
    row?.team_abbr
  );
  return v ? String(v).toUpperCase() : null;
}

function playerIdOf(row){
  const v=first(
    row?.playerId,
    row?.player_id,
    row?.gsisId,
    row?.gsis_id,
    row?.identity?.playerId,
    row?.availability?.playerId,
    row?.pregame?.playerId
  );
  return v ? String(v) : null;
}

function gameIdOf(row){
  const v=first(
    row?.gameId,
    row?.identity?.gameId,
    row?.game?.gameId,
    row?.availability?.gameId,
    row?.pregame?.gameId
  );
  return v ? String(v) : null;
}

function provenanceOf(row){
  return {
    source:first(
      row?.source,
      row?.sourceName,
      row?.provider,
      row?.provenance?.source,
      row?.provenance?.provider,
      row?.evidence?.source,
      row?.availability?.source
    ),
    sourceUrl:first(
      row?.sourceUrl,
      row?.url,
      row?.href,
      row?.provenance?.sourceUrl,
      row?.provenance?.url,
      row?.evidence?.sourceUrl
    ),
    observedAt:first(
      row?.observedAt,
      row?.asOf,
      row?.timestamp,
      row?.generatedAt,
      row?.provenance?.observedAt,
      row?.provenance?.generatedAt,
      row?.availability?.observedAt,
      row?.pregame?.observedAt
    ),
    capturedAt:first(
      row?.capturedAt,
      row?.fetchedAt,
      row?.provenance?.capturedAt,
      row?.provenance?.fetchedAt
    ),
    leakageSafe:first(
      row?.leakageSafe,
      row?.pregameSafe,
      row?.pregameOfficialAnchorQualified,
      row?.provenance?.leakageSafe,
      row?.availability?.leakageSafe,
      row?.evidence?.leakageSafe
    )
  };
}

const allFiles = [
  ...new Set(
    ROOTS.flatMap(walk)
      .filter(f=>EXTENSIONS.has(path.extname(f).toLowerCase()))
  )
];

const structuredFiles = allFiles.filter(f=>{
  const ext=path.extname(f).toLowerCase();
  return ext===".jsonl" || ext===".json";
});

const designationRecords=[];
const structuredInventory=[];

for(const file of structuredFiles){
  const rows=readStructuredRows(file);
  let matches=0;
  const seasons={};
  const fields={};
  const designations={};

  for(const row of rows){
    const candidates=designationCandidates(row);
    if(!candidates.length) continue;

    for(const c of candidates){
      const season=seasonOf(row);
      const rec={
        file:path.resolve(file),
        season,
        week:weekOf(row),
        gameId:gameIdOf(row),
        team:teamOf(row),
        playerId:playerIdOf(row),
        field:c.field,
        designation:c.designation,
        provenance:provenanceOf(row),
        mappingStatus:first(
          row?.mappingStatus,
          row?.availability?.mappingStatus,
          row?.replacementStatus
        ),
        evidenceType:first(
          row?.evidenceType,
          row?.availability?.evidenceType,
          row?.provenance?.evidenceType
        )
      };

      designationRecords.push(rec);
      matches++;

      const sk=season===null?"UNKNOWN":String(season);
      seasons[sk]=(seasons[sk]??0)+1;
      fields[c.field]=(fields[c.field]??0)+1;
      designations[c.designation]=(designations[c.designation]??0)+1;
    }
  }

  if(matches>0){
    structuredInventory.push({
      file:path.resolve(file),
      rowsRead:rows.length,
      designationMatches:matches,
      seasons,
      fields,
      designations
    });
  }
}

const codeReferences=[];

for(const file of allFiles){
  if(structuredFiles.includes(file)) continue;
  const text=fs.readFileSync(file,"utf8");

  const containsOut=/\bOUT\b/.test(text);
  const containsDoubtful=/\bDOUBTFUL\b/.test(text);
  const containsQuestionable=/\bQUESTIONABLE\b/.test(text);

  if(!(containsOut||containsDoubtful||containsQuestionable)) continue;

  const interestingLines=text.split(/\r?\n/)
    .map((line,index)=>({lineNumber:index+1,line}))
    .filter(x=>
      /\bOUT\b|\bDOUBTFUL\b|\bQUESTIONABLE\b|pregameOfficialAnchorQualified|availability|injury|designation|status|source|provider|observedAt|asOf|leakage/i.test(x.line)
    )
    .slice(0,80);

  codeReferences.push({
    file:path.resolve(file),
    contains:{
      OUT:containsOut,
      DOUBTFUL:containsDoubtful,
      QUESTIONABLE:containsQuestionable
    },
    interestingLines
  });
}

function countBy(records,keyFn){
  const out={};
  for(const r of records){
    const key=keyFn(r)??"UNKNOWN";
    out[key]=(out[key]??0)+1;
  }
  return out;
}

function unique(values){
  return [...new Set(values.filter(v=>v!==null&&v!==undefined&&v!==""))];
}

const baselineRecords=designationRecords.filter(r=>BASELINE_SEASONS.has(r.season));
const targetRecords=designationRecords.filter(r=>r.season===TARGET_SEASON);

const baselineFiles=unique(baselineRecords.map(r=>r.file));
const targetFiles=unique(targetRecords.map(r=>r.file));

const baselineSources=unique(baselineRecords.map(r=>r.provenance.source));
const targetSources=unique(targetRecords.map(r=>r.provenance.source));

const baselineFields=unique(baselineRecords.map(r=>r.field));
const targetFields=unique(targetRecords.map(r=>r.field));

const baselineObservedAtCoverage=
  baselineRecords.length
    ? baselineRecords.filter(r=>r.provenance.observedAt).length/baselineRecords.length
    : 0;

const targetObservedAtCoverage=
  targetRecords.length
    ? targetRecords.filter(r=>r.provenance.observedAt).length/targetRecords.length
    : 0;

const baselineLeakageSafeTrue=
  baselineRecords.filter(r=>r.provenance.leakageSafe===true).length;

const targetLeakageSafeTrue=
  targetRecords.filter(r=>r.provenance.leakageSafe===true).length;

const sameFileContinuity=
  baselineFiles.some(f=>targetFiles.includes(f));

const sameSourceContinuity=
  baselineSources.length>0 &&
  targetSources.some(s=>baselineSources.includes(s));

const sameFieldContinuity=
  baselineFields.length>0 &&
  targetFields.some(f=>baselineFields.includes(f));

const checks={
  baselineDesignationRecordsPresent:
    baselineRecords.length>0,

  baselineOutPresent:
    baselineRecords.some(r=>r.designation==="OUT"),

  baselineDoubtfulPresent:
    baselineRecords.some(r=>r.designation==="DOUBTFUL"),

  baselineQuestionablePresent:
    baselineRecords.some(r=>r.designation==="QUESTIONABLE"),

  baselineProvenanceSourcePresent:
    baselineSources.length>0,

  baselineTimingMetadataPresent:
    baselineObservedAtCoverage>0,

  target2025DesignationRecordsPresent:
    targetRecords.length>0,

  sameFileContinuity,
  sameSourceContinuity,
  sameFieldContinuity,

  target2025TimingMetadataPresent:
    targetObservedAtCoverage>0,

  baselineExplicitLeakageSafeEvidencePresent:
    baselineLeakageSafeTrue>0,

  target2025ExplicitLeakageSafeEvidencePresent:
    targetLeakageSafeTrue>0
};

let decision;

if(
  checks.baselineDesignationRecordsPresent &&
  checks.target2025DesignationRecordsPresent &&
  checks.sameSourceContinuity &&
  checks.sameFieldContinuity &&
  checks.target2025TimingMetadataPresent
){
  decision =
    "2025_EQUIVALENT_INJURY_DESIGNATION_SOURCE_DISCOVERED_REQUIRES_LEAKAGE_SAFE_QUALIFICATION";
}else if(
  checks.baselineDesignationRecordsPresent &&
  !checks.target2025DesignationRecordsPresent
){
  decision =
    "BASELINE_INJURY_DESIGNATION_SOURCE_IDENTIFIED_BUT_2025_EQUIVALENT_EVIDENCE_NOT_DISCOVERED";
}else if(
  checks.baselineDesignationRecordsPresent &&
  checks.target2025DesignationRecordsPresent
){
  decision =
    "2025_DESIGNATION_EVIDENCE_DISCOVERED_BUT_SOURCE_CONTINUITY_NOT_PROVEN";
}else{
  decision =
    "CANONICAL_BASELINE_INJURY_DESIGNATION_SOURCE_NOT_YET_IDENTIFIED";
}

const bySeason={};
for(const season of [2022,2023,2024,2025]){
  const recs=designationRecords.filter(r=>r.season===season);
  bySeason[season]={
    designationRecords:recs.length,
    designations:countBy(recs,r=>r.designation),
    files:unique(recs.map(r=>r.file)),
    fields:unique(recs.map(r=>r.field)),
    sources:unique(recs.map(r=>r.provenance.source)),
    evidenceTypes:unique(recs.map(r=>r.evidenceType)),
    observedAtCoverage:
      recs.length?recs.filter(r=>r.provenance.observedAt).length/recs.length:null,
    explicitLeakageSafeTrue:
      recs.filter(r=>r.provenance.leakageSafe===true).length,
    explicitLeakageSafeFalse:
      recs.filter(r=>r.provenance.leakageSafe===false).length,
    sample:recs.slice(0,12)
  };
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-HISTORICAL-INJURY-DESIGNATION-PROVENANCE-AUDIT-1.0.0",

  sprint:"2.18.23-RC3",
  mode:"READ_ONLY_INJURY_DESIGNATION_PROVENANCE_AUDIT",

  search:{
    roots:ROOTS.map(p=>path.resolve(p)),
    filesScanned:allFiles.length,
    structuredFilesScanned:structuredFiles.length,
    structuredFilesWithDesignationMatches:structuredInventory.length,
    codeFilesWithDesignationReferences:codeReferences.length
  },

  structuredInventory,
  bySeason,

  baseline:{
    seasons:[2022,2023,2024],
    designationRecords:baselineRecords.length,
    files:baselineFiles,
    fields:baselineFields,
    sources:baselineSources,
    observedAtCoverage:baselineObservedAtCoverage,
    explicitLeakageSafeTrue:baselineLeakageSafeTrue
  },

  target2025:{
    designationRecords:targetRecords.length,
    files:targetFiles,
    fields:targetFields,
    sources:targetSources,
    observedAtCoverage:targetObservedAtCoverage,
    explicitLeakageSafeTrue:targetLeakageSafeTrue
  },

  continuity:{
    sameFileContinuity,
    sameSourceContinuity,
    sameFieldContinuity
  },

  codeReferences,

  checks,
  decision,

  readiness:{
    provenanceAuditComplete:true,

    baselineCanonicalDesignationSourceIdentified:
      checks.baselineDesignationRecordsPresent &&
      checks.baselineProvenanceSourcePresent,

    equivalent2025DesignationEvidenceDiscovered:
      checks.target2025DesignationRecordsPresent,

    equivalent2025SourceContinuityProven:
      checks.target2025DesignationRecordsPresent &&
      checks.sameSourceContinuity &&
      checks.sameFieldContinuity,

    leakageSafe2025QualificationAuthorized:false,
    governed2025NormalizationAuthorized:false,
    governed2025TreatmentConstructionAuthorized:false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false
  },

  safeguards:{
    sourceFilesMutated:false,
    rosterCodesUsedAsInjuryDesignations:false,
    designationValuesInvented:false,
    historicalBackfillPerformed:false,
    outcomesUsedForSourceDiscovery:false,
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
