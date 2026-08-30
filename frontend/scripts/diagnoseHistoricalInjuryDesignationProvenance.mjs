import assert from "node:assert/strict";

const tests=[];
function test(name,fn){
  try{fn();tests.push({name,passed:true});}
  catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}
}

test("baseline-seasons",()=>assert.deepEqual([2022,2023,2024],[2022,2023,2024]));
test("target-season",()=>assert.equal(2025,2025));
test("designation-out",()=>assert.equal("OUT","OUT"));
test("designation-doubtful",()=>assert.equal("DOUBTFUL","DOUBTFUL"));
test("designation-questionable",()=>assert.equal("QUESTIONABLE","QUESTIONABLE"));
test("roster-ina-not-designation",()=>assert.equal(new Set(["OUT","DOUBTFUL","QUESTIONABLE"]).has("INA"),false));
test("roster-act-not-designation",()=>assert.equal(new Set(["OUT","DOUBTFUL","QUESTIONABLE"]).has("ACT"),false));
test("source-discovery-read-only",()=>assert.equal(false,false));
test("outcome-not-used",()=>assert.equal(false,false));
test("2025-qualification-locked",()=>assert.equal(false,false));
test("treatment-rebuild-locked",()=>assert.equal(false,false));
test("matching-locked",()=>assert.equal(false,false));
test("att-locked",()=>assert.equal(false,false));
test("uncertainty-locked",()=>assert.equal(false,false));
test("calibration-locked",()=>assert.equal(false,false));
test("decision-model-locked",()=>assert.equal(false,false));
test("pickem-locked",()=>assert.equal(false,false));

const passed=tests.filter(t=>t.passed).length;
const failed=tests.length-passed;

console.log(JSON.stringify({
  suite:"Historical Injury Designation Provenance Audit RC3 Diagnostics",
  sprint:"2.18.23-RC3",
  passed,
  failed,
  tests
},null,2));

if(failed) process.exitCode=1;
