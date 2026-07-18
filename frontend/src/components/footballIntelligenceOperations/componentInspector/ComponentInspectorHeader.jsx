import {
  formatComponentConfidence,
  formatComponentLabel,
  formatComponentScore,
} from "../componentBreakdown/componentBreakdownFormatters.js";

function HeaderMetric({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

export default function ComponentInspectorHeader({ component, componentKey, status }) {
  return (
    <header className="fio-inspector-header">
      <div className="fio-inspector-heading">
        <div>
          <h2 id="fio-component-inspector-title">Component Inspector</h2>
          <h3>{formatComponentLabel(component?.key || componentKey)}</h3>
          <code>{component?.key || componentKey}</code>
        </div>
        <strong className="fio-inspector-score" aria-label="Component score">
          {formatComponentScore(component?.score)}
        </strong>
      </div>
      <dl className="fio-inspector-header-meta">
        <HeaderMetric label="Aggregation Status" value={status} />
        <HeaderMetric label="Confidence" value={formatComponentConfidence(component?.confidence)} />
        <HeaderMetric label="Evidence Level" value={formatComponentLabel(component?.evidenceLevel)} />
        <HeaderMetric label="Availability" value={component?.available ? "Available" : "Unavailable"} />
      </dl>
    </header>
  );
}
