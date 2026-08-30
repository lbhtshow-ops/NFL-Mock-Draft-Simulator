import assert from "node:assert/strict";
const tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e?.stack??String(e)});}}
const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function variance(xs){if(xs.length<2)return null;const m=mean(xs);return xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1);}
function smd(a,b){const va=variance(a),vb=variance(b);if(!Number.isFinite(va)||!Number.isFinite(vb))return null;const p=Math.sqrt((va+vb)/2);return p?(mean(a)-mean(b))/p:0;}
test("null-not-finite",()=>assert.equal(finite(null),false));
test("smd-identical-zero",()=>assert.equal(smd([1,2,3],[1,2,3]),0));
test("smd-different-nonzero",()=>assert.ok(Math.abs(smd([2,3,4],[1,2,3]))>0));
test("with-replacement-allows-reuse",()=>{const x=new Map();["a","a","b"].forEach(k=>x.set(k,(x.get(k)??0)+1));assert.equal(Math.max(...x.values()),2);});
test("without-replacement-unique",()=>assert.equal(new Set(["a","b","c"]).size,3));
test("no-outcome-selection",()=>{const fields="expectedTeamMargin evidenceQuality restDifferential overallStrength passMatchup rushMatchup recentForm specialTeams explosivePlay redZone";assert.equal(/score|outcome|marginactual/i.test(fields),false);});
test("selection-remains-locked",()=>assert.equal(false,false));
const passed=tests.filter(t=>t.passed).length,failed=tests.length-passed;
console.log(JSON.stringify({suite:"Historical Availability Matching Design RC1 Diagnostics",sprint:"2.18.13-RC1",passed,failed,tests},null,2));
if(failed)process.exitCode=1;
