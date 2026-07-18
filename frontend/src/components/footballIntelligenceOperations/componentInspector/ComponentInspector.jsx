import { getComponentAggregationState } from "../componentBreakdown/componentBreakdownFormatters.js";
import ComponentInspectorHeader from "./ComponentInspectorHeader.jsx";
import ComponentMetadataPanel from "./ComponentMetadataPanel.jsx";
import ComponentExplanationPanel from "./ComponentExplanationPanel.jsx";
import ComponentEvidenceSummary from "./ComponentEvidenceSummary.jsx";
import ComponentValidationSummary from "./ComponentValidationSummary.jsx";

function InspectorState({ children }) {
  return <p className="fio-component-state-message">{children}</p>;
}

function InspectorShell({ children }) {
  return (
    <section className="fio-panel fio-component-inspector">
      <h2>Component Inspector</h2>
      <InspectorState>{children}</InspectorState>
    </section>
  );
}

export default function ComponentInspector({ evaluation, isEvaluating, componentKey }) {
  const result = evaluation?.result;
  const component = result?.components?.[componentKey];

  if (isEvaluating) return <InspectorShell>Preparing component inspection...</InspectorShell>;
  if (!evaluation) return <InspectorShell>Run an evaluation to inspect a component.</InspectorShell>;
  if (!evaluation.success) return <InspectorShell>Component inspection unavailable because the evaluation failed.</InspectorShell>;
  if (!component) return <InspectorShell>No authoritative result is available for this component.</InspectorShell>;

  const aggregationState = getComponentAggregationState({
    key: componentKey,
    component,
    aggregation: result.aggregation,
    modelAvailable: result.available,
  });
  const explanation = result.explanation?.componentExplanations?.[componentKey];

  return (
    <section className="fio-panel fio-component-inspector" aria-labelledby="fio-component-inspector-title">
      <ComponentInspectorHeader component={component} componentKey={componentKey} status={aggregationState.status} />
      <div className="fio-inspector-grid">
        <ComponentMetadataPanel component={component} aggregation={result.aggregation} status={aggregationState.status} exclusion={aggregationState.exclusion} />
        <ComponentExplanationPanel explanation={explanation} />
        <ComponentEvidenceSummary component={component} />
        <ComponentValidationSummary component={component} />
      </div>
    </section>
  );
}
