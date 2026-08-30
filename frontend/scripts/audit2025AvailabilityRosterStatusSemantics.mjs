import fs from "node:fs";
import path from "node:path";

const SOURCE="./data/calibration/historical/v1/observations-availability.jsonl";
const SEASONS=[2022,2023,2024,2025];

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
const rows=readJsonl(SOURCE);

function seasonOf(r){return Number(r?.season);}
function teamOf(r){return r?.team??null;}
function gameIdOf(r){return r?.gameId??null;}
function weekOf(r){return r?.week??null;}
function playersOf(r){
  const p=r?.evidence?.rosterDepth?.players;
  return Array.isArray(p)?p:[];
}
function statusOf(p){
  const s=p?.status;
  return s===null||s===undefined||s===""?null:String(s).trim().toUpperCase();
}
function countMap(values){
  const m=new Map();
  for(const v of values)m.set(v,(m.get(v)??0)+1);
  return Object.fromEntries([...m.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0]))));
}
function addSet(map,key,value){
  if(!map.has(key))map.set(key,new Set());
  map.get(key).add(value);
}
function setSizes(map){
  return Object.fromEntries([...map.entries()].sort(([a],[b])=>String(a).localeCompare(String(b))).map(([k,v])=>[k,v.size]));
}

const bySeason={};
const allCodes=new Set();

for(const season of SEASONS){
  const seasonRows=rows.filter(r=>seasonOf(r)===season);
  const playerRows=[];
  const statusTeamGames=new Map();
  const statusPlayers=new Map();
  const sampleByStatus=new Map();

  let teamGamesWithRosterDepth=0;
  let teamGamesWithoutRosterDepth=0;
  let playerRowsMissingStatus=0;
  let playerRowsMissingPlayerId=0;

  for(const row of seasonRows){
    const players=playersOf(row);
    if(players.length) teamGamesWithRosterDepth++;
    else teamGamesWithoutRosterDepth++;

    for(const p of players){
      const status=statusOf(p);
      const playerId=p?.playerId??null;
      const rec={
        season,
        week:weekOf(row),
        gameId:gameIdOf(row),
        team:teamOf(row),
        playerId,
        name:p?.name??null,
        position:p?.position??null,
        status
      };
      playerRows.push(rec);

      if(!status){playerRowsMissingStatus++;continue;}
      allCodes.add(status);
      if(!playerId)playerRowsMissingPlayerId++;

      addSet(statusTeamGames,status,`${gameIdOf(row)}:${teamOf(row)}`);
      addSet(statusPlayers,status,playerId??`${rec.name}:${rec.team}`);

      if(!sampleByStatus.has(status))sampleByStatus.set(status,[]);
      if(sampleByStatus.get(status).length<5)sampleByStatus.get(status).push(rec);
    }
  }

  const statusCounts=countMap(playerRows.map(x=>x.status).filter(Boolean));
  const statuses=Object.keys(statusCounts);

  bySeason[season]={
    teamGameRows:seasonRows.length,
    teamGamesWithRosterDepth,
    teamGamesWithoutRosterDepth,
    rosterDepthCoverage:seasonRows.length?teamGamesWithRosterDepth/seasonRows.length:null,
    playerRows:playerRows.length,
    playerRowsMissingStatus,
    playerRowsMissingPlayerId,
    statusCounts,
    statusTeamGameCoverage:setSizes(statusTeamGames),
    uniquePlayersByStatus:setSizes(statusPlayers),
    statusCodes:statuses,
    samplesByStatus:Object.fromEntries([...sampleByStatus.entries()])
  };
}

const baselineCodes=new Set([2022,2023,2024].flatMap(s=>bySeason[s].statusCodes));
const codes2025=new Set(bySeason[2025].statusCodes);

const sharedCodes=[...codes2025].filter(x=>baselineCodes.has(x)).sort();
const unique2025Codes=[...codes2025].filter(x=>!baselineCodes.has(x)).sort();
const baselineOnlyCodes=[...baselineCodes].filter(x=>!codes2025.has(x)).sort();

const semantics={
  observedRosterStatusCodes:[...allCodes].sort(),
  explicitlyProvenInThisDatasetAsInjuryDesignations:[],
  prohibitedAutomaticMappings:[
    "INA->OUT",
    "RES->OUT",
    "RET->OUT",
    "CUT->OUT",
    "DEV->AVAILABLE",
    "ACT->AVAILABLE"
  ],
  reason:
    "The nested field is rosterDepth.players[].status. Code presence alone does not prove equivalence to pregame injury-report designations or the governed OUT/DOUBTFUL/QUESTIONABLE treatment contract."
};

const checks={
  sourceExists:fs.existsSync(SOURCE),
  sourceRows2174:rows.length===2174,
  season2025Rows544:bySeason[2025].teamGameRows===544,
  season2025RosterDepthPresent:bySeason[2025].teamGamesWithRosterDepth>0,
  season2025PlayerStatusesPresent:Object.keys(bySeason[2025].statusCounts).length>0,
  baselinePlayerStatusesPresent:[2022,2023,2024].every(s=>Object.keys(bySeason[s].statusCounts).length>0),
  sharedRosterCodesExist:sharedCodes.length>0,
  injuryDesignationEquivalenceProven:false,
  automaticMappingAuthorized:false
};

const decision =
  checks.season2025PlayerStatusesPresent && sharedCodes.length>0
    ? "ROSTER_STATUS_SCHEMA_RECONCILED_BUT_INJURY_DESIGNATION_SEMANTICS_NOT_PROVEN"
    : "ROSTER_STATUS_SCHEMA_REQUIRES_FURTHER_SOURCE_AUDIT";

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-2025-AVAILABILITY-ROSTER-STATUS-SEMANTICS-AUDIT-1.0.0",
  sprint:"2.18.23-RC2",
  mode:"READ_ONLY_ROSTER_STATUS_SEMANTICS_AUDIT",
  source:{file:path.resolve(SOURCE),rows:rows.length},
  bySeason,
  comparison:{
    baselineSeasons:[2022,2023,2024],
    targetSeason:2025,
    baselineStatusCodes:[...baselineCodes].sort(),
    season2025StatusCodes:[...codes2025].sort(),
    sharedCodes,
    unique2025Codes,
    baselineOnlyCodes
  },
  semantics,
  checks,
  decision,
  readiness:{
    rosterStatusSchemaReconciled:
      checks.season2025PlayerStatusesPresent && sharedCodes.length>0,
    rosterStatusMayBeUsedAsInjuryDesignation:false,
    canonicalAvailabilityNormalizationAuthorized:false,
    governed2025QualificationAuthorized:false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false
  },
  nextEvidenceQuestion:
    "Identify the canonical historical pregame injury/designation source used to establish governed OUT/DOUBTFUL/QUESTIONABLE events in 2022-2024 and determine whether equivalent leakage-safe evidence exists for 2025.",
  safeguards:{
    sourceMutated:false,
    rosterStatusReinterpretedAsInjuryStatus:false,
    statusMappingInvented:false,
    historicalBackfillPerformed:false,
    outcomesUsed:false,
    treatmentDefinitionChanged:false,
    attReestimated:false,
    uncertaintyReestimated:false,
    calibrationExecuted:false,
    teamStrengthMutated:false,
    decisionModelMutated:false,
    pickemScoringMutated:false,
    databaseMutated:false
  }
},null,2));
