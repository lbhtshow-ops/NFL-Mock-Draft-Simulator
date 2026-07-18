import {
  getComponentAggregationState,
  QUARTERBACK_COMPONENT_ORDER,
} from "../componentBreakdown/componentBreakdownFormatters.js";
import {
  calculateWeightedContribution,
  formatComponentWeight,
  formatGrade,
} from "./aggregationInspectorFormatters.js";

export default function AggregationContributionTable({ aggregation, components, modelAvailable }) {
  return (
    <section className="fio-aggregation-section fio-aggregation-contributions">
      <h3>Component Contributions</h3>
      <div className="fio-aggregation-table-wrap">
        <table>
          <caption>Authoritative component scores and aggregation weights in fixed quarterback order.</caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Score</th>
              <th scope="col">Requested Weight</th>
              <th scope="col">Applied Weight</th>
              <th scope="col">Aggregation Status</th>
              <th scope="col">Weighted Contribution</th>
            </tr>
          </thead>
          <tbody>
            {QUARTERBACK_COMPONENT_ORDER.map(([key, label]) => {
              const component = components?.[key];
              const requestedWeight = aggregation.requestedWeights?.[key];
              const appliedWeight = aggregation.appliedWeights?.[key];
              const state = getComponentAggregationState({
                key,
                component,
                aggregation,
                modelAvailable,
              });
              const contribution = calculateWeightedContribution(component?.score, appliedWeight);
              return (
                <tr key={key}>
                  <th scope="row"><span>{label}</span><code>{key}</code></th>
                  <td data-label="Score">{formatGrade(component?.score)}</td>
                  <td data-label="Requested Weight">{formatComponentWeight(requestedWeight)}</td>
                  <td data-label="Applied Weight">{formatComponentWeight(appliedWeight)}</td>
                  <td data-label="Aggregation Status"><span className={`fio-aggregation-status fio-aggregation-status--${state.status.toLowerCase()}`}>{state.status}</span></td>
                  <td data-label="Weighted Contribution">{formatGrade(contribution)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>Weighted Contribution is a presentation-only multiplication of the authoritative component score and applied weight. Displayed contributions are not summed into an alternate grade.</p>
    </section>
  );
}
