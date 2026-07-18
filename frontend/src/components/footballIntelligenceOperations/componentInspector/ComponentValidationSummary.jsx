import { formatComponentLabel } from "../componentBreakdown/componentBreakdownFormatters.js";

function ValidationList({ title, entries }) {
  return (
    <section>
      <h4>{title}</h4>
      {!entries.length ? <p>None reported.</p> : <ul className="fio-inspector-validation-list">{entries.map((entry, index) => (
        <li key={`${entry?.code || title}-${index}`}>
          <strong>{formatComponentLabel(entry?.code)}</strong>
          <code>{entry?.path || "Path not reported"}</code>
          <span>{entry?.message || "Message not reported"}</span>
        </li>
      ))}</ul>}
    </section>
  );
}

export default function ComponentValidationSummary({ component }) {
  const validation = component?.validation;
  const errors = Array.isArray(validation?.errors) ? validation.errors : [];
  const warnings = Array.isArray(validation?.warnings) ? validation.warnings : [];
  const missingEvidence = Array.isArray(component?.missingEvidence) ? component.missingEvidence : [];

  return (
    <section className="fio-inspector-section">
      <h3>Validation and Missing Evidence</h3>
      {!validation ? <p>No local validation metadata reported.</p> : (
        <dl className="fio-inspector-validation-summary">
          <div><dt>Status</dt><dd>{validation.valid ? "Valid" : "Invalid"}</dd></div>
          <div><dt>Error Count</dt><dd>{errors.length}</dd></div>
          <div><dt>Warning Count</dt><dd>{warnings.length}</dd></div>
        </dl>
      )}
      {validation && <div className="fio-inspector-validation-columns"><ValidationList title="Errors" entries={errors} /><ValidationList title="Warnings" entries={warnings} /></div>}
      <section className="fio-inspector-missing">
        <h4>Missing Evidence Paths</h4>
        {!missingEvidence.length ? <p>None reported.</p> : <ul>{missingEvidence.map((path) => <li key={path}><code>{path}</code></li>)}</ul>}
      </section>
    </section>
  );
}
