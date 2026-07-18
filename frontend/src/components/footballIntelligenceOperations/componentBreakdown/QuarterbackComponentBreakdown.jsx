import ComponentSummaryCard from "./ComponentSummaryCard.jsx";
import ComponentBreakdownLegend from "./ComponentBreakdownLegend.jsx";
import {
  getComponentAggregationState,
  QUARTERBACK_COMPONENT_ORDER,
} from "./componentBreakdownFormatters.js";

function StateMessage({ children }) {
  return <p className="fio-component-state-message">{children}</p>;
}

export default function QuarterbackComponentBreakdown({
  evaluation,
  isEvaluating,
  selectedComponentKey,
  onSelectComponent,
}) {
  const result = evaluation?.result;
  const components = result?.components;
  const hasComponents = components && Object.keys(components).length > 0;

  return (
    <section className="fio-panel fio-panel--details fio-component-breakdown" aria-labelledby="fio-component-breakdown-title">
      <div className="fio-component-breakdown__header">
        <div>
          <h2 id="fio-component-breakdown-title">Quarterback Component Breakdown</h2>
          <p>Where the authoritative overall grade came from.</p>
        </div>
        <ComponentBreakdownLegend />
      </div>

      {!evaluation && !isEvaluating && (
        <StateMessage>Run an evaluation to inspect the component structure.</StateMessage>
      )}
      {isEvaluating && <StateMessage>Preparing component results…</StateMessage>}
      {evaluation && !evaluation.success && (
        <StateMessage>Component breakdown unavailable because the evaluation failed.</StateMessage>
      )}
      {evaluation?.success && !hasComponents && (
        <StateMessage>No component results are available for this evaluation.</StateMessage>
      )}

      {evaluation?.success && hasComponents && (
        <div className="fio-component-grid">
          {QUARTERBACK_COMPONENT_ORDER.map(([key, label]) => {
            const component = components[key] || null;
            const state = getComponentAggregationState({
              key,
              component,
              aggregation: result.aggregation,
              modelAvailable: result.available,
            });

            return (
              <ComponentSummaryCard
                key={key}
                label={label}
                component={component}
                requestedWeight={result.aggregation?.requestedWeights?.[key]}
                appliedWeight={result.aggregation?.appliedWeights?.[key]}
                aggregationStatus={state.status}
                exclusionReason={state.exclusion?.reason || null}
                selected={selectedComponentKey === key}
                onSelect={() => onSelectComponent(key)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
