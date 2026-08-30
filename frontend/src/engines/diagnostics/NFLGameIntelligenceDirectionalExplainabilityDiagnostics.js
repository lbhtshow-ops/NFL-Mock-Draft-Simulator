import assert from "node:assert/strict";
import {
  NFL_GAME_INTELLIGENCE_DIRECTIONAL_EXPLAINABILITY_GOVERNANCE as G,
} from "../teamIntelligence/strength/calibration/playerEvidence/NFLGameIntelligenceDirectionalExplainabilityGovernance.js";
import {
  projectNFLGameIntelligenceDirectionalExplainability,
} from "../gameDecisionSupport/canonical/NFLGameIntelligenceDirectionalExplainabilityProjector.js";

const tests=[];
const test=(name,fn)=>{try{fn();tests.push({name,passed:true})}catch(error){tests.push({name,passed:false,error:error.message})}};

const baseMatchup={
  contract:"NFLMatchupIntelligenceResult",
  version:"NFL-MATCHUP-INTELLIGENCE-V1.0.0",
  evidenceQuality:.82,
  dimensions:{
    overallStrength:11,
    passMatchup:6,
    rushMatchup:2,
    recentForm:-5,
    specialTeams:-8,
    quarterback:1,
    availability:0,
    protectionPressure:null,
    explosivePlay:null,
    redZone:null,
    weatherStyle:null,
  }
};

const rams49ers=projectNFLGameIntelligenceDirectionalExplainability({
  matchup:baseMatchup,
  favoriteCode:"LAR",
  homeTeamCode:"LAR",
  awayTeamCode:"SF",
  homeTeam:"Los Angeles Rams",
  awayTeam:"San Francisco 49ers",
});

test("governance-contract",()=>assert.equal(G.contractVersion,"FIE-NFL-GAME-INTELLIGENCE-DIRECTIONAL-EXPLAINABILITY-GOVERNANCE-1.0.0"));
test("additive-namespace",()=>assert.equal(G.apiContract.additiveNamespace,"matchupExplainability"));
test("existing-factors-preserved",()=>assert.equal(G.apiContract.existingFactorsPreserved,true));
test("pickem-cannot-infer-direction",()=>assert.equal(G.ownership.pickemMayInferDirection,false));

test("rams-favorite",()=>assert.equal(rams49ers.favoriteCode,"LAR"));
test("rams-overall-strength-supports-favorite",()=>assert.ok(rams49ers.keyAdvantages.some(x=>x.dimension==="overallStrength"&&x.favoredTeamCode==="LAR")));
test("rams-pass-supports-favorite",()=>assert.ok(rams49ers.keyAdvantages.some(x=>x.dimension==="passMatchup"&&x.favoredTeamCode==="LAR")));
test("sf-special-teams-is-counterweight",()=>assert.ok(rams49ers.counterweights.some(x=>x.dimension==="specialTeams"&&x.favoredTeamCode==="SF")));
test("sf-recent-form-is-counterweight",()=>assert.ok(rams49ers.counterweights.some(x=>x.dimension==="recentForm"&&x.favoredTeamCode==="SF")));
test("magnitude-order-support",()=>assert.ok(rams49ers.keyAdvantages[0].magnitude>=rams49ers.keyAdvantages.at(-1).magnitude));
test("magnitude-order-counter",()=>assert.ok(rams49ers.counterweights[0].magnitude>=rams49ers.counterweights.at(-1).magnitude));

const coltsRavens=projectNFLGameIntelligenceDirectionalExplainability({
  matchup:{
    ...baseMatchup,
    dimensions:{
      overallStrength:2,
      passMatchup:-7,
      rushMatchup:-1,
      recentForm:9,
      specialTeams:0,
      quarterback:0,
      availability:0,
      protectionPressure:null,
      explosivePlay:null,
      redZone:null,
      weatherStyle:null,
    },
  },
  favoriteCode:"IND",
  homeTeamCode:"BAL",
  awayTeamCode:"IND",
  homeTeam:"Baltimore Ravens",
  awayTeam:"Indianapolis Colts",
});

test("colts-away-favorite",()=>assert.equal(coltsRavens.favoriteCode,"IND"));
test("colts-pass-is-key-advantage",()=>assert.ok(coltsRavens.keyAdvantages.some(x=>x.dimension==="passMatchup"&&x.favoredTeamCode==="IND")));
test("ravens-recent-form-is-counterweight",()=>assert.ok(coltsRavens.counterweights.some(x=>x.dimension==="recentForm"&&x.favoredTeamCode==="BAL")));

test("small-dimensions-suppressed",()=>assert.ok(!rams49ers.keyAdvantages.some(x=>x.dimension==="rushMatchup")));
test("summary-generated-by-fie",()=>assert.ok(rams49ers.keyAdvantages.every(x=>typeof x.summary==="string"&&x.summary.length>0)));
test("evidence-null-not-fabricated",()=>assert.ok(rams49ers.keyAdvantages.every(x=>x.evidence===null)));
test("source-provenance",()=>assert.equal(rams49ers.keyAdvantages[0].provenance.sourceContract,"NFLMatchupIntelligenceResult"));
test("source-direction-semantics",()=>assert.equal(rams49ers.keyAdvantages[0].provenance.directionSemantics,"POSITIVE_HOME_NEGATIVE_AWAY"));

const noFavorite=projectNFLGameIntelligenceDirectionalExplainability({
  matchup:baseMatchup,
  favoriteCode:null,
  homeTeamCode:"LAR",
  awayTeamCode:"SF",
});
test("no-favorite-no-classification",()=>assert.equal(noFavorite.keyAdvantages.length+noFavorite.counterweights.length,0));
test("no-favorite-limitation",()=>assert.ok(noFavorite.limitations.some(x=>x.includes("favorite"))));

test("read-only",()=>assert.equal(rams49ers.safeguards.readOnlyExplainability,true));
test("no-matchup-recompute",()=>assert.equal(rams49ers.safeguards.matchupDimensionsRecomputed,false));
test("no-favorite-recompute",()=>assert.equal(rams49ers.safeguards.favoriteRecomputed,false));
test("no-matchup-scoring-mutation",()=>assert.equal(G.safeguards.matchupScoringMutationAuthorized,false));
test("no-decision-mutation",()=>assert.equal(G.safeguards.decisionModelMutationAuthorized,false));
test("no-player-impact-activation",()=>assert.equal(G.safeguards.playerImpactActivationAuthorized,false));
test("no-team-strength-mutation",()=>assert.equal(G.safeguards.teamStrengthMutationAuthorized,false));
test("no-pickem-scoring-mutation",()=>assert.equal(G.safeguards.pickemScoringMutationAuthorized,false));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"NFL Game Intelligence Directional Explainability Diagnostics",
  sprint:"2D.5C",
  status:failed?"FAIL":"PASS",
  passed,
  failed,
  tests,
  examples:{
    rams49ers,
    coltsRavens,
  },
  safeguards:G.safeguards,
},null,2));
if(failed)process.exitCode=1;
