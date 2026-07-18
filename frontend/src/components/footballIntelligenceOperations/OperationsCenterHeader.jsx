function StatusLabel({ label, value, tone }) {
  return (
    <div className={`fio-status-label fio-status-label--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function OperationsCenterHeader() {
  return (
    <header className="fio-header">
      <div className="fio-header__identity">
        <p className="fio-header__eyebrow">Football Operations</p>
        <h1>Football Intelligence Operations Center</h1>
        <p className="fio-header__subtitle">Internal Evaluation Build</p>
      </div>

      <div className="fio-header__statuses" aria-label="Operating status">
        <StatusLabel label="Model Status" value="Provisional" tone="warning" />
        <StatusLabel label="Registry Status" value="Isolated" tone="neutral" />
        <StatusLabel label="Environment" value="Development" tone="success" />
      </div>
    </header>
  );
}
