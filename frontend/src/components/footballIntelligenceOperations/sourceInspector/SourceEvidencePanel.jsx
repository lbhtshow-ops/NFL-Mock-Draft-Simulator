import {
  formatSourceLabel,
  formatStructuredScalar,
} from "./sourceInspectorFormatters.js";

const MAX_VALUE_FIELDS = 12;

function MissingList({ title, values }) {
  const entries = Array.isArray(values) ? values : [];
  return (
    <section>
      <h4>{title}</h4>
      {!entries.length ? <p>No missing evidence reported.</p> : <ul className="fio-source-code-list">{entries.map((value, index) => <li key={`${value}-${index}`}><code>{value}</code></li>)}</ul>}
    </section>
  );
}

export default function SourceEvidencePanel({ standardized, adapted }) {
  const data = standardized?.value?.data;
  const fields = data && typeof data === "object" && !Array.isArray(data)
    ? Object.entries(data).slice(0, MAX_VALUE_FIELDS)
    : [];
  const sources = Array.isArray(standardized?.sources) ? standardized.sources : [];
  const evidence = Array.isArray(standardized?.evidence) ? standardized.evidence : [];

  return (
    <section className="fio-source-section fio-source-evidence">
      <h3>Evidence and Structured Value</h3>
      <section>
        <h4>Structured Value</h4>
        {!standardized?.value ? <p>No structured value reported.</p> : <>
          <dl className="fio-source-value-summary">
            <div><dt>Value Type</dt><dd>{formatSourceLabel(standardized.value.type)}</dd></div>
            <div><dt>First-level Field Count</dt><dd>{data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data).length : 0}</dd></div>
          </dl>
          {!fields.length ? <p>No safe first-level fields reported.</p> : <dl className="fio-source-value-fields">{fields.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{formatStructuredScalar(value)}</dd></div>)}</dl>}
          {data && Object.keys(data).length > fields.length && <p>{Object.keys(data).length - fields.length} additional field(s) reported.</p>}
        </>}
      </section>
      <div className="fio-source-missing-grid">
        <MissingList title="Standardized Missing Evidence" values={standardized?.missingEvidence} />
        <MissingList title="Adapted Missing Evidence" values={adapted?.missingEvidence} />
      </div>
      <section>
        <h4>Evidence Types</h4>
        {!evidence.length ? <p>No evidence entries reported.</p> : <ul>{evidence.map((entry, index) => <li key={`${entry?.type || "evidence"}-${index}`}>{formatSourceLabel(entry?.type)}</li>)}</ul>}
      </section>
      <section>
        <h4>Source Provenance</h4>
        {!sources.length ? <p>No source provenance reported.</p> : <ul>{sources.map((source, index) => <li key={`${source}-${index}`}>{typeof source === "string" ? source : "Structured Detail Available"}</li>)}</ul>}
      </section>
    </section>
  );
}
