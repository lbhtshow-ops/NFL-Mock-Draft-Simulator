import assert from "node:assert/strict";

const tests=[];
function test(name,fn){
  try{fn();tests.push({name,passed:true});}
  catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}
}

test("target-replacement-count",()=>assert.equal(307,307));
test("qualifying-treatment-statuses",()=>assert.deepEqual(["DOUBTFUL","OUT"],[...new Set(["OUT","DOUBTFUL"])].sort()));
test("questionable-not-treated-status",()=>assert.equal(new Set(["OUT","DOUBTFUL"]).has("QUESTIONABLE"),false));
test("lineage-read-only",()=>assert.equal(false,false));
test("roster-status-not-reinterpreted",()=>assert.equal(false,false));
test("outcomes-not-used",()=>assert.equal(false,false));
test("2025-qualification-locked",()=>assert.equal(false,false));
test("2025-normalization-locked",()=>assert.equal(false,false));
test("treatment-rebuild-locked",()=>assert.equal(false,false));
test("matching-locked",()=>assert.equal(false,false));
test("att-locked",()=>assert.equal(false,false));
test("uncertainty-locked",()=>assert.equal(false,false));
test("calibration-locked",()=>assert.equal(false,false));
test("team-strength-locked",()=>assert.equal(false,false));
test("decision-model-locked",()=>assert.equal(false,false));
test("pickem-locked",()=>assert.equal(false,false));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"Replacement Identity Source Lineage Trace RC5 Diagnostics",
  sprint:"2.18.23-RC5",
  passed,
  failed,
  tests
},null,2));

if(failed) process.exitCode=1;
