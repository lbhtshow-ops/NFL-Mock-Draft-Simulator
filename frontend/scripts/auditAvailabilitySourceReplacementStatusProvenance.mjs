import fs from "node:fs";
import path from "node:path";

const DATA = "./data/calibration/historical/v1";

const SOURCE_FILE =
  path.join(DATA,"observations-availability.jsonl");

const REPLACEMENT_FILE =
  path.join(DATA,"expected-replacement-identities-v1.jsonl");

const QUALIFYING_TREATMENT_STATUSES =
  new Set(["OUT","DOUBTFUL"]);

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

function norm(v){
  if(v===null || v===undefined) return null;
  const s=String(v).trim().toUpperCase();
  return s||null;
}

function identityFromReplacement(row){
  return {
    season:first(row?.season,row?.identity?.season),
    week:first(row?.week,row?.identity?.week),
    team:first(row?.team,row?.identity?.team),
    unavailablePlayerId:first(
      row?.unavailablePlayerId,
      row?.identity?.unavailablePlayerId
    ),
    replacementPlayerId:first(
      row?.replacementPlayerId,
      row?.identity?.replacementPlayerId
    ),
    position:first(row?.position,row?.identity?.position)
  };
}

function sourceTeamGameIdentity(row){
  return {
    season:first(row?.season,row?.identity?.season,row?.game?.season),
    week:first(row?.week,row?.identity?.week,row?.game?.week),
    team:first(row?.team,row?.identity?.team,row?.game?.team),
    gameId:first(row?.gameId,row?.identity?.gameId,row?.game?.gameId)
  };
}

function playerIdOf(player){
  return first(
    player?.playerId,
    player?.player_id,
    player?.gsisId,
    player?.gsis_id,
    player?.id
  );
}

function playerNameOf(player){
  return first(
    player?.name,
    player?.playerName,
    player?.fullName
  );
}

function reportStatusOf(player){
  return norm(first(
    player?.reportStatus,
    player?.report_status,
    player?.injuryStatus,
    player?.designation,
    player?.gameStatus,
    player?.statusDesignation
  ));
}

function sourcePlayers(row){
  const candidates = [
    row?.impact?.players,
    row?.players,
    row?.availability?.players,
    row?.evidence?.players,
    row?.evidence?.injuryReport?.players,
    row?.evidence?.officialInjuryReport?.players
  ];

  for(const x of candidates){
    if(Array.isArray(x)) return x;
  }

  return [];
}

function playerSignals(player){
  return {
    reportStatus:reportStatusOf(player),
    isOut:player?.isOut===true,
    isDoubtful:player?.isDoubtful===true,
    isQuestionable:player?.isQuestionable===true,
    injuryStatus:norm(player?.injuryStatus),
    designation:norm(player?.designation),
    practiceStatus:norm(player?.practiceStatus),
    gameStatus:norm(player?.gameStatus)
  };
}

function sourcePregameAnchor(row){
  return first(
    row?.pregameOfficialAnchorQualified,
    row?.availability?.pregameOfficialAnchorQualified,
    row?.evidence?.pregameOfficialAnchorQualified,
    row?.impact?.pregameOfficialAnchorQualified
  );
}

function sourceObservedAt(row){
  return first(
    row?.observedAt,
    row?.asOf,
    row?.generatedAt,
    row?.provenance?.observedAt,
    row?.provenance?.generatedAt
  );
}

function replacementStatus(row){
  return norm(first(
    row?.unavailableStatus,
    row?.status,
    row?.availability?.unavailableStatus
  ));
}

function playerEventKey({
  season,
  week,
  team,
  unavailablePlayerId
}){
  return [
    season??"",
    week??"",
    team??"",
    unavailablePlayerId??""
  ].join("|");
}

const sourceRows = readJsonl(SOURCE_FILE);
const replacementRows = readJsonl(REPLACEMENT_FILE);

const sourcePlayerEvents = new Map();

for(const row of sourceRows){
  const base = sourceTeamGameIdentity(row);
  const players = sourcePlayers(row);

  for(const player of players){
    const playerId = playerIdOf(player);
    if(!playerId) continue;

    const key = playerEventKey({
      season:base.season,
      week:base.week,
      team:base.team,
      unavailablePlayerId:playerId
    });

    if(!sourcePlayerEvents.has(key)){
      sourcePlayerEvents.set(key,[]);
    }

    sourcePlayerEvents.get(key).push({
      teamGame:base,
      player:{
        playerId,
        name:playerNameOf(player),
        position:first(player?.position,player?.pos)
      },
      signals:playerSignals(player),
      pregameOfficialAnchorQualified:sourcePregameAnchor(row),
      observedAt:sourceObservedAt(row),
      rowEvidenceKeys:
        row?.evidence && typeof row.evidence==="object"
          ? Object.keys(row.evidence).sort()
          : [],
      rowImpactKeys:
        row?.impact && typeof row.impact==="object"
          ? Object.keys(row.impact).sort()
          : []
    });
  }
}

const replacementAudit = {
  totalRows:replacementRows.length,
  treatmentRows:0,
  outRows:0,
  doubtfulRows:0,
  questionableRows:0,
  otherStatusRows:0
};

const statusTransformEvidence = {
  OUT:{
    replacementRows:0,
    joinedRows:0,
    joinedWithReportStatusOUT:0,
    joinedWithIsOutTrue:0,
    joinedWithAnchorTrue:0
  },
  DOUBTFUL:{
    replacementRows:0,
    joinedRows:0,
    joinedWithReportStatusDOUBTFUL:0,
    joinedWithIsDoubtfulTrue:0,
    joinedWithAnchorTrue:0
  }
};

let joinedReplacementRows = 0;
let uniqueJoinRows = 0;
let ambiguousJoinRows = 0;
let missingJoinRows = 0;
let qualifyingRowsWithExactSourceSignal = 0;
let qualifyingRowsWithoutExactSourceSignal = 0;
let qualifyingRowsWithAnchorTrue = 0;
let qualifyingRowsWithAnchorFalse = 0;
let qualifyingRowsWithAnchorUnknown = 0;

const samples = [];
const unresolvedSamples = [];

for(const row of replacementRows){
  const id = identityFromReplacement(row);
  const status = replacementStatus(row);

  if(status==="OUT"){
    replacementAudit.outRows++;
    replacementAudit.treatmentRows++;
    statusTransformEvidence.OUT.replacementRows++;
  }else if(status==="DOUBTFUL"){
    replacementAudit.doubtfulRows++;
    replacementAudit.treatmentRows++;
    statusTransformEvidence.DOUBTFUL.replacementRows++;
  }else if(status==="QUESTIONABLE"){
    replacementAudit.questionableRows++;
  }else{
    replacementAudit.otherStatusRows++;
  }

  const key = playerEventKey(id);
  const matches = sourcePlayerEvents.get(key)??[];

  if(matches.length===0){
    missingJoinRows++;
  }else{
    joinedReplacementRows++;
    if(matches.length===1) uniqueJoinRows++;
    else ambiguousJoinRows++;
  }

  if(!QUALIFYING_TREATMENT_STATUSES.has(status)) continue;

  const exactSignal = matches.some(m=>
    status==="OUT"
      ? (
          m.signals.reportStatus==="OUT" ||
          m.signals.isOut===true ||
          m.signals.injuryStatus==="OUT" ||
          m.signals.designation==="OUT" ||
          m.signals.gameStatus==="OUT"
        )
      : (
          m.signals.reportStatus==="DOUBTFUL" ||
          m.signals.isDoubtful===true ||
          m.signals.injuryStatus==="DOUBTFUL" ||
          m.signals.designation==="DOUBTFUL" ||
          m.signals.gameStatus==="DOUBTFUL"
        )
  );

  if(exactSignal) qualifyingRowsWithExactSourceSignal++;
  else qualifyingRowsWithoutExactSourceSignal++;

  const anchorValues = matches
    .map(m=>m.pregameOfficialAnchorQualified)
    .filter(v=>v!==null && v!==undefined);

  if(anchorValues.some(v=>v===true)){
    qualifyingRowsWithAnchorTrue++;
  }else if(anchorValues.some(v=>v===false)){
    qualifyingRowsWithAnchorFalse++;
  }else{
    qualifyingRowsWithAnchorUnknown++;
  }

  if(status==="OUT"){
    statusTransformEvidence.OUT.joinedRows += matches.length?1:0;
    if(matches.some(m=>m.signals.reportStatus==="OUT"))
      statusTransformEvidence.OUT.joinedWithReportStatusOUT++;
    if(matches.some(m=>m.signals.isOut===true))
      statusTransformEvidence.OUT.joinedWithIsOutTrue++;
    if(matches.some(m=>m.pregameOfficialAnchorQualified===true))
      statusTransformEvidence.OUT.joinedWithAnchorTrue++;
  }

  if(status==="DOUBTFUL"){
    statusTransformEvidence.DOUBTFUL.joinedRows += matches.length?1:0;
    if(matches.some(m=>m.signals.reportStatus==="DOUBTFUL"))
      statusTransformEvidence.DOUBTFUL.joinedWithReportStatusDOUBTFUL++;
    if(matches.some(m=>m.signals.isDoubtful===true))
      statusTransformEvidence.DOUBTFUL.joinedWithIsDoubtfulTrue++;
    if(matches.some(m=>m.pregameOfficialAnchorQualified===true))
      statusTransformEvidence.DOUBTFUL.joinedWithAnchorTrue++;
  }

  const record = {
    replacement:{
      identity:id,
      unavailableStatus:status,
      evidenceType:first(
        row?.evidenceType,
        row?.replacementEvidenceType
      ),
      mappingStatus:row?.mappingStatus??null,
      pregameOfficialAnchorQualified:
        row?.pregameOfficialAnchorQualified??null,
      postgameSnapDefinedReplacement:
        row?.postgameSnapDefinedReplacement??null
    },
    sourceMatchCount:matches.length,
    sourceMatches:matches.slice(0,6)
  };

  if(exactSignal && samples.length<20){
    samples.push(record);
  }

  if(!exactSignal && unresolvedSamples.length<20){
    unresolvedSamples.push(record);
  }
}

const sourceSchema = {
  sourceRows:sourceRows.length,
  sourcePlayerEventKeys:sourcePlayerEvents.size,
  seasons:{},
  playerSignalCounts:{
    reportStatus:0,
    isOut:0,
    isDoubtful:0,
    isQuestionable:0,
    anchorTrue:0
  }
};

for(const row of sourceRows){
  const season = Number(
    first(row?.season,row?.identity?.season,row?.game?.season)
  );

  if(Number.isFinite(season)){
    sourceSchema.seasons[season]=(sourceSchema.seasons[season]??0)+1;
  }

  for(const player of sourcePlayers(row)){
    const sig=playerSignals(player);
    if(sig.reportStatus) sourceSchema.playerSignalCounts.reportStatus++;
    if(sig.isOut) sourceSchema.playerSignalCounts.isOut++;
    if(sig.isDoubtful) sourceSchema.playerSignalCounts.isDoubtful++;
    if(sig.isQuestionable) sourceSchema.playerSignalCounts.isQuestionable++;
  }

  if(sourcePregameAnchor(row)===true){
    sourceSchema.playerSignalCounts.anchorTrue++;
  }
}

const treatmentCoverage =
  replacementAudit.treatmentRows
    ? qualifyingRowsWithExactSourceSignal/replacementAudit.treatmentRows
    : 0;

const joinCoverage =
  replacementRows.length
    ? joinedReplacementRows/replacementRows.length
    : 0;

const checks = {
  sourceExists:fs.existsSync(SOURCE_FILE),
  replacementExists:fs.existsSync(REPLACEMENT_FILE),

  sourceRowsPresent:sourceRows.length>0,
  replacementRowsPresent:replacementRows.length>0,

  replacementCountDerivedDynamically:true,

  qualifyingTreatmentRowsPresent:
    replacementAudit.treatmentRows>0,

  sourcePlayerEventsConstructed:
    sourcePlayerEvents.size>0,

  replacementJoinCoveragePositive:
    joinCoverage>0,

  exactQualifyingSourceSignalsPresent:
    qualifyingRowsWithExactSourceSignal>0,

  outSourceSignalPresent:
    statusTransformEvidence.OUT.joinedWithReportStatusOUT>0 ||
    statusTransformEvidence.OUT.joinedWithIsOutTrue>0,

  doubtfulSourceSignalPresent:
    statusTransformEvidence.DOUBTFUL.joinedWithReportStatusDOUBTFUL>0 ||
    statusTransformEvidence.DOUBTFUL.joinedWithIsDoubtfulTrue>0,

  sourcePregameAnchorEvidencePresent:
    qualifyingRowsWithAnchorTrue>0,

  rosterStatusReinterpretationUsed:false,
  questionablesPromotedToTreatment:false,
  outcomesUsedForProvenance:false
};

let decision;

if(
  checks.exactQualifyingSourceSignalsPresent &&
  treatmentCoverage===1 &&
  checks.sourcePregameAnchorEvidencePresent
){
  decision =
    "SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_RECONCILED_FOR_ALL_TREATMENT_ROWS";
}else if(
  checks.exactQualifyingSourceSignalsPresent &&
  treatmentCoverage>=0.9
){
  decision =
    "SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_SUBSTANTIALLY_RECONCILED_WITH_RESIDUAL_GAPS";
}else if(
  checks.exactQualifyingSourceSignalsPresent
){
  decision =
    "SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_PARTIALLY_RECONCILED";
}else if(
  checks.replacementJoinCoveragePositive
){
  decision =
    "SOURCE_ARTIFACT_JOIN_RECONCILED_BUT_TREATMENT_FIELD_TRANSFORM_NOT_PROVEN";
}else{
  decision =
    "AVAILABILITY_SOURCE_TO_REPLACEMENT_STATUS_PROVENANCE_NOT_RECONCILED";
}

console.log(JSON.stringify({
  contractVersion:
    "FIE-NFL-AVAILABILITY-SOURCE-REPLACEMENT-STATUS-PROVENANCE-1.0.0",

  sprint:"2.18.23-RC6",
  mode:"READ_ONLY_STATUS_PROVENANCE_RECONCILIATION",

  source:{
    file:path.resolve(SOURCE_FILE),
    ...sourceSchema
  },

  replacement:{
    file:path.resolve(REPLACEMENT_FILE),
    ...replacementAudit
  },

  join:{
    joinedReplacementRows,
    uniqueJoinRows,
    ambiguousJoinRows,
    missingJoinRows,
    joinCoverage
  },

  treatmentProvenance:{
    qualifyingRows:replacementAudit.treatmentRows,
    qualifyingRowsWithExactSourceSignal,
    qualifyingRowsWithoutExactSourceSignal,
    treatmentCoverage,

    qualifyingRowsWithAnchorTrue,
    qualifyingRowsWithAnchorFalse,
    qualifyingRowsWithAnchorUnknown,

    byStatus:statusTransformEvidence
  },

  samples,
  unresolvedSamples,

  checks,
  decision,

  readiness:{
    exactHistoricalTreatmentStatusProvenanceValidated:
      decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_RECONCILED_FOR_ALL_TREATMENT_ROWS",

    historicalTreatmentStatusProvenanceSubstantiallyValidated:
      decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_RECONCILED_FOR_ALL_TREATMENT_ROWS" ||
      decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_SUBSTANTIALLY_RECONCILED_WITH_RESIDUAL_GAPS",

    equivalent2025SourceComparisonMayAdvance:
      (
        decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_RECONCILED_FOR_ALL_TREATMENT_ROWS" ||
        decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_SUBSTANTIALLY_RECONCILED_WITH_RESIDUAL_GAPS"
      ),

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
      decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_RECONCILED_FOR_ALL_TREATMENT_ROWS" ||
      decision==="SOURCE_FIELD_TO_UNAVAILABLE_STATUS_PROVENANCE_SUBSTANTIALLY_RECONCILED_WITH_RESIDUAL_GAPS"
    )
      ? "AUDIT_2025_EQUIVALENT_PLAYER_STATUS_AND_PREGAME_ANCHOR_COVERAGE_USING_THE_PROVEN_SOURCE_FIELDS"
      : "INSPECT_UNRESOLVED_TREATMENT_ROWS_AND_SOURCE_PLAYER_SCHEMA_BEFORE_ANY_2025_COMPARISON",

  safeguards:{
    sourceArtifactMutated:false,
    replacementArtifactMutated:false,
    treatmentDefinitionChanged:false,
    questionablePromotedToTreatment:false,
    rosterStatusUsedAsInjuryDesignation:false,
    statusValuesInvented:false,
    historicalBackfillPerformed:false,
    outcomesUsedForQualification:false,
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
