import assert from "node:assert/strict";
import {mapCanonicalDecisionToApi} from "../services/fieDecisionApi/decisionMapper.mjs";

const g={
  gameId:1,
  season:2026,
  week:1,
  awayTeam:"SF",
  homeTeam:"LAR",
  awayTeamDisplay:"San Francisco 49ers",
  homeTeamDisplay:"Los Angeles Rams",
};

const m={
  contract:"NFLMatchupIntelligenceResult",
  version:"NFL-MATCHUP-INTELLIGENCE-V1.0.0",
  evidenceQuality:.8,
  matchupEdge:7,
  dimensions:{
    overallStrength:11,
    passMatchup:6,
    rushMatchup:2,
    recentForm:-5,
    specialTeams:-8,
    quarterback:0,
    availability:0,
    protectionPressure:null,
    explosivePlay:null,
    redZone:null,
    weatherStyle:null,
  },
  keyAdvantages:[
    {dimension:"overallStrength",team:"LAR",label:"overall team strength",magnitude:11},
    {dimension:"specialTeams",team:"SF",label:"special teams",magnitude:8},
  ],
  counterweights:[],
  limitations:["TEST"],
};

const d={
  favorite:"LAR",
  homeWinProbability:.61,
  awayWinProbability:.39,
  expectedHomeMargin:2.4,
  confidence:.22,
  confidenceBand:"LOW",
  model:{id:"QUALITY_WEIGHTED_MATCHUP",version:"NFL-GAME-DECISION-MODEL-V1.0.0",status:"PRODUCTION_AUTHORITY"},
  generatedAt:"2026-08-23T20:00:00.000Z",
};

const before={
  favorite:d.favorite,
  homeWinProbability:d.homeWinProbability,
  awayWinProbability:d.awayWinProbability,
  expectedHomeMargin:d.expectedHomeMargin,
  confidence:d.confidence,
  matchupEdge:m.matchupEdge,
};

const api=mapCanonicalDecisionToApi({requestGame:g,matchup:m,decision:d});

const tests=[];
const check=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(error){tests.push({name,passed:false,error:error.message})}};

check("favorite-unchanged",()=>assert.equal(api.favoriteCode,before.favorite));
check("home-probability-unchanged",()=>assert.equal(api.homeWinProbability,before.homeWinProbability));
check("away-probability-unchanged",()=>assert.equal(api.awayWinProbability,before.awayWinProbability));
check("margin-unchanged",()=>assert.equal(api.expectedHomeMargin,before.expectedHomeMargin));
check("confidence-unchanged",()=>assert.equal(api.confidence,before.confidence));
check("matchup-edge-unchanged",()=>assert.equal(api.matchupEdge,before.matchupEdge));
check("legacy-factors-preserved",()=>assert.equal(api.factors.length,2));
check("legacy-factor-semantics-not-rewritten",()=>assert.equal(api.factors[1].team,"SF"));
check("new-namespace-present",()=>assert.ok(api.matchupExplainability));
check("true-supporting-advantage",()=>assert.ok(api.matchupExplainability.keyAdvantages.some(x=>x.dimension==="overallStrength"&&x.favoredTeamCode==="LAR")));
check("true-counterweight",()=>assert.ok(api.matchupExplainability.counterweights.some(x=>x.dimension==="specialTeams"&&x.favoredTeamCode==="SF")));
check("projection-read-only",()=>assert.equal(api.matchupExplainability.safeguards.readOnlyExplainability,true));

const failed=tests.filter(t=>!t.passed);
console.log(JSON.stringify({
  suite:"FIE Decision API Directional Explainability Mapper Diagnostics",
  sprint:"2D.5C",
  status:failed.length?"FAIL":"PASS",
  passed:tests.length-failed.length,
  failed:failed.length,
  tests,
  apiSample:api,
},null,2));
if(failed.length)process.exitCode=1;
