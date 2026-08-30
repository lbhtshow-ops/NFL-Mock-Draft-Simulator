import fs from "node:fs";
import path from "node:path";

const DATA="./data/calibration/historical/v1";
const SOURCE_FILE=path.join(DATA,"observations-availability.jsonl");
const REPLACEMENT_FILE=path.join(DATA,"expected-replacement-identities-v1.jsonl");

const TREATMENT_STATUSES=new Set(["OUT","DOUBTFUL"]);

function readJsonl(file){
  if(!fs.existsSync(file))return[];
  return fs.readFileSync(file,"utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line=>{try{return JSON.parse(line)}catch{return null}})
    .filter(Boolean);
}
function first(...xs){for(const x of xs)if(x!==null&&x!==undefined&&x!=="")return x;return null;}
function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
function norm(v){if(v===null||v===undefined)return null;const s=String(v).trim().toUpperCase();return s||null;}

function sourceSeason(row){const v=first(row?.season,row?.identity?.season,row?.game?.season);return finite(v)?Number(v):null;}
function sourceWeek(row){const v=first(row?.week,row?.identity?.week,row?.game?.week);return finite(v)?Number(v):null;}
function sourceTeam(row){const v=first(row?.team,row?.identity?.team,row?.game?.team);return v?String(v).toUpperCase():null;}
function sourceGameId(row){const v=first(row?.gameId,row?.identity?.gameId,row?.game?.gameId);return v?String(v):null;}

function sourcePlayers(row){
  const p=row?.evidence?.availabilityImpact?.players;
  return Array.isArray(p)?p:[];
}
function playerId(p){return first(p?.playerId,p?.player_id,p?.gsisId,p?.gsis_id,p?.id);}
function reportStatus(p){return norm(first(p?.reportStatus,p?.report_status,p?.designation,p?.injuryStatus,p?.gameStatus));}

function replacementIdentity(row){
  return {
    season:first(row?.season,row?.identity?.season),
    week:first(row?.week,row?.identity?.week),
    team:first(row?.team,row?.identity?.team),
    unavailablePlayerId:first(row?.unavailablePlayerId,row?.identity?.unavailablePlayerId),
    replacementPlayerId:first(row?.replacementPlayerId,row?.identity?.replacementPlayerId),
    position:first(row?.position,row?.identity?.position)
  };
}
function replacementStatus(row){return norm(first(row?.unavailableStatus,row?.availability?.unavailableStatus,row?.status));}

function eventKey({season,week,team,unavailablePlayerId}){
  return [season??"",week??"",team??"",unavailablePlayerId??""].join("|");
}

const sourceRows=readJsonl(SOURCE_FILE);
const replacementRows=readJsonl(REPLACEMENT_FILE);

const sourceEvents=new Map();
const sourceSummary={
  rows:sourceRows.length,
  bySeason:{},
  playerRows:0,
  byReportStatus:{},
  isOutTrue:0,
  isDoubtfulTrue:0,
  isQuestionableTrue:0,
  playerRowsWithDateModified:0,
  playerRowsWithPracticeStatus:0,
  playerRowsWithPrimaryInjury:0
};

for(const row of sourceRows){
  const season=sourceSeason(row);
  if(season!==null)sourceSummary.bySeason[season]=(sourceSummary.bySeason[season]??0)+1;

  const players=sourcePlayers(row);

  for(const p of players){
    const pid=playerId(p);
    if(!pid)continue;

    sourceSummary.playerRows++;
    const rs=reportStatus(p);
    if(rs)sourceSummary.byReportStatus[rs]=(sourceSummary.byReportStatus[rs]??0)+1;
    if(p?.isOut===true)sourceSummary.isOutTrue++;
    if(p?.isDoubtful===true)sourceSummary.isDoubtfulTrue++;
    if(p?.isQuestionable===true)sourceSummary.isQuestionableTrue++;
    if(p?.dateModified)sourceSummary.playerRowsWithDateModified++;
    if(p?.practiceStatus)sourceSummary.playerRowsWithPracticeStatus++;
    if(p?.reportPrimaryInjury)sourceSummary.playerRowsWithPrimaryInjury++;

    const key=eventKey({
      season,
      week:sourceWeek(row),
      team:sourceTeam(row),
      unavailablePlayerId:String(pid)
    });

    if(!sourceEvents.has(key))sourceEvents.set(key,[]);
    sourceEvents.get(key).push({
      gameId:sourceGameId(row),
      season,
      week:sourceWeek(row),
      team:sourceTeam(row),
      playerId:String(pid),
      name:p?.name??null,
      position:p?.position??null,
      reportStatus:rs,
      isOut:p?.isOut===true,
      isDoubtful:p?.isDoubtful===true,
      isQuestionable:p?.isQuestionable===true,
      reportPrimaryInjury:p?.reportPrimaryInjury??null,
      reportSecondaryInjury:p?.reportSecondaryInjury??null,
      practiceStatus:p?.practiceStatus??null,
      practicePrimaryInjury:p?.practicePrimaryInjury??null,
      dateModified:p?.dateModified??null,
      availabilitySource:row?.datasetGovernance?.availabilitySource??null,
      availabilityJoin:row?.datasetGovernance?.availabilityJoin??null,
      availabilityImpactStatus:row?.evidence?.availabilityImpact?.status??null
    });
  }
}

const replacementSummary={
  rows:replacementRows.length,
  bySeason:{},
  byUnavailableStatus:{},
  treatmentRows:0,
  questionableRows:0,
  pregameAnchorTrue:0,
  pregameAnchorFalse:0,
  pregameAnchorNull:0
};

const matrix={};
function bump(repStatus,srcStatus,field){
  const k=`${repStatus}|${srcStatus}`;
  if(!matrix[k])matrix[k]={replacementStatus:repStatus,sourceReportStatus:srcStatus,joinedRows:0,sourceIsOutTrue:0,sourceIsDoubtfulTrue:0,sourceIsQuestionableTrue:0,pregameAnchorTrue:0,pregameAnchorFalse:0,pregameAnchorNull:0};
  matrix[k][field]++;
}

let joined=0,uniqueJoined=0,ambiguousJoined=0,missing=0;
let exactStatusMatch=0;
let exactBooleanMatch=0;
let treatmentRowsWithSourceTreatmentSignal=0;
let treatmentRowsWithoutSourceTreatmentSignal=0;
let questionableRowsWithSourceQuestionableSignal=0;
let questionableRowsIncorrectlyPromoted=0;

const samples=[];
const unresolved=[];

for(const row of replacementRows){
  const id=replacementIdentity(row);
  const season=finite(id.season)?Number(id.season):null;
  if(season!==null)replacementSummary.bySeason[season]=(replacementSummary.bySeason[season]??0)+1;

  const repStatus=replacementStatus(row)??"UNKNOWN";
  replacementSummary.byUnavailableStatus[repStatus]=(replacementSummary.byUnavailableStatus[repStatus]??0)+1;

  if(TREATMENT_STATUSES.has(repStatus))replacementSummary.treatmentRows++;
  if(repStatus==="QUESTIONABLE")replacementSummary.questionableRows++;

  const anchor=row?.pregameOfficialAnchorQualified;
  if(anchor===true)replacementSummary.pregameAnchorTrue++;
  else if(anchor===false)replacementSummary.pregameAnchorFalse++;
  else replacementSummary.pregameAnchorNull++;

  const matches=sourceEvents.get(eventKey(id))??[];
  if(matches.length===0)missing++;
  else{
    joined++;
    if(matches.length===1)uniqueJoined++;
    else ambiguousJoined++;
  }

  let anyExactStatus=false;
  let anyExactBoolean=false;
  let anyTreatmentSignal=false;
  let anyQuestionableSignal=false;

  for(const m of matches){
    const srcStatus=m.reportStatus??"UNKNOWN";
    bump(repStatus,srcStatus,"joinedRows");

    if(m.isOut)bump(repStatus,srcStatus,"sourceIsOutTrue");
    if(m.isDoubtful)bump(repStatus,srcStatus,"sourceIsDoubtfulTrue");
    if(m.isQuestionable)bump(repStatus,srcStatus,"sourceIsQuestionableTrue");

    if(anchor===true)bump(repStatus,srcStatus,"pregameAnchorTrue");
    else if(anchor===false)bump(repStatus,srcStatus,"pregameAnchorFalse");
    else bump(repStatus,srcStatus,"pregameAnchorNull");

    if(repStatus===srcStatus)anyExactStatus=true;

    if(repStatus==="OUT" && m.isOut)anyExactBoolean=true;
    if(repStatus==="DOUBTFUL" && m.isDoubtful)anyExactBoolean=true;
    if(repStatus==="QUESTIONABLE" && m.isQuestionable)anyExactBoolean=true;

    if(
      m.reportStatus==="OUT" ||
      m.reportStatus==="DOUBTFUL" ||
      m.isOut ||
      m.isDoubtful
    ) anyTreatmentSignal=true;

    if(
      m.reportStatus==="QUESTIONABLE" ||
      m.isQuestionable
    ) anyQuestionableSignal=true;
  }

  if(anyExactStatus)exactStatusMatch++;
  if(anyExactBoolean)exactBooleanMatch++;

  if(TREATMENT_STATUSES.has(repStatus)){
    if(anyTreatmentSignal)treatmentRowsWithSourceTreatmentSignal++;
    else treatmentRowsWithoutSourceTreatmentSignal++;
  }

  if(repStatus==="QUESTIONABLE"){
    if(anyQuestionableSignal)questionableRowsWithSourceQuestionableSignal++;
    if(anyTreatmentSignal)questionableRowsIncorrectlyPromoted++;
  }

  const rec={
    replacement:{
      identity:id,
      unavailableStatus:repStatus,
      mappingStatus:row?.mappingStatus??null,
      evidenceType:row?.evidenceType??null,
      pregameOfficialAnchorQualified:anchor??null,
      inferredFromRosterOrder:row?.inferredFromRosterOrder??null,
      postgameSnapDefinedReplacement:row?.postgameSnapDefinedReplacement??null
    },
    sourceMatchCount:matches.length,
    sourceMatches:matches.slice(0,8)
  };

  if(
    matches.length &&
    (
      anyExactStatus ||
      anyExactBoolean
    ) &&
    samples.length<25
  ) samples.push(rec);

  if(
    (
      TREATMENT_STATUSES.has(repStatus) &&
      !anyTreatmentSignal
    ) &&
    unresolved.length<25
  ) unresolved.push(rec);
}

const transformCoverage={
  joinCoverage:replacementRows.length?joined/replacementRows.length:0,
  exactStatusMatchCoverage:joined?exactStatusMatch/joined:0,
  exactBooleanMatchCoverage:joined?exactBooleanMatch/joined:0,
  treatmentSourceSignalCoverage:replacementSummary.treatmentRows?treatmentRowsWithSourceTreatmentSignal/replacementSummary.treatmentRows:0,
  questionableSourceSignalCoverage:replacementSummary.questionableRows?questionableRowsWithSourceQuestionableSignal/replacementSummary.questionableRows:0
};

const rules={
  proposedObservedTransform:{
    OUT:"source reportStatus=OUT and/or isOut=true",
    DOUBTFUL:"source reportStatus=DOUBTFUL and/or isDoubtful=true",
    QUESTIONABLE:"source reportStatus=QUESTIONABLE and/or isQuestionable=true; not treatment by itself"
  },
  treatmentStatuses:["OUT","DOUBTFUL"],
  questionableTreatment:false,
  pregameAnchorRole:
    "Audited separately from designation transform; required governance role must be inferred from replacement artifact and builder semantics, not invented."
};

const checks={
  sourceExists:fs.existsSync(SOURCE_FILE),
  replacementExists:fs.existsSync(REPLACEMENT_FILE),
  sourceAvailabilityImpactPlayersPresent:sourceSummary.playerRows>0,
  sourceOutSignalsPresent:
    (sourceSummary.byReportStatus.OUT??0)>0 || sourceSummary.isOutTrue>0,
  sourceDoubtfulSignalsPresent:
    (sourceSummary.byReportStatus.DOUBTFUL??0)>0 || sourceSummary.isDoubtfulTrue>0,
  sourceQuestionableSignalsPresent:
    (sourceSummary.byReportStatus.QUESTIONABLE??0)>0 || sourceSummary.isQuestionableTrue>0,
  replacementTreatmentRowsPresent:replacementSummary.treatmentRows>0,
  joinCoveragePositive:transformCoverage.joinCoverage>0,
  treatmentSourceSignalCoveragePositive:transformCoverage.treatmentSourceSignalCoverage>0,
  questionableNotPromotedByContract:true,
  rosterStatusReinterpretationUsed:false,
  outcomesUsedForTransform:false
};

let decision;
if(
  transformCoverage.treatmentSourceSignalCoverage===1 &&
  transformCoverage.joinCoverage===1 &&
  questionableRowsIncorrectlyPromoted===0
){
  decision="HISTORICAL_STATUS_TRANSFORM_FULLY_RECONCILED";
}else if(
  transformCoverage.treatmentSourceSignalCoverage>=0.95 &&
  questionableRowsIncorrectlyPromoted===0
){
  decision="HISTORICAL_STATUS_TRANSFORM_SUBSTANTIALLY_RECONCILED_WITH_SMALL_GAPS";
}else if(
  transformCoverage.treatmentSourceSignalCoverage>0
){
  decision="HISTORICAL_STATUS_TRANSFORM_PARTIALLY_RECONCILED";
}else{
  decision="HISTORICAL_STATUS_TRANSFORM_NOT_RECONCILED";
}

console.log(JSON.stringify({
  contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-STATUS-TRANSFORM-LINEAGE-1.0.0",
  sprint:"2.18.23-RC8",
  mode:"READ_ONLY_STATUS_TRANSFORM_LINEAGE_AUDIT",

  source:{
    file:path.resolve(SOURCE_FILE),
    ...sourceSummary
  },

  replacement:{
    file:path.resolve(REPLACEMENT_FILE),
    ...replacementSummary
  },

  join:{
    joined,
    uniqueJoined,
    ambiguousJoined,
    missing,
    ...transformCoverage
  },

  transform:{
    treatmentRowsWithSourceTreatmentSignal,
    treatmentRowsWithoutSourceTreatmentSignal,
    questionableRowsWithSourceQuestionableSignal,
    questionableRowsIncorrectlyPromoted,
    exactStatusMatch,
    exactBooleanMatch,
    matrix:Object.values(matrix)
      .sort((a,b)=>
        a.replacementStatus.localeCompare(b.replacementStatus) ||
        a.sourceReportStatus.localeCompare(b.sourceReportStatus)
      )
  },

  rules,
  samples,
  unresolved,

  checks,
  decision,

  readiness:{
    statusTransformAuditComplete:true,

    historicalStatusTransformValidated:
      decision==="HISTORICAL_STATUS_TRANSFORM_FULLY_RECONCILED",

    historicalStatusTransformSubstantiallyValidated:
      decision==="HISTORICAL_STATUS_TRANSFORM_FULLY_RECONCILED" ||
      decision==="HISTORICAL_STATUS_TRANSFORM_SUBSTANTIALLY_RECONCILED_WITH_SMALL_GAPS",

    equivalent2025SourceComparisonMayAdvance:
      decision==="HISTORICAL_STATUS_TRANSFORM_FULLY_RECONCILED" ||
      decision==="HISTORICAL_STATUS_TRANSFORM_SUBSTANTIALLY_RECONCILED_WITH_SMALL_GAPS",

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
    (
      decision==="HISTORICAL_STATUS_TRANSFORM_FULLY_RECONCILED" ||
      decision==="HISTORICAL_STATUS_TRANSFORM_SUBSTANTIALLY_RECONCILED_WITH_SMALL_GAPS"
    )
      ? "AUDIT_2025_FOR_EQUIVALENT_NFLVERSE_INJURY_REPORT_FIELDS_AND_SAFE_PREGAME_JOIN_COVERAGE"
      : "INVESTIGATE_UNRESOLVED_REPLACEMENT_EVENTS_AND_BUILDER_JOIN_KEYS_BEFORE_2025_COMPARISON",

  safeguards:{
    sourceArtifactMutated:false,
    replacementArtifactMutated:false,
    treatmentDefinitionChanged:false,
    questionablePromotedToTreatment:false,
    rosterStatusUsedAsInjuryDesignation:false,
    statusValuesInvented:false,
    historicalBackfillPerformed:false,
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
