import {
  DIAGNOSTIC_SUITE_INVENTORY,
  DIAGNOSTIC_TOTAL,
} from "./modelHealthFormatters.js";

export default function DiagnosticSuiteSummary({ diagnosticState, onRunDiagnostics }) {
  const running = diagnosticState.status === "RUNNING";
  const completed = diagnosticState.status === "PASSED" || diagnosticState.status === "FAILED";
  const buttonLabel = running ? "Running Diagnostics..." : completed ? "Re-run Diagnostics" : "Run Permanent Diagnostics";

  return (
    <section className="fio-health-section fio-health-diagnostics">
      <h3>Permanent Diagnostics</h3>
      <div aria-live="polite" className="fio-health-diagnostic-status">
        {diagnosticState.status === "IDLE" && <p>{DIAGNOSTIC_TOTAL} permanent cases available.</p>}
        {running && <p>Permanent diagnostics are running.</p>}
        {diagnosticState.status === "PASSED" && <p><strong>{diagnosticState.passedCount} / {diagnosticState.total} Passing</strong></p>}
        {diagnosticState.status === "FAILED" && diagnosticState.error && <p className="fio-health-error"><strong>Diagnostics could not be completed.</strong><code>{diagnosticState.error.code}</code><span>{diagnosticState.error.message}</span></p>}
        {diagnosticState.status === "FAILED" && !diagnosticState.error && <p className="fio-health-error"><strong>{diagnosticState.failedCount} permanent case(s) failed.</strong><span>Review the failed case IDs reported below.</span></p>}
      </div>
      <ul className="fio-health-suite-list">
        {(completed ? diagnosticState.suites : DIAGNOSTIC_SUITE_INVENTORY).map((suite) => (
          <li key={suite.key}>
            <span>{suite.label}</span>
            <strong>{completed ? `${suite.passedCount}/${suite.total}` : `${suite.total} cases`}</strong>
            {completed && <small>{suite.failedCount === 0 ? "PASSED" : "FAILED"}</small>}
            {completed && suite.failedCaseIds?.length > 0 && <ul>{suite.failedCaseIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul>}
          </li>
        ))}
      </ul>
      <button type="button" className="fio-health-run" onClick={onRunDiagnostics} disabled={running}>{buttonLabel}</button>
    </section>
  );
}
