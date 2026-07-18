import {
  getComponentAggregationState,
  QUARTERBACK_COMPONENT_ORDER,
} from "../componentBreakdown/componentBreakdownFormatters.js";
import {
  formatComponentLabel,
  formatSafeValue,
} from "./aggregationInspectorFormatters.js";

const SAFE_EXCLUSION_FIELDS = [
  "reason",
  "requestedWeight",
  "appliedWeight",
  "missingEvidence",
  "required",
  "critical",
];

export default function AggregationExclusions({ aggregation, components, modelAvailable }) {
  const excluded = Array.isArray(aggregation.excludedComponents) ? aggregation.excludedComponents : [];
  const criticalMissing = Array.isArray(aggregation.criticalMissingComponents) ? aggregation.criticalMissingComponents : [];
  const blocked = QUARTERBACK_COMPONENT_ORDER.filter(([key]) => getComponentAggregationState({
    key,
    component: components?.[key],
    aggregation,
    modelAvailable,
  }).status === "BLOCKED").map(([key]) => key);

  return (
    <section className="fio-aggregation-section fio-aggregation-exclusions">
      <h3>Exclusions and Missing Components</h3>
      <section>
        <h4>Included Components</h4>
        {!aggregation.includedComponents?.length ? <p>None reported.</p> : <ul className="fio-code-list">{aggregation.includedComponents.map((key) => <li key={key}><code>{key}</code></li>)}</ul>}
      </section>
      <section>
        <h4>Excluded Components</h4>
        {!excluded.length ? <p>No components were excluded.</p> : <ul className="fio-aggregation-exclusion-list">{excluded.map((entry, index) => (
          <li key={`${entry?.key || "excluded"}-${index}`}>
            <h5>{formatComponentLabel(entry?.key)}</h5>
            <code>{entry?.key || "Key not reported"}</code>
            <dl>{SAFE_EXCLUSION_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(entry, field)).map((field) => <div key={field}><dt>{formatComponentLabel(field)}</dt><dd>{formatSafeValue(entry[field])}</dd></div>)}</dl>
          </li>
        ))}</ul>}
      </section>
      <section>
        <h4>Critical Missing Components</h4>
        {!criticalMissing.length ? <p>No critical components are missing.</p> : <ul className="fio-code-list">{criticalMissing.map((key) => <li key={key}><code>{key}</code></li>)}</ul>}
      </section>
      <section>
        <h4>Blocked Components</h4>
        {!blocked.length ? <p>No components are blocked.</p> : <ul className="fio-code-list">{blocked.map((key) => <li key={key}><code>{key}</code></li>)}</ul>}
      </section>
    </section>
  );
}
