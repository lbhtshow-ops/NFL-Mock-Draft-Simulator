import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(here, "DraftOperationsCenter.jsx");
const cssPath = path.resolve(here, "../../styles/draft-operations-next.css");
const draftPath = path.resolve(here, "../../pages/Draft.jsx");
const component = fs.readFileSync(componentPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const draft = fs.readFileSync(draftPath, "utf8");

const checks = {
  fullTimelineUsesAllPicks: component.includes("const timelinePicks = picks;"),
  currentPickAutoScrollPresent: component.includes("scrollIntoView") && component.includes("data-timeline-pick-id"),
  timelineWheelScrollPresent: component.includes("handleTimelineWheel") && component.includes("onWheel={handleTimelineWheel}"),
  searchClearControlPresent: component.includes('className="next-search-clear"') && component.includes('onClick={() => onSearchChange("")}'),
  bigBoardBoundedViewport: css.includes("height: clamp(420px, 52vh, 560px);") && css.includes("max-height: 560px;") && css.includes("overflow-y: auto;"),
  bigBoardR2RuleOverridesR1: css.lastIndexOf("max-height: 560px;") > css.lastIndexOf("max-height: none;"),
  stickyTableHeaderPreserved: css.includes(".next-board-table thead { position: sticky;"),
  pausedManualPickAllowed: draft.includes("Pause freezes the clock and automatic/CPU progression only.") && !draft.includes("Draft is paused. Please resume before selecting a player."),
  pauseStillStopsTimer: draft.includes("if (paused) {\n            return;\n        }") || draft.includes("if (paused) {\r\n            return;\r\n        }"),
};

const result = {
  status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
  contract: "DraftRuntimeStabilizationDiagnostics",
  contractVersion: "MDS-5B.7B-R2-1.0.0",
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (result.status !== "PASS") process.exitCode = 1;
