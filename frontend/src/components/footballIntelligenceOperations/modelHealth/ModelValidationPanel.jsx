import { formatHealthLabel } from "./modelHealthFormatters.js";

function EntryList({ label, entries }) {
  return (
    <section>
      <h4>{label}</h4>
      {!entries.length ? <p>None reported.</p> : <ul className="fio-health-validation-entries">{entries.map((entry, index) => (
        <li key={`${entry?.code || label}-${index}`}>
          <strong>{formatHealthLabel(entry?.code)}</strong>
          <code>{entry?.path || "Path not reported"}</code>
          <span>{entry?.message || "Message not reported"}</span>
        </li>
      ))}</ul>}
    </section>
  );
}

export default function ModelValidationPanel({ evaluation, isEvaluating }) {
  if (isEvaluating) return <section className="fio-health-section"><h3>Evaluation Validation</h3><p>Validation pending.</p></section>;
  if (!evaluation) return <section className="fio-health-section"><h3>Evaluation Validation</h3><p>No evaluation validation available.</p></section>;
  if (!evaluation.success) return (
    <section className="fio-health-section">
      <h3>Evaluation Validation</h3>
      <p className="fio-health-error"><strong>{formatHealthLabel(evaluation.error?.code)}</strong><span>{evaluation.error?.message || "Evaluation failed."}</span></p>
    </section>
  );

  const validation = evaluation.validation;
  const errors = Array.isArray(validation?.errors) ? validation.errors : [];
  const warnings = Array.isArray(validation?.warnings) ? validation.warnings : [];
  return (
    <section className="fio-health-section">
      <h3>Evaluation Validation</h3>
      <dl className="fio-health-validation-summary">
        <div><dt>Status</dt><dd>{validation?.valid ? "Valid" : "Invalid"}</dd></div>
        <div><dt>Errors</dt><dd>{errors.length}</dd></div>
        <div><dt>Warnings</dt><dd>{warnings.length}</dd></div>
      </dl>
      <div className="fio-health-validation-groups">
        <EntryList label="Errors" entries={errors} />
        <EntryList label="Warnings" entries={warnings} />
      </div>
    </section>
  );
}
