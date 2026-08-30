import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const checks = [];
const pass = (name, ok) => { checks.push({ name, ok: Boolean(ok) }); console.log(`${ok ? "PASS" : "FAIL"} ${name}`); };
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const siePath = "src/data/sportsIntelligence/SportsIntelligenceEngine.js";
const uiPath = "src/components/draftOperations/DraftOperationsCenter.jsx";
const cssPath = "src/styles/draft-operations-next.css";
const sie = read(siePath);
const ui = read(uiPath);
const css = read(cssPath);

pass("coverage contract version declared", sie.includes("WAR_ROOM_INTELLIGENCE_COVERAGE_V1"));
for (const state of ["CANONICAL", "ROSTER_DERIVED", "MDS_RUNTIME", "TRANSITIONAL", "UNAVAILABLE"]) pass(`coverage classification ${state} declared`, sie.includes(`${state}: \"${state}\"`));
pass("team-specific context registry distinguishes default fallback", sie.includes("teamContexts?.[abbreviation]"));
pass("organization field coverage is explicit", sie.includes("organizationCoverage"));
pass("identity field coverage is explicit", sie.includes("identityCoverage"));
pass("needs coverage distinguishes roster-derived and transitional", sie.includes("DERIVED_TEAM_NEEDS_ENGINE") && sie.includes("Roster-derived needs unavailable"));
pass("MDS drafted ownership declared", sie.includes('drafted: coverage(WAR_ROOM_COVERAGE.MDS_RUNTIME'));
pass("MDS draft capital ownership declared", sie.includes('draftCapital: coverage(WAR_ROOM_COVERAGE.MDS_RUNTIME'));
pass("MDS queue ownership declared", sie.includes('draftQueue: coverage(WAR_ROOM_COVERAGE.MDS_RUNTIME'));
pass("draft strategy remains transitional", sie.includes('draftStrategy: coverage(WAR_ROOM_COVERAGE.TRANSITIONAL'));
pass("UI consumes coverage contract", ui.includes("sportsTeamIntel?.coverageContract?.domains"));
pass("UI no longer uses blanket Sports Intelligence Connected badge", !ui.includes('teamIntel.connected ? "Sports Intelligence Connected"'));
pass("all nine War Room tabs retained", ["overview","needs","roster","drafted","intel","identity","front-office","capital","queue"].every((id) => ui.includes(`id: \"${id}\"`)));
pass("tab coverage indicators rendered", ui.includes("next-tab-coverage"));
pass("coverage legend rendered", ui.includes("next-war-coverage-legend"));
pass("front-office fields expose provenance", ui.includes("warRoomCoverage.organization?.fields?.generalManager"));
pass("identity fields expose provenance", ui.includes("warRoomCoverage.identity?.fields?.offensiveScheme"));
pass("coverage styles present", css.includes("next-coverage-badge") && css.includes("next-war-coverage-legend"));
pass("Pick'em logic not imported by SportsIntelligenceEngine", !/pick.?em/i.test(sie));
pass("Pick'em logic not imported by DraftOperationsCenter", !/pick.?em/i.test(ui));
pass("no probability mutation added", !/homeWinProbability\s*=|awayWinProbability\s*=|expectedHomeMargin\s*=/i.test(sie + ui));

pass("coverage contract is returned by team resolver", sie.includes("coverageContract,"));
pass("coverage contract version exposed to consumers", sie.includes("coverageContractVersion: coverageContract.version"));
pass("default team context cannot masquerade as team-specific context", sie.includes("hasTeamSpecificContext ? teamContext?.offensiveScheme : null"));

const failed = checks.filter((c) => !c.ok);
console.log(`\nMDS War Room Intelligence Coverage Stabilization diagnostics: ${checks.length - failed.length}/${checks.length} passed; ${failed.length} failed.`);
if (failed.length) process.exit(1);
console.log("MDS_DRAFT_ROOM_WAR_ROOM_INTELLIGENCE_COVERAGE_STABILIZED_READY");
