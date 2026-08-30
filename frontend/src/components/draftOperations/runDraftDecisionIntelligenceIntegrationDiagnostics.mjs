import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const componentPath = path.join(root, "src/components/draftOperations/DraftOperationsCenter.jsx");
const stylePath = path.join(root, "src/styles/draft-operations-next.css");
const component = fs.readFileSync(componentPath, "utf8");
const styles = fs.readFileSync(stylePath, "utf8");

const checks = [
  ["canonical Sports Intelligence draft decision resolver is reused", component.includes("resolveSportsDraftDecision")],
  ["selected prospect decision is scoped to one existing prospect", component.includes("players: [selectedPlayer]")],
  ["decision uses inspected War Room team", component.includes("team: warRoomTeamContext")],
  ["decision uses current or next unresolved team pick", component.includes("const decisionPick = useMemo") && component.includes("!pick?.player")],
  ["existing team picks are supplied to decision support", component.includes("teamPicks: currentTeamPicks")],
  ["user-visible Draft Decision Intelligence surface exists", component.includes("Draft Decision Intelligence")],
  ["Why this pick explanation is surfaced", component.includes("Why this pick")],
  ["team context is surfaced", component.includes("Team context")],
  ["decision provenance is surfaced", component.includes("Decision provenance")],
  ["canonical FIE prospect re-ranking lock is visible", component.includes("Canonical FIE prospect re-ranking: OFF")],
  ["no new fit score formula was added to DraftOperationsCenter", !component.includes("teamFitScore *") && !component.includes("decisionScore =")],
  ["responsive decision support styling exists", styles.includes(".next-selected-decision-support") && styles.includes(".next-selected-decision-grid")],
];

let passed = 0;
for (const [label, ok] of checks) {
  if (ok) passed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
}
console.log(`\n${passed}/${checks.length} PASS`);
if (passed !== checks.length) process.exit(1);
console.log("MDS_FI2_DRAFT_DECISION_INTELLIGENCE_INTEGRATION_READY_FOR_LOCAL_VALIDATION");
