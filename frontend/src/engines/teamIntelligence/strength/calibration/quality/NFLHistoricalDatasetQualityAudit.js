export const NFL_HISTORICAL_QUALITY_DOMAINS=Object.freeze([
"SCHEDULES_RESULTS","PLAY_BY_PLAY","TEAM_STATS","WEEKLY_ROSTERS","INJURIES","DEPTH_CHARTS",
"SNAP_COUNTS","PLAYER_IDENTITY","PLAYER_CALIBER","COACHING","SCHEME","REPLACEMENT_CALIBER"
]);
const ratio=(n,d)=>d? n/d:null;
const key=r=>`${r.season}:${r.week}:${r.gameId}:${r.team}`;
export function auditNFLHistoricalDatasetQuality(records=[]){
 const rows=records.filter(r=>r&&Number.isInteger(r.season)&&Number.isInteger(r.week)&&r.gameId&&r.team&&r.domain);
 const universe=[...new Set(rows.map(key))];
 const domains={};
 for(const domain of NFL_HISTORICAL_QUALITY_DOMAINS){
  const dr=rows.filter(r=>r.domain===domain), safe=dr.filter(r=>r.safeForPregameCalibration===true);
  const keys=[...new Set(dr.map(key))], safeKeys=[...new Set(safe.map(key))];
  const seasons=[...new Set(dr.map(r=>r.season))].sort((a,b)=>a-b);
  const provenance=dr.filter(r=>r.sourceId&&r.provenance?.provider);
  domains[domain]=Object.freeze({
   recordCount:dr.length,observationKeyCount:keys.length,safePregameKeyCount:safeKeys.length,
   unsafeRecordCount:dr.length-safe.length,temporalSafetyRate:ratio(safe.length,dr.length),
   provenanceCoverageRate:ratio(provenance.length,dr.length),universeCoverageRate:ratio(keys.length,universe.length),
   seasons:Object.freeze(seasons),minimumSeason:seasons[0]??null,maximumSeason:seasons.at(-1)??null
  });
 }
 const overlap=(required)=>{
  const sets=required.map(domain=>new Set(rows.filter(r=>r.domain===domain&&r.safeForPregameCalibration===true).map(key)));
  const matched=universe.filter(k=>sets.every(s=>s.has(k)));
  return Object.freeze({domains:Object.freeze(required),safeObservationKeyCount:matched.length,universeCoverageRate:ratio(matched.length,universe.length)});
 };
 return Object.freeze({
  contractVersion:"FIE-NFL-HISTORICAL-DATASET-QUALITY-AUDIT-1.0.0",status:"AUDITED_NOT_CALIBRATED",
  universeObservationKeyCount:universe.length,domains:Object.freeze(domains),
  overlaps:Object.freeze({
   performance:overlap(["SCHEDULES_RESULTS","TEAM_STATS"]),
   availability:overlap(["SCHEDULES_RESULTS","WEEKLY_ROSTERS","INJURIES"]),
   availabilityCaliber:overlap(["SCHEDULES_RESULTS","WEEKLY_ROSTERS","INJURIES","PLAYER_CALIBER"]),
   coachingScheme:overlap(["SCHEDULES_RESULTS","COACHING","SCHEME"])
  }),
  learnedWeights:null,learnedCoefficients:null,teamStrengthScores:null
 });
}
