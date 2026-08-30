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
  timelineHorizontalAutoCenterPresent:
    timelineEffect.includes("timeline.scrollTo({ left: targetLeft") &&
    timelineEffect.includes("currentCard.offsetLeft") &&
    timelineEffect.includes("timeline.clientWidth"),
  timelineAutoCenterDoesNotUseScrollIntoView:
    timelineEffectStart >= 0 && !timelineEffect.includes("scrollIntoView"),
  prospectIntelJumpStillPreserved:
    component.includes('prospectWorkspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })'),
  userControlledTimelineDetectionPresent:
    component.includes("userControlledTeams.includes(pick.team.id)"),
  userControlledTeamClassApplied:
    component.includes('className={isUserControlled ? "next-timeline-user-team" : undefined}'),
  userControlledTeamHighlightStyled:
    css.includes(".next-timeline-pick .next-timeline-user-team") &&
    css.includes("color: var(--next-gold)"),
  desktopBigBoardRemainsBounded:
    css.includes("height: clamp(500px, 58vh, 680px)") &&
    css.includes("max-height: 680px") &&
    css.includes("overflow-y: auto"),
  bigBoardAddsProspectRows:
    css.includes("min-height: 500px") && css.includes("max-height: 680px"),
  timelineHistoryPreserved:
    component.includes("const timelinePicks = picks;") &&
    component.includes("timelinePicks.map((pick) =>"),
  manualDraftButtonPreserved:
    component.includes("onSelectPlayer(player);") && component.includes('type="button"'),
};

const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
const result = {
  status,
  contract: "FinalWorkspacePolishDiagnostics",
  contractVersion: "MDS-5B.7B-R3-1.0.0",
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (status !== "PASS") process.exit(1);
