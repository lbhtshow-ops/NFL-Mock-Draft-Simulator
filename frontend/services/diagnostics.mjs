import {createFieDecisionApiHandler} from "./handler.mjs";
import {normalizeNFLTeam} from "./teamNormalizer.mjs";
const tests=[];const assert=(x,m)=>{if(!x)throw new Error(m)};
async function check(name,fn){try{await fn();tests.push({name,passed:true})}catch(e){tests.push({name,passed:false,error:e.message})}}
const calls=[];
const h=createFieDecisionApiHandler({
 buildMatchup:async x=>{calls.push(x);return{matchupEdge:8,evidenceQuality:.8,keyAdvantages:[{dimension:"overallStrength",team:"BAL",label:"overall team strength",magnitude:12}],limitations:[]}},
 getDecision:async({game,generatedAt})=>({game,favorite:"BAL",homeWinProbability:.66,awayWinProbability:.34,expectedHomeMargin:4.1,confidence:.32,confidenceBand:"LOW",model:{id:"QUALITY_WEIGHTED_MATCHUP",version:"NFL-GAME-DECISION-MODEL-V1.0.0",status:"PRODUCTION_AUTHORITY"},generatedAt}),
 now:()=> "2026-08-11T12:00:00.000Z"
});
await check("team-full-name-normalizes",async()=>assert(normalizeNFLTeam("Baltimore Ravens")==="BAL"));
await check("team-code-remains-code",async()=>assert(normalizeNFLTeam("bal")==="BAL"));
await check("health-endpoint-works",async()=>assert((await h({method:"GET",path:"/health"})).statusCode===200));
await check("invalid-contract-is-rejected",async()=>assert((await h({method:"POST",path:"/v1/nfl/game-decisions",body:{contract:"WRONG",version:"1.0.0",games:[]}})).statusCode===400));
const body={contract:"LBHTPickemFIEDecisionRequest",version:"1.0.0",games:[{gameId:1001,week:1,kickoff:"2026-09-10T00:20:00Z",awayTeam:"Cincinnati Bengals",homeTeam:"Baltimore Ravens"}]};
await check("canonical-bundle-is-returned",async()=>{const r=await h({method:"POST",path:"/v1/nfl/game-decisions",body});assert(r.statusCode===200&&r.body.contract==="LBHTPickemFIEDecisionBundle"&&r.body.decisions.length===1)});
await check("season-is-inferred-from-kickoff",async()=>assert(calls.at(-1)?.season===2026));
await check("canonical-team-codes-feed-fie",async()=>assert(calls.at(-1)?.homeTeam==="BAL"&&calls.at(-1)?.awayTeam==="CIN"));
await check("canonical-fields-map-to-pickem-contract",async()=>{const r=await h({method:"POST",path:"/v1/nfl/game-decisions",body:{contract:"LBHTPickemFIEDecisionRequest",version:"1.0.0",games:[{gameId:1002,season:2026,week:2,awayTeam:"CIN",homeTeam:"BAL"}]}}),d=r.body.decisions[0];assert(d.favorite==="Baltimore Ravens"&&d.homeWinProbability===.66&&d.expectedHomeMargin===4.1&&d.model.version==="NFL-GAME-DECISION-MODEL-V1.0.0")});
await check("batch-limit-is-enforced",async()=>assert((await h({method:"POST",path:"/v1/nfl/game-decisions",body:{contract:"LBHTPickemFIEDecisionRequest",version:"1.0.0",games:Array.from({length:33},(_,i)=>({gameId:i+1,season:2026,week:1,awayTeam:"CIN",homeTeam:"BAL"}))}})).statusCode===413));
const failed=tests.filter(t=>!t.passed);console.log(JSON.stringify({suite:"LBHT Canonical FIE HTTP Decision API V1 Diagnostics",passed:tests.length-failed.length,failed:failed.length,tests},null,2));if(failed.length)process.exitCode=1;
