import {
  countObjectEntries,
  countValidationEntries,
  formatMetadataValue,
} from "./developerToolsFormatters.js";

export default function EvaluationMetadataPanel({ evaluation, isEvaluating }) {
  const result = evaluation?.result;
  const prospect = evaluation?.prospect;
  const rows = [
    ["Evaluation Success", evaluation?.success],
    ["Evaluation Status", isEvaluating ? "RUNNING" : evaluation?.status],
    ["Prospect ID", prospect?.id ?? evaluation?.playerId],
    ["Prospect Name", prospect?.name],
    ["Position", prospect?.position ?? result?.position],
    ["Readiness Status", evaluation?.readiness?.status],
    ["Model Name", result?.model],
    ["Model Version", result?.versions?.model],
    ["Weight Version", result?.versions?.weights],
    ["Contract Version", result?.versions?.contract],
    ["Result Contract", result?.contract],
    ["Data State", result?.dataState],
    ["Evidence Level", result?.evidenceLevel],
    ["Available", result?.available],
    ["Overall Grade", result?.overallGrade],
    ["Confidence", result?.confidence],
    ["Validation Valid", evaluation?.validation?.valid],
    ["Validation Error Count", countValidationEntries(evaluation?.validation, "errors")],
    ["Validation Warning Count", countValidationEntries(evaluation?.validation, "warnings")],
    ["Source Count", countObjectEntries(evaluation?.adaptedSources)],
    ["Component Count", countObjectEntries(result?.components)],
    ["Contributor Count", Array.isArray(result?.provenance?.contributors) ? result.provenance.contributors.length : null],
  ];

  if (evaluation?.error) {
    rows.push(
      ["Evaluation Error Code", evaluation.error.code],
      ["Evaluation Error Message", evaluation.error.message]
    );
  }

  return (
    <section className="fio-developer-section fio-developer-metadata">
      <h3>Evaluation Metadata</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{formatMetadataValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
