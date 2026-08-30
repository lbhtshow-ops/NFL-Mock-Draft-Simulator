import { aggregateNFLVersePlayByPlay } from "../../data/footballIntelligence/nfl/performance/NFLVersePlayByPlayTeamPerformanceAdapter.js";
import { buildNFLOpponentAdjustment } from "../../data/footballIntelligence/nfl/performance/NFLOpponentAdjustmentEngine.js";
function assert(c,m){if(!c)throw new Error(m)} const tests=[]; function check(n,f){try{f();tests.push({name:n,passed:true})}catch(e){tests.push({name:n,passed:false,error:e.message})}}
const rows=[
{season:2026,week:1,game_id:"G1",posteam:"BAL",defteam:"CIN",play_type:"pass",epa:"0.4",success:"1",season_type:"REG"},
{season:2026,week:1,game_id:"G1",posteam:"CIN",defteam:"BAL",play_type:"run",epa:"-0.2",success:"0",season_type:"REG"},
{season:2026,week:1,game_id:"G1",posteam:"BAL",defteam:"CIN",play_type:"field_goal",epa:"1.2",special:"1",season_type:"REG"},
{season:2026,week:1,game_id:"G1",posteam:"CIN",defteam:"BAL",play_type:"punt",epa:"-0.3",special:"1",season_type:"REG"},
{season:2026,week:1,game_id:"G2",posteam:"KC",defteam:"CLE",play_type:"pass",epa:"0.2",success:"1",season_type:"REG"},
{season:2026,week:1,game_id:"G2",posteam:"CLE",defteam:"KC",play_type:"run",epa:"-0.1",success:"0",season_type:"REG"},
{season:2026,week:1,game_id:"G2",posteam:"KC",defteam:"CLE",play_type:"kickoff",epa:"0.1",special:"1",season_type:"REG"}];
const evidence=aggregateNFLVersePlayByPlay({rows,season:2026,phaseScope:"REGULAR"});
check("special-teams-plays-are-captured",()=>{const b=evidence.find(r=>r.teamAbbreviation==="BAL");assert(b.specialTeams.plays===2,"BAL special teams sample incorrect")});
check("special-teams-epa-is-zero-sum-by-team-pair",()=>{const b=evidence.find(r=>r.teamAbbreviation==="BAL"),c=evidence.find(r=>r.teamAbbreviation==="CIN");assert(Math.abs(b.specialTeams.epa+c.specialTeams.epa)<1e-6,"not zero sum")});
check("special-teams-types-are-counted",()=>{const b=evidence.find(r=>r.teamAbbreviation==="BAL");assert(b.specialTeams.fieldGoalPlays>=1,"FG missing");assert(b.specialTeams.puntPlays>=1,"punt missing")});
check("opponent-adjustment-still-operates",()=>assert(buildNFLOpponentAdjustment(evidence).size===4,"adjustment size wrong"));
check("phase-scope-is-retained",()=>assert(evidence.every(r=>r.phaseScope==="REGULAR"),"phase scope lost"));
check("special-teams-do-not-contaminate-offense-play-count",()=>{const b=evidence.find(r=>r.teamAbbreviation==="BAL");assert(b.sample.offensivePlays===1,"offense sample contaminated")});
const failed=tests.filter(t=>!t.passed); console.log(JSON.stringify({suite:"NFL Prior / Special Teams / Team Strength V1 Diagnostics",passed:tests.length-failed.length,failed:failed.length,tests},null,2)); if(failed.length)process.exitCode=1;
