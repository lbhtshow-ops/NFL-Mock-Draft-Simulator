import fs from "node:fs";
import path from "node:path";

const SOURCE =
  "./data/calibration/historical/v1/observations-availability.jsonl";

const SEASONS = [2022,2023,2024,2025];

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

function first(...values){
  for(const v of values){
    if(v!==null && v!==undefined && v!=="") return v;
  }
  return null;
}

function finite(v){
  return v!==null &&
    v!==undefined &&
    v!=="" &&
    Number.isFinite(Number(v));
}

function normSeason(row){
  const v=first(
    row?.season,
    row?.identity?.season,
    row?.game?.season,
    row?.observation?.season
  );
  return finite(v)?Number(v):null;
}

function classifyValue(value){
  if(value===null) return "null";
  if(Array.isArray(value)) return "array";
  return typeof value;
}

function walkValue(value,pathPrefix="",depth=0,maxDepth=8,out=[]){
  if(depth>maxDepth) return out;

  if(Array.isArray(value)){
    out.push({
      path:pathPrefix || "<root>",
      type:"array",
      length:value.length
    });

    const samples=value.slice(0,5);
    for(const item of samples){
      const childPath=
        pathPrefix
          ? `${pathPrefix}[]`
          : "[]";

      if(item && typeof item==="object"){
        walkValue(
          item,
          childPath,
          depth+1,
          maxDepth,
          out
        );
      }
    }
    return out;
  }

  if(value && typeof value==="object"){
    if(pathPrefix){
      out.push({
        path:pathPrefix,
        type:"object"
      });
    }

    for(const [key,child] of Object.entries(value)){
      const childPath =
        pathPrefix
          ? `${pathPrefix}.${key}`
          : key;

      const type=classifyValue(child);

      if(
        child &&
        typeof child==="object"
      ){
        walkValue(
          child,
          childPath,
          depth+1,
          maxDepth,
          out
        );
      }else{
        out.push({
          path:childPath,
          type,
          sampleValue:child
        });
      }
    }
  }

  return out;
}

function scorePath(path){
  const p=String(path).toLowerCase();

  let score=0;
  if(/player|athlete|person|gsis/.test(p)) score+=5;
  if(/status|designation|injur|availab|inactive|question|doubt|out/.test(p)) score+=5;
  if(/anchor|pregame|official|report/.test(p)) score+=4;
  if(/source|provider|provenance|url|observed|captured|generated|timestamp|asof|as_of/.test(p)) score+=3;
  if(/depth|roster|snap|participation/.test(p)) score+=2;

  return score;
}

function valueLooksLikeStatus(value){
  if(value===null || value===undefined) return false;
  const s=String(value).trim().toUpperCase();

  return [
    "OUT",
    "DOUBTFUL",
    "QUESTIONABLE",
    "ACTIVE",
    "INACTIVE",
    "ACT",
    "INA",
    "RES",
    "IR",
    "PUP",
    "FULL",
    "LIMITED",
    "DNP"
  ].includes(s);
}

function getByPath(obj,path){
  const parts=path.split(".");
  let cur=obj;

  for(const part of parts){
    if(cur===null || cur===undefined) return undefined;

    if(part.endsWith("[]")){
      const key=part.slice(0,-2);
      cur=cur?.[key];
      if(!Array.isArray(cur)) return undefined;
      return cur;
    }

    cur=cur?.[part];
  }

  return cur;
}

const rows=readJsonl(SOURCE);

const pathStats=new Map();
const topLevelShapes=new Map();

for(const row of rows){
  const topShape=Object.keys(row).sort().join("|");
  topLevelShapes.set(
    topShape,
    (topLevelShapes.get(topShape)??0)+1
  );

  const paths=walkValue(row);

  for(const item of paths){
    const key=item.path;

    if(!pathStats.has(key)){
      pathStats.set(key,{
        path:key,
        occurrences:0,
        types:new Map(),
        sampleValues:[],
        statusLikeValues:new Map(),
        seasons:new Map(),
        arrayLengths:[]
      });
    }

    const stat=pathStats.get(key);
    stat.occurrences++;
    stat.types.set(
      item.type,
      (stat.types.get(item.type)??0)+1
    );

    if(
      item.sampleValue!==undefined &&
      stat.sampleValues.length<8
    ){
      stat.sampleValues.push(item.sampleValue);
    }

    if(valueLooksLikeStatus(item.sampleValue)){
      const s=String(item.sampleValue).trim().toUpperCase();
      stat.statusLikeValues.set(
        s,
        (stat.statusLikeValues.get(s)??0)+1
      );
    }

    if(Number.isFinite(Number(item.length))){
      stat.arrayLengths.push(Number(item.length));
    }
  }

  const season=normSeason(row);
  if(season!==null){
    for(const item of paths){
      const stat=pathStats.get(item.path);
      stat.seasons.set(
        season,
        (stat.seasons.get(season)??0)+1
      );
    }
  }
}

const normalizedPaths=[...pathStats.values()]
  .map(stat=>({
    path:stat.path,
    relevanceScore:scorePath(stat.path),
    occurrences:stat.occurrences,
    types:Object.fromEntries(stat.types),
    sampleValues:stat.sampleValues,
    statusLikeValues:Object.fromEntries(stat.statusLikeValues),
    seasons:Object.fromEntries(stat.seasons),
    arrayLengthSummary:stat.arrayLengths.length
      ? {
          min:Math.min(...stat.arrayLengths),
          max:Math.max(...stat.arrayLengths),
          mean:
            stat.arrayLengths.reduce((a,b)=>a+b,0)/
            stat.arrayLengths.length
        }
      : null
  }))
  .sort((a,b)=>
    b.relevanceScore-a.relevanceScore ||
    b.occurrences-a.occurrences ||
    a.path.localeCompare(b.path)
  );

const interestingPaths=normalizedPaths.filter(x=>
  x.relevanceScore>=4
);

const statusValuePaths=normalizedPaths.filter(x=>
  Object.keys(x.statusLikeValues).length>0
);

const playerLikePaths=normalizedPaths.filter(x=>
  /player|athlete|person|gsis/i.test(x.path)
);

const pregameAnchorLikePaths=normalizedPaths.filter(x=>
  /pregame|anchor|official.*report|report.*official/i.test(x.path)
);

const provenanceLikePaths=normalizedPaths.filter(x=>
  /source|provider|provenance|observed|captured|generated|timestamp|asof|as_of|url/i.test(x.path)
);

const bySeason={};

for(const season of SEASONS){
  const seasonRows=rows.filter(r=>normSeason(r)===season);

  const shapes=new Map();
  const interestingPresence=new Map();

  for(const row of seasonRows){
    const shape=Object.keys(row).sort().join("|");
    shapes.set(
      shape,
      (shapes.get(shape)??0)+1
    );

    const paths=walkValue(row);

    for(const item of paths){
      if(scorePath(item.path)<4) continue;

      interestingPresence.set(
        item.path,
        (interestingPresence.get(item.path)??0)+1
      );
    }
  }

  bySeason[season]={
    rows:seasonRows.length,

    topLevelShapes:Object.fromEntries(
      [...shapes.entries()]
        .sort((a,b)=>b[1]-a[1])
    ),

    interestingPathPresence:Object.fromEntries(
      [...interestingPresence.entries()]
        .sort((a,b)=>b[1]-a[1])
        .slice(0,100)
    ),

    samples:seasonRows.slice(0,3)
  };
}

const commonHighValuePaths=interestingPaths
  .filter(x=>
    SEASONS.every(season=>
      Number(x.seasons?.[season]??0)>0
    )
  );

const only2025HighValuePaths=interestingPaths
  .filter(x=>
    Number(x.seasons?.[2025]??0)>0 &&
    [2022,2023,2024].every(season=>
      Number(x.seasons?.[season]??0)===0
    )
  );

const baselineOnlyHighValuePaths=interestingPaths
  .filter(x=>
    [2022,2023,2024].some(season=>
      Number(x.seasons?.[season]??0)>0
    ) &&
    Number(x.seasons?.[2025]??0)===0
  );

const evidenceKeys=new Set();

for(const row of rows){
  if(
    row?.evidence &&
    typeof row.evidence==="object" &&
    !Array.isArray(row.evidence)
  ){
    Object.keys(row.evidence)
      .forEach(k=>evidenceKeys.add(k));
  }
}

const sourceContainsNestedRosterPlayers=
  interestingPaths.some(x=>
    /evidence\.rosterDepth\.players\[\]/i.test(x.path)
  );

const sourceContainsExplicitInjuryReportPlayers=
  interestingPaths.some(x=>
    /injuryReport.*players\[\]|officialInjuryReport.*players\[\]/i.test(x.path)
  );

const sourceContainsImpactPlayers=
  interestingPaths.some(x=>
    /impact\.players\[\]/i.test(x.path)
  );

const sourceContainsQualifyingDesignationValues=
  statusValuePaths.some(x=>
    Object.keys(x.statusLikeValues)
      .some(v=>
        ["OUT","DOUBTFUL","QUESTIONABLE"]
          .includes(v)
      )
  );

let decision;

if(
  sourceContainsExplicitInjuryReportPlayers &&
  sourceContainsQualifyingDesignationValues
){
  decision=
    "PLAYER_LEVEL_INJURY_DESIGNATION_SCHEMA_DISCOVERED";
}else if(
  sourceContainsImpactPlayers &&
  sourceContainsQualifyingDesignationValues
){
  decision=
    "PLAYER_LEVEL_IMPACT_STATUS_SCHEMA_DISCOVERED";
}else if(
  sourceContainsNestedRosterPlayers &&
  !sourceContainsQualifyingDesignationValues
){
  decision=
    "SOURCE_IS_ROSTER_DEPTH_EVIDENCE_WITHOUT_DISCOVERED_INJURY_DESIGNATION_FIELDS";
}else{
  decision=
    "SOURCE_SCHEMA_REQUIRES_TARGETED_PATH_FOLLOWUP";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-AVAILABILITY-OBSERVATION-SCHEMA-DISCOVERY-1.0.0",

  sprint:"2.18.23-RC7",
  mode:"READ_ONLY_SCHEMA_DISCOVERY",

  source:{
    file:path.resolve(SOURCE),
    exists:fs.existsSync(SOURCE),
    rows:rows.length,
    topLevelShapes:Object.fromEntries(
      [...topLevelShapes.entries()]
        .sort((a,b)=>b[1]-a[1])
    ),
    evidenceKeys:[...evidenceKeys].sort()
  },

  discovery:{
    discoveredPathCount:normalizedPaths.length,
    interestingPathCount:interestingPaths.length,

    interestingPaths:
      interestingPaths.slice(0,160),

    statusValuePaths,
    playerLikePaths:
      playerLikePaths.slice(0,100),

    pregameAnchorLikePaths:
      pregameAnchorLikePaths.slice(0,100),

    provenanceLikePaths:
      provenanceLikePaths.slice(0,100)
  },

  bySeason,

  comparison:{
    commonHighValuePaths:
      commonHighValuePaths.slice(0,120),

    only2025HighValuePaths:
      only2025HighValuePaths.slice(0,120),

    baselineOnlyHighValuePaths:
      baselineOnlyHighValuePaths.slice(0,120)
  },

  schemaInterpretation:{
    sourceContainsNestedRosterPlayers,
    sourceContainsExplicitInjuryReportPlayers,
    sourceContainsImpactPlayers,
    sourceContainsQualifyingDesignationValues
  },

  decision,

  readiness:{
    schemaDiscoveryComplete:true,

    exactPlayerStatusSourcePathIdentified:
      decision==="PLAYER_LEVEL_INJURY_DESIGNATION_SCHEMA_DISCOVERED" ||
      decision==="PLAYER_LEVEL_IMPACT_STATUS_SCHEMA_DISCOVERED",

    sourceMayAdvanceToStatusTransformAudit:
      decision==="PLAYER_LEVEL_INJURY_DESIGNATION_SCHEMA_DISCOVERED" ||
      decision==="PLAYER_LEVEL_IMPACT_STATUS_SCHEMA_DISCOVERED",

    equivalent2025SourceComparisonAuthorized:false,
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
    decision==="PLAYER_LEVEL_INJURY_DESIGNATION_SCHEMA_DISCOVERED"
      ? "TRACE_DISCOVERED_INJURY_DESIGNATION_PATH_TO_REPLACEMENT_UNAVAILABLE_STATUS"
      : decision==="PLAYER_LEVEL_IMPACT_STATUS_SCHEMA_DISCOVERED"
        ? "TRACE_DISCOVERED_IMPACT_STATUS_PATH_TO_REPLACEMENT_UNAVAILABLE_STATUS"
        : decision==="SOURCE_IS_ROSTER_DEPTH_EVIDENCE_WITHOUT_DISCOVERED_INJURY_DESIGNATION_FIELDS"
          ? "IDENTIFY_THE_SEPARATE_HISTORICAL_INJURY_REPORT_ARTIFACT_OR_PRECONSTRUCTION_SOURCE_USED_BY_REPLACEMENT_MAPPING"
          : "INSPECT_TOP_DISCOVERED_PLAYER_STATUS_AND_PROVENANCE_PATHS_BEFORE_FURTHER_LINEAGE_WORK",

  safeguards:{
    sourceArtifactMutated:false,
    schemaValuesReinterpreted:false,
    rosterStatusUsedAsInjuryDesignation:false,
    statusValuesInvented:false,
    historicalBackfillPerformed:false,
    outcomesUsed:false,
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
