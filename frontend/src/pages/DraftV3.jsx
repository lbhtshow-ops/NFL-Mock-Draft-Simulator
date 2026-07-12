import DraftSidebar from "../components/draftV3/Sidebar/DraftSidebar";
import DraftTracker from "../components/draftV3/Tracker/DraftTracker";
import DraftBoard from "../components/draftV3/Board/DraftBoard";
import WarRoom from "../components/draftV3/WarRoom/WarRoom";
import ProspectIntelligenceCenter from "../components/draftV3/Intelligence/ProspectIntelligenceCenter";
import useCpuDraft from "../hooks/draft/useCpuDraft";
import useDraftEngine from "../hooks/draft/useDraftEngine";
import useDraftSpeed from "../hooks/draft/useDraftSpeed";
import { evaluateDraftDecision } from "../engines/DraftDecisionEngine";
import "../styles/draft-room-v3.css";
import runPlayerEvaluationDiagnostics from "../engines/playerEvaluation/runPlayerEvaluationDiagnostics";
import { printPlayerContextDiagnostics } from "../engines/diagnostics/PlayerContextDiagnostics";
import { printProductionEngineDiagnostics } from "../engines/diagnostics/ProductionEngineDiagnostics";


export default function DraftV3() {
  const draft = useDraftEngine();
  const draftSpeed = useDraftSpeed("normal");
  
  useCpuDraft({
    currentPick: draft.currentPick,
    isUserPick: draft.isUserPick,
    availableProspects: draft.availableProspects,
    cpuDelay: draftSpeed.activeDraftSpeed.delay,
    onCpuPick: draft.handleCpuPick,
  });

if (typeof window !== "undefined" && !window.__LBHT_PLAYER_DIAGNOSTICS_RAN__) {
  window.__LBHT_PLAYER_DIAGNOSTICS_RAN__ = true;
  runPlayerEvaluationDiagnostics();
}

if (
  typeof window !== "undefined" &&
  !window.__LBHT_CONTEXT_DIAGNOSTICS_RAN__
) {
  window.__LBHT_CONTEXT_DIAGNOSTICS_RAN__ = true;
  printPlayerContextDiagnostics();
}

if (
  typeof window !== "undefined" &&
  !window.__LBHT_PRODUCTION_DIAGNOSTICS_RAN__
) {
  window.__LBHT_PRODUCTION_DIAGNOSTICS_RAN__ = true;
  printProductionEngineDiagnostics();
}

  return (
    <div className="draft_v3_page">
      <DraftTracker
  currentPick={draft.currentPick}
  draftHistory={draft.draftHistory}
  isUserPick={draft.isUserPick}
  onSelectProspect={draft.handleSelectProspect}
/>

      <main className="draft_v3_layout">
        <DraftSidebar
          queuedProspects={draft.queuedProspects}
          currentPick={draft.currentPick}
          draftHistory={draft.draftHistory}
          onUndoPick={draft.handleUndoPick}
          onCpuPick={draft.handleCpuPick}
          isUserPick={draft.isUserPick}
          draftSpeed={draftSpeed.draftSpeed}
          onDraftSpeedChange={draftSpeed.setDraftSpeed}
        />

        <DraftBoard
          prospects={draft.availableProspects}
          queuedProspects={draft.queuedProspects}
          selectedProspect={draft.selectedProspect}
          onSelectProspect={draft.handleSelectProspect}
          onToggleQueueProspect={draft.handleToggleQueueProspect}
          onDraftProspect={draft.handleDraftProspect}
          isUserPick={draft.isUserPick}
        />

        <WarRoom
          queuedProspects={draft.queuedProspects}
          onRemoveProspect={draft.handleToggleQueueProspect}
          currentPick={draft.currentPick}
        />
      </main>

      <ProspectIntelligenceCenter
        player={draft.selectedProspect}
        getProspectGrade={(prospect) => prospect?.displayGrade || "--"}
        getProspectTier={(prospect) => prospect?.displayTier || "--"}
        getProspectProjection={(prospect) => prospect?.displayProjection || "--"}
      />
    </div>
  );
}