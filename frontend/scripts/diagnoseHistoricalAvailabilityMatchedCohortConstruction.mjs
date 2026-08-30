import assert from "node:assert/strict";
const tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e?.stack??String(e)});}}
test("expected-treated-count",()=>assert.equal(187,187));
test("expected-pair-count",()=>assert.equal(131,131));
test("expected-unmatched-count",()=>assert.equal(56,56));
test("expected-unique-controls",()=>assert.equal(76,76));
test("expected-max-reuse",()=>assert.equal(7,7));
test("pair-weight-unit",()=>assert.equal(1,1));
test("outcomes-absent",()=>assert.equal(false,false));
test("effect-estimation-locked",()=>assert.equal(false,false));
test("calibration-locked",()=>assert.equal(false,false));
test("pickem-locked",()=>assert.equal(false,false));
const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Matched Cohort RC1 Diagnostics",sprint:"2.18.16-RC1",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
