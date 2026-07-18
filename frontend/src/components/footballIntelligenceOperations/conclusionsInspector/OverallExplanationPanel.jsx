import {
  MAX_EXPLANATION_ITEMS,
  formatConclusionLabel,
  formatSafeScalar,
  getSafeObjectFields,
  limitItems,
} from "./conclusionsInspectorFormatters.js";

const SECTIONS = [
  ["strengths", "Strengths"],
  ["concerns", "Concerns"],
  ["contextualFactors", "Contextual Factors"],
];

function ExplanationEntry({ entry }) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return <span>{formatSafeScalar(entry)}</span>;
  const fields = getSafeObjectFields(entry);
  return fields.length ? <dl>{fields.map((field) => <div key={field.key}><dt>{formatConclusionLabel(field.key)}</dt><dd>{field.value}</dd></div>)}</dl> : <span>Structured Detail Available</span>;
}

export default function OverallExplanationPanel({ explanation }) {
  const componentKeys = explanation?.componentExplanations && typeof explanation.componentExplanations === "object"
    ? Object.keys(explanation.componentExplanations)
    : [];
  return (
    <section className="fio-conclusion-section">
      <h3>Overall Explanation</h3>
      {typeof explanation?.summary === "string" && explanation.summary.trim() && <p>{explanation.summary}</p>}
      <div className="fio-overall-explanation">
        {SECTIONS.map(([key, label]) => {
          const { entries, remaining } = limitItems(explanation?.[key], MAX_EXPLANATION_ITEMS);
          return <section key={key}><h4>{label}</h4>{!entries.length ? <p>None reported.</p> : <ul>{entries.map((entry, index) => <li key={`${key}-${index}`}><ExplanationEntry entry={entry} /></li>)}</ul>}{remaining > 0 && <p>{remaining} additional item(s) not displayed.</p>}</section>;
        })}
      </div>
      <section className="fio-component-explanation-inventory">
        <h4>Component Explanation Inventory</h4>
        <p><strong>{componentKeys.length}</strong> component explanation record(s) available.</p>
        {!componentKeys.length ? <p>None reported.</p> : <ul>{componentKeys.map((key) => <li key={key}><code>{key}</code></li>)}</ul>}
        <p>Detailed component explanations are available in the Component Inspector.</p>
      </section>
    </section>
  );
}
