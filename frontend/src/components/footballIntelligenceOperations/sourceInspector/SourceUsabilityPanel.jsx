import {
  formatConfidence,
  formatScore,
  formatSourceLabel,
  formatYesNo,
} from "./sourceInspectorFormatters.js";

function Row({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

export default function SourceUsabilityPanel({ adapted, coverageState, sourceKey }) {
  return (
    <section className="fio-source-section">
      <h3>Adapted Usability</h3>
      <dl className="fio-source-metadata">
        <Row label="Usable for Score" value={formatYesNo(adapted?.usability?.usableForScore)} />
        <Row label="Usable for Context" value={formatYesNo(adapted?.usability?.usableForContext)} />
        <Row label="Usability Reason" value={formatSourceLabel(adapted?.usability?.reason)} />
        <Row label="Coverage State" value={formatSourceLabel(coverageState)} />
        <Row label="Valid Shape" value={formatYesNo(adapted?.validShape)} />
        <Row label="Available" value={formatYesNo(adapted?.available)} />
        <Row label="Score" value={formatScore(adapted?.score)} />
        <Row label="Confidence" value={formatConfidence(adapted?.confidence)} />
        <Row label="Evidence Level" value={formatSourceLabel(adapted?.evidenceLevel)} />
        <Row label="Data State" value={formatSourceLabel(adapted?.dataState)} />
      </dl>
      {sourceKey === "schemeFit" && (
        <p className="fio-source-policy-note">
          Scheme Fit is contextual and does not directly increase the universal QB grade.
        </p>
      )}
    </section>
  );
}
