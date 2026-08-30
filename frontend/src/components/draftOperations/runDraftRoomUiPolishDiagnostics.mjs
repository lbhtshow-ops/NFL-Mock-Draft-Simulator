import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendSrc = path.resolve(here, "../..");
const componentPath = path.join(here, "DraftOperationsCenter.jsx");
const cssPath = path.join(frontendSrc, "styles", "draft-operations-next.css");

const component = fs.readFileSync(componentPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

const timelineEffectStart = component.indexOf("const timeline = timelineRef.current;");
const timelineEffectEnd = component.indexOf("const handleTimelineWheel", timelineEffectStart);
const timelineEffect = component.slice(timelineEffectStart, timelineEffectEnd);

const checks = {
  finalBigBoardHeightApplied:
    css.includes("height: clamp(610px, calc(58vh + 110px), 790px)") &&
    css.includes("min-height: 610px") &&
    css.includes("max-height: 790px"),
  bigBoardStillInternallyScrollable:
    css.includes(".next-big-board .next-board-scroll") && css.includes("overflow-y: auto"),
  stickyHeaderPreserved:
    css.includes(".next-board-table thead { position: sticky; top: 0;"),
  timelineTypographyRaised:
    css.includes(".next-timeline-pick strong { font-size: .89rem; }") &&
    css.includes(".next-timeline-pick em { font-size: .64rem; }"),
  bigBoardTypographyRaised:
    css.includes(".next-board-table th { font-size: .78rem;") &&
    css.includes(".next-board-table .player-cell span { font-size: .82rem; }"),
  warRoomTypographyRaised:
    css.includes(".next-war-tabs button { font-size: .82rem; font-weight: 850; }") &&
    css.includes(".next-roster-player small { font-size: .71rem; }"),
  searchTypographyRaised:
    css.includes(".next-board-tools input,") &&
    css.includes(".next-search-clear { font-size: 1.5rem; }"),
  userControlledTeamHighlightPreserved:
    component.includes("userControlledTeams.includes(pick.team.id)") &&
    component.includes('next-timeline-user-team') &&
    css.includes(".next-timeline-pick .next-timeline-user-team"),
  timelineHorizontalAutoCenterPreserved:
    timelineEffect.includes("timeline.scrollTo({ left: targetLeft") &&
    timelineEffect.includes("currentCard.offsetLeft"),
  automaticTimelineDoesNotMoveBrowserVertically:
    timelineEffectStart >= 0 && !timelineEffect.includes("scrollIntoView"),
  explicitProspectIntelJumpPreserved:
    component.includes('prospectWorkspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })'),
};

const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
const result = {
  status,
  contract: "DraftRoomUiPolishDiagnostics",
  contractVersion: "MDS-5B.7C-1.0.0",
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (status !== "PASS") process.exit(1);
