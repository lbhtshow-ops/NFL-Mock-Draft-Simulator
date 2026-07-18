import OverallGradeDisplay from "./OverallGradeDisplay.jsx";
import EvaluationProjectionGrid from "./EvaluationProjectionGrid.jsx";
import EvaluationHighlights from "./EvaluationHighlights.jsx";

function ValidationSummary({ validation }) {
  return (
    <dl className="fio-summary-validation">
      <div>
        <dt>Contract Validation</dt>
        <dd className={validation?.valid ? "fio-summary-status--success" : "fio-summary-status--danger"}>
          {validation?.valid ? "Valid" : "Invalid"}
        </dd>
      </div>
      <div><dt>Errors</dt><dd>{validation?.errors?.length || 0}</dd></div>
      <div><dt>Warnings</dt><dd>{validation?.warnings?.length || 0}</dd></div>
    </dl>
  );
}

function Identity({ prospect }) {
  return (
    <div className="fio-summary-identity">
      <div>
        <span>Quarterback Prospect Evaluation</span>
        <h3>{prospect?.name || "Selected Prospect"}</h3>
        <p>{[prospect?.position, prospect?.school].filter(Boolean).join(" · ") || "Identity unavailable"}</p>
      </div>
      {prospect?.id && <code title={prospect.id}>{prospect.id}</code>}
    </div>
  );
}

function StatePanel({ title, prospect, children, evaluation }) {
  return (
    <section
      className="fio-panel fio-panel--evaluation"
      aria-labelledby="fio-executive-summary-title"
      aria-live="polite"
    >
      <div className="fio-summary-heading">
        <div>
          <h2 id="fio-executive-summary-title">{title}</h2>
          <p>Quarterback Prospect Evaluation</p>
        </div>
      </div>
      <Identity prospect={prospect} />
      <div className="fio-summary-state-message">{children}</div>
      {evaluation && <ValidationSummary validation={evaluation.validation} />}
    </section>
  );
}

export default function ExecutiveEvaluationSummary({
  selectedProspect,
  evaluation,
  isEvaluating,
}) {
  const prospect = evaluation?.prospect || selectedProspect;

  if (isEvaluating) {
    return (
      <StatePanel title="Evaluation Workspace" prospect={prospect}>
        <p>Preparing football intelligence…</p>
      </StatePanel>
    );
  }

  if (!evaluation) {
    return (
      <StatePanel title="Evaluation Workspace" prospect={prospect}>
        <p>No evaluation has been run.</p>
        <p>Select a prospect and run an evaluation to view the executive summary.</p>
      </StatePanel>
    );
  }

  if (!evaluation.success) {
    return (
      <StatePanel title="Evaluation Failed" prospect={prospect} evaluation={evaluation}>
        <p role="alert">{evaluation.error?.message || "Evaluation failed."}</p>
      </StatePanel>
    );
  }

  if (!evaluation.result?.available || typeof evaluation.result?.overallGrade !== "number") {
    return (
      <StatePanel title="Evaluation Unavailable" prospect={prospect} evaluation={evaluation}>
        <p>Readiness: {evaluation.readiness?.status || "NOT READY"}</p>
        <p>
          Missing required evidence: {evaluation.readiness?.missingRequirements?.join(", ") || "None reported"}
        </p>
        <p>
          Missing optional evidence: {evaluation.readiness?.missingOptional?.join(", ") || "None reported"}
        </p>
      </StatePanel>
    );
  }

  const { result } = evaluation;

  return (
    <section
      className="fio-panel fio-panel--evaluation fio-executive-summary"
      aria-labelledby="fio-executive-summary-title"
      aria-live="polite"
    >
      <div className="fio-summary-heading">
        <div>
          <h2 id="fio-executive-summary-title">Executive Evaluation Summary</h2>
          <p>Quarterback Prospect Evaluation</p>
        </div>
        <span className="fio-summary-provisional">
          <strong>Provisional Model</strong>
          QB v1 has not completed historical calibration.
        </span>
      </div>

      <Identity prospect={prospect} />
      <OverallGradeDisplay result={result} readiness={evaluation.readiness} />
      <EvaluationProjectionGrid conclusions={result.conclusions} />
      <EvaluationHighlights explanation={result.explanation} conclusions={result.conclusions} />
      <ValidationSummary validation={evaluation.validation} />
    </section>
  );
}
