import {
  formatComponentConfidence,
  formatComponentLabel,
  formatComponentScore,
  formatComponentWeight,
} from "./componentBreakdownFormatters.js";

function MetadataRow({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function ComponentSummaryCard({
  label,
  component,
  requestedWeight,
  appliedWeight,
  aggregationStatus,
  exclusionReason,
  selected,
  onSelect,
}) {
  const statusTone = aggregationStatus.toLowerCase();

  return (
    <button
      type="button"
      className={`fio-component-card fio-component-card--${statusTone}${selected ? " fio-component-card--selected" : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <header>
        <div>
          <h3>{label}</h3>
          <span className={`fio-component-status fio-component-status--${statusTone}`}>
            {aggregationStatus}
          </span>
        </div>
        <strong className="fio-component-score" aria-label={`${label} score`}>
          {formatComponentScore(component?.score)}
        </strong>
      </header>

      <dl className="fio-component-primary-meta">
        <MetadataRow
          label="Confidence"
          value={formatComponentConfidence(component?.confidence)}
        />
        <MetadataRow
          label="Evidence Level"
          value={formatComponentLabel(component?.evidenceLevel)}
        />
        <MetadataRow
          label="Availability"
          value={component?.available ? "Available" : "Unavailable"}
        />
      </dl>

      <dl className="fio-component-secondary-meta">
        <MetadataRow label="Required" value={component?.required ? "Yes" : "No"} />
        <MetadataRow label="Critical" value={component?.critical ? "Yes" : "No"} />
        <MetadataRow label="Requested Weight" value={formatComponentWeight(requestedWeight)} />
        <MetadataRow label="Applied Weight" value={formatComponentWeight(appliedWeight)} />
        <MetadataRow
          label="Missing Evidence"
          value={Array.isArray(component?.missingEvidence) ? component.missingEvidence.length : 0}
        />
      </dl>

      {aggregationStatus === "EXCLUDED" && (
        <p className="fio-component-exclusion">
          <span>Exclusion Reason</span>
          <strong>{formatComponentLabel(exclusionReason)}</strong>
        </p>
      )}
    </button>
  );
}
