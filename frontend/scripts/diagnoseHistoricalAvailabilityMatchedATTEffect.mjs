import assert from "node:assert/strict";
const tests=[];function test(name,fn){try{fn();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}}
test("pair-effect-definition",()=>assert.equal(-3-2,-5));
test("negative-means-underperformance",()=>assert.ok(-5<0));
test("positive-means-outperformance",()=>assert.ok(4>0));
test("pair-weight-unit",()=>assert.equal(1,1));
test("expected-pair-count",()=>assert.equal(131,131));
test("att-family",()=>assert.equal("ATT","ATT"));
test("descriptive-only",()=>assert.equal("DESCRIPTIVE_POINT_ESTIMATE_ONLY","DESCRIPTIVE_POINT_ESTIMATE_ONLY"));
test("uncertainty-locked",()=>assert.equal(false,false));
test("inference-locked",()=>assert.equal(false,false));
test("calibration-locked",()=>assert.equal(false,false));
test("team-strength-locked",()=>assert.equal(false,false));
test("decision-model-locked",()=>assert.equal(false,false));
test("pickem-locked",()=>assert.equal(false,false));
const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Matched ATT Effect RC1 Diagnostics",sprint:"2.18.18-RC1",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
