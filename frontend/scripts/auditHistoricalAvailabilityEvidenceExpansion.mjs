import fs from "node:fs";
import path from "node:path";
import generatedNFLHistoricalDecisionDataset from "../src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js";

const SEARCH_ROOTS=["./data/calibration/historical/v1","./data/footballIntelligence","./src/data/footballIntelligence/nfl"];
const EXTS=new Set([".jsonl",".json"]);
const NAME_RE=/(availab|injur|status|roster|depth|inactive|participation|questionable|doubtful)/i;
const BASELINE=new Set([2022,2023,2024]);
const TARGETS=new Set([2018,2019,2020,2021,2025]);
const SEASONS=[2018,2019,2020,2021,2022,2023,2024,2025];
const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const n=v=>Number(v);

function walk(dir){
  if(!fs.existsSync(dir))return[];
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}
function safeJson(t){try{return JSON.parse(t);}catch{return null;}}
function readFileRows(file){
  const ext=path.extname(file).toLowerCase();
  if(ext===".jsonl")return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(safeJson).filter(Boolean);
  if(ext===".json"){
    const x=safeJson(fs.readFileSync(file,"utf8"));
    if(Array.isArray(x))return x;
    if(Array.isArray(x?.records))return x.records;
    if(Array.isArray(x?.observations))return x.observations;
    if(Array.isArray(x?.data))return x.data;
    return x&&typeof x==="object"?[x]:[];
  }
  return [];
}
function first(...xs){for(const x of xs)if(x!==null&&x!==undefined&&x!=="")return x;return null;}
function normalizeStatus(v){if(v===null||v===undefined)return null;const s=String(v).trim().toUpperCase();return s||null;}
function normalize(row,file){
  const identity=row?.identity??{},game=row?.game??{},availability=row?.availability??{},provenance=row?.provenance??{},evidence=row?.evidence??{};
  const season=first(row?.season,identity?.season,game?.season,availability?.season);
  const week=first(row?.week,identity?.week,game?.week,availability?.week);
  const team=first(row?.team,identity?.team,availability?.team,row?.teamAbbr,row?.team_abbr);
  const gameId=first(row?.gameId,identity?.gameId,game?.gameId,availability?.gameId);
  const status=normalizeStatus(first(row?.status,row?.availabilityStatus,row?.playerStatus,row?.gameStatus,availability?.status,availability?.availabilityStatus,evidence?.status));
  const playerId=first(row?.playerId,row?.player_id,row?.gsisId,row?.gsis_id,identity?.playerId,availability?.playerId);
  const evidenceTime=first(row?.observedAt,row?.generatedAt,row?.timestamp,row?.asOf,provenance?.generatedAt,provenance?.observedAt,evidence?.observedAt);
  const leakageSafe=first(row?.leakageSafe,row?.pregameSafe,row?.pregameOfficialAnchorQualified,availability?.leakageSafe,evidence?.leakageSafe);
  const replacementPlayerId=first(row?.replacementPlayerId,availability?.replacementPlayerId,row?.replacement?.playerId);
  const ambiguous=row?.ambiguous===true||row?.ambiguity===true||String(row?.status??"").toUpperCase().includes("UNKNOWN")||String(row?.classification??"").toUpperCase().includes("UNKNOWN");
  return {sourceFile:path.resolve(file),season:finite(season)?n(season):null,week:finite(week)?n(week):null,team:team?String(team).toUpperCase():null,gameId:gameId?String(gameId):null,status,playerId:playerId?String(playerId):null,evidenceTime:evidenceTime??null,leakageSafe:leakageSafe===true?true:leakageSafe===false?false:null,replacementPlayerId:replacementPlayerId?String(replacementPlayerId):null,ambiguous};
}
function canonicalTeamGames(){
  const out=[];
  for(const d of generatedNFLHistoricalDecisionDataset){
    const g=d?.game??{},season=n(g?.season);
    if(!SEASONS.includes(season))continue;
    for(const side of ["AWAY","HOME"]){
      const team=side==="HOME"?g?.homeTeam:g?.awayTeam;
      out.push({key:`${g?.gameId}:${team}`,gameId:g?.gameId??null,season,week:g?.week??null,gameType:g?.gameType??null,gameday:g?.gameday??null,team:team??null,side});
    }
  }
  return out;
}

const candidateFiles=[...new Set(SEARCH_ROOTS.flatMap(walk).filter(f=>EXTS.has(path.extname(f).toLowerCase())).filter(f=>NAME_RE.test(path.basename(f))))];
const discovered=[],fileInventory=[];
for(const file of candidateFiles){
  const rows=readFileRows(file);
  const normalized=rows.map(r=>normalize(r,file)).filter(r=>r.season!==null||r.gameId||r.team||r.status||r.playerId);
  const seasons={};for(const r of normalized)if(r.season!==null)seasons[r.season]=(seasons[r.season]??0)+1;
  fileInventory.push({file:path.resolve(file),rowsRead:rows.length,normalizedRows:normalized.length,seasons});
  discovered.push(...normalized);
}
const canonical=canonicalTeamGames();
function resolveGameId(r){
  if(r.gameId)return r.gameId;
  if(r.season===null||r.week===null||!r.team)return null;
  const m=canonical.filter(c=>c.season===r.season&&Number(c.week)===Number(r.week)&&c.team===r.team);
  return m.length===1?m[0].gameId:null;
}
for(const r of discovered){if(!r.gameId)r.gameId=resolveGameId(r);r.teamGameKey=r.gameId&&r.team?`${r.gameId}:${r.team}`:null;}
const evidenceByKey=new Map();
for(const r of discovered){if(!r.teamGameKey)continue;if(!evidenceByKey.has(r.teamGameKey))evidenceByKey.set(r.teamGameKey,[]);evidenceByKey.get(r.teamGameKey).push(r);}

function classify(c){
  const rows=evidenceByKey.get(c.key)??[];
  if(!rows.length)return{classification:"MISSING_AVAILABILITY_EVIDENCE",reason:"NO_DISCOVERED_AVAILABILITY_RECORD"};
  if(rows.some(r=>r.leakageSafe===false))return{classification:"TEMPORALLY_UNSAFE_OR_LEAKAGE_RISK",reason:"EXPLICIT_LEAKAGE_UNSAFE_RECORD_PRESENT"};
  if(rows.some(r=>r.ambiguous===true))return{classification:"AMBIGUOUS_OR_UNKNOWN_STATUS",reason:"AMBIGUOUS_OR_UNKNOWN_EVIDENCE_PRESENT"};
  if(!rows.some(r=>r.status))return{classification:"INCOMPLETE_STATUS_EVIDENCE",reason:"NO_NORMALIZED_STATUS"};
  if(!rows.some(r=>r.playerId))return{classification:"INCOMPLETE_PLAYER_IDENTITY",reason:"NO_PLAYER_IDENTITY"};
  return{classification:"EVIDENCE_PRESENT_REQUIRES_GOVERNED_RECONCILIATION",reason:"STATUS_AND_PLAYER_IDENTITY_PRESENT"};
}

const bySeason={};
for(const season of SEASONS){
  const teamGames=canonical.filter(r=>r.season===season),counts={},examples={};
  for(const c of teamGames){
    const x=classify(c);counts[x.classification]=(counts[x.classification]??0)+1;
    if(!examples[x.classification])examples[x.classification]=[];
    if(examples[x.classification].length<5)examples[x.classification].push({gameId:c.gameId,week:c.week,team:c.team,side:c.side,reason:x.reason});
  }
  const present=counts.EVIDENCE_PRESENT_REQUIRES_GOVERNED_RECONCILIATION??0;
  bySeason[season]={canonicalTeamGames:teamGames.length,canonicalGames:new Set(teamGames.map(r=>r.gameId)).size,classifications:counts,evidencePresentCount:present,evidencePresentShare:teamGames.length?present/teamGames.length:null,governedBaselineSeason:BASELINE.has(season),expansionTargetSeason:TARGETS.has(season),examples};
}
const expansionTargets=SEASONS.filter(s=>TARGETS.has(s)).map(season=>{
  const r=bySeason[season];
  return{season,canonicalTeamGames:r.canonicalTeamGames,evidencePresent:r.evidencePresentCount,evidencePresentShare:r.evidencePresentShare,
    missingAvailabilityEvidence:r.classifications.MISSING_AVAILABILITY_EVIDENCE??0,
    temporallyUnsafeOrLeakageRisk:r.classifications.TEMPORALLY_UNSAFE_OR_LEAKAGE_RISK??0,
    ambiguousOrUnknownStatus:r.classifications.AMBIGUOUS_OR_UNKNOWN_STATUS??0,
    incompleteStatusEvidence:r.classifications.INCOMPLETE_STATUS_EVIDENCE??0,
    incompletePlayerIdentity:r.classifications.INCOMPLETE_PLAYER_IDENTITY??0};
});
const expansionEvidencePresent=expansionTargets.reduce((s,r)=>s+r.evidencePresent,0);
const decision=expansionEvidencePresent>0?"HISTORICAL_EVIDENCE_EXPANSION_CANDIDATES_DISCOVERED":"ADDITIONAL_EVIDENCE_ACQUISITION_REQUIRED";

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-EVIDENCE-EXPANSION-AUDIT-1.0.0",
  sprint:"2.18.22-RC1",mode:"READ_ONLY_EXPANSION_AUDIT",
  canonicalUniverse:{decisionRecords:generatedNFLHistoricalDecisionDataset.length,auditedSeasons:SEASONS,canonicalTeamGames:canonical.length,canonicalGames:new Set(canonical.map(r=>r.gameId)).size},
  discovery:{searchRoots:SEARCH_ROOTS.map(p=>path.resolve(p)),candidateFileCount:candidateFiles.length,files:fileInventory,normalizedEvidenceRows:discovered.length,resolvedTeamGameEvidenceKeys:evidenceByKey.size},
  bySeason,expansionTargets,decision,
  readiness:{expansionAuditComplete:true,expansionCandidateEvidencePresent:expansionEvidencePresent>0,governedExpansionConstructionAuthorized:false,treatmentControlRebuildAuthorized:false,matchingRerunAuthorized:false,attRecomputationAuthorized:false,uncertaintyRecomputationAuthorized:false,productionCalibrationAuthorized:false},
  safeguards:{evidenceEligibilityUsesOutcome:false,canonicalHistoricalDatasetMutated:false,availabilityEvidenceMutated:false,matchedCohortMutated:false,attReestimated:false,uncertaintyReestimated:false,learnedWeightsCreated:false,calibrationExecuted:false,teamStrengthMutated:false,decisionModelMutated:false,pickemScoringMutated:false,databaseMutated:false}
},null,2));
