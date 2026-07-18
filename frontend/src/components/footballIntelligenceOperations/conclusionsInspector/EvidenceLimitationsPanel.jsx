import {
  MAX_EXPLANATION_ITEMS,
  formatConclusionLabel,
  formatSafeScalar,
  getSafeObjectFields,
  isEvidencePath,
  limitItems,
} from "./conclusionsInspectorFormatters.js";

function LimitationList({ title, values }) {
  const { entries, remaining } = limitItems(values, MAX_EXPLANATION_ITEMS);
  return <section><h4>{title}</h4>{!entries.length ? <p>None reported.</p> : <ul>{entries.map((entry, index) => {
    if (typeof entry === "string") return <li key={`${entry}-${index}`}>{isEvidencePath(entry) ? <code>{entry}</code> : formatConclusionLabel(entry)}</li>;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return <li key={index}>{formatSafeScalar(entry)}</li>;
    const fields = getSafeObjectFields(entry);
    return <li key={index}>{!fields.length ? "Structured Detail Available" : <dl>{fields.map((field) => <div key={field.key}><dt>{formatConclusionLabel(field.key)}</dt><dd>{field.value}</dd></div>)}</dl>}</li>;
  })}</ul>}{remaining > 0 && <p>{remaining} additional item(s) not displayed.</p>}</section>;
}

export default function EvidenceLimitationsPanel({ result, readiness }) {
  const explanation = result?.explanation;
  const contributors = Array.isArray(result?.provenance?.contributors) ? result.provenance.contributors : [];
  const domains = [...new Set(contributors.map((entry) => entry?.domain).filter((value) => typeof value === "string"))];
  const sourceIds = [...new Set(contributors.map((entry) => entry?.contributorId).filter((value) => typeof value === "string"))];
  const evidenceRefs = [...new Set(contributors.flatMap((entry) => Array.isArray(entry?.evidenceRefs) ? entry.evidenceRefs : []))];
  const versionRefs = [...new Set(contributors.map((entry) => entry?.versions?.model).filter((value) => typeof value === "string"))];

  return (
    <section className="fio-conclusion-section fio-evidence-limitations">
      <h3>Evidence Limitations and Provenance</h3>
      <dl className="fio-readiness-context">
        <div><dt>Evaluation Readiness</dt><dd>{formatConclusionLabel(readiness?.status)}</dd></div>
      </dl>
      <div className="fio-limitation-grid">
        <LimitationList title="Missing Required Evidence" values={readiness?.missingRequirements} />
        <LimitationList title="Missing Optional Evidence" values={readiness?.missingOptional} />
        <LimitationList title="Model Missing Evidence" values={result?.missingEvidence} />
        <LimitationList title="Conflicting Evidence" values={explanation?.conflictingEvidence} />
        <LimitationList title="Confidence Rationale" values={explanation?.confidenceRationale} />
      </div>
      <section className="fio-result-provenance">
        <h4>Result Provenance</h4>
        {!result?.provenance ? <p>No result-level provenance reported.</p> : <dl>
          <div><dt>Contributor Count</dt><dd>{contributors.length}</dd></div>
          <div><dt>Source Count</dt><dd>{sourceIds.length}</dd></div>
          <div><dt>Domains</dt><dd>{domains.length ? domains.map(formatConclusionLabel).join(", ") : "Not Reported"}</dd></div>
          <div><dt>Evidence Reference Count</dt><dd>{evidenceRefs.length}</dd></div>
          <div><dt>Version References</dt><dd>{versionRefs.length ? versionRefs.join(", ") : "Not Reported"}</dd></div>
        </dl>}
        <p>Full source provenance remains available in the Source Inspector.</p>
      </section>
    </section>
  );
}
