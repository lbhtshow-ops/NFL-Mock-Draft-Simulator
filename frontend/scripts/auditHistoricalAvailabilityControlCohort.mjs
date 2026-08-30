import fs from "node:fs";
const file="./data/calibration/historical/v1/historical-availability-control-cohort-v1.jsonl";
const rows=fs.existsSync(file)?fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const counts={};
for(const r of rows) counts[r.classification]=(counts[r.classification]??0)+1;
const treated=rows.filter(r=>r.classification==="TREATED");
const controls=rows.filter(r=>r.classification==="CONTROL_CANDIDATE");
const exposed=rows.filter(r=>r.classification==="AVAILABILITY_EXPOSED_UNRESOLVED");
const unknown=rows.filter(r=>r.classification==="EXCLUDED_UNKNOWN");
const violations={
  treatedWithoutQualifyingSourceEvent:treated.filter(r=>r?.reconciliation?.sourceContainsQualifyingAvailabilityEvent!==true).length,
  treatedStatusMismatch:treated.filter(r=>r?.reconciliation?.treatmentStatusesValid!==true).length,
  controlWithQualifyingOutOrDoubtful:controls.filter(r=>(r?.availability?.qualifyingTreatmentEventCount??0)>0).length,
  controlWithoutAvailableEvidence:controls.filter(r=>r?.availability?.sourceAvailable!==true).length,
  leakageUnsafeControl:controls.filter(r=>r?.identity?.leakageSafe!==true).length,
};
console.log(JSON.stringify({
  audit:"HISTORICAL_AVAILABILITY_CONTROL_COHORT",mode:"READ_ONLY",records:rows.length,counts,
  questionableOnlyControlCandidates:controls.filter(r=>(r?.availability?.questionableCount??0)>0).length,
  unresolvedAvailabilityTeamGames:exposed.length,excludedUnknownTeamGames:unknown.length,violations,
  boundary:{controlCohortIsNotMatchedCohort:true,causalTargetDefined:false,fittingAuthorized:false,formalFittingAuthorized:false},
  safeguards:{datasetMutated:false,learnedWeightsCreated:false,calibrationExecuted:false,teamStrengthMutated:false,pickemScoringMutated:false}
},null,2));
