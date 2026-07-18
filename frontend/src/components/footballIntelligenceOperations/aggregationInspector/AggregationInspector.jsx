import AggregationSummary from "./AggregationSummary.jsx";
import AggregationContributionTable from "./AggregationContributionTable.jsx";
import AggregationExclusions from "./AggregationExclusions.jsx";
import AggregationValidationSummary from "./AggregationValidationSummary.jsx";

function InspectorState({ children }) {
  return (
    <section className="fio-panel fio-aggregation-inspector">
      <h2>Aggregation Inspector</h2>
      <p className="fio-component-state-message">{children}</p>
    </section>
  );
}

export default function AggregationInspector({ evaluation, isEvaluating }) {
  if (isEvaluating) return <InspectorState>Preparing aggregation results...</InspectorState>;
  if (!evaluation) return <InspectorState>Run an evaluation to inspect authoritative aggregation.</InspectorState>;
  if (!evaluation.success) return <InspectorState>Aggregation inspection unavailable because the evaluation failed.</InspectorState>;

  const result = evaluation.result;
  const aggregation = result?.aggregation;
  if (!aggregation || typeof aggregation !== "object") {
    return <InspectorState>No authoritative aggregation metadata is available.</InspectorState>;
  }

  return (
    <section className="fio-panel fio-aggregation-inspector" aria-labelledby="fio-aggregation-inspector-title">
      <header className="fio-aggregation-header">
        <h2 id="fio-aggregation-inspector-title">Aggregation Inspector</h2>
        <p>How authoritative component results were combined into the contract-owned overall grade.</p>
      </header>
      <AggregationSummary aggregation={aggregation} result={result} readiness={evaluation.readiness} />
      <AggregationContributionTable aggregation={aggregation} components={result.components} modelAvailable={result.available} />
      <div className="fio-aggregation-lower-grid">
        <AggregationExclusions aggregation={aggregation} components={result.components} modelAvailable={result.available} />
        <AggregationValidationSummary aggregation={aggregation} evaluationValidation={evaluation.validation} />
      </div>
    </section>
  );
}
