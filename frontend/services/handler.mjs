import {REQUEST_CONTRACT,CONTRACT_VERSION,createDecisionBundle,createErrorResponse} from "./contracts.mjs";
import {normalizeGameRequest,mapCanonicalDecisionToApi} from "./decisionMapper.mjs";
const MAX=32;
const json=(statusCode,body,origin="*")=>({statusCode,headers:{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, Accept","Cache-Control":"no-store"},body});
export function createFieDecisionApiHandler({buildMatchup,getDecision,now=()=>new Date().toISOString(),allowedOrigin="*"}={}){
 if(typeof buildMatchup!=="function"||typeof getDecision!=="function")throw new Error("buildMatchup and getDecision dependencies are required");
 return async({method,path,body=null}={})=>{
  const m=String(method||"GET").toUpperCase();
  if(m==="OPTIONS")return json(204,null,allowedOrigin);
  if(m==="GET"&&(path==="/health"||path==="/v1/nfl/game-decisions/health"))return json(200,{status:"ok",service:"LBHT Canonical FIE Decision API",contractVersion:CONTRACT_VERSION},allowedOrigin);
  if(m!=="POST"||path!=="/v1/nfl/game-decisions")return json(404,createErrorResponse("NOT_FOUND","Endpoint not found."),allowedOrigin);
  if(body?.contract!==REQUEST_CONTRACT||body?.version!==CONTRACT_VERSION)return json(400,createErrorResponse("INVALID_CONTRACT","Unsupported request contract or version."),allowedOrigin);
  if(!Array.isArray(body.games)||!body.games.length)return json(400,createErrorResponse("INVALID_GAMES","games must be a non-empty array."),allowedOrigin);
  if(body.games.length>MAX)return json(413,createErrorResponse("TOO_MANY_GAMES",`A maximum of ${MAX} games is allowed per request.`),allowedOrigin);
  const decisions=[];
  for(const raw of body.games){
   const n=normalizeGameRequest(raw);
   if(!n.valid)return json(400,createErrorResponse("INVALID_GAME","One or more games failed validation.",{gameId:raw?.gameId??null,errors:n.errors}),allowedOrigin);
   const g=n.game;
   const matchup=await buildMatchup({gameId:g.gameId,season:g.season,week:g.week,awayTeam:g.awayTeam,homeTeam:g.homeTeam,availabilityWeek:g.week,gameType:"REG",context:{homeField:true}});
   const decision=await getDecision({game:{gameId:g.gameId,season:g.season,week:g.week,awayTeam:g.awayTeam,homeTeam:g.homeTeam},matchupIntelligence:matchup,generatedAt:now()});
   decisions.push(mapCanonicalDecisionToApi({requestGame:g,matchup,decision}));
  }
  return json(200,createDecisionBundle(decisions,now()),allowedOrigin);
 };
}
