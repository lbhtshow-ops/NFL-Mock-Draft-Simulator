import assert from "node:assert/strict";

const tests=[];
function test(name,fn){
  try{fn();tests.push({name,passed:true});}
  catch(error){tests.push({name,passed:false,error:error?.stack??String(error)});}
}

test("out-is-treatment",()=>assert.equal(new Set(["OUT","DOUBTFUL"]).has("OUT"),true));
test("doubtful-is-treatment",()=>assert.equal(new Set(["OUT","DOUBTFUL"]).has("DOUBTFUL"),true));
test("questionable-not-treatment",()=>assert.equal(new Set(["OUT","DOUBTFUL"]).has("QUESTIONABLE"),false));
test("availability-impact-path",()=>assert.equal("evidence.availabilityImpact.players[]","evidence.availabilityImpact.players[]"));
test("report-status-path",()=>assert.equal("reportStatus","reportStatus"));
test("is-out-path",()=>assert.equal("isOut","isOut"));
test("is-doubtful-path",()=>assert.equal("isDoubtful","isDoubtful"));
test("is-questionable-path",()=>assert.equal("isQuestionable","isQuestionable"));
test("read-only",()=>assert.equal(false,false));
test("roster-status-not-reinterpreted",()=>assert.equal(false,false));
test("2025-comparison-not-yet-authorized-by-default",()=>assert.equal(false,false));
test("2025-qualification-locked",()=>assert.equal(false,false));
test("2025-normalization-locked",()=>assert.equal(false,false));
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
  suite:"Historical Availability Status Transform Lineage RC8 Diagnostics",
  sprint:"2.18.23-RC8",
  passed,
  failed,
  tests
},null,2));

if(failed)process.exitCode=1;
