import { formatComponentLabel } from "../componentBreakdown/componentBreakdownFormatters.js";
import { formatBoolean, MAX_INSPECTOR_ENTRIES } from "./componentInspectorFormatters.js";

export default function ComponentEvidenceSummary({ component }) {
  const contributors = Array.isArray(component?.provenance?.contributors)
    ? component.provenance.contributors
    : [];
  const roles = ["DIRECT", "SUPPORTING", "CONTEXT_ONLY", "EXCLUDED"];

  return (
    <section className="fio-inspector-section">
      <h3>Evidence Summary</h3>
      {!contributors.length && <p>No contributors reported.</p>}
      {roles.map((role) => {
        const entries = contributors.filter((entry) => entry?.role === role);
        if (!entries.length) return null;
        const visible = entries.slice(0, MAX_INSPECTOR_ENTRIES);
        return (
          <section className="fio-inspector-contributor-group" key={role}>
            <h4>{formatComponentLabel(role)}</h4>
            <ul>{visible.map((entry, index) => (
              <li key={entry.contributorId || `${role}-${index}`}>
                <dl>
                  <div><dt>Domain</dt><dd>{formatComponentLabel(entry.domain)}</dd></div>
                  <div><dt>Source ID</dt><dd><code>{entry.contributorId || "Not Reported"}</code></dd></div>
                  <div><dt>Role</dt><dd>{formatComponentLabel(entry.role)}</dd></div>
                  <div><dt>Contributed to Score</dt><dd>{formatBoolean(entry.contributedToScore)}</dd></div>
                  <div><dt>Contributed to Overall Grade</dt><dd>{formatBoolean(entry.contributedToOverallGrade)}</dd></div>
                </dl>
              </li>
            ))}</ul>
            {entries.length > visible.length && <p>{entries.length - visible.length} additional contributor(s) reported.</p>}
          </section>
        );
      })}
    </section>
  );
}
