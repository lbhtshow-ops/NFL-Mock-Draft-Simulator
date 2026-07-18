import ProjectionConclusionPanel from "./ProjectionConclusionPanel.jsx";
import OverallExplanationPanel from "./OverallExplanationPanel.jsx";
import DevelopmentPriorityPanel from "./DevelopmentPriorityPanel.jsx";
import EvidenceLimitationsPanel from "./EvidenceLimitationsPanel.jsx";

function InspectorState({ children }) {
  return <section className="fio-panel fio-conclusions-inspector"><h2>Conclusions &amp; Explanation Inspector</h2><p className="fio-component-state-message">{children}</p></section>;
}

export default function ConclusionsInspector({ evaluation, isEvaluating }) {
  if (isEvaluating) return <InspectorState>Preparing model conclusions...</InspectorState>;
  if (!evaluation) return <InspectorState>Run an evaluation to inspect the complete model projection.</InspectorState>;
  if (!evaluation.success) return <InspectorState>Conclusions are unavailable because the evaluation failed.</InspectorState>;

  const result = evaluation.result;
  if (!result) return <InspectorState>No authoritative model result is available.</InspectorState>;
  return (
    <section className="fio-panel fio-conclusions-inspector" aria-labelledby="fio-conclusions-inspector-title">
      <header className="fio-conclusions-header"><h2 id="fio-conclusions-inspector-title">Conclusions &amp; Explanation Inspector</h2><p>The complete model-owned projection, explanation, and evidence limitations.</p></header>
      {!result.available && <p className="fio-conclusions-unavailable">No available overall grade was produced.</p>}
      <div className="fio-conclusions-primary-grid">
        <ProjectionConclusionPanel conclusions={result.conclusions} />
        <OverallExplanationPanel explanation={result.explanation} />
      </div>
      <div className="fio-conclusions-secondary-grid">
        <DevelopmentPriorityPanel priorities={result.conclusions?.developmentPriorities} />
        <EvidenceLimitationsPanel result={result} readiness={evaluation.readiness} />
      </div>
    </section>
  );
}
