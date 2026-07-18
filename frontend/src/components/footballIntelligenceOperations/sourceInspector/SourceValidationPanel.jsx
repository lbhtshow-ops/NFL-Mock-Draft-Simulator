import { formatSourceLabel } from "./sourceInspectorFormatters.js";

function ValidationGroup({ title, validation }) {
  const errors = Array.isArray(validation?.errors) ? validation.errors : [];
  const warnings = Array.isArray(validation?.warnings) ? validation.warnings : [];
  if (!validation) return <section><h4>{title}</h4><p>No validation metadata reported.</p></section>;
  return (
    <section>
      <h4>{title}</h4>
      <dl className="fio-source-validation-summary">
        <div><dt>Status</dt><dd>{validation.valid ? "Valid" : "Invalid"}</dd></div>
        <div><dt>Error Count</dt><dd>{errors.length}</dd></div>
        <div><dt>Warning Count</dt><dd>{warnings.length}</dd></div>
      </dl>
      {[['Errors', errors], ['Warnings', warnings]].map(([label, entries]) => (
        <section key={label}>
          <h5>{label}</h5>
          {!entries.length ? <p>None reported.</p> : <ul className="fio-source-validation-list">{entries.map((entry, index) => <li key={`${entry?.code || label}-${index}`}><strong>{formatSourceLabel(entry?.code)}</strong><code>{entry?.path || "Path not reported"}</code><span>{entry?.message || "Message not reported"}</span></li>)}</ul>}
        </section>
      ))}
    </section>
  );
}

export default function SourceValidationPanel({ standardized, adapted }) {
  return (
    <section className="fio-source-section fio-source-validation">
      <h3>Source Validation</h3>
      <div className="fio-source-validation-grid">
        <ValidationGroup title="Standardized Source Validation" validation={standardized?.validation} />
        <ValidationGroup title="Adapter Validation" validation={adapted?.validation} />
      </div>
    </section>
  );
}
