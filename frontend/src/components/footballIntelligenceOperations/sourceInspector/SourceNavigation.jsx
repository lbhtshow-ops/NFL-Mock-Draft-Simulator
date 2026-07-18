import {
  SOURCE_DEFINITIONS,
  formatConfidence,
} from "./sourceInspectorFormatters.js";

export default function SourceNavigation({ evaluation, selectedSourceKey, onSelectSource }) {
  return (
    <nav className="fio-source-navigation" aria-label="Intelligence sources">
      {SOURCE_DEFINITIONS.map(({ key, label, coverageKey }) => {
        const standardized = evaluation.intelligence?.[key];
        const coverageState = evaluation.coverage?.[coverageKey] || "UNAVAILABLE";
        const selected = selectedSourceKey === key;
        return (
          <button
            type="button"
            key={key}
            className={`fio-source-control${selected ? " fio-source-control--selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onSelectSource(key)}
          >
            <strong>{label}</strong>
            <span className={`fio-source-coverage fio-source-coverage--${coverageState.toLowerCase()}`}>{coverageState}</span>
            <span>{standardized?.available ? "Available" : "Unavailable"}</span>
            <span>Confidence: {formatConfidence(standardized?.confidence)}</span>
          </button>
        );
      })}
    </nav>
  );
}
