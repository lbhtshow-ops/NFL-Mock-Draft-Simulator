import assert from "node:assert/strict";
import {CLASSIFICATIONS,buildHistoricalAvailabilityControlCohort,classifyHistoricalAvailabilityTeamGame,teamGameKey} from "./buildHistoricalAvailabilityControlCohort.mjs";

const tests=[];
async function test(name,fn){try{await fn();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}}

const source=({gameId="2022_01_A_B",team="A",season=2022,week=1,leakageSafe=true,impact={status:"AVAILABLE",playerCount:0,outCount:0,doubtfulCount:0,questionableCount:0,players:[]}}={})=>({
  gameId,team,opponent:"B",season,week,leakageSafe,kickoffAt:"2022-09-01T20:00:00Z",evidenceAsOf:"2022-09-01T19:59:00Z",
  evidence:{availabilityImpact:impact},
  datasetGovernance:{availabilityJoin:"LATEST_SAFE_PLAYER_WEEK_REPORT",availabilitySource:"NFLVERSE_INJURIES"}
});
const treated=({gameId="2022_01_A_B",team="A",season=2022,week=1,status="OUT",player="p1",replacement="p2"}={})=>({
  identity:{gameId,team,opponent:"B",season,week,position:"QB",unavailablePlayerId:player,replacementPlayerId:replacement},
  availability:{unavailableStatus:status,expectedReplacementDelta:5}
});

await test("key",()=>assert.equal(teamGameKey("g1","bal"),"g1:BAL"));
await test("clean-control",()=>assert.equal(classifyHistoricalAvailabilityTeamGame({sourceRows:[source()],treatedRows:[]}).classification,CLASSIFICATIONS.CONTROL_CANDIDATE));
await test("questionable-only-control-candidate",()=>{
  const r=classifyHistoricalAvailabilityTeamGame({sourceRows:[source({impact:{status:"AVAILABLE",playerCount:1,outCount:0,doubtfulCount:0,questionableCount:1,players:[{playerId:"p1",reportStatus:"Questionable",isQuestionable:true}]}})],treatedRows:[]});
  assert.equal(r.classification,CLASSIFICATIONS.CONTROL_CANDIDATE);assert.equal(r.availability.questionableCount,1);
});
await test("out-unresolved-not-control",()=>{
  const r=classifyHistoricalAvailabilityTeamGame({sourceRows:[source({impact:{status:"AVAILABLE",playerCount:1,outCount:1,doubtfulCount:0,questionableCount:0,players:[{playerId:"p1",reportStatus:"Out",isOut:true}]}})],treatedRows:[]});
  assert.equal(r.classification,CLASSIFICATIONS.AVAILABILITY_EXPOSED_UNRESOLVED);
});
await test("doubtful-unresolved-not-control",()=>{
  const r=classifyHistoricalAvailabilityTeamGame({sourceRows:[source({impact:{status:"AVAILABLE",playerCount:1,outCount:0,doubtfulCount:1,questionableCount:0,players:[{playerId:"p1",reportStatus:"Doubtful",isDoubtful:true}]}})],treatedRows:[]});
  assert.equal(r.classification,CLASSIFICATIONS.AVAILABILITY_EXPOSED_UNRESOLVED);
});
await test("missing-availability-excluded",()=>assert.equal(classifyHistoricalAvailabilityTeamGame({sourceRows:[source({impact:null})],treatedRows:[]}).classification,CLASSIFICATIONS.EXCLUDED_UNKNOWN));
await test("leakage-unsafe-excluded",()=>assert.equal(classifyHistoricalAvailabilityTeamGame({sourceRows:[source({leakageSafe:false})],treatedRows:[]}).classification,CLASSIFICATIONS.EXCLUDED_UNKNOWN));
await test("ambiguous-source-excluded",()=>{
  const r=classifyHistoricalAvailabilityTeamGame({sourceRows:[source(),source()],treatedRows:[]});
  assert.equal(r.classification,CLASSIFICATIONS.EXCLUDED_UNKNOWN);assert.equal(r.reason,"AMBIGUOUS_SOURCE_TEAM_GAME");
});
await test("treated",()=>{
  const r=classifyHistoricalAvailabilityTeamGame({sourceRows:[source({impact:{status:"AVAILABLE",playerCount:1,outCount:1,doubtfulCount:0,questionableCount:0,players:[{playerId:"p1",reportStatus:"Out",isOut:true}]}})],treatedRows:[treated()]});
  assert.equal(r.classification,CLASSIFICATIONS.TREATED);assert.equal(r.reconciliation.sourceContainsQualifyingAvailabilityEvent,true);assert.equal(r.reconciliation.treatmentStatusesValid,true);
});
await test("treated-source-mismatch-visible",()=>{
  const r=classifyHistoricalAvailabilityTeamGame({sourceRows:[source()],treatedRows:[treated()]});
  assert.equal(r.classification,CLASSIFICATIONS.TREATED);assert.equal(r.reconciliation.sourceContainsQualifyingAvailabilityEvent,false);
});
await test("outside-season-excluded",()=>assert.equal(classifyHistoricalAvailabilityTeamGame({sourceRows:[source({season:2025})],treatedRows:[],allowedSeasons:[2022,2023,2024]}).classification,CLASSIFICATIONS.EXCLUDED_UNKNOWN));
await test("build-no-overlap",()=>{
  const s1=source({gameId:"2022_01_A_B",team:"A",impact:{status:"AVAILABLE",playerCount:1,outCount:1,doubtfulCount:0,questionableCount:0,players:[{playerId:"p1",reportStatus:"Out",isOut:true}]}});
  const s2=source({gameId:"2022_01_C_D",team:"C"});const t1=treated({gameId:"2022_01_A_B",team:"A"});
  const {records,report}=buildHistoricalAvailabilityControlCohort({sourceObservations:[s1,s2],treatedResidualRows:[t1]});
  assert.equal(records.length,2);assert.equal(report.reconciliation.controlOverlapCount,0);assert.equal(report.reconciliation.exposedControlOverlapCount,0);
});
await test("no-weights-or-calibration",()=>{
  const {report}=buildHistoricalAvailabilityControlCohort({sourceObservations:[],treatedResidualRows:[]});
  assert.equal(report.safeguards.learnedWeightsCreated,false);assert.equal(report.safeguards.calibrationExecuted,false);assert.equal(report.readiness.formalFittingAuthorized,false);
});

const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Control Cohort RC1 Diagnostics",sprint:"2.18.10-RC1",passed,failed,tests},null,2));
if(failed) process.exitCode=1;
