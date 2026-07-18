import { formatComponentLabel } from "./aggregationInspectorFormatters.js";

function ValidationEntries({ title, entries }) {
  return (
    <section>
      <h4>{title}</h4>
      {!entries.length ? <p>None reported.</p> : <ul>{entries.map((entry, index) => (
        <li key={`${entry?.code || title}-${index}`}>
          <strong>{formatComponentLabel(entry?.code)}</strong>
          <code>{entry?.path || "Path not reported"}</code>
          <span>{entry?.message || "Message not reported"}</span>
        </li>
      ))}</ul>}
    </section>
  );
}

export default function AggregationValidationSummary({ aggregation, evaluationValidation }) {
  const localValidation = aggregation.validation;
  const relatedErrors = Array.isArray(evaluationValidation?.errors)
    ? evaluationValidation.errors.filter((entry) => entry?.path === "aggregation" || entry?.path?.startsWith("aggregation."))
    : [];
  const relatedWarnings = Array.isArray(evaluationValidation?.warnings)
    ? evaluationValidation.warnings.filter((entry) => entry?.path === "aggregation" || entry?.path?.startsWith("aggregation."))
    : [];
  const validation = localValidation || (relatedErrors.length || relatedWarnings.length ? {
    valid: relatedErrors.length === 0,
    errors: relatedErrors,
    warnings: relatedWarnings,
  } : null);

  return (
    <section className="fio-aggregation-section fio-aggregation-validation">
      <h3>Aggregation Validation</h3>
      {!validation ? <p>No local aggregation validation metadata reported.</p> : <>
        <dl>
          <div><dt>Status</dt><dd>{validation.valid ? "Valid" : "Invalid"}</dd></div>
          <div><dt>Error Count</dt><dd>{validation.errors?.length || 0}</dd></div>
          <div><dt>Warning Count</dt><dd>{validation.warnings?.length || 0}</dd></div>
        </dl>
        <div className="fio-aggregation-validation-lists">
          <ValidationEntries title="Errors" entries={validation.errors || []} />
          <ValidationEntries title="Warnings" entries={validation.warnings || []} />
        </div>
      </>}
    </section>
  );
}
