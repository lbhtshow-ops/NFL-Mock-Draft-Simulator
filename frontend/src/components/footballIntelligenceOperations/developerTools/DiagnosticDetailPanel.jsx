export default function DiagnosticDetailPanel({ diagnosticState }) {
  const state = diagnosticState || { status: "IDLE", suites: [], total: 223, passedCount: 0, failedCount: 0, error: null };
  const completed = state.status === "PASSED" || state.status === "FAILED";

  return (
    <section className="fio-developer-section fio-developer-diagnostics">
      <div className="fio-developer-section-heading">
        <h3>Latest Permanent Diagnostic Details</h3>
        <strong className={`fio-developer-diagnostic-status fio-developer-diagnostic-status--${String(state.status).toLowerCase()}`}>{state.status}</strong>
      </div>
      {state.status === "IDLE" && <p>{state.total} permanent cases available. No diagnostic result has been reported.</p>}
      {state.status === "RUNNING" && <p>Permanent diagnostics are running from Model Health.</p>}
      {completed && (
        <dl className="fio-developer-diagnostic-totals">
          <div><dt>Passed</dt><dd>{state.passedCount}</dd></div>
          <div><dt>Total</dt><dd>{state.total}</dd></div>
          <div><dt>Failed</dt><dd>{state.failedCount}</dd></div>
        </dl>
      )}
      {state.status === "FAILED" && state.error && (
        <p className="fio-developer-safe-error"><strong>{state.error.code}</strong><span>{state.error.message}</span></p>
      )}
      {completed && state.suites?.length > 0 && (
        <ul className="fio-developer-suite-list">
          {state.suites.map((suite) => (
            <li key={suite.key}>
              <div><strong>{suite.label}</strong><span>{suite.passedCount}/{suite.total} passed · {suite.failedCount} failed</span></div>
              {suite.failedCaseIds?.length > 0 && <ul>{suite.failedCaseIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul>}
            </li>
          ))}
        </ul>
      )}
      <p className="fio-developer-diagnostic-note">Run or re-run permanent diagnostics from Model Health.</p>
    </section>
  );
}
