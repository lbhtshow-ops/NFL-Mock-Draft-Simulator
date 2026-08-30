import assert from "node:assert/strict";

import {
  createLE3JProductionConsumerAcceptanceFixture,
  LE3J_ACCEPTANCE_TARGET,
} from "../../../services/fieDecisionApi/le3jAcceptanceFixture.mjs";
import {
  createFieDecisionProductionComposition,
} from "../../../services/fieDecisionApi/productionComposition.mjs";
import {
  createFieDecisionApiHandler,
} from "../../../services/fieDecisionApi/handler.mjs";
import {
  getNFLGameDecision,
} from "../gameDecisionSupport/canonical/NFLGameDecisionService.js";

let passed=0;
async function test(name,fn){await fn();passed+=1;console.log(`PASS ${passed}: ${name}`);}

const baseMatchup=()=>({
  gameId:34,
  season:2026,
  week:1,
  awayTeam:"BAL",
  homeTeam:"IND",
  matchupEdge:2,
  evidenceQuality:.8,
  keyAdvantages:[],
  limitations:[],
  sourceTeamIntelligence:{
    away:{availabilityEvidence:{players:[]}},
    home:{availabilityEvidence:{players:[]}},
  },
});

const runtime=()=>({
  invalidateTeamAvailability(){return {status:"NOT_CACHED",invalidated:false};},
  async loadForMatchup(){return {status:"READY",teams:[]};},
});

const fixture=createLE3JProductionConsumerAcceptanceFixture({
  enabled:true,
  token:"test-token",
  now:()=> "2026-08-27T12:00:00.000Z",
});

const production=createFieDecisionProductionComposition({
  availabilityRuntime:runtime(),
  acceptanceFixture:fixture,
  normalizeTeam:v=>v,
  buildMatchupIntelligence:async()=>baseMatchup(),
  getDecision:getNFLGameDecision,
});

await test("acceptance control is token guarded",async()=>{
  assert.equal(fixture.authorize("wrong").ok,false);
  assert.equal(fixture.authorize("test-token").ok,true);
});

await test("Decision A has no acceptance Player Impact",async()=>{
  const m=await production.buildMatchup({...LE3J_ACCEPTANCE_TARGET,forceRefresh:true});
  const d=production.getDecision({game:LE3J_ACCEPTANCE_TARGET,matchupIntelligence:m,generatedAt:"2026-08-27T12:00:00.000Z"});
  assert.equal(d.decisionInfluence.playerImpact.applied,false);
});

await test("activation executes one controlled canonical LE-3 refresh",async()=>{
  const s=await fixture.activate({production});
  assert.equal(s.active,true);
  assert.equal(s.lastActivation.refresh.changes,1);
  assert.equal(s.lastActivation.refresh.refreshRequirements,1);
  assert.equal(s.lastActivation.refresh.executed,1);
  assert.equal(s.lastActivation.change.materiality,"CRITICAL");
  assert.equal(s.lastActivation.change.reasonCode,"STARTING_QB_AVAILABILITY_CHANGE");
  assert.equal(s.lastActivation.canonicalDecisionB.decisionInfluence.playerImpact.applied,true);
});

await test("normal non-force-refresh request remains unaffected while fixture is active",async()=>{
  const m=await production.buildMatchup({...LE3J_ACCEPTANCE_TARGET,forceRefresh:false});
  const d=production.getDecision({game:LE3J_ACCEPTANCE_TARGET,matchupIntelligence:m});
  assert.equal(d.decisionInfluence.playerImpact.applied,false);
});

await test("forceRefresh Decision B is changed by canonical Player Impact influence",async()=>{
  const aMatchup=baseMatchup();
  const a=production.getDecision({game:LE3J_ACCEPTANCE_TARGET,matchupIntelligence:aMatchup,generatedAt:"2026-08-27T12:00:00.000Z"});
  const bMatchup=await production.buildMatchup({...LE3J_ACCEPTANCE_TARGET,forceRefresh:true});
  const b=production.getDecision({game:LE3J_ACCEPTANCE_TARGET,matchupIntelligence:bMatchup,generatedAt:"2026-08-27T12:01:00.000Z"});
  assert.equal(b.decisionInfluence.playerImpact.applied,true);
  assert.notEqual(b.decisionInfluence.effectiveMatchupEdge,a.decisionInfluence.effectiveMatchupEdge);
  assert.notEqual(b.homeWinProbability,a.homeWinProbability);
  assert.notEqual(b.awayWinProbability,a.awayWinProbability);
  assert.equal(b.model.id,a.model.id);
  assert.equal(b.model.version,a.model.version);
});

await test("public Decision API forceRefresh exposes B through unchanged mapping contract",async()=>{
  const handler=createFieDecisionApiHandler({
    buildMatchup:production.buildMatchup,
    getDecision:production.getDecision,
    now:()=> "2026-08-27T12:02:00.000Z",
  });
  const out=await handler({
    method:"POST",
    path:"/v1/nfl/game-decisions",
    body:{
      contract:"LBHTPickemFIEDecisionRequest",
      version:"1.0.0",
      forceRefresh:true,
      games:[LE3J_ACCEPTANCE_TARGET],
    },
  });
  assert.equal(out.statusCode,200);
  const body=out.body;
  const d=body.decisions[0];
  assert.equal(d.decisionInfluence.playerImpact.applied,true);
  assert.ok(d.matchupExplainability);
  const activationModel=fixture.status().lastActivation.canonicalDecisionB.model;
  assert.ok(d.model?.id);
  assert.equal(d.model.id,activationModel?.id??null);
  assert.equal(d.model.version,activationModel?.version??null);
});

await test("deactivation restores A behavior",async()=>{
  fixture.deactivate();
  const m=await production.buildMatchup({...LE3J_ACCEPTANCE_TARGET,forceRefresh:true});
  const d=production.getDecision({game:LE3J_ACCEPTANCE_TARGET,matchupIntelligence:m});
  assert.equal(d.decisionInfluence.playerImpact.applied,false);
});

console.log(`NFLProductionConsumerAtoBFixtureLE3JDiagnostics: ${passed}/${passed} passed`);
