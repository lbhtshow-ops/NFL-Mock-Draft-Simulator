import {TEAM_CONTEXT_CLASSIFICATION} from "./NFLTeamCoachingSchemeEvidenceContract.js";
const latest=a=>[...a].sort((x,y)=>String(y.observedAt||"").localeCompare(String(x.observedAt||"")))[0]||null;
export function synthesizeNFLTeamCoachingIntelligence(evidence){
 const o=(evidence?.observations||[]).filter(x=>x.domain==="COACHING");
 const fact=s=>latest(o.filter(x=>x.subject===s&&x.classification===TEAM_CONTEXT_CLASSIFICATION.FACT));
 return Object.freeze({intelligenceVersion:"FIE-NFL-TEAM-COACHING-INTELLIGENCE-1.0.0",status:o.length?"AVAILABLE":"UNAVAILABLE",identity:Object.freeze({headCoach:fact("HEAD_COACH")?.value??null,offensiveCoordinator:fact("OFFENSIVE_COORDINATOR")?.value??null,defensiveCoordinator:fact("DEFENSIVE_COORDINATOR")?.value??null,offensivePlayCaller:fact("OFFENSIVE_PLAY_CALLER")?.value??null,defensivePlayCaller:fact("DEFENSIVE_PLAY_CALLER")?.value??null}),continuity:latest(o.filter(x=>x.subject==="STAFF_CONTINUITY"))?.value??null,staffChange:latest(o.filter(x=>x.subject==="STAFF_CHANGE"))?.value??null,strengthScore:null,adjustment:null,observations:Object.freeze(o)});
}