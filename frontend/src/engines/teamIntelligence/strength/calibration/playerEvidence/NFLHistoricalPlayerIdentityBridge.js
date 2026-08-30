const clean=v=>typeof v==="string"&&v.trim()?v.trim():null;
export function resolveHistoricalPlayerIdentity({injuryRecord={},rosterRecord={},playerDirectoryRecord={}}={}){
  const candidates=[
    clean(injuryRecord.gsisId),clean(rosterRecord.gsisId),clean(rosterRecord.playerId),
    clean(playerDirectoryRecord.gsisId)
  ].filter(Boolean);
  const unique=[...new Set(candidates)];
  if(unique.length>1){
    return Object.freeze({status:"CONFLICT",canonicalPlayerId:null,candidates:Object.freeze(unique),confidence:0});
  }
  if(unique.length===1){
    return Object.freeze({status:"RESOLVED",canonicalPlayerId:unique[0],candidates:Object.freeze(unique),confidence:1});
  }
  return Object.freeze({status:"UNRESOLVED",canonicalPlayerId:null,candidates:Object.freeze([]),confidence:0});
}
