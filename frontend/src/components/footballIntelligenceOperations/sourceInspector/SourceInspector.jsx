import SourceNavigation from "./SourceNavigation.jsx";
import SourceOverview from "./SourceOverview.jsx";
import SourceUsabilityPanel from "./SourceUsabilityPanel.jsx";
import SourceEvidencePanel from "./SourceEvidencePanel.jsx";
import SourceValidationPanel from "./SourceValidationPanel.jsx";
import { SOURCE_DEFINITIONS } from "./sourceInspectorFormatters.js";

function InspectorState({ children }) {
  return <section className="fio-panel fio-source-inspector"><h2>Source Inspector</h2><p className="fio-component-state-message">{children}</p></section>;
}

export default function SourceInspector({ evaluation, isEvaluating, selectedSourceKey, onSelectSource }) {
  if (isEvaluating) return <InspectorState>Preparing intelligence sources...</InspectorState>;
  if (!evaluation) return <InspectorState>Run an evaluation to inspect intelligence sources.</InspectorState>;
  if (!evaluation.success) return <InspectorState>Source inspection unavailable because the evaluation failed.</InspectorState>;

  const definition = SOURCE_DEFINITIONS.find(({ key }) => key === selectedSourceKey);
  const standardized = evaluation.intelligence?.[selectedSourceKey];
  const adapted = evaluation.adaptedSources?.[selectedSourceKey];
  if (!definition || (!standardized && !adapted)) return <InspectorState>No authoritative source result is available for this domain.</InspectorState>;

  const coverageState = evaluation.coverage?.[definition.coverageKey];
  return (
    <section className="fio-panel fio-source-inspector" aria-labelledby="fio-source-inspector-title">
      <header className="fio-source-header"><h2 id="fio-source-inspector-title">Source Inspector</h2><p>What intelligence entered the evaluation and how the prepared source was adapted.</p></header>
      <SourceNavigation evaluation={evaluation} selectedSourceKey={selectedSourceKey} onSelectSource={onSelectSource} />
      <div className="fio-source-primary-grid">
        <SourceOverview standardized={standardized} adapted={adapted} />
        <SourceUsabilityPanel adapted={adapted} coverageState={coverageState} sourceKey={selectedSourceKey} />
      </div>
      <SourceEvidencePanel standardized={standardized} adapted={adapted} />
      <SourceValidationPanel standardized={standardized} adapted={adapted} />
    </section>
  );
}
