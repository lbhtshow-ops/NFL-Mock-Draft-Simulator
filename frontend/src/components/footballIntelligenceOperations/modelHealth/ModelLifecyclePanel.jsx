const LIFECYCLE = [
  ["Implementation", "COMPLETE"],
  ["Diagnostics", "COMPLETE"],
  ["Calibration", "IN PROGRESS"],
  ["Registry", "NOT STARTED"],
  ["PlayerEvaluationEngine", "NOT STARTED"],
  ["Production", "NOT APPROVED"],
];

export default function ModelLifecyclePanel() {
  return (
    <section className="fio-health-section">
      <h3>Lifecycle</h3>
      <dl className="fio-health-list">
        <div><dt>Model Status</dt><dd className="fio-health-tone--warning">Provisional</dd></div>
        <div><dt>Registry Status</dt><dd>Isolated</dd></div>
        <div><dt>Production Registration</dt><dd>Not Registered</dd></div>
        <div><dt>Historical Calibration</dt><dd className="fio-health-tone--warning">Incomplete</dd></div>
        <div><dt>Production Readiness</dt><dd className="fio-health-tone--danger">Not Approved</dd></div>
      </dl>
      <ol className="fio-health-lifecycle">
        {LIFECYCLE.map(([label, status]) => (
          <li key={label}>
            <span>{label}</span>
            <strong className={`fio-health-lifecycle--${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
