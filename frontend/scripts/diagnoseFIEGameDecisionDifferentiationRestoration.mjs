import assert from "node:assert/strict";
import { getNFLTeamPerformanceEvidenceForSeason } from "../src/data/footballIntelligence/nfl/performance/NFLTeamPerformanceEvidenceRegistry.js";
import { buildNFLMatchupIntelligenceProfile } from "../src/data/footballIntelligence/services/NFLMatchupIntelligenceService.js";
import { getNFLGameDecision } from "../src/engines/gameDecisionSupport/canonical/NFLGameDecisionService.js";
import { evaluateNFLGameDecisionV1, getNFLCanonicalGameDecisionModelConfig } from "../src/engines/gameDecisionSupport/canonical/NFLGameDecisionModelV1.js";
import { predictNFLCandidate } from "../src/engines/gameDecisionSupport/models/NFLCandidateDecisionModels.js";
import { createFieDecisionApiHandler } from "../services/fieDecisionApi/handler.mjs";

let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log(`PASS ${name}`)}catch(e){failed++;console.error(`FAIL ${name}: ${e.message}`)}}

const config=getNFLCanonicalGameDecisionModelConfig();
const baseline=predictNFLCandidate(config.modelId,{pregame:{matchupEdge:4,evidenceQuality:null}},config.parameters);
check("observed baseline probability reproduced",()=>assert.ok(Math.abs(baseline.homeWinProbability-0.5479293029256311)<1e-12));
check("observed baseline margin reproduced",()=>assert.equal(baseline.expectedHomeMargin,1.25));
check("baseline-only production authority now rejected",()=>assert.throws(()=>evaluateNFLGameDecisionV1({
 game:{gameId:999,season:2026,week:1,awayTeam:"BAL",homeTeam:"IND"},
 matchupIntelligence:{matchupEdge:4,evidenceQuality:null}
}),/INSUFFICIENT_CANONICAL_MATCHUP_EVIDENCE/));

check("canonical LAR code resolves nflverse LA performance evidence",()=>{
 const x=getNFLTeamPerformanceEvidenceForSeason("LAR",2025,{phaseScope:"ALL"});
 assert.equal(x?.teamAbbreviation,"LA");
});

const games=[
 {gameId:1,season:2026,week:1,awayTeam:"NE",homeTeam:"SEA"},
 {gameId:2,season:2026,week:1,awayTeam:"SF",homeTeam:"LAR"},
 {gameId:3,season:2026,week:1,awayTeam:"BAL",homeTeam:"IND"},
 {gameId:4,season:2026,week:1,awayTeam:"CHI",homeTeam:"CAR"},
 {gameId:5,season:2026,week:1,awayTeam:"DEN",homeTeam:"KC"},
];

const handler=createFieDecisionApiHandler({
 buildMatchup:buildNFLMatchupIntelligenceProfile,
 getDecision:getNFLGameDecision,
 now:()=> "2026-08-17T00:00:00.000Z"
});
const response=await handler({
 method:"POST",
 path:"/v1/nfl/game-decisions",
 body:{contract:"LBHTPickemFIEDecisionRequest",version:"1.0.0",games}
});
const body=response.body;
const decisions=body?.decisions||[];

check("production API request succeeds",()=>assert.equal(response.statusCode,200));
check("canonical response contract preserved",()=>{assert.equal(body.contract,"LBHTPickemFIEDecisionBundle");assert.equal(body.version,"1.0.0")});
check("all games return Decisions",()=>assert.equal(decisions.length,5));
check("production authority preserved for evidence-backed Decisions",()=>assert.ok(decisions.every(x=>x.model?.status==="PRODUCTION_AUTHORITY")));
check("all evidence quality values are materially populated",()=>assert.ok(decisions.every(x=>Number.isFinite(x.evidenceQuality)&&x.evidenceQuality>=0.5)));
check("all matchup edges are finite",()=>assert.ok(decisions.every(x=>Number.isFinite(x.matchupEdge))));
check("every audited matchup has factors",()=>assert.ok(decisions.every(x=>Array.isArray(x.factors)&&x.factors.length>0)));

const profiles=decisions.map(x=>[
 Number(x.homeWinProbability.toFixed(9)),
 Number(x.expectedHomeMargin.toFixed(6)),
 Number(x.matchupEdge.toFixed(6))
].join("|"));
check("at least three materially different profiles",()=>assert.ok(new Set(profiles).size>=3));
check("all five audited matchups are differentiated",()=>assert.equal(new Set(profiles).size,5));
check("old constant baseline disappears",()=>assert.equal(decisions.filter(x=>
 Math.abs(x.homeWinProbability-0.5479293029256311)<1e-12&&
 Math.abs(x.expectedHomeMargin-1.25)<1e-12&&
 Math.abs(x.matchupEdge-4)<1e-12
).length,0));

const chiCar=decisions.find(x=>x.awayTeamCode==="CHI"&&x.homeTeamCode==="CAR");
check("away favorite is possible from matchup evidence",()=>{assert.equal(chiCar.favoriteCode,"CHI");assert.ok(chiCar.homeWinProbability<.5)});

console.log("\nDIFFERENTIATED_DECISIONS");
console.log(JSON.stringify(decisions.map(x=>({
 game:`${x.awayTeamCode}@${x.homeTeamCode}`,
 favorite:x.favoriteCode,
 homeWinProbability:x.homeWinProbability,
 awayWinProbability:x.awayWinProbability,
 expectedHomeMargin:x.expectedHomeMargin,
 confidence:x.confidence,
 confidenceBand:x.confidenceBand,
 evidenceQuality:x.evidenceQuality,
 matchupEdge:x.matchupEdge,
 factors:x.factors
})),null,2));

console.log(`\nFIE Game Decision Differentiation diagnostics: ${passed}/${passed+failed} passed; ${failed} failed.`);
if(failed)process.exit(1);
console.log("FIE_GAME_DECISION_DIFFERENTIATION_RESTORED");
