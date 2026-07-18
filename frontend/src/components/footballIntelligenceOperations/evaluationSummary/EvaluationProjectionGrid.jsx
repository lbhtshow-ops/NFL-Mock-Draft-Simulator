import { formatReadableLabel } from "./evaluationSummaryFormatters.js";

function StructuredValue({ value }) {
  if (typeof value === "string") return formatReadableLabel(value);
  if (["number", "boolean"].includes(typeof value)) return String(value);

  if (Array.isArray(value)) {
    if (!value.length) return "Not Established";
    return (
      <ul className="fio-summary-compact-list">
        {value.slice(0, 4).map((entry, index) => (
          <li key={index}>
            {["string", "number", "boolean"].includes(typeof entry)
              ? formatReadableLabel(String(entry))
              : "Structured Result Available"}
          </li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === "object") {
    const safeEntries = Object.entries(value).filter(([, entry]) =>
      ["string", "number", "boolean"].includes(typeof entry)
    );
    const factorEntries = Object.entries(value).filter(
      ([, entry]) => Array.isArray(entry) && entry.every((item) => typeof item === "string")
    );

    if (!safeEntries.length && !factorEntries.length) {
      return "Structured Result Available";
    }

    return (
      <span className="fio-summary-structured-value">
        {safeEntries.map(([key, entry]) => (
          <span key={key}>
            {formatReadableLabel(key)}: {formatReadableLabel(String(entry))}
          </span>
        ))}
        {factorEntries.map(([key, entries]) => (
          <span key={key}>
            {formatReadableLabel(key)}: {entries.map((entry) => formatReadableLabel(entry)).join(", ")}
          </span>
        ))}
      </span>
    );
  }

  return "Not Established";
}

const PROJECTION_FIELDS = [
  ["archetype", "Archetype"],
  ["readiness", "Readiness"],
  ["ceiling", "Ceiling"],
  ["floor", "Floor"],
  ["riskProfile", "Risk Profile"],
  ["translationRisk", "Translation Risk"],
  ["roleProjection", "Role Projection"],
];

export default function EvaluationProjectionGrid({ conclusions = {} }) {
  return (
    <section className="fio-summary-section" aria-labelledby="fio-projection-title">
      <h3 id="fio-projection-title">Projection Profile</h3>
      <dl className="fio-summary-projection-grid">
        {PROJECTION_FIELDS.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd><StructuredValue value={conclusions[key]} /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
