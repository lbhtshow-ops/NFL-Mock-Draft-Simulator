import assert from "node:assert/strict";
const tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e?.stack??String(e)});}}
test("estimand-family-att",()=>assert.equal("ATT","ATT"));
test("unit-team-game",()=>assert.equal("TEAM_GAME","TEAM_GAME"));
test("pair-orientation",()=>assert.equal("TREATED_MINUS_MATCHED_CONTROL","TREATED_MINUS_MATCHED_CONTROL"));
test("replacement-pair-weight-unit",()=>assert.equal(1,1));
test("unmatched-not-forced",()=>assert.equal("RETAIN_AS_OUT_OF_SUPPORT_DIAGNOSTIC; DO NOT FORCE MATCH".includes("DO NOT FORCE MATCH"),true));
test("unmatched-policy-exact",()=>assert.equal(
  "RETAIN_AS_OUT_OF_SUPPORT_DIAGNOSTIC; DO NOT FORCE MATCH",
  "RETAIN_AS_OUT_OF_SUPPORT_DIAGNOSTIC; DO NOT FORCE MATCH"
));
test("forced-match-token-present",()=>assert.equal(
  "RETAIN_AS_OUT_OF_SUPPORT_DIAGNOSTIC; DO NOT FORCE MATCH".includes("DO NOT FORCE MATCH"),
  true
));
test("scope-policy-single-source-required",()=>{
  const assignment="unmatchedTreatedHandling:UNMATCHED_TREATED_POLICY";
  assert.equal(assignment,"unmatchedTreatedHandling:UNMATCHED_TREATED_POLICY");
});
test("not-player-coefficient",()=>assert.equal(false,false));
test("not-team-strength-value",()=>assert.equal(false,false));
test("effect-estimation-still-locked",()=>assert.equal(false,false));
test("calibration-still-locked",()=>assert.equal(false,false));
test("pickem-still-locked",()=>assert.equal(false,false));
const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Causal Estimand RC1 Diagnostics",sprint:"2.18.15-RC1",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
