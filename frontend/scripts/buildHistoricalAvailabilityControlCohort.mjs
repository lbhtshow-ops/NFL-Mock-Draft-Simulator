const CLASSIFICATIONS = Object.freeze({
  TREATED: "TREATED",
  CONTROL_CANDIDATE: "CONTROL_CANDIDATE",
  AVAILABILITY_EXPOSED_UNRESOLVED: "AVAILABILITY_EXPOSED_UNRESOLVED",
  EXCLUDED_UNKNOWN: "EXCLUDED_UNKNOWN",
});

const clean = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
const finite = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const integer = (v) => Number.isInteger(Number(v)) ? Number(v) : null;
const array = (v) => Array.isArray(v) ? v : [];
const upper = (v) => { const x = clean(v); return x ? x.toUpperCase() : null; };

export function teamGameKey(gameId, team) {
  const g = clean(gameId), t = upper(team);
  return g && t ? `${g}:${t}` : null;
}

function normalizeStatus(v) {
  const x = upper(v);
  if (!x) return null;
  if (x === "OUT") return "OUT";
  if (x === "DOUBTFUL") return "DOUBTFUL";
  if (x === "QUESTIONABLE") return "QUESTIONABLE";
  return x;
}

function availabilitySummary(source) {
  const impact = source?.evidence?.availabilityImpact ?? null;
  const players = array(impact?.players);
  const normalized = players.map((player) => {
    const status =
      player?.isOut === true ? "OUT" :
      player?.isDoubtful === true ? "DOUBTFUL" :
      player?.isQuestionable === true ? "QUESTIONABLE" :
      normalizeStatus(player?.reportStatus ?? player?.report_status);
    return Object.freeze({
      playerId: clean(player?.playerId ?? player?.gsis_id),
      name: clean(player?.name ?? player?.full_name),
      position: upper(player?.position),
      status,
      dateModified: clean(player?.dateModified ?? player?.date_modified),
    });
  });

  const outPlayers = normalized.filter((p) => p.status === "OUT");
  const doubtfulPlayers = normalized.filter((p) => p.status === "DOUBTFUL");
  const questionablePlayers = normalized.filter((p) => p.status === "QUESTIONABLE");
  const reportedOutCount = finite(impact?.outCount) ? Number(impact.outCount) : 0;
  const reportedDoubtfulCount = finite(impact?.doubtfulCount) ? Number(impact.doubtfulCount) : 0;
  const reportedQuestionableCount = finite(impact?.questionableCount) ? Number(impact.questionableCount) : 0;
  const outCount = Math.max(outPlayers.length, reportedOutCount);
  const doubtfulCount = Math.max(doubtfulPlayers.length, reportedDoubtfulCount);
  const questionableCount = Math.max(questionablePlayers.length, reportedQuestionableCount);

  return Object.freeze({
    sourceStatus: upper(impact?.status),
    sourceAvailable: impact?.status === "AVAILABLE",
    playerCount: finite(impact?.playerCount) ? Number(impact.playerCount) : players.length,
    outCount, doubtfulCount, questionableCount,
    qualifyingTreatmentEventCount: outCount + doubtfulCount,
    qualifyingPlayers: Object.freeze([...outPlayers, ...doubtfulPlayers]),
  });
}

function treatedSummary(rows) {
  const uniquePlayers = new Set(), positions = new Set(), statuses = new Set(), deltas = [];
  for (const row of rows) {
    const pid = clean(row?.identity?.unavailablePlayerId);
    if (pid) uniquePlayers.add(pid);
    const position = upper(row?.identity?.position);
    if (position) positions.add(position);
    const status = normalizeStatus(row?.availability?.unavailableStatus);
    if (status) statuses.add(status);
    if (finite(row?.availability?.expectedReplacementDelta)) deltas.push(Number(row.availability.expectedReplacementDelta));
  }
  return Object.freeze({
    residualObservationCount: rows.length,
    uniqueUnavailablePlayerCount: uniquePlayers.size,
    positions: Object.freeze([...positions].sort()),
    statuses: Object.freeze([...statuses].sort()),
    completeReplacementDeltaCount: deltas.length,
    expectedReplacementDeltaSum: deltas.reduce((a,b)=>a+b,0),
  });
}

export function classifyHistoricalAvailabilityTeamGame({sourceRows=[], treatedRows=[], allowedSeasons=[2022,2023,2024]}={}) {
  const source = sourceRows.length === 1 ? sourceRows[0] : null;
  const identitySource = sourceRows[0] ?? null;
  const treated = treatedRows.length > 0;
  const season = integer(identitySource?.season ?? treatedRows[0]?.identity?.season);
  const key = teamGameKey(identitySource?.gameId ?? treatedRows[0]?.identity?.gameId, identitySource?.team ?? treatedRows[0]?.identity?.team);
  const base = {
    contract:"NFLHistoricalAvailabilityControlCohortRecord",
    contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-CONTROL-COHORT-1.0.0",
    key,
    identity:Object.freeze({
      gameId:clean(identitySource?.gameId ?? treatedRows[0]?.identity?.gameId),
      season,
      week:integer(identitySource?.week ?? treatedRows[0]?.identity?.week),
      team:upper(identitySource?.team ?? treatedRows[0]?.identity?.team),
      opponent:upper(identitySource?.opponent ?? treatedRows[0]?.identity?.opponent),
      kickoffAt:clean(source?.kickoffAt),
      evidenceAsOf:clean(source?.evidenceAsOf),
      leakageSafe:source?.leakageSafe === true,
      split:clean(source?.split),
    }),
    availability:source ? availabilitySummary(source) : null,
    treatment:treatedSummary(treatedRows),
    provenance:Object.freeze({
      sourceObservationDataset:"observations-availability.jsonl",
      treatedResidualDataset:"historical-availability-impact-baseline-residuals-v1.jsonl",
      availabilityJoin:clean(source?.datasetGovernance?.availabilityJoin),
      availabilitySource:clean(source?.datasetGovernance?.availabilitySource),
    }),
    safeguards:Object.freeze({
      treatmentDefinitionOutOrDoubtfulOnly:true,
      questionableAloneDoesNotCreateTreatment:true,
      unresolvedAvailabilityCannotEnterControl:true,
      missingAvailabilityCannotEnterControl:true,
      leakageUnsafeCannotEnterControl:true,
      learnedWeightsCreated:false,
      calibrationExecuted:false,
      teamStrengthMutated:false,
      pickemScoringMutated:false,
    }),
  };

  if (!key || !allowedSeasons.includes(season)) return Object.freeze({...base,classification:CLASSIFICATIONS.EXCLUDED_UNKNOWN,reason:"OUTSIDE_GOVERNED_SEASON_OR_MISSING_KEY"});
  if (sourceRows.length !== 1) return Object.freeze({...base,classification:CLASSIFICATIONS.EXCLUDED_UNKNOWN,reason:sourceRows.length===0?"SOURCE_TEAM_GAME_MISSING":"AMBIGUOUS_SOURCE_TEAM_GAME"});
  if (source?.leakageSafe !== true) return Object.freeze({...base,classification:CLASSIFICATIONS.EXCLUDED_UNKNOWN,reason:"SOURCE_NOT_LEAKAGE_SAFE"});

  const availability = base.availability;
  if (treated) {
    const treatmentStatusesValid = treatedRows.every((row) => ["OUT","DOUBTFUL"].includes(normalizeStatus(row?.availability?.unavailableStatus)));
    const sourceQualifying = availability?.qualifyingTreatmentEventCount > 0;
    return Object.freeze({...base,classification:CLASSIFICATIONS.TREATED,reason:"COMPLETE_RESIDUAL_TREATMENT_PRESENT",reconciliation:Object.freeze({
      treatmentStatusesValid,sourceContainsQualifyingAvailabilityEvent:sourceQualifying,treatedRowCount:treatedRows.length,
    })});
  }
  if (!availability?.sourceAvailable) return Object.freeze({...base,classification:CLASSIFICATIONS.EXCLUDED_UNKNOWN,reason:"AVAILABILITY_EVIDENCE_UNAVAILABLE"});
  if (availability.qualifyingTreatmentEventCount > 0) return Object.freeze({...base,classification:CLASSIFICATIONS.AVAILABILITY_EXPOSED_UNRESOLVED,reason:"OUT_OR_DOUBTFUL_EVENT_WITHOUT_COMPLETE_TREATMENT_RECORD"});
  return Object.freeze({...base,classification:CLASSIFICATIONS.CONTROL_CANDIDATE,reason:availability.questionableCount>0?"NO_OUT_OR_DOUBTFUL_EVENT_QUESTIONABLE_ONLY_ALLOWED_AS_CANDIDATE":"NO_OUT_OR_DOUBTFUL_EVENT"});
}

export function buildHistoricalAvailabilityControlCohort({sourceObservations=[],treatedResidualRows=[],allowedSeasons=[2022,2023,2024]}={}) {
  const sourcesByKey = new Map();
  for (const source of sourceObservations) {
    const season=integer(source?.season);
    if (!allowedSeasons.includes(season)) continue;
    const key=teamGameKey(source?.gameId,source?.team);
    if (!key) continue;
    if (!sourcesByKey.has(key)) sourcesByKey.set(key,[]);
    sourcesByKey.get(key).push(source);
  }

  const treatedByKey = new Map();
  let treatedRowsOutsideGovernedSeasons=0,treatedRowsMissingKey=0;
  for (const row of treatedResidualRows) {
    const season=integer(row?.identity?.season);
    if (!allowedSeasons.includes(season)) { treatedRowsOutsideGovernedSeasons++; continue; }
    const key=teamGameKey(row?.identity?.gameId,row?.identity?.team);
    if (!key) { treatedRowsMissingKey++; continue; }
    if (!treatedByKey.has(key)) treatedByKey.set(key,[]);
    treatedByKey.get(key).push(row);
  }

  const universeKeys=new Set([...sourcesByKey.keys(),...treatedByKey.keys()]);
  const records=[...universeKeys].sort().map((key)=>classifyHistoricalAvailabilityTeamGame({
    sourceRows:sourcesByKey.get(key)??[],treatedRows:treatedByKey.get(key)??[],allowedSeasons
  }));

  const counts=Object.fromEntries(Object.values(CLASSIFICATIONS).map((c)=>[c,records.filter((r)=>r.classification===c).length]));
  const treatedRecords=records.filter((r)=>r.classification===CLASSIFICATIONS.TREATED);
  const treatedSourceMismatchCount=treatedRecords.filter((r)=>r?.reconciliation?.sourceContainsQualifyingAvailabilityEvent!==true).length;
  const treatedStatusMismatchCount=treatedRecords.filter((r)=>r?.reconciliation?.treatmentStatusesValid!==true).length;
  const duplicateSourceKeyCount=[...sourcesByKey.values()].filter((rows)=>rows.length>1).length;
  const treatedTeamGameCount=treatedByKey.size;
  const treatedResidualObservationCount=[...treatedByKey.values()].reduce((sum,rows)=>sum+rows.length,0);
  const controlOverlapCount=records.filter((r)=>r.classification===CLASSIFICATIONS.CONTROL_CANDIDATE&&treatedByKey.has(r.key)).length;
  const exposedControlOverlapCount=records.filter((r)=>r.classification===CLASSIFICATIONS.CONTROL_CANDIDATE&&(r?.availability?.qualifyingTreatmentEventCount??0)>0).length;
  const leakageUnsafeControlCount=records.filter((r)=>r.classification===CLASSIFICATIONS.CONTROL_CANDIDATE&&r?.identity?.leakageSafe!==true).length;
  const unknownAvailabilityControlCount=records.filter((r)=>r.classification===CLASSIFICATIONS.CONTROL_CANDIDATE&&r?.availability?.sourceAvailable!==true).length;

  const report=Object.freeze({
    contractVersion:"FIE-NFL-HISTORICAL-AVAILABILITY-CONTROL-COHORT-REPORT-1.0.0",
    sprint:"2.18.10-RC1",
    mode:"CONSTRUCTION_ONLY",
    allowedSeasons:Object.freeze([...allowedSeasons]),
    sourceObservationCount:sourceObservations.length,
    governedSourceObservationCount:[...sourcesByKey.values()].reduce((a,b)=>a+b.length,0),
    treatedResidualObservationCount,treatedTeamGameCount,cohortRecordCount:records.length,
    counts:Object.freeze(counts),
    reconciliation:Object.freeze({
      expectedTreatedTeamGames:187,expectedTreatedResidualRows:286,
      treatedTeamGameCountMatchesExpected:treatedTeamGameCount===187,
      treatedResidualRowCountMatchesExpected:treatedResidualObservationCount===286,
      treatedSourceMismatchCount,treatedStatusMismatchCount,duplicateSourceKeyCount,
      treatedRowsOutsideGovernedSeasons,treatedRowsMissingKey,controlOverlapCount,
      exposedControlOverlapCount,leakageUnsafeControlCount,unknownAvailabilityControlCount,
    }),
    readiness:Object.freeze({
      controlCohortConstructible:
        treatedTeamGameCount===187&&treatedResidualObservationCount===286&&
        treatedSourceMismatchCount===0&&treatedStatusMismatchCount===0&&
        controlOverlapCount===0&&exposedControlOverlapCount===0&&
        leakageUnsafeControlCount===0&&unknownAvailabilityControlCount===0&&
        duplicateSourceKeyCount===0,
      treatedControlComparabilityAuthorized:false,causalTargetDefined:false,formalFittingAuthorized:false,
    }),
    safeguards:Object.freeze({
      questionableAloneDoesNotDefineTreatment:true,unresolvedOutOrDoubtfulExcludedFromControl:true,
      unknownAvailabilityExcludedFromControl:true,treatmentResidualRowsMutated:false,
      sourceAvailabilityObservationsMutated:false,learnedWeightsCreated:false,calibrationExecuted:false,
      decisionModelMutated:false,teamStrengthMutated:false,pickemScoringMutated:false,databaseMutated:false,
    }),
  });
  return Object.freeze({records:Object.freeze(records),report});
}

export { CLASSIFICATIONS };
