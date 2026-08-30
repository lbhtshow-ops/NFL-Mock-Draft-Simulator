export const TEAM_CONTEXT_STATUS=Object.freeze({AVAILABLE:"AVAILABLE",UNAVAILABLE:"UNAVAILABLE"});
export const TEAM_CONTEXT_CLASSIFICATION=Object.freeze({FACT:"FACT",OBSERVATION:"OBSERVATION",ANALYST_INTERPRETATION:"ANALYST_INTERPRETATION",HISTORICAL_PRIOR:"HISTORICAL_PRIOR"});
const clean=v=>typeof v==="string"&&v.trim()?v.trim():null;
const conf=v=>Number.isFinite(v)&&v>=0&&v<=1?v:null;
export function createNFLTeamCoachingSchemeEvidence(input={}){
 const observations=(Array.isArray(input.observations)?input.observations:[]).map(x=>({
  domain:clean(x?.domain),subject:clean(x?.subject),value:x?.value??null,
  classification:Object.values(TEAM_CONTEXT_CLASSIFICATION).includes(x?.classification)?x.classification:TEAM_CONTEXT_CLASSIFICATION.OBSERVATION,
  sourceId:clean(x?.sourceId),sourceType:clean(x?.sourceType),observedAt:clean(x?.observedAt),confidence:conf(x?.confidence)
 })).filter(x=>x.domain&&x.subject&&x.sourceId);
 return Object.freeze({contractVersion:"FIE-NFL-TEAM-COACHING-SCHEME-EVIDENCE-1.0.0",team:clean(input.team),season:Number.isInteger(input.season)?input.season:null,asOf:clean(input.asOf),status:observations.length?TEAM_CONTEXT_STATUS.AVAILABLE:TEAM_CONTEXT_STATUS.UNAVAILABLE,observations:Object.freeze(observations),provenance:Object.freeze({sourceIds:Object.freeze([...new Set(observations.map(x=>x.sourceId))]),sourceTypes:Object.freeze([...new Set(observations.map(x=>x.sourceType).filter(Boolean))])})});
}