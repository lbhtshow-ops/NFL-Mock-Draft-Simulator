import {
  formatComponentLabel,
  formatComponentWeight,
} from "../componentBreakdown/componentBreakdownFormatters.js";
import { formatBoolean } from "./componentInspectorFormatters.js";

function Row({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

export default function ComponentMetadataPanel({ component, aggregation, status, exclusion }) {
  const contributors = component?.provenance?.contributors;
  return (
    <section className="fio-inspector-section">
      <h3>Component Metadata</h3>
      <dl className="fio-inspector-metadata">
        <Row label="Required" value={formatBoolean(component?.required)} />
        <Row label="Critical" value={formatBoolean(component?.critical)} />
        <Row label="Data State" value={formatComponentLabel(component?.dataState)} />
        <Row label="Requested Weight" value={formatComponentWeight(aggregation?.requestedWeights?.[component?.key])} />
        <Row label="Applied Weight" value={formatComponentWeight(aggregation?.appliedWeights?.[component?.key])} />
        <Row label="Included or Excluded" value={status} />
        <Row label="Exclusion Reason" value={exclusion?.reason ? formatComponentLabel(exclusion.reason) : "Not Reported"} />
        <Row label="Missing-evidence Count" value={Array.isArray(component?.missingEvidence) ? component.missingEvidence.length : 0} />
        <Row label="Contributor Count" value={Array.isArray(contributors) ? contributors.length : 0} />
        <Row label="Local Validation Status" value={component?.validation ? (component.validation.valid ? "Valid" : "Invalid") : "Not Reported"} />
      </dl>
      {exclusion && (
        <div className="fio-inspector-exclusion">
          <h4>Exclusion Record</h4>
          <dl>
            <Row label="Reason" value={formatComponentLabel(exclusion.reason)} />
            {exclusion.code != null && <Row label="Code" value={formatComponentLabel(exclusion.code)} />}
            {exclusion.requestedWeight != null && <Row label="Requested Weight" value={formatComponentWeight(exclusion.requestedWeight)} />}
            {exclusion.appliedWeight != null && <Row label="Applied Weight" value={formatComponentWeight(exclusion.appliedWeight)} />}
          </dl>
        </div>
      )}
    </section>
  );
}
