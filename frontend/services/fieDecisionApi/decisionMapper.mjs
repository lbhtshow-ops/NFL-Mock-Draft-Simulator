import {normalizeNFLTeam,getNFLTeamDisplayName} from "./teamNormalizer.mjs";
import {projectNFLGameIntelligenceDirectionalExplainability} from "../../src/engines/gameDecisionSupport/canonical/NFLGameIntelligenceDirectionalExplainabilityProjector.js";
function inferSeason(k){if(!k)return null;const d=new Date(k);if(Number.isNaN(d.getTime()))return null;const y=d.getUTCFullYear(),m=d.getUTCMonth()+1;return m<=2?y-1:y}
export function normalizeGameRequest(g={}){
 const gameId=Number(g.gameId),week=Number(g.week),awayTeam=normalizeNFLTeam(g.awayTeam),homeTeam=normalizeNFLTeam(g.homeTeam);
 const season=Number.isInteger(Number(g.season))?Number(g.season):inferSeason(g.kickoff),errors=[];
 if(!Number.isFinite(gameId))errors.push("gameId must be numeric");
 if(!Number.isInteger(week)||week<1||week>22)errors.push("week must be an integer from 1 through 22");
 if(!Number.isInteger(season))errors.push("season is required or must be inferable from kickoff");
 if(!awayTeam)errors.push(`unsupported awayTeam: ${g.awayTeam??"null"}`);
 if(!homeTeam)errors.push(`unsupported homeTeam: ${g.homeTeam??"null"}`);
 return{valid:!errors.length,errors,game:{gameId,season,week,awayTeam,homeTeam,awayTeamDisplay:getNFLTeamDisplayName(awayTeam),homeTeamDisplay:getNFLTeamDisplayName(homeTeam),kickoff:g.kickoff||null}};
}
const factors=m=>(Array.isArray(m?.keyAdvantages)?m.keyAdvantages:[]).slice(0,4).map(f=>({dimension:f.dimension||null,team:f.team||null,label:f.label||null,magnitude:Number.isFinite(Number(f.magnitude))?Number(f.magnitude):null}));
function playerImpactExplanation({game:g,decision:d}){
 const impact=d?.decisionInfluence?.playerImpact,delta=Number(impact?.homeMarginDelta);
 if(!impact?.applied||!Number.isFinite(delta)||delta===0)return null;
 const favoredCode=delta>0?g.homeTeam:g.awayTeam;
 const favoredTeam=delta>0?(g.homeTeamDisplay||g.homeTeam):(g.awayTeamDisplay||g.awayTeam);
 return{
  supportsFavorite:favoredCode===d.favorite,
  item:{
   dimension:"playerImpact",favoredTeam,favoredTeamCode:favoredCode,magnitude:Math.abs(delta),
   label:"player impact",
   summary:`${favoredTeam} gains a governed Player Impact edge from a significant opponent availability downgrade.`,
   evidenceQuality:null,evidence:null,
   provenance:{contract:impact.contract||null,version:impact.version||null,candidate:impact.candidate||null}
  }
 };
}
export function mapCanonicalDecisionToApi({requestGame:g,matchup:m,decision:d}){
 const fp=d.favorite===g.homeTeam?d.homeWinProbability:d.favorite===g.awayTeam?d.awayWinProbability:null;
 const matchupExplainability=projectNFLGameIntelligenceDirectionalExplainability({
  matchup:m,favoriteCode:d.favorite,homeTeamCode:g.homeTeam,awayTeamCode:g.awayTeam,
  homeTeam:g.homeTeamDisplay||g.homeTeam,awayTeam:g.awayTeamDisplay||g.awayTeam
 });
 const pi=playerImpactExplanation({game:g,decision:d});
 if(pi){
  const key=pi.supportsFavorite?"keyAdvantages":"counterweights";
  matchupExplainability[key]=[pi.item,...(Array.isArray(matchupExplainability[key])?matchupExplainability[key]:[])].slice(0,4);
 }
 return{gameId:g.gameId,season:g.season,week:g.week,awayTeam:g.awayTeamDisplay||g.awayTeam,homeTeam:g.homeTeamDisplay||g.homeTeam,
 awayTeamCode:g.awayTeam,homeTeamCode:g.homeTeam,
 favorite:d.favorite===g.homeTeam?g.homeTeamDisplay:d.favorite===g.awayTeam?g.awayTeamDisplay:d.favorite,
 favoriteCode:d.favorite,homeWinProbability:d.homeWinProbability,awayWinProbability:d.awayWinProbability,
 expectedHomeMargin:d.expectedHomeMargin,confidence:d.confidence,confidenceBand:d.confidenceBand,
 evidenceQuality:m?.evidenceQuality??null,matchupEdge:m?.matchupEdge??null,factors:factors(m),
 matchupExplainability,decisionInfluence:d?.decisionInfluence??null,
 limitations:Array.isArray(m?.limitations)?m.limitations:[],
 summary:`${d.favorite===g.homeTeam?g.homeTeamDisplay:d.favorite===g.awayTeam?g.awayTeamDisplay:d.favorite} is the current LBHT Intelligence favorite${Number.isFinite(Number(fp))?` at ${Math.round(Number(fp)*100)}% win probability`:""}.`,
 model:{id:d?.model?.id||null,version:d?.model?.version||null,status:d?.model?.status||null},generatedAt:d.generatedAt||null};
}
