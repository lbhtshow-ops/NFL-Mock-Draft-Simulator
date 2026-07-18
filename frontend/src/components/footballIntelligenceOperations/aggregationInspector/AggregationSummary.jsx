import {
  formatComponentLabel,
  formatComponentWeight,
  formatCount,
  formatGrade,
  formatYesNo,
} from "./aggregationInspectorFormatters.js";

function SummaryRow({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

export default function AggregationSummary({ aggregation, result, readiness }) {
  return (
    <div className="fio-aggregation-overview">
      <section className="fio-aggregation-section">
        <h3>Aggregation Summary</h3>
        <dl className="fio-aggregation-summary-grid">
          <SummaryRow label="Strategy" value={formatComponentLabel(aggregation.method)} />
          <SummaryRow label="Normalization Applied" value={formatYesNo(aggregation.normalizationApplied)} />
          <SummaryRow label="Requested Weight Total" value={formatComponentWeight(aggregation.requestedWeightTotal)} />
          <SummaryRow label="Applied Weight Total" value={formatComponentWeight(aggregation.appliedWeightTotal)} />
          <SummaryRow label="Included Components" value={formatCount(aggregation.includedComponents)} />
          <SummaryRow label="Excluded Components" value={formatCount(aggregation.excludedComponents)} />
          <SummaryRow label="Critical Missing" value={formatCount(aggregation.criticalMissingComponents)} />
          <SummaryRow label="Result Availability" value={result.available ? "Available" : "Unavailable"} />
          <SummaryRow label="Evaluation Readiness" value={formatComponentLabel(readiness?.status)} />
        </dl>
        {aggregation.normalizationApplied && aggregation.excludedComponents?.length > 0 && (
          <p className="fio-aggregation-note">
            Applied weights differ because authoritative aggregation excluded unavailable optional evidence.
          </p>
        )}
      </section>

      <section className="fio-aggregation-section fio-aggregation-grades">
        <h3>Authoritative Overall Grades</h3>
        <dl>
          <SummaryRow label="Raw Overall Grade" value={formatGrade(aggregation.rawOverallGrade)} />
          <SummaryRow label="Contract Overall Grade" value={formatGrade(result.overallGrade)} />
        </dl>
        <p>Raw grade is shown only when preserved in authoritative aggregation metadata.</p>
      </section>
    </div>
  );
}
