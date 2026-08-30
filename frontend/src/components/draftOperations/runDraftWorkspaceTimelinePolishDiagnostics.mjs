import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(here, "DraftOperationsCenter.jsx");
const cssPath = path.resolve(here, "../../styles/draft-operations-next.css");
const component = fs.readFileSync(componentPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

const checks = {
  fullTimelineUsesAllPicks: component.includes("const timelinePicks = picks;"),
  legacyTimelineSliceRemoved: !component.includes("visibleTimeline"),
  currentPickAutoScrollPresent: component.includes("scrollIntoView") && component.includes("data-timeline-pick-id"),
  timelineWheelScrollPresent: component.includes("handleTimelineWheel") && component.includes("onWheel={handleTimelineWheel}"),
  completedPickPlayerVisible: component.includes('className="next-timeline-player"') && component.includes("playerSchool"),
  searchClearControlPresent: component.includes('className="next-search-clear"') && component.includes('onClick={() => onSearchChange("")}'),
  searchClearIsConditional: component.includes("{searchQuery ? ("),
  desktopBigBoardUsesAvailableHeight: css.includes(".next-big-board .next-board-scroll") && css.includes("flex: 1 1 auto;") && css.includes("height: auto;"),
  stickyTableHeaderPreserved: css.includes(".next-board-table thead { position: sticky;"),
  mobileTimelineSnapPreserved: css.includes("scroll-snap-type: x proximity"),
  touchTimelineSupportPresent: css.includes("touch-action: pan-x pan-y"),
};

const result = {
  status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
  contract: "DraftWorkspaceTimelinePolishDiagnostics",
  contractVersion: "MDS-5B.7B-R1-1.0.1",
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (result.status !== "PASS") process.exitCode = 1;
