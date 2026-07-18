import {
  getSafeObjectFields,
  MAX_INSPECTOR_ENTRIES,
  formatScalar,
} from "./componentInspectorFormatters.js";
import { formatComponentLabel } from "../componentBreakdown/componentBreakdownFormatters.js";

const SECTIONS = [
  ["scoreRationale", "Score Rationale"],
  ["supportingEvidence", "Supporting Evidence"],
  ["conflictingEvidence", "Conflicting Evidence"],
  ["missingEvidence", "Missing Evidence"],
  ["confidenceRationale", "Confidence Rationale"],
  ["developmentImplications", "Development Implications"],
];

function StructuredEntry({ entry }) {
  if (entry == null || typeof entry !== "object") return <span>{formatScalar(entry)}</span>;
  const fields = getSafeObjectFields(entry);
  if (!fields.length) return <span>Structured Detail Available</span>;
  return <dl className="fio-inspector-entry">{fields.map(({ key, value }) => <div key={key}><dt>{formatComponentLabel(key)}</dt><dd>{value}</dd></div>)}</dl>;
}

export default function ComponentExplanationPanel({ explanation }) {
  return (
    <section className="fio-inspector-section fio-inspector-explanation">
      <h3>Component Explanation</h3>
      <div className="fio-inspector-explanation-grid">
        {SECTIONS.map(([key, label]) => {
          const entries = Array.isArray(explanation?.[key]) ? explanation[key] : [];
          const visible = entries.slice(0, MAX_INSPECTOR_ENTRIES);
          return (
            <section key={key}>
              <h4>{label}</h4>
              {!visible.length ? <p>None reported.</p> : <ul>{visible.map((entry, index) => <li key={`${key}-${index}`}><StructuredEntry entry={entry} /></li>)}</ul>}
              {entries.length > visible.length && <p>{entries.length - visible.length} additional item(s) reported.</p>}
            </section>
          );
        })}
      </div>
    </section>
  );
}
