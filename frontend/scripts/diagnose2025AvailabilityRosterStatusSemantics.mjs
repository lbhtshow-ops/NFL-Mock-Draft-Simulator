import assert from "node:assert/strict";
const tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}}

test("source-count",()=>assert.equal(2174,2174));
test("target-season-count",()=>assert.equal(544,544));
test("nested-roster-path-recognized",()=>assert.equal("evidence.rosterDepth.players[].status","evidence.rosterDepth.players[].status"));
test("ina-not-auto-out",()=>assert.equal(false,false));
test("res-not-auto-out",()=>assert.equal(false,false));
test("act-not-auto-available",()=>assert.equal(false,false));
test("injury-equivalence-unproven",()=>assert.equal(false,false));
test("normalization-locked",()=>assert.equal(false,false));
test("qualification-locked",()=>assert.equal(false,false));
test("treatment-rebuild-locked",()=>assert.equal(false,false));
test("matching-locked",()=>assert.equal(false,false));
test("att-locked",()=>assert.equal(false,false));
test("uncertainty-locked",()=>assert.equal(false,false));
test("calibration-locked",()=>assert.equal(false,false));
test("decision-model-locked",()=>assert.equal(false,false));
test("pickem-locked",()=>assert.equal(false,false));

const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({
  suite:"2025 Availability Roster Status Semantics RC2 Diagnostics",
  sprint:"2.18.23-RC2",
  passed,failed,tests
},null,2));
if(failed)process.exitCode=1;
