import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { predictNFLCandidate } from '../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js';
import { getNFLCanonicalGameDecisionModelConfig } from '../src/engines/gameDecisionSupport/canonical/NFLGameDecisionModelV1.js';

export const DEFAULT_OBSERVATION_FILE='data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl';
export const DEFAULT_DECISION_MODULE='src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLHistoricalDecisionDataset.js';
export const DEFAULT_OUTPUT='data/calibration/historical/v1/historical-availability-impact-baseline-residuals-v1.jsonl';
export const DEFAULT_RESIDUALS='data/calibration/historical/v1/historical-availability-impact-baseline-residual-construction-residuals-v1.jsonl';
export const DEFAULT_REPORT='data/calibration/historical/v1/historical-availability-impact-baseline-residuals-v1-report.json';

const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const num=v=>v==null||v===''?null:(finite(v)?Number(v):null);
const str=v=>v==null?null:(String(v).trim()||null);
const up=v=>str(v)?.toUpperCase()??null;
const get=(o,keys)=>{for(const k of keys){let v=o;for(const p of k.split('.'))v=v?.[p];if(v!=null)return v}return null};
export const loadJsonl=f=>fs.existsSync(f)?fs.readFileSync(f,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse):[];

export async function loadCanonicalDecisionDataset(file=DEFAULT_DECISION_MODULE){
  const abs=path.resolve(file);
  if(!fs.existsSync(abs)) return {file:abs,records:[],error:'CANONICAL_DECISION_MODULE_NOT_FOUND'};
  try{
    const m=await import(pathToFileURL(abs).href);
    const d=m.generatedNFLHistoricalDecisionDataset??m.default?.generatedNFLHistoricalDecisionDataset??m.default;
    const records=Array.isArray(d)?d:(Array.isArray(d?.records)?d.records:[]);
    return {file:abs,records,error:records.length?null:'CANONICAL_DECISION_DATASET_EMPTY_OR_UNRECOGNIZED'};
  }catch(e){return {file:abs,records:[],error:`CANONICAL_DECISION_MODULE_IMPORT_FAILED: ${e.message}`}}
}

export function normalizeDecisionRecord(r={}){
  return {
    raw:r,
    gameId:str(get(r,['gameId','identity.gameId','game.gameId'])),
    season:num(get(r,['season','identity.season','game.season'])),
    week:num(get(r,['week','identity.week','game.week'])),
    gameType:up(get(r,['gameType','identity.gameType','game.gameType'])),
    awayTeam:up(get(r,['awayTeam','identity.awayTeam','game.awayTeam'])),
    homeTeam:up(get(r,['homeTeam','identity.homeTeam','game.homeTeam'])),
    awayScore:num(get(r,['outcome.awayScore','awayScore','game.awayScore'])),
    homeScore:num(get(r,['outcome.homeScore','homeScore','game.homeScore'])),
    snapshotThroughWeek:num(get(r,['pregame.snapshotThroughWeek','pregame.features.snapshotThroughWeek','snapshotThroughWeek'])),
    matchupEdge:num(get(r,['pregame.matchupEdge','pregame.features.matchupEdge','matchupEdge'])),
    evidenceQuality:num(get(r,['pregame.evidenceQuality','pregame.features.evidenceQuality','evidenceQuality']))
  };
}

export function indexDecisionRecords(rows=[]){
  const normalized=rows.map(normalizeDecisionRecord),byGameId=new Map(),bySWT=new Map();
  for(const r of normalized){
    if(r.gameId){if(!byGameId.has(r.gameId))byGameId.set(r.gameId,[]);byGameId.get(r.gameId).push(r)}
    for(const t of [r.awayTeam,r.homeTeam].filter(Boolean)){
      const k=`${r.season}:${r.week}:${t}`;
      if(!bySWT.has(k))bySWT.set(k,[]);
      bySWT.get(k).push(r);
    }
  }
  return {normalized,byGameId,bySWT};
}

const obsIdentity=o=>({
  season:num(o?.identity?.season),week:num(o?.identity?.week),gameId:str(o?.identity?.gameId),
  team:up(o?.identity?.team),opponent:up(o?.identity?.opponent),position:up(o?.identity?.position),
  unavailablePlayerId:str(o?.identity?.unavailablePlayerId),replacementPlayerId:str(o?.identity?.replacementPlayerId)
});

export function resolveDecisionRecord(o,idx){
  const i=obsIdentity(o); let c=i.gameId?(idx.byGameId.get(i.gameId)??[]):[];
  if(!c.length&&i.season!=null&&i.week!=null&&i.team)c=idx.bySWT.get(`${i.season}:${i.week}:${i.team}`)??[];
  if(i.opponent&&c.length>1)c=c.filter(r=>(r.awayTeam===i.team&&r.homeTeam===i.opponent)||(r.homeTeam===i.team&&r.awayTeam===i.opponent));
  return c.length===1?{status:'JOINED',record:c[0]}:c.length>1?{status:'AMBIGUOUS',candidates:c.length}:{status:'MISSING',candidates:0};
}

export function constructBaselineResidual(observation,decision,config){
  const i=obsIdentity(observation);
  const side=decision.homeTeam===i.team?'HOME':decision.awayTeam===i.team?'AWAY':null;
  if(!side) return {status:'INVALID',reason:'TEAM_NOT_PRESENT_IN_JOINED_DECISION_RECORD'};
  if(!finite(decision.matchupEdge)) return {status:'INVALID',reason:'MISSING_CANONICAL_MATCHUP_EDGE'};
  if(!finite(decision.evidenceQuality)) return {status:'INVALID',reason:'MISSING_CANONICAL_EVIDENCE_QUALITY'};
  const actualTeamMargin=num(observation?.outcome?.pointMargin);
  if(!finite(actualTeamMargin)) return {status:'INVALID',reason:'MISSING_FINAL_TEAM_POINT_MARGIN'};

  const prediction=predictNFLCandidate(config.modelId,{pregame:{matchupEdge:decision.matchupEdge,evidenceQuality:decision.evidenceQuality}},config.parameters);
  const expectedHomeMargin=num(prediction?.expectedHomeMargin);
  if(!finite(expectedHomeMargin)) return {status:'INVALID',reason:'CANONICAL_MODEL_EXPECTED_MARGIN_UNAVAILABLE'};
  const expectedTeamMargin=side==='HOME'?expectedHomeMargin:-expectedHomeMargin;
  const gamePerformanceResidual=actualTeamMargin-expectedTeamMargin;

  return {status:'AVAILABLE',record:{
    contract:'NFLHistoricalAvailabilityImpactBaselineResidual',
    contractVersion:'FIE-NFL-HISTORICAL-AVAILABILITY-IMPACT-BASELINE-RESIDUAL-1.0.0',
    identity:{...i,gameType:decision.gameType,gameId:decision.gameId,side},
    availability:{
      unavailableStatus:observation?.pregame?.unavailableStatus??null,
      playerCaliber:num(observation?.pregame?.playerCaliber),
      playerCaliberConfidence:num(observation?.pregame?.playerCaliberConfidence),
      replacementCaliber:num(observation?.pregame?.replacementCaliber),
      replacementCaliberConfidence:num(observation?.pregame?.replacementCaliberConfidence),
      expectedReplacementDelta:num(observation?.pregame?.expectedReplacementDelta),
      replacementEvidenceType:observation?.pregame?.replacementEvidenceType??null
    },
    pregameBaseline:{
      modelId:config.modelId,
      modelVersion:config.modelVersion??null,
      productionAuthorityGranted:config.productionAuthorityGranted===true,
      fittedRecords:num(config.fittedRecords),
      parameters:{...config.parameters},
      snapshotThroughWeek:decision.snapshotThroughWeek,
      matchupEdge:decision.matchupEdge,
      evidenceQuality:decision.evidenceQuality,
      expectedHomeMargin,
      expectedTeamMargin
    },
    outcome:{
      status:observation?.outcome?.status??null,
      teamPoints:num(observation?.outcome?.teamPoints),
      opponentPoints:num(observation?.outcome?.opponentPoints),
      actualTeamMargin,
      won:observation?.outcome?.won??null,
      tied:observation?.outcome?.tied??null
    },
    residual:{
      gamePerformanceResidual,
      definition:'ACTUAL_TEAM_MARGIN_MINUS_CANONICAL_EXPECTED_TEAM_MARGIN',
      observedPlayerImpact:null,
      causalTargetDefined:false,
      fittingAuthorized:false
    },
    provenance:{
      sourceObservationContract:observation?.contractVersion??null,
      sourceObservationDataset:'historical-availability-impact-calibration-observations-v1.jsonl',
      historicalDecisionDataset:'generatedNFLHistoricalDecisionDataset.js',
      canonicalDecisionModel:'NFLGameDecisionModelV1 / QUALITY_WEIGHTED_MATCHUP'
    },
    safeguards:{
      baselineUsesProductionCanonicalModelConfig:true,
      missingBaselineFeaturesFailClosed:true,
      candidateModelDefaultsUsedForMissingHistoricalFeatures:false,
      rawPointMarginIsNotObservedPlayerImpact:true,
      gamePerformanceResidualIsNotObservedPlayerImpact:true,
      learnedWeightsCreated:false,
      calibrationExecuted:false,
      decisionModelMutated:false,
      teamStrengthMutated:false,
      pickemScoringMutated:false,
      databaseMutated:false
    }
  }};
}

export async function constructHistoricalAvailabilityImpactBaselineResiduals(){
  const observations=loadJsonl(DEFAULT_OBSERVATION_FILE);
  const loaded=await loadCanonicalDecisionDataset();
  const idx=indexDecisionRecords(loaded.records);
  let config=null,configError=null;
  try{config=getNFLCanonicalGameDecisionModelConfig()}catch(e){configError=e.message}
  const records=[],residuals=[];
  let joined=0,missing=0,ambiguous=0,missingEdge=0,missingQuality=0,invalid=0;
  if(config){
    for(const o of observations){
      const j=resolveDecisionRecord(o,idx);
      if(j.status==='MISSING'){missing++;residuals.push({reason:'MISSING_DECISION_RECORD',observation:o});continue}
      if(j.status==='AMBIGUOUS'){ambiguous++;residuals.push({reason:'AMBIGUOUS_DECISION_RECORD',candidateCount:j.candidates,observation:o});continue}
      joined++;
      const made=constructBaselineResidual(o,j.record,config);
      if(made.status==='AVAILABLE'){records.push(made.record);continue}
      invalid++;
      if(made.reason==='MISSING_CANONICAL_MATCHUP_EDGE')missingEdge++;
      if(made.reason==='MISSING_CANONICAL_EVIDENCE_QUALITY')missingQuality++;
      residuals.push({reason:made.reason,observation:o,decision:{gameId:j.record.gameId,season:j.record.season,week:j.record.week,team:o?.identity?.team}});
    }
  }
  const values=records.map(r=>r.residual.gamePerformanceResidual).filter(Number.isFinite);
  const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  return {loaded,config,configError,records,residuals,report:{
    contractVersion:'FIE-NFL-HISTORICAL-AVAILABILITY-IMPACT-BASELINE-RESIDUAL-REPORT-1.0.0',
    sprint:'2.18.9-RC1',
    sourceObservationCount:observations.length,
    canonicalDecisionRecords:loaded.records.length,
    canonicalDecisionDatasetFile:loaded.file,
    canonicalDecisionDatasetImportError:loaded.error,
    canonicalModelConfigLoaded:Boolean(config),
    canonicalModelConfigError:configError,
    canonicalModelId:config?.modelId??null,
    canonicalModelVersion:config?.modelVersion??null,
    canonicalModelParameters:config?.parameters??null,
    joinedDecisionRecordCount:joined,
    baselineResidualCount:records.length,
    missingDecisionRecordCount:missing,
    ambiguousDecisionRecordCount:ambiguous,
    missingMatchupEdgeCount:missingEdge,
    missingEvidenceQualityCount:missingQuality,
    invalidBaselineInputCount:invalid,
    residualCoverage:observations.length?records.length/observations.length:0,
    meanGamePerformanceResidual:mean(values),
    minGamePerformanceResidual:values.length?Math.min(...values):null,
    maxGamePerformanceResidual:values.length?Math.max(...values):null,
    readiness:{
      baselineResidualDatasetConstructible:records.length>0,
      observedPlayerImpactTargetDefined:false,
      causalTargetDefined:false,
      formalFittingAuthorized:false
    },
    safeguards:{
      productionCanonicalModelConfigReused:true,
      hardcodedMarginTransformUsed:false,
      missingFeatureDefaultsUsed:false,
      rawPointMarginTreatedAsObservedPlayerImpact:false,
      gameResidualTreatedAsObservedPlayerImpact:false,
      learnedWeightsCreated:false,
      calibrationExecuted:false,
      decisionModelMutated:false,
      teamStrengthMutated:false,
      pickemScoringMutated:false,
      databaseMutated:false
    }
  }};
}
