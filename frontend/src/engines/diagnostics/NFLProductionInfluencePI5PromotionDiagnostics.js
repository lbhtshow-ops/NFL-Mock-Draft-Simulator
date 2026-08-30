import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

import {
  NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_AUTHORITY,
  resolveNFLAdvancedEarlySeasonMatchupPolicyV1,
} from "../matchupIntelligence/canonical/NFLAdvancedEarlySeasonMatchupPolicyV1.js";

import {
  NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY,
  resolveNFLPlayerImpactDecisionInfluenceV1,
  applyNFLPlayerImpactDecisionInfluenceV1,
} from "../gameDecisionSupport/canonical/NFLPlayerImpactDecisionInfluenceV1.js";

const EXPECTED_RAW = -7.139221586649016;
const EXPECTED_DELTA = -1.4278443173298032;
const EPS = 1e-12;
function pass(label){ console.log(`PASS — ${label}`); }
function readJsonl(file){return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function keyEffect(row){const t=row?.treated||{};return [t.season,t.week,t.gameId,t.team].join("|");}
function keyObservation(row){const i=row?.identity||{};return [i.season,i.week,i.gameId,i.team].join("|");}
function gap(row){
 const p=row?.pregame||{},a=Number(p.playerCaliber),b=Number(p.replacementCaliber);
 if(Number.isFinite(a)&&Number.isFinite(b))return Math.max(0,a-b);
 const d=Number(p.expectedReplacementDelta);return Number.isFinite(d)?Math.max(0,d):null;
}
function pct(values,p){
 const s=values.filter(Number.isFinite).slice().sort((a,b)=>a-b),i=(s.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);
 return lo===hi?s[lo]:s[lo]+(s[hi]-s[lo])*(i-lo);
}
const pi2=JSON.parse(fs.readFileSync(path.resolve("src/data/footballIntelligence/nfl/decisionSupport/sources/generatedNFLAdvancedEarlySeasonWeightCalibrationPI2.json"),"utf8"));
const pi4=JSON.parse(fs.readFileSync(path.resolve("data/calibration/historical/expansion-2020-2021/player-impact/player-impact-canonical-decision-ablation-pi4-v1.json"),"utf8"));
assert.equal(pi2?.promotionGate?.status,"PROMOTION_ELIGIBLE_RESEARCH_ONLY"); pass("PI.2 maturity-aligned candidate is promotion eligible");
assert.equal(pi4?.decision,"PI4_PLAYER_IMPACT_CANONICAL_DECISION_PROMOTION_ELIGIBLE_RESEARCH_ONLY");
assert.equal(pi4?.frozenCandidate?.candidateHash,NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY.candidateHash);
pass("PI.4 frozen Player Impact candidate is promotion eligible and hash locked");
assert.equal(NFL_ADVANCED_EARLY_SEASON_MATCHUP_POLICY_V1_AUTHORITY.productionAuthorityGranted,true);
assert.equal(NFL_PLAYER_IMPACT_DECISION_INFLUENCE_V1_AUTHORITY.productionAuthorityGranted,true);
pass("PI.5 successor authorities are explicit and active");

const effects=[
 ...readJsonl(path.resolve("data/calibration/historical/v1/historical-availability-matched-att-effects-v1.jsonl")),
 ...readJsonl(path.resolve("data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-matched-att-effects-2020-2021-v1.jsonl"))
], observations=[
 ...readJsonl(path.resolve("data/calibration/historical/v1/historical-availability-impact-calibration-observations-v1.jsonl")),
 ...readJsonl(path.resolve("data/calibration/historical/expansion-2020-2021/player-impact/matched-att/historical-availability-impact-calibration-observations-2020-2021-v1.jsonl"))
];
const om=new Map();
for(const o of observations){const k=keyObservation(o);if(!om.has(k))om.set(k,[]);om.get(k).push(o);}
const all=[],very=[];
for(const e of effects){
 const v=Number(e?.effect?.treatedMinusControlResidual);if(!Number.isFinite(v))continue;all.push(v);
 const gaps=(om.get(keyEffect(e))||[]).map(gap).filter(Number.isFinite);
 if(gaps.length&&Math.max(...gaps)>=15)very.push(v);
}
assert.equal(effects.length,720);assert.equal(very.length,55);
const raw=Math.max(pct(all,.05),Math.min(pct(all,.95),very.reduce((a,b)=>a+b,0)/very.length));
assert.ok(Math.abs(raw-EXPECTED_RAW)<=EPS);
assert.ok(Math.abs(raw*.20-EXPECTED_DELTA)<=EPS);
pass("final all-validated-seasons VERY_HIGH coefficient is reproducible");

const w1=resolveNFLAdvancedEarlySeasonMatchupPolicyV1({season:2026,week:1,homeIntelligence:{advancedMatchupEvidence:{season:2025}},awayIntelligence:{advancedMatchupEvidence:{season:2025}}});
assert.equal(w1.multiplier,1);pass("Week 1 prior-season advanced evidence remains full strength");
const early=resolveNFLAdvancedEarlySeasonMatchupPolicyV1({season:2026,week:3,homeIntelligence:{advancedMatchupEvidence:{season:2026},matchupRuntimeEvidence:{teamStrength:{sampleMaturity:{reliability:.25}}}},awayIntelligence:{advancedMatchupEvidence:{season:2026},matchupRuntimeEvidence:{teamStrength:{sampleMaturity:{reliability:.50}}}}});
assert.equal(early.multiplier,.25);pass("current-season advanced influence is maturity aligned");

const evidence=(status="OUT",delta=20)=>({players:[{playerId:"p1",displayName:"Test Player",position:"WR",availability:{status},decisionInfluenceEvidence:{caliberDelta:delta}}]});
const matchup={matchupEdge:10,evidenceQuality:.8,sourceTeamIntelligence:{home:{availabilityEvidence:evidence("OUT",20)},away:{availabilityEvidence:{players:[]}}}};
const influence=resolveNFLPlayerImpactDecisionInfluenceV1({matchupIntelligence:matchup});
assert.equal(influence.applied,true);assert.ok(Math.abs(influence.homeMarginDelta-EXPECTED_DELTA)<=EPS);
pass("VERY_HIGH-only Player Impact applies one fixed team-level margin delta");
const applied=applyNFLPlayerImpactDecisionInfluenceV1({matchupIntelligence:matchup,modelParameters:{edgeScale:.25}});
assert.ok(Math.abs(applied.matchupEdgeDelta-(EXPECTED_DELTA/(.8*.25)))<=EPS);
pass("Player Impact projects into the unchanged canonical Decision Model input");
const closed=resolveNFLPlayerImpactDecisionInfluenceV1({matchupIntelligence:{...matchup,sourceTeamIntelligence:{home:{availabilityEvidence:evidence("QUESTIONABLE",30)},away:{availabilityEvidence:{players:[]}}}}});
assert.equal(closed.applied,false);pass("unvalidated availability statuses fail closed");
console.log("");console.log("9/9 PASS");console.log("PI5_GOVERNED_PRODUCTION_INFLUENCE_PROMOTION_READY_FOR_LOCAL_REGRESSION");
