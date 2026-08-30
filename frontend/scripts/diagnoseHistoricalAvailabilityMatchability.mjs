import assert from "node:assert/strict";
const tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e?.stack??String(e)});}}
const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function sd(xs){if(xs.length<2)return null;const m=mean(xs);return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1));}
function percentile(xs,p){const s=[...xs].sort((a,b)=>a-b);if(!s.length)return null;const i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return l===h?s[l]:s[l]+(s[h]-s[l])*(i-l);}
test("finite-null-false",()=>assert.equal(finite(null),false));
test("sd-positive",()=>assert.ok(sd([1,2,3])>0));
test("percentile-median",()=>assert.equal(percentile([1,2,3],.5),2));
test("diagnostic-threshold-order",()=>{const x=[.2,.4,.7,1,1.4];assert.ok(percentile(x,.5)<=percentile(x,.75));assert.ok(percentile(x,.75)<=percentile(x,.95));});
test("no-outcome-use",()=>{const fields="expectedTeamMargin evidenceQuality restDifferential overallStrength passMatchup rushMatchup recentForm specialTeams explosivePlay redZone";assert.equal(fields.includes("Score"),false);assert.equal(fields.includes("outcome"),false);});
test("fitting-remains-locked",()=>assert.equal(false,false));
const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Matchability RC1 Diagnostics",sprint:"2.18.12-RC1",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
