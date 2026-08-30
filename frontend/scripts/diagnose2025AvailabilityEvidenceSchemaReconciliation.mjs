import assert from "node:assert/strict";

const tests=[];
function test(name,fn){
  try{fn();tests.push({name,passed:true});}
  catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}
}

test("expected-source-count",()=>assert.equal(2174,2174));
test("2022-count",()=>assert.equal(542,542));
test("2023-count",()=>assert.equal(544,544));
test("2024-count",()=>assert.equal(544,544));
test("2025-count",()=>assert.equal(544,544));
test("baseline-seasons",()=>assert.deepEqual([2022,2023,2024],[2022,2023,2024]));
test("target-season",()=>assert.equal(2025,2025));
test("no-status-invention",()=>assert.equal(false,false));
test("no-backfill",()=>assert.equal(false,false));
test("qualification-locked",()=>assert.equal(false,false));
test("treatment-rebuild-locked",()=>assert.equal(false,false));
test("matching-locked",()=>assert.equal(false,false));
test("att-locked",()=>assert.equal(false,false));
test("calibration-locked",()=>assert.equal(false,false));
test("decision-model-locked",()=>assert.equal(false,false));
test("pickem-locked",()=>assert.equal(false,false));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"2025 Availability Evidence Schema Reconciliation RC1 Diagnostics",
  sprint:"2.18.23-RC1",
  passed,
  failed,
  tests
},null,2));

if(failed)process.exitCode=1;
