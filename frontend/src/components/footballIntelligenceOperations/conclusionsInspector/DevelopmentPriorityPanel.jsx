import {
  MAX_EXPLANATION_ITEMS,
  formatConclusionLabel,
  formatSafeScalar,
  getSafeObjectFields,
  limitItems,
} from "./conclusionsInspectorFormatters.js";

export default function DevelopmentPriorityPanel({ priorities }) {
  const { entries, remaining } = limitItems(priorities, MAX_EXPLANATION_ITEMS);
  return (
    <section className="fio-conclusion-section">
      <h3>Development Priorities</h3>
      {!entries.length ? <p>No development priorities reported.</p> : <ol className="fio-development-priorities">{entries.map((priority, index) => {
        if (!priority || typeof priority !== "object" || Array.isArray(priority)) return <li key={index}>{formatSafeScalar(priority)}</li>;
        const fields = getSafeObjectFields(priority);
        return <li key={index}>{!fields.length ? <span>Structured Detail Available</span> : <dl>{fields.map((field) => <div key={field.key}><dt>{formatConclusionLabel(field.key)}</dt><dd>{field.value}</dd></div>)}</dl>}</li>;
      })}</ol>}
      {remaining > 0 && <p>{remaining} additional item(s) not displayed.</p>}
    </section>
  );
}
