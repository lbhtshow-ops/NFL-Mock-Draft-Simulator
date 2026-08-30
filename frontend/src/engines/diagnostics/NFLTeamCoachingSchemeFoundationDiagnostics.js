import assert from "node:assert/strict";import{TEAM_CONTEXT_CLASSIFICATION as C,createNFLTeamCoachingSchemeEvidence as make,evaluateNFLTeamContext as evalC}from"../teamIntelligence/context/index.js";
const tests=[];const t=(n,f)=>{try{f();tests.push([n,true])}catch(e){tests.push([n,false,e.message])}};
const f={team:"BAL",season:2026,asOf:"2026-08-13T00:00:00Z",observations:[
{domain:"COACHING",subject:"HEAD_COACH",value:"Coach A",classification:C.FACT,sourceId:"official",sourceType:"OFFICIAL",observedAt:"2026-08-01T00:00:00Z",confidence:1},
{domain:"COACHING",subject:"OFFENSIVE_COORDINATOR",value:"Coach B",classification:C.FACT,sourceId:"official",sourceType:"OFFICIAL",observedAt:"2026-08-01T00:00:00Z",confidence:1},
{domain:"COACHING",subject:"STAFF_CONTINUITY",value:"RETURNING_CORE",classification:C.OBSERVATION,sourceId:"history",sourceType:"RESEARCH",observedAt:"2026-08-02T00:00:00Z",confidence:.9},
{domain:"OFFENSIVE_SCHEME",subject:"EARLY_DOWN_PASS_TENDENCY",value:"ABOVE_BASELINE",classification:C.OBSERVATION,sourceId:"pbp",sourceType:"PLAY_BY_PLAY",observedAt:"2026-08-10T00:00:00Z",confidence:.8},
{domain:"DEFENSIVE_SCHEME",subject:"STRUCTURE",value:"MULTIPLE",classification:C.ANALYST_INTERPRETATION,sourceId:"film",sourceType:"FILM_ANALYSIS",observedAt:"2026-08-09T00:00:00Z",confidence:.7},
{domain:"OFFENSIVE_SCHEME",subject:"HISTORICAL_SYSTEM_PRIOR",value:"OUTSIDE_ZONE_HEAVY",classification:C.HISTORICAL_PRIOR,sourceId:"prior",sourceType:"HISTORICAL",observedAt:"2025-12-31T00:00:00Z",confidence:.6}]};
const e=make(f),r=evalC(f);
t("contract_version",()=>assert.equal(e.contractVersion,"FIE-NFL-TEAM-COACHING-SCHEME-EVIDENCE-1.0.0"));
t("team",()=>assert.equal(r.team,"BAL"));t("season",()=>assert.equal(r.season,2026));t("as_of",()=>assert.equal(r.asOf,f.asOf));
t("head_coach_fact",()=>assert.equal(r.coaching.identity.headCoach,"Coach A"));t("oc_fact",()=>assert.equal(r.coaching.identity.offensiveCoordinator,"Coach B"));
t("missing_dc_null",()=>assert.equal(r.coaching.identity.defensiveCoordinator,null));t("continuity_context",()=>assert.equal(r.coaching.continuity,"RETURNING_CORE"));
t("coaching_strength_null",()=>assert.equal(r.coaching.strengthScore,null));t("coaching_adjustment_null",()=>assert.equal(r.coaching.adjustment,null));
t("offense_observation",()=>assert.equal(r.scheme.offense.traits.EARLY_DOWN_PASS_TENDENCY,"ABOVE_BASELINE"));
t("defense_interpretation",()=>assert.equal(r.scheme.defense.traits.STRUCTURE,"MULTIPLE"));
t("historical_prior",()=>assert.equal(r.scheme.offense.traits.HISTORICAL_SYSTEM_PRIOR,"OUTSIDE_ZONE_HEAVY"));
t("offense_strength_null",()=>assert.equal(r.scheme.offense.strengthScore,null));t("defense_strength_null",()=>assert.equal(r.scheme.defense.strengthScore,null));
t("scheme_adjustment_null",()=>assert.equal(r.scheme.matchupAdjustment,null));t("special_teams_unknown",()=>assert.equal(r.scheme.specialTeams.status,"UNAVAILABLE"));
t("source_ids",()=>assert.ok(r.provenance.sourceIds.includes("official")));t("source_types",()=>assert.ok(r.provenance.sourceTypes.includes("FILM_ANALYSIS")));
t("multi_source",()=>assert.ok(r.provenance.sourceIds.length>=4));t("classification_distinct",()=>assert.equal(e.observations.find(x=>x.sourceId==="film").classification,C.ANALYST_INTERPRETATION));
t("prior_distinct",()=>assert.equal(e.observations.find(x=>x.sourceId==="prior").classification,C.HISTORICAL_PRIOR));
t("missing_confidence_null",()=>assert.equal(make({team:"X",season:2026,observations:[{domain:"COACHING",subject:"HEAD_COACH",value:"X",sourceId:"s"}]}).observations[0].confidence,null));
t("bad_confidence_null",()=>assert.equal(make({team:"X",season:2026,observations:[{domain:"COACHING",subject:"HEAD_COACH",value:"X",sourceId:"s",confidence:2}]}).observations[0].confidence,null));
t("empty_unavailable",()=>assert.equal(make({team:"X",season:2026}).status,"UNAVAILABLE"));
t("source_required",()=>assert.equal(make({team:"X",season:2026,observations:[{domain:"COACHING",subject:"HEAD_COACH",value:"X"}]}).observations.length,0));
t("identity_requires_fact",()=>assert.equal(evalC({team:"X",season:2026,observations:[{domain:"COACHING",subject:"HEAD_COACH",value:"Rumor",classification:C.ANALYST_INTERPRETATION,sourceId:"s"}]}).coaching.identity.headCoach,null));
t("prior_and_current_coexist",()=>assert.equal(r.scheme.offense.observations.length,2));t("overall_scheme_null",()=>assert.equal(r.scheme.overallStrengthScore,null));
t("no_win_probability",()=>assert.equal("winProbability"in r,false));t("no_spread",()=>assert.equal("pointSpread"in r,false));t("no_pick",()=>assert.equal("pickRecommendation"in r,false));
t("service_version",()=>assert.equal(r.contextVersion,"FIE-NFL-TEAM-CONTEXT-1.0.0"));t("evidence_available",()=>assert.equal(r.evidenceStatus,"AVAILABLE"));
t("evidence_frozen",()=>assert.ok(Object.isFrozen(e.observations)));t("coaching_frozen",()=>assert.ok(Object.isFrozen(r.coaching)));t("scheme_frozen",()=>assert.ok(Object.isFrozen(r.scheme)));
const bad=tests.filter(x=>!x[1]);console.log(JSON.stringify({suite:"NFL Team Coaching & Scheme Intelligence Foundation",contractVersion:"FIE-NFL-TEAM-CONTEXT-SPRINT-1.0.0",status:bad.length?"FAIL":"PASS",passed:tests.length-bad.length,failed:bad.length,checks:Object.fromEntries(tests.map(x=>[x[0],x[1]])),failures:bad.map(x=>x[0]+": "+x[2])},null,2));if(bad.length)process.exitCode=1;