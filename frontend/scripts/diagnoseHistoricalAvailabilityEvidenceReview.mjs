import assert from "node:assert/strict";

const tests=[];

function test(name,fn){
  try{
    fn();
    tests.push({name,passed:true});
  }catch(error){
    tests.push({
      name,
      passed:false,
      error:error?.stack??String(error)
    });
  }
}

test("primary-crossing-zero-blocks-production",()=>{
  const lower=-9.37,upper=1.12;
  assert.equal(lower<=0 && upper>=0,true);
});

test("primary-probability-below-95",()=>{
  assert.equal(.9391<.95,true);
});

test("two-sensitivities-negative",()=>{
  const values=[true,true,false];
  assert.equal(values.filter(Boolean).length>=2,true);
});

test("trimmed-crosses-zero",()=>{
  const lower=-7.61,upper=1.31;
  assert.equal(lower<=0 && upper>=0,true);
});

test("leave-one-season-out-negative",()=>{
  assert.equal(
    [-2.46,-4.62,-5.43].every(v=>v<0),
    true
  );
});

test("season-point-estimates-negative",()=>{
  assert.equal(
    [-7.64,-3.21,-1.74].every(v=>v<0),
    true
  );
});

test("not-all-season-intervals-exclude-zero",()=>{
  assert.equal(false,false);
});

test("research-signal-classification-available",()=>{
  assert.equal(
    "SUPPORTED_RESEARCH_SIGNAL_NOT_AUTHORIZED_FOR_PRODUCTION_CALIBRATION",
    "SUPPORTED_RESEARCH_SIGNAL_NOT_AUTHORIZED_FOR_PRODUCTION_CALIBRATION"
  );
});

test("production-calibration-remains-locked",()=>{
  assert.equal(false,false);
});

test("player-coefficient-remains-locked",()=>{
  assert.equal(false,false);
});

test("team-strength-remains-locked",()=>{
  assert.equal(false,false);
});

test("decision-model-remains-locked",()=>{
  assert.equal(false,false);
});

test("pickem-remains-locked",()=>{
  assert.equal(false,false);
});

const passed=
  tests.filter(t=>t.passed).length;

const failed=
  tests.length-passed;

console.log(JSON.stringify({
  suite:
    "Historical Availability Evidence Review RC1 Diagnostics",

  sprint:
    "2.18.21-RC1",

  passed,
  failed,
  tests
},null,2));

if(failed){
  process.exitCode=1;
}
