import {
  formatConfidence,
  formatReadableLabel,
  getProvisionalGradeDescriptor,
} from "./evaluationSummaryFormatters.js";

function StatusRow({ label, value, tone = "neutral" }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={`fio-summary-status fio-summary-status--${tone}`}>{value}</dd>
    </div>
  );
}

export default function OverallGradeDisplay({ result, readiness }) {
  const hasGrade = result?.available && typeof result?.overallGrade === "number";
  const grade = hasGrade ? result.overallGrade : "—";
  const descriptor = hasGrade
    ? getProvisionalGradeDescriptor(result.overallGrade)
    : null;
  const readinessStatus = readiness?.status || "NOT READY";

  return (
    <section className="fio-summary-overview" aria-labelledby="fio-overall-grade-title">
      <div className="fio-summary-grade">
        <span id="fio-overall-grade-title">Overall Grade</span>
        <strong>{grade}</strong>
        {descriptor && (
          <p>
            {descriptor}
            <small>Provisional projection descriptor</small>
          </p>
        )}
      </div>

      <dl className="fio-summary-status-grid">
        <StatusRow label="Model Confidence" value={formatConfidence(result?.confidence)} />
        <StatusRow
          label="Evidence Level"
          value={formatReadableLabel(result?.evidenceLevel, "—")}
        />
        <StatusRow
          label="Evaluation Readiness"
          value={formatReadableLabel(readinessStatus)}
          tone={readinessStatus === "READY" ? "success" : "warning"}
        />
        <StatusRow
          label="Result Availability"
          value={result?.available ? "Available" : "Unavailable"}
          tone={result?.available ? "success" : "warning"}
        />
        <StatusRow
          label="Data State"
          value={formatReadableLabel(result?.dataState)}
        />
      </dl>
    </section>
  );
}
