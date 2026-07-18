import {
  formatConfidence,
  formatScore,
  formatSourceLabel,
  formatVersion,
  formatYesNo,
} from "./sourceInspectorFormatters.js";

function Row({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

export default function SourceOverview({ standardized, adapted }) {
  const versions = standardized?.versions;
  return (
    <section className="fio-source-section">
      <h3>Source Overview</h3>
      <dl className="fio-source-metadata">
        <Row label="Domain" value={formatSourceLabel(standardized?.domain)} />
        <Row label="Available" value={formatYesNo(standardized?.available)} />
        <Row label="Score" value={formatScore(standardized?.score)} />
        <Row label="Confidence" value={formatConfidence(standardized?.confidence)} />
        <Row label="Evidence Level" value={formatSourceLabel(standardized?.evidenceLevel)} />
        <Row label="Data State" value={formatSourceLabel(standardized?.dataState)} />
        <Row label="Value Type" value={formatSourceLabel(standardized?.value?.type)} />
        <Row label="Framework Version" value={formatVersion(versions?.framework)} />
        <Row label="Model Version" value={formatVersion(versions?.model)} />
        <Row label="Data Version" value={formatVersion(versions?.data)} />
        <Row label="Last Updated" value={formatVersion(standardized?.lastUpdated)} />
        <Row label="Source Count" value={Array.isArray(standardized?.sources) ? standardized.sources.length : 0} />
        <Row label="Missing Evidence Count" value={Array.isArray(standardized?.missingEvidence) ? standardized.missingEvidence.length : 0} />
        <Row label="Adapted Domain" value={formatSourceLabel(adapted?.domain)} />
        <Row label="Adapted Valid Shape" value={formatYesNo(adapted?.validShape)} />
      </dl>
    </section>
  );
}
