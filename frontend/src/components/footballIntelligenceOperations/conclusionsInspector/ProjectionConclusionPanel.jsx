import {
  MAX_CONCLUSION_ITEMS,
  formatConclusionLabel,
  formatSafeScalar,
  getSafeObjectFields,
  limitItems,
} from "./conclusionsInspectorFormatters.js";

const FIELDS = [
  ["archetype", "Archetype"],
  ["readiness", "Readiness"],
  ["ceiling", "Ceiling"],
  ["floor", "Floor"],
  ["riskProfile", "Risk Profile"],
  ["translationRisk", "Translation Risk"],
  ["roleProjection", "Role Projection"],
];

function ConclusionValue({ value }) {
  if (Array.isArray(value)) {
    const { entries, remaining } = limitItems(value, MAX_CONCLUSION_ITEMS);
    return <div>{!entries.length ? <p>None reported.</p> : <ul>{entries.map((entry, index) => <li key={index}>{formatSafeScalar(entry)}</li>)}</ul>}{remaining > 0 && <p>{remaining} additional item(s) not displayed.</p>}</div>;
  }
  if (value && typeof value === "object") {
    const fields = getSafeObjectFields(value);
    return fields.length ? <dl>{fields.map((field) => <div key={field.key}><dt>{formatConclusionLabel(field.key)}</dt><dd>{field.value}</dd></div>)}</dl> : <p>Structured Detail Available</p>;
  }
  return <p>{value == null ? "Not Reported" : formatSafeScalar(value)}</p>;
}

export default function ProjectionConclusionPanel({ conclusions }) {
  return (
    <section className="fio-conclusion-section">
      <h3>Projection Conclusions</h3>
      <div className="fio-projection-conclusions">
        {FIELDS.map(([key, label]) => <section key={key}><h4>{label}</h4><ConclusionValue value={conclusions?.[key]} /></section>)}
      </div>
    </section>
  );
}
