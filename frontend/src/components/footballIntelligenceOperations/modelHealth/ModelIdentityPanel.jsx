import {
  formatHealthLabel,
  formatReportedValue,
} from "./modelHealthFormatters.js";

function Row({ label, value, code = false }) {
  return <div><dt>{label}</dt><dd>{code ? <code>{value}</code> : value}</dd></div>;
}

export default function ModelIdentityPanel({ result }) {
  return (
    <section className="fio-health-section">
      <h3>Model Identity</h3>
      <dl className="fio-health-list">
        <Row label="Model Name" value={formatReportedValue(result?.model)} />
        <Row label="Position" value={formatReportedValue(result?.position)} />
        <Row label="Model Version" value={formatReportedValue(result?.versions?.model)} code />
        <Row label="Weight Version" value={formatReportedValue(result?.versions?.weights)} code />
        <Row label="Contract Version" value={formatReportedValue(result?.versions?.contract)} code />
        <Row label="Evaluation Domain" value={formatReportedValue(result?.domain)} />
        <Row label="Result Contract" value={formatReportedValue(result?.contract)} />
        <Row label="Result Data State" value={formatHealthLabel(result?.dataState)} />
        <Row label="Evidence Level" value={formatHealthLabel(result?.evidenceLevel)} />
      </dl>
    </section>
  );
}
