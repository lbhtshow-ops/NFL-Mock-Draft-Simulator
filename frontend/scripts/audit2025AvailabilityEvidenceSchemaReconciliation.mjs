import fs from "node:fs";
import path from "node:path";

const SOURCE =
  "./data/calibration/historical/v1/observations-availability.jsonl";

const SEASONS = [2022, 2023, 2024, 2025];

function readJsonl(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file,"utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line=>JSON.parse(line));
}

function keys(value){
  return value && typeof value==="object" && !Array.isArray(value)
    ? Object.keys(value).sort()
    : [];
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

function normSeason(row){
  const v=first(
    row?.season,
    row?.identity?.season,
    row?.game?.season,
    row?.availability?.season,
    row?.observation?.season
  );
  return finite(v) ? Number(v) : null;
}

function normWeek(row){
  const v=first(
    row?.week,
    row?.identity?.week,
    row?.game?.week,
    row?.availability?.week,
    row?.observation?.week
  );
  return finite(v) ? Number(v) : null;
}

function normTeam(row){
  const v=first(
    row?.team,
    row?.identity?.team,
    row?.game?.team,
    row?.availability?.team,
    row?.observation?.team,
    row?.teamAbbr,
    row?.team_abbr
  );
  return v ? String(v).toUpperCase() : null;
}

function normGameId(row){
  const v=first(
    row?.gameId,
    row?.identity?.gameId,
    row?.game?.gameId,
    row?.availability?.gameId,
    row?.observation?.gameId
  );
  return v ? String(v) : null;
}

function normPlayerId(row){
  const v=first(
    row?.playerId,
    row?.player_id,
    row?.gsisId,
    row?.gsis_id,
    row?.identity?.playerId,
    row?.availability?.playerId,
    row?.observation?.playerId,
    row?.player?.id
  );
  return v ? String(v) : null;
}

const STATUS_PATHS = [
  ["status", r=>r?.status],
  ["availabilityStatus", r=>r?.availabilityStatus],
  ["playerStatus", r=>r?.playerStatus],
  ["gameStatus", r=>r?.gameStatus],
  ["practiceStatus", r=>r?.practiceStatus],
  ["injuryStatus", r=>r?.injuryStatus],
  ["designation", r=>r?.designation],
  ["availability.status", r=>r?.availability?.status],
  ["availability.availabilityStatus", r=>r?.availability?.availabilityStatus],
  ["availability.gameStatus", r=>r?.availability?.gameStatus],
  ["availability.practiceStatus", r=>r?.availability?.practiceStatus],
  ["observation.status", r=>r?.observation?.status],
  ["observation.value", r=>r?.observation?.value],
  ["evidence.status", r=>r?.evidence?.status],
  ["payload.status", r=>r?.payload?.status],
  ["payload.gameStatus", r=>r?.payload?.gameStatus],
  ["raw.status", r=>r?.raw?.status],
  ["raw.gameStatus", r=>r?.raw?.gameStatus]
];

function statusCandidates(row){
  return STATUS_PATHS
    .map(([path,get])=>({path,value:get(row)}))
    .filter(x=>x.value!==null && x.value!==undefined && x.value!=="");
}

function normalizeStatusValue(v){
  if(v===null || v===undefined) return null;
  const s=String(v).trim().toUpperCase();
  if(!s) return null;

  const canonical = {
    "OUT":"OUT",
    "DOUBTFUL":"DOUBTFUL",
    "QUESTIONABLE":"QUESTIONABLE",
    "ACTIVE":"ACTIVE",
    "AVAILABLE":"AVAILABLE",
    "INACTIVE":"INACTIVE",
    "IR":"IR",
    "INJURED RESERVE":"IR",
    "PUP":"PUP",
    "SUSPENDED":"SUSPENDED",
    "FULL":"FULL",
    "LIMITED":"LIMITED",
    "DNP":"DNP",
    "DID NOT PARTICIPATE":"DNP"
  };

  return canonical[s] ?? null;
}

const rows = readJsonl(SOURCE);

const bySeason = {};
const allKeyShapes = new Map();
const allStatusPathCounts = new Map();

for(const season of SEASONS){
  const seasonRows = rows.filter(r=>normSeason(r)===season);

  const topLevelKeyShapes = new Map();
  const nestedKeyFrequency = {
    identity:new Map(),
    game:new Map(),
    availability:new Map(),
    observation:new Map(),
    evidence:new Map(),
    payload:new Map(),
    raw:new Map(),
    player:new Map()
  };

  const statusPathCounts = new Map();
  const statusValueCounts = new Map();
  const canonicalStatusCounts = new Map();

  let rowsWithAnyStatusCandidate = 0;
  let rowsWithCanonicalStatus = 0;
  let rowsWithPlayerId = 0;
  let rowsWithTeam = 0;
  let rowsWithWeek = 0;
  let rowsWithGameId = 0;

  const sampleRows = [];
  const sampleUnresolved = [];

  for(const row of seasonRows){
    const shape = keys(row).join("|");
    topLevelKeyShapes.set(shape,(topLevelKeyShapes.get(shape)??0)+1);
    allKeyShapes.set(shape,(allKeyShapes.get(shape)??0)+1);

    for(const [name,map] of Object.entries(nestedKeyFrequency)){
      for(const key of keys(row?.[name])){
        map.set(key,(map.get(key)??0)+1);
      }
    }

    const candidates = statusCandidates(row);
    if(candidates.length) rowsWithAnyStatusCandidate++;

    let canonicalFound = false;
    for(const c of candidates){
      statusPathCounts.set(c.path,(statusPathCounts.get(c.path)??0)+1);
      allStatusPathCounts.set(c.path,(allStatusPathCounts.get(c.path)??0)+1);

      const raw = String(c.value);
      statusValueCounts.set(raw,(statusValueCounts.get(raw)??0)+1);

      const normalized = normalizeStatusValue(c.value);
      if(normalized){
        canonicalStatusCounts.set(normalized,(canonicalStatusCounts.get(normalized)??0)+1);
        canonicalFound = true;
      }
    }

    if(canonicalFound) rowsWithCanonicalStatus++;
    if(normPlayerId(row)) rowsWithPlayerId++;
    if(normTeam(row)) rowsWithTeam++;
    if(normWeek(row)!==null) rowsWithWeek++;
    if(normGameId(row)) rowsWithGameId++;

    if(sampleRows.length<5){
      sampleRows.push({
        season:normSeason(row),
        week:normWeek(row),
        team:normTeam(row),
        gameId:normGameId(row),
        playerId:normPlayerId(row),
        topLevelKeys:keys(row),
        identityKeys:keys(row?.identity),
        availabilityKeys:keys(row?.availability),
        observationKeys:keys(row?.observation),
        evidenceKeys:keys(row?.evidence),
        payloadKeys:keys(row?.payload),
        statusCandidates:candidates
      });
    }

    if(!canonicalFound && sampleUnresolved.length<10){
      sampleUnresolved.push({
        season:normSeason(row),
        week:normWeek(row),
        team:normTeam(row),
        gameId:normGameId(row),
        playerId:normPlayerId(row),
        topLevelKeys:keys(row),
        identity:row?.identity??null,
        availability:row?.availability??null,
        observation:row?.observation??null,
        evidence:row?.evidence??null,
        payload:row?.payload??null,
        directStatusLike:Object.fromEntries(
          keys(row)
            .filter(k=>/status|availab|designation|practice|injur/i.test(k))
            .map(k=>[k,row[k]])
        )
      });
    }
  }

  const mapObject = map => Object.fromEntries(
    [...map.entries()].sort((a,b)=>b[1]-a[1] || String(a[0]).localeCompare(String(b[0])))
  );

  bySeason[season] = {
    rowCount:seasonRows.length,
    identityCoverage:{
      withPlayerId:rowsWithPlayerId,
      withTeam:rowsWithTeam,
      withWeek:rowsWithWeek,
      withGameId:rowsWithGameId
    },
    statusCoverage:{
      rowsWithAnyStatusCandidate,
      rowsWithCanonicalStatus,
      rowsWithoutCanonicalStatus:seasonRows.length-rowsWithCanonicalStatus,
      anyStatusCandidateShare:seasonRows.length?rowsWithAnyStatusCandidate/seasonRows.length:null,
      canonicalStatusShare:seasonRows.length?rowsWithCanonicalStatus/seasonRows.length:null
    },
    topLevelKeyShapes:mapObject(topLevelKeyShapes),
    nestedKeyFrequency:Object.fromEntries(
      Object.entries(nestedKeyFrequency).map(([name,map])=>[name,mapObject(map)])
    ),
    statusPathCounts:mapObject(statusPathCounts),
    rawStatusValueCounts:mapObject(statusValueCounts),
    canonicalStatusCounts:mapObject(canonicalStatusCounts),
    samples:sampleRows,
    unresolvedSamples:sampleUnresolved
  };
}

function signatureForSeason(season){
  const r=bySeason[season];
  return {
    rowCount:r.rowCount,
    topLevelKeyShapes:Object.keys(r.topLevelKeyShapes),
    statusPaths:Object.keys(r.statusPathCounts),
    canonicalStatusValues:Object.keys(r.canonicalStatusCounts),
    identityCoverage:r.identityCoverage,
    statusCoverage:r.statusCoverage
  };
}

const baselineSignatures = [2022,2023,2024].map(signatureForSeason);
const sig2025 = signatureForSeason(2025);

const baselineStatusPaths = new Set(
  baselineSignatures.flatMap(x=>x.statusPaths)
);
const statusPaths2025 = new Set(sig2025.statusPaths);

const sharedStatusPaths = [...statusPaths2025]
  .filter(x=>baselineStatusPaths.has(x));

const unique2025StatusPaths = [...statusPaths2025]
  .filter(x=>!baselineStatusPaths.has(x));

const baselineCanonicalStatusValues = new Set(
  baselineSignatures.flatMap(x=>x.canonicalStatusValues)
);
const canonical2025StatusValues = new Set(sig2025.canonicalStatusValues);

const reconciliation = {
  sourceExists:fs.existsSync(SOURCE),
  sourceRowCount:rows.length,
  expectedSourceRowCountMatches:rows.length===2174,

  expectedSeasonCounts:{
    "2022":bySeason[2022].rowCount===542,
    "2023":bySeason[2023].rowCount===544,
    "2024":bySeason[2024].rowCount===544,
    "2025":bySeason[2025].rowCount===544
  },

  season2025HasRows:bySeason[2025].rowCount===544,

  season2025HasAnyRecognizedStatusPath:
    bySeason[2025].statusCoverage.rowsWithAnyStatusCandidate>0,

  season2025HasCanonicalStatusValues:
    bySeason[2025].statusCoverage.rowsWithCanonicalStatus>0,

  season2025SharesStatusPathWithBaseline:
    sharedStatusPaths.length>0,

  season2025CanonicalStatusesSubsetOfBaseline:
    [...canonical2025StatusValues]
      .every(v=>baselineCanonicalStatusValues.has(v))
};

let decision;

if(
  bySeason[2025].statusCoverage.rowsWithCanonicalStatus===544 &&
  sharedStatusPaths.length>0 &&
  reconciliation.season2025CanonicalStatusesSubsetOfBaseline
){
  decision =
    "2025_SCHEMA_COMPATIBLE_WITH_EXISTING_CANONICAL_STATUS_NORMALIZATION";
}else if(
  bySeason[2025].statusCoverage.rowsWithAnyStatusCandidate>0
){
  decision =
    "2025_SCHEMA_REQUIRES_EXPLICIT_STATUS_NORMALIZATION_MAPPING";
}else{
  decision =
    "2025_STATUS_SEMANTICS_NOT_DISCOVERED_REQUIRES_SOURCE_SCHEMA_AUDIT";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-2025-AVAILABILITY-EVIDENCE-SCHEMA-RECONCILIATION-1.0.0",
  sprint:"2.18.23-RC1",
  mode:"READ_ONLY_SCHEMA_RECONCILIATION",

  source:{
    file:path.resolve(SOURCE),
    rowCount:rows.length,
    seasons:SEASONS
  },

  bySeason,

  comparison:{
    baselineSeasons:[2022,2023,2024],
    targetSeason:2025,
    baselineStatusPaths:[...baselineStatusPaths].sort(),
    season2025StatusPaths:[...statusPaths2025].sort(),
    sharedStatusPaths:sharedStatusPaths.sort(),
    unique2025StatusPaths:unique2025StatusPaths.sort(),
    baselineCanonicalStatusValues:[...baselineCanonicalStatusValues].sort(),
    season2025CanonicalStatusValues:[...canonical2025StatusValues].sort()
  },

  reconciliation,

  decision,

  readiness:{
    schemaAuditComplete:true,
    canonicalStatusMappingIdentified:
      decision!=="2025_STATUS_SEMANTICS_NOT_DISCOVERED_REQUIRES_SOURCE_SCHEMA_AUDIT",
    normalized2025ArtifactConstructionAuthorized:false,
    governed2025QualificationAuthorized:false,
    treatmentControlRebuildAuthorized:false,
    matchingRerunAuthorized:false,
    attRecomputationAuthorized:false,
    uncertaintyRecomputationAuthorized:false,
    productionCalibrationAuthorized:false
  },

  safeguards:{
    sourceAvailabilityEvidenceMutated:false,
    statusValuesInvented:false,
    statusValuesBackfilled:false,
    currentSeasonDataUsedToRewriteHistory:false,
    outcomeUsedForSchemaReconciliation:false,
    matchedCohortMutated:false,
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
