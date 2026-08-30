import fs from "node:fs";
import path from "node:path";
import {
  getNFLTeamIntelligenceResult,
} from "../src/engines/teamIntelligence/CanonicalNFLTeamIntelligenceEngine.js";
import {
  createMDSFIEIntelligenceApplicationServiceResult,
  isMDSFIEIntelligenceApplicationServiceResult,
} from "../src/data/sportsIntelligence/services/MDSFIEIntelligenceApplicationService.js";

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

const canonical = getNFLTeamIntelligenceResult("BAL", { season: 2026 });
const application = createMDSFIEIntelligenceApplicationServiceResult({
  teamIntelligence: canonical,
  draftContext: {
    draftId: "sprint-4-diagnostic",
    draftYear: 2027,
    pickNumber: 17,
    round: 1,
    selectingTeam: "BAL",
  },
});
const view = application?.application?.fie?.teamIntelligence || null;

check("canonical FIE team contract returned", canonical?.contract === "NFLTeamIntelligenceResult");
check("canonical FIE resolves BAL", canonical?.teamAbbreviation === "BAL");
check("canonical FIE state is governed", ["AVAILABLE", "PARTIAL", "UNKNOWN", "UNAVAILABLE"].includes(canonical?.state));
check("canonical FIE evidence completeness is bounded", canonical?.evidenceCompleteness === null || (canonical.evidenceCompleteness >= 0 && canonical.evidenceCompleteness <= 1));
check("canonical FIE summary is present", typeof canonical?.summary === "string" && canonical.summary.length > 0);
check("canonical FIE limiting factors are present", Array.isArray(canonical?.explanation?.limitingFactors));
check("canonical FIE provenance array is present", Array.isArray(canonical?.sources));

check("application-service result remains valid", isMDSFIEIntelligenceApplicationServiceResult(application));
check("application view uses canonical team contract", view?.sourceContract === "NFLTeamIntelligenceResult");
check("application view preserves team abbreviation", view?.teamAbbreviation === canonical?.teamAbbreviation);
check("application view preserves canonical state", view?.state === canonical?.state);
check("application view preserves evidence completeness", view?.evidenceCompleteness === canonical?.evidenceCompleteness);
check("application view preserves summary", view?.summary === canonical?.summary);
check("application view preserves limiting factors", JSON.stringify(view?.explanation?.limitingFactors) === JSON.stringify(canonical?.explanation?.limitingFactors));
check("application view preserves sources", JSON.stringify(view?.sources) === JSON.stringify(canonical?.sources));
check("application view does not invent team strength", view?.overallStrength === canonical?.overallStrength);
check("application view does not invent confidence", view?.confidence === canonical?.confidence);
check("application view has no matchup result when none supplied", application?.application?.fie?.matchupIntelligence === null);
check("draft context stays MDS-owned", application?.application?.draftContext?.pickNumber === 17);

const sportsSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/SportsIntelligenceEngine.js"),
  "utf8"
);
const draftOpsSource = fs.readFileSync(
  path.resolve("src/components/draftOperations/DraftOperationsCenter.jsx"),
  "utf8"
);
const draftWireSource = fs.readFileSync(
  path.resolve("src/components/draftOperations/DraftWire.jsx"),
  "utf8"
);
const cpuSource = fs.readFileSync(
  path.resolve("src/data/sportsIntelligence/draft/SportsDraftDecisionEngine.js"),
  "utf8"
);

check("SportsIntelligenceEngine delegates to canonical FIE team engine", sportsSource.includes("getNFLTeamIntelligenceResult"));
check("SportsIntelligenceEngine exposes canonical FIE team resolver", sportsSource.includes("export function resolveSportsCanonicalNFLTeamIntelligence"));
check("SportsIntelligenceEngine retains Sprint 3 application resolver", sportsSource.includes("resolveSportsFIEApplicationContext"));
check("DraftOperationsCenter imports canonical FIE team resolver", draftOpsSource.includes("resolveSportsCanonicalNFLTeamIntelligence"));
check("DraftOperationsCenter imports FIE application resolver", draftOpsSource.includes("resolveSportsFIEApplicationContext"));
check("DraftOperationsCenter builds FIE application context", draftOpsSource.includes("const fieApplicationContext = useMemo"));
check("DraftOperationsCenter renders canonical FIE assessment", draftOpsSource.includes("Canonical FIE Team Assessment"));
check("DraftOperationsCenter renders evidence coverage", draftOpsSource.includes("Evidence Coverage"));
check("DraftOperationsCenter explicitly shows unmodeled strength", draftOpsSource.includes("Model pending"));
check("DraftOperationsCenter explicitly shows unknown confidence", draftOpsSource.includes("Not established"));
check("DraftOperationsCenter surfaces canonical summary", draftOpsSource.includes("canonicalFIEView?.summary"));
check("DraftOperationsCenter surfaces canonical limiting factors", draftOpsSource.includes("canonicalFIEView.explanation.limitingFactors"));
check("Draft Wire component remains unwired", !draftWireSource.includes("resolveSportsFIEApplicationContext"));
check("CPU decision engine remains unwired", !cpuSource.includes("resolveSportsFIEApplicationContext"));
check("DraftOperationsCenter does not mutate win probability", !draftOpsSource.includes("calibratedWinProbability"));
check("DraftOperationsCenter does not add predicted winner logic", !draftOpsSource.includes("predictedWinner"));

console.log(`\nMDS/FIE Draft Operations Intelligence Integration diagnostics: ${passed}/${passed + failed} passed; ${failed} failed.`);
if (failed) process.exit(1);
console.log("MDS_FIE_DRAFT_OPERATIONS_CANONICAL_TEAM_INTELLIGENCE_INTEGRATED_READY");
