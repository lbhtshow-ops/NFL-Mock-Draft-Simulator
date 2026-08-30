import fs from "node:fs";
import path from "node:path";
import { evaluateCanonicalProspect } from "../src/engines/playerEvaluation/prospect/CanonicalProspectEvaluationService.js";
import { listSupportedProspectPositions } from "../src/engines/playerEvaluation/prospectModels/registry/ProspectModelRegistry.js";

let passed=0, failed=0;
function check(name, condition) {
  if (condition) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.error(`FAIL ${name}`); }
}

const edge = evaluateCanonicalProspect({
  player: { id: "diagnostic-edge", name: "Diagnostic EDGE", position: "EDGE" },
  playerContext: { position: "EDGE", evaluationPath: "PROSPECT", competition: { level: "COLLEGE" }, careerStage: "PROSPECT" },
});
const models = listSupportedProspectPositions();
const qb = models.find((item) => item.position === "QB");
const edgeModel = models.find((item) => item.position === "EDGE");

check("canonical prospect service executes", Boolean(edge?.versions?.service));
check("canonical prospect service normalizes EDGE", edge?.position === "EDGE");
check("EDGE is truthfully unavailable without model", edge?.available === false);
check("EDGE reports MODEL_NOT_REGISTERED", edge?.error === "MODEL_NOT_REGISTERED");
check("EDGE does not invent overall grade", edge?.modelResult?.overallGrade == null);
check("EDGE confidence remains zero", edge?.modelResult?.confidence === 0);
check("canonical runtime still gathers domain intelligence", Boolean(edge?.intelligence));
check("canonical runtime exposes production domain", Boolean(edge?.intelligence?.production));
check("canonical runtime exposes athletic domain", Boolean(edge?.intelligence?.athleticism));
check("canonical runtime exposes football IQ domain", Boolean(edge?.intelligence?.footballIQ));
check("canonical runtime exposes scheme fit domain", Boolean(edge?.intelligence?.schemeFit));
check("canonical runtime exposes player traits domain", Boolean(edge?.intelligence?.playerTraits));
check("QB production model remains registered", qb?.implemented === true);
check("EDGE production model remains unregistered", edgeModel?.implemented === false);

const sports = fs.readFileSync(path.resolve("src/data/sportsIntelligence/SportsIntelligenceEngine.js"),"utf8");
const pic = fs.readFileSync(path.resolve("src/components/draftV3/Intelligence/ProspectIntelligenceCenter.jsx"),"utf8");

check("SportsIntelligenceEngine imports canonical player evaluation boundary", sports.includes("getPlayerEvaluationIntelligenceResult"));
check("prospect resolver invokes canonical player evaluation", sports.includes("const canonicalEvaluation = getPlayerEvaluationIntelligenceResult(player)"));
check("prospect resolver exposes canonical runtime", sports.includes("canonicalProspectRuntime: canonicalRuntime"));
check("prospect resolver exposes canonical model result", sports.includes("canonicalProspectModelResult: canonicalModelResult"));
check("prospect resolver maps canonical production", sports.includes("production: canonicalDomains.production"));
check("prospect resolver maps canonical athleticism", sports.includes("athletics: canonicalDomains.athleticism"));
check("prospect resolver maps canonical football IQ", sports.includes("footballIQ: canonicalDomains.footballIQ"));
check("prospect resolver maps canonical scheme fit", sports.includes("schemeFit: canonicalDomains.schemeFit"));
check("prospect resolver maps canonical player traits", sports.includes("traits: canonicalDomains.playerTraits"));
check("prospect resolver prioritizes canonical source classification", sports.includes("CANONICAL_FIE_PROSPECT_MODEL"));
check("prospect resolver retains development adapter as fallback", sports.includes("resolveDevelopmentProspectProjection"));
check("Prospect Intelligence Center reports canonical connection", pic.includes("Canonical FIE prospect model connected"));
check("Prospect Intelligence Center reports model unavailable truthfully", pic.includes("Canonical FIE connected"));
check("Prospect Intelligence Center does not fabricate unavailable grade", pic.includes('const grade = canonicalEvaluationData.overallGrade'));
check("Prospect Intelligence Center labels unavailable model", pic.includes('"Model Not Available"'));
check("Prospect Intelligence Center still uses existing tab architecture", pic.includes("<IntelligenceTabs"));
check("Prospect Intelligence Center still consumes SportsIntelligenceEngine", pic.includes("resolveSportsProspectIntelligence"));

console.log(`\nMDS/FIE Canonical Prospect Draft Room Integration diagnostics: ${passed}/${passed+failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_CANONICAL_PROSPECT_DRAFT_ROOM_CONSUMER_CONNECTED_READY");
