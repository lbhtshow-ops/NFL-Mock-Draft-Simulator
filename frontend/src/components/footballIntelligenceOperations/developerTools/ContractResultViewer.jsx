import { serializeDeveloperRecord } from "./developerToolsFormatters.js";

export default function ContractResultViewer({ recordLabel, value }) {
  return (
    <section className="fio-developer-section fio-contract-viewer">
      <div className="fio-developer-section-heading">
        <h3>Contract Result</h3>
        <span>{recordLabel}</span>
      </div>
      <pre tabIndex="0" aria-label={`${recordLabel} structured JSON`}>
        <code>{serializeDeveloperRecord(value)}</code>
      </pre>
    </section>
  );
}
