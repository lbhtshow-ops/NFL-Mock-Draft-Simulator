const REQUIREMENTS=Object.freeze({
 PERFORMANCE:["SCHEDULES_RESULTS","TEAM_STATS"],
 AVAILABILITY:["SCHEDULES_RESULTS","WEEKLY_ROSTERS","INJURIES"],
 AVAILABILITY_CALIBER:["SCHEDULES_RESULTS","WEEKLY_ROSTERS","INJURIES","PLAYER_CALIBER"],
 COACHING_SCHEME:["SCHEDULES_RESULTS","COACHING","SCHEME"],
 REPLACEMENT_CALIBER:["SCHEDULES_RESULTS","WEEKLY_ROSTERS","INJURIES","PLAYER_CALIBER","REPLACEMENT_CALIBER"]
});
export function assessNFLHistoricalExperimentEligibility(audit,minimumSafeObservations=1){
 const experiments={};
 for(const [name,requiredDomains] of Object.entries(REQUIREMENTS)){
  const counts=requiredDomains.map(d=>audit?.domains?.[d]?.safePregameKeyCount??0);
  const missingDomains=requiredDomains.filter((d,i)=>counts[i]===0);
  const conservativeSafeObservationCeiling=Math.min(...counts);
  experiments[name]=Object.freeze({requiredDomains:Object.freeze(requiredDomains),missingDomains:Object.freeze(missingDomains),
   conservativeSafeObservationCeiling,eligible:missingDomains.length===0&&conservativeSafeObservationCeiling>=minimumSafeObservations});
 }
 return Object.freeze({contractVersion:"FIE-NFL-HISTORICAL-EXPERIMENT-ELIGIBILITY-1.0.0",
  minimumSafeObservations,experiments:Object.freeze(experiments),authorizesCalibrationExecution:false});
}
