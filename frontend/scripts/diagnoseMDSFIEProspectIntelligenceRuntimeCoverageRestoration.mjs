import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
let passed = 0;
let failed = 0;
function check(ok, label) { if (ok) { console.log(`PASS ${label}`); passed += 1; } else { console.error(`FAIL ${label}`); failed += 1; } }
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const sports = read('src/data/sportsIntelligence/SportsIntelligenceEngine.js');
const center = read('src/components/draftV3/Intelligence/ProspectIntelligenceCenter.jsx');
const ops = read('src/components/draftOperations/DraftOperationsCenter.jsx');
const registryPath = path.join(root, 'src/engines/playerEvaluation/prospectModels/registry/ProspectModelRegistry.js');
const registry = await import(pathToFileURL(registryPath).href);
const positions = registry.listSupportedProspectPositions();
const byPosition = Object.fromEntries(positions.map((entry) => [entry.position, entry]));

check(sports.includes('getPlayerEvaluationIntelligenceResult'), 'Sports Intelligence restores canonical prospect evaluation import');
check(sports.includes('canonicalProspectRuntime'), 'Sports Intelligence exposes canonical prospect runtime');
check(sports.includes('canonicalProspectModelResult'), 'Sports Intelligence exposes canonical prospect model result');
check(sports.includes('canonicalProspectConnected'), 'Sports Intelligence exposes canonical prospect connection state');
check(sports.includes('CANONICAL_FIE_PROSPECT_MODEL_UNAVAILABLE'), 'unavailable canonical model remains explicit');
check(sports.includes('value?.data?.evaluation'), 'decision display reads governed IntelligenceResult value envelope');
check(center.includes('evaluationSummary?.value?.data'), 'Prospect Intelligence Center reads governed IntelligenceResult value envelope');
check(center.includes('canonicalProspectModelResult'), 'Prospect Intelligence Center consumes canonical model result');
check(ops.includes('raw === null || raw === undefined || raw === ""'), 'Big Board prevents null Intel Grade coercion to zero');
check(!ops.includes('const value = Number(getProspectGrade?.(player));'), 'legacy null-to-zero Intel Grade path removed');

check(byPosition.QB?.implemented === true, 'QB canonical prospect model remains registered');
for (const position of ['RB','WR','TE','OT','IOL','DL','EDGE','LB','CB','S','K','P']) {
  check(byPosition[position]?.implemented === false, `${position} remains truthfully unregistered rather than using generic fallback`);
}

const edge = registry.evaluateProspectByPosition({ position: 'EDGE', playerId: 'diagnostic-edge' });
check(edge?.available === false, 'unregistered EDGE evaluation remains unavailable');
check(edge?.overallGrade === null, 'unregistered EDGE evaluation does not invent grade');
check(edge?.confidence === 0, 'unregistered EDGE confidence remains zero');
check(edge?.validation?.errors?.some((entry) => entry.code === 'MODEL_NOT_REGISTERED'), 'unregistered EDGE reports MODEL_NOT_REGISTERED');

check(sports.includes('coverageContract'), 'Sprint 7 War Room coverage contract preserved');
check(sports.includes('resolveSportsCanonicalNFLTeamIntelligence'), 'canonical NFL team resolver from prior integration preserved');
check(sports.includes('resolveSportsFIEApplicationContext'), 'FIE application-context resolver from prior integration preserved');
check(sports.includes('resolveSportsDraftWire'), 'Draft Wire resolver preserved');
check(sports.includes('resolveSportsDraftDecision'), 'CPU draft decision resolver preserved');
check(!sports.includes('pickem') && !center.toLowerCase().includes('pickem'), 'Pick’em logic not imported into MDS prospect consumers');

console.log(`\nMDS/FIE Prospect Intelligence Runtime Coverage Restoration diagnostics: ${passed}/${passed + failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log('MDS_FIE_PROSPECT_INTELLIGENCE_RUNTIME_COVERAGE_RESTORED_READY');
