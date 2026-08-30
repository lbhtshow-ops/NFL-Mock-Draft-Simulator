import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { draftResultsFixture } from "../data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_5/index.js";
import { formatMeasurements } from "./draftRoomPreview/formatMeasurements.js";
import "../styles/draft-results-preview.css";

const safe = (value, fallback = "Unavailable") => typeof value === "string" && value.trim() ? value : fallback;
const humanize = (value) => safe(value).toLowerCase().replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

function Distribution({ title, values }) {
  const entries = Object.entries(values ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const maximum = Math.max(1, ...entries.map(([, count]) => count));
  return <section className="fid-results-card fid-results-distribution"><h2>{title}</h2>{entries.length ? <ul>{entries.map(([label, count]) => <li key={label}><span>{label}</span><div aria-hidden="true"><i style={{ width: `${(count / maximum) * 100}%` }} /></div><strong>{count}</strong></li>)}</ul> : <p>No selections are available.</p>}</section>;
}

function SelectionCard({ selection }) {
  const specificWarnings = selection.warnings.filter(({ category }) => !["ELIGIBILITY_UNRESOLVED", "DECLARATION_UNRESOLVED", "DATA_LIMITED"].includes(category));
  return <article className="fid-result-selection-card">
    <div className="fid-result-pick"><span>Round {selection.round}</span><strong>Pick #{selection.overallPick}</strong></div>
    <div><span className="fid-result-position">{selection.officialPosition}</span><h3>{selection.prospectDisplayName}</h3><p>{selection.program} • {safe(selection.projectedRole, "Role under review")}</p></div>
    <dl><div><dt>Measurements</dt><dd>{formatMeasurements(selection.measurements)}</dd></div><div><dt>Production</dt><dd>{selection.compactProductionSummary?.summary ?? "Limited production available"}</dd></div></dl>
    <div className="fid-result-scouting"><p><strong>Strength</strong>{safe(selection.primaryStrength)}</p><p><strong>Concern</strong>{safe(selection.primaryConcern)}</p></div>
    {specificWarnings.length > 0 && <div className="fid-result-chips">{specificWarnings.map((warning) => <span key={warning.category}>{humanize(warning.category)}</span>)}</div>}
  </article>;
}

function DraftHistory({ selections }) {
  return <section className="fid-results-card fid-results-history"><div className="fid-results-section-heading"><div><span>Complete fixture sequence</span><h2>Draft History</h2></div><strong>{selections.length} selection{selections.length === 1 ? "" : "s"}</strong></div>{selections.length ? <ol>{selections.map((selection) => <li key={selection.selectionRef}><span className="fid-history-number">#{selection.overallPick}</span><div><strong>{selection.prospectDisplayName}</strong><p>{selection.officialPosition} • {selection.program}</p></div><div><strong>Fixture Team Alpha</strong><p>Round {selection.round}, Pick {selection.pickInRound}</p></div><span className="fid-history-source">{selection.userControlled ? "User fixture pick" : "Fixture pick"}</span></li>)}</ol> : <p>No draft history is available for this result.</p>}</section>;
}

function Summary({ view }) {
  return <div className="fid-results-summary-grid">
    <Distribution title="Selections by position" values={view.distributions.positions} />
    <Distribution title="Selections by program" values={view.distributions.programs} />
    <section className="fid-results-card"><h2>Result limitations</h2><ul className="fid-results-limitations">{view.warningSummary.global.map((item) => <li key={item}>{item}</li>)}</ul><p className="fid-results-small">Candidate-specific warnings: {view.warningSummary.selectionWarningCount}</p></section>
    <section className="fid-results-card"><h2>Team summary</h2>{view.teamSummaries.map((team) => <div key={team.teamRef}><strong>{team.displayName}</strong><p>{team.selectionCount} fixture selection{team.selectionCount === 1 ? "" : "s"}</p><span className="fid-results-unavailable">Team Intelligence unavailable</span></div>)}</section>
    <section className="fid-results-card fid-results-quiet"><h2>Trade analysis</h2><p>No trades occurred in this fixture. Trade values and analysis are unavailable.</p></section>
    <section className="fid-results-card fid-results-quiet"><h2>Future intelligence</h2><p>Grades, value, confidence, team fit, scheme fit, positional value, and explainability have not been calculated.</p></section>
  </div>;
}

export default function DraftResultsPreview() {
  const navigate = useNavigate();
  const view = draftResultsFixture.view;
  const [tab, setTab] = useState("class");
  const resultStatus = useMemo(() => view.header.resultStatus === "PARTIAL_FIXTURE_RESULT" ? "Partial fixture result" : "Complete fixture result", [view.header.resultStatus]);
  if (view.status !== "READY") return <main className="fid-results-preview"><section className="fid-results-error"><h1>Draft Results unavailable</h1><p>The fixture result could not be reconstructed.</p><button onClick={() => navigate("/__dev/draft-room-preview")}>Return to Draft Room Preview</button></section></main>;
  return <main className="fid-results-preview">
    <header className="fid-results-header"><div><span className="fid-results-badge">Fixture preview • Not saved</span><h1>Draft Results Center</h1><p>2027 Draft Operations Center • {resultStatus}</p></div><dl><div><dt>Team</dt><dd>FTA</dd></div><div><dt>Selections</dt><dd>{view.header.totalSelections}</dd></div><div><dt>Your picks</dt><dd>{view.header.userSelections}</dd></div><div><dt>Status</dt><dd>Not saved</dd></div></dl></header>
    <div className="fid-results-notice" role="note"><strong>This is an immutable fixture snapshot.</strong><span>It is not persisted, publicly shareable, graded, or connected to an account.</span></div>
    <nav className="fid-results-tabs" aria-label="Draft Results sections">{[["class", "Your Class"], ["history", "History"], ["summary", "Summary"]].map(([id, label]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <div className="fid-results-layout">
      <section className={`fid-results-primary ${tab === "class" ? "is-active" : ""}`}><div className="fid-results-section-heading"><div><span>Fixture Team Alpha</span><h2>Your Draft Class</h2><p>Factual selection summary only—no grade, ranking, fit, or value score.</p></div><strong>{view.userDraftClass.selectionCount} pick</strong></div>{view.userDraftClass.selections.length ? <div className="fid-result-class-list">{view.userDraftClass.selections.map((selection) => <SelectionCard key={selection.selectionRef} selection={selection} />)}</div> : <div className="fid-results-empty"><h3>No user selections</h3><p>This fixture result does not contain a user-controlled pick.</p></div>}</section>
      <div className={`fid-results-history-wrap ${tab === "history" ? "is-active" : ""}`}><DraftHistory selections={view.history} /></div>
      <div className={`fid-results-summary-wrap ${tab === "summary" ? "is-active" : ""}`}><Summary view={view} /></div>
    </div>
    <footer className="fid-results-actions"><button className="fid-results-primary-action" onClick={() => navigate("/__dev/draft-room-preview")}>Return to Draft Room Preview</button><button onClick={() => navigate("/__dev/draft-room-preview")}>Start New Fixture Draft</button><span>Save, share, export, grading, and resume are unavailable in this preview.</span></footer>
  </main>;
}
