import { useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import { draftRoomFixture, reduceDraftRoomState, selectProspects } from "../data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_2/index.js";
import { formatMeasurements } from "./draftRoomPreview/formatMeasurements.js";
import "../styles/draft-room-preview.css";

const warningLabels = {
  ELIGIBILITY_UNRESOLVED: "Eligibility Review",
  DECLARATION_UNRESOLVED: "Declaration Review",
  PROGRAM_REFERENCE_PROVISIONAL: "Program Provisional",
  PROGRAM_REFERENCE_CONTRADICTORY: "Program Conflict",
  PRODUCTION_LIMITED: "Limited Production",
  DATA_LIMITED: "Data Review",
  TESTING_UNAVAILABLE: "Testing Unavailable",
  SCOUTING_REVIEW_INCOMPLETE: "Scouting Review",
  PROSPECT_BLOCKED: "Selection Blocked",
  REFERENCE_UNKNOWN: "Reference Unknown",
};
const cardWarningCategories = new Set(["PROGRAM_REFERENCE_PROVISIONAL", "PROGRAM_REFERENCE_CONTRADICTORY", "PRODUCTION_LIMITED", "SCOUTING_REVIEW_INCOMPLETE", "PROSPECT_BLOCKED", "REFERENCE_UNKNOWN"]);
const sortLabels = { SOURCE_FIXTURE_ORDER: "Fixture order (not a ranking)", NAME_ASC: "Name A–Z", POSITION_THEN_NAME: "Position, then name", PROGRAM_THEN_NAME: "Program, then name", PRODUCTION_AVAILABILITY: "Production availability", DATA_COMPLETENESS: "Fewest data warnings" };
const safeText = (value, fallback = "Unavailable") => typeof value === "string" && value.trim() ? value : fallback;
const programName = (prospect) => safeText(prospect.program?.displayName);
const humanize = (value, fallback = "Unavailable") => safeText(value, fallback).toLowerCase().replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
const productionSummary = (prospect) => {
  const stats = prospect.productionSummary?.statistics;
  if (!stats) return "Limited production available";
  const parts = [];
  if (Number.isFinite(stats.games)) parts.push(`${stats.games} games`);
  if (Number.isFinite(stats.passingYards)) parts.push(`${stats.passingYards.toLocaleString()} pass yds`);
  if (Number.isFinite(stats.rushingYards)) parts.push(`${stats.rushingYards.toLocaleString()} rush yds`);
  if (Number.isFinite(stats.receivingYards)) parts.push(`${stats.receivingYards.toLocaleString()} rec yds`);
  if (Number.isFinite(stats.tackles)) parts.push(`${stats.tackles} tackles`);
  return parts.slice(0, 3).join(" • ") || `${prospect.productionSummary.season ?? "Recent"} production on file`;
};
const focusables = (node) => [...node.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((item) => !item.hidden && item.getAttribute("aria-hidden") !== "true");

function WarningChips({ warnings, complete = false }) {
  const visible = complete ? warnings : warnings.filter((warning) => cardWarningCategories.has(warning.category)).slice(0, 2);
  if (!visible.length) return null;
  return <ul className={`fid-warning-list ${complete ? "is-complete" : ""}`} aria-label={complete ? "Data limitations" : "Candidate indicators"}>{visible.map((warning) => <li key={warning.category} data-severity={warning.severity}>{warningLabels[warning.category] ?? warning.message}</li>)}</ul>;
}

function ProspectCard({ prospect, watched, onOpen, onWatch }) {
  return <article className="fid-prospect-card">
    <button className="fid-card-main" onClick={(event) => onOpen(prospect.prospectRef, event.currentTarget)} aria-label={`Review ${prospect.displayName}`}>
      <span className="fid-position">{prospect.officialPosition}</span>
      <span className="fid-card-identity"><strong>{prospect.displayName}</strong><small>{programName(prospect)} <span aria-hidden="true">•</span> {safeText(prospect.projectedRole, "Role unavailable")}</small></span>
      <span className="fid-measurements">{formatMeasurements(prospect.measurements)}</span>
      <span className="fid-production">{productionSummary(prospect)}</span>
      <span className="fid-summary"><strong>Strength</strong>{safeText(prospect.strengthSummary)}</span>
      <span className="fid-summary"><strong>Concern</strong>{safeText(prospect.concernSummary)}</span>
      <WarningChips warnings={prospect.warnings} />
    </button>
    <button className="fid-watch" aria-pressed={watched} onClick={() => onWatch(prospect.prospectRef, watched)}>{watched ? "Watching" : "Watch"}</button>
  </article>;
}

function EmptyState({ title, children, action }) { return <div className="fid-empty" role="status"><strong>{title}</strong><p>{children}</p>{action}</div>; }
function DraftHistory({ state }) {
  if (!state.history.length) return <EmptyState title="No fixture selections yet">Confirmed selections in this preview session will appear here. Nothing is saved.</EmptyState>;
  return <ol className="fid-history">{state.history.map((pick) => <li key={pick.selectionRef}><b>#{pick.overallPick}</b><span><strong>{pick.prospectDisplayNameSnapshot}</strong><small>{pick.positionSnapshot} • {pick.programSnapshot}</small></span><em>{state.teamContext.displayName} • Round {pick.round}</em></li>)}</ol>;
}
function YourClass({ state, details }) {
  const draftClass = state.userDraftClass;
  if (!draftClass.selections.length) return <EmptyState title="Your fixture class is empty">Your team’s confirmed fixture selections will build a scouting summary here—without grades, rankings, or fit scores.</EmptyState>;
  return <div className="fid-class-view">
    <div className="fid-class-summary"><span><strong>{draftClass.selectionCount}</strong> selections</span><span><strong>{Object.entries(draftClass.positionDistribution).map(([position, count]) => `${position} ${count}`).join(", ")}</strong> position mix</span><span><strong>{draftClass.unresolvedWarningCount}</strong> review flags</span></div>
    <p className="fid-fixture-note">Fixture-only team summary • not saved or graded</p>
    <div className="fid-class-cards">{draftClass.selections.map((pick) => { const prospect = details[pick.prospectRef]; return <article key={pick.selectionRef}><span className="fid-position">{pick.positionSnapshot}</span><div><strong>{pick.prospectDisplayNameSnapshot}</strong><small>Round {pick.round} • Pick #{pick.overallPick} • {pick.programSnapshot}</small><small>{formatMeasurements(prospect?.measurements)}</small></div></article>; })}</div>
  </div>;
}

function SelectionConfirmation({ prospect, ready, onConfirm, onCancel }) {
  const dialogRef = useRef(null); const cancelRef = useRef(null); const titleId = useId();
  useEffect(() => { cancelRef.current?.focus(); }, []);
  const onKeyDown = (event) => {
    if (event.key === "Escape") { event.stopPropagation(); onCancel(); return; }
    if (event.key !== "Tab") return;
    const items = focusables(dialogRef.current); const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="fid-confirm-backdrop"><section ref={dialogRef} className="fid-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
    <span className="fid-kicker">Confirm fixture selection</span><h3 id={titleId}>{prospect.displayName}</h3><p>{ready ? `Select ${prospect.displayName} for ${draftRoomFixture.teamContext.displayName}?` : "Acknowledge the eligibility and declaration uncertainty before confirming."}</p>
    <div><button ref={cancelRef} className="fid-secondary" onClick={onCancel}>Cancel</button><button className="fid-primary" disabled={!ready} onClick={onConfirm}>Confirm fixture pick</button></div>
  </section></div>;
}

function ProspectDetail({ prospect, state, dispatch, onClose, onConfirmed }) {
  const dialogRef = useRef(null); const closeRef = useRef(null); const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    const priorOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; closeRef.current?.focus();
    return () => { document.body.style.overflow = priorOverflow; };
  }, []);
  const onKeyDown = (event) => {
    if (confirming) return;
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key !== "Tab") return;
    const items = focusables(dialogRef.current); const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const acknowledged = state.selection.eligibilityWarningAcknowledged; const ready = state.selection.status === "READY_TO_SELECT";
  return <div className="fid-dialog-backdrop" onMouseDown={(event) => { if (!confirming && event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="fid-detail" role="dialog" aria-modal="true" aria-labelledby="fid-detail-title" onKeyDown={onKeyDown}>
      <header><div><span className="fid-kicker">Scouting report</span><h2 id="fid-detail-title">{prospect.displayName}</h2><p>{prospect.officialPosition} • {programName(prospect)} • {safeText(prospect.projectedRole, "Role unavailable")}</p></div><button ref={closeRef} className="fid-close" onClick={onClose} aria-label="Close prospect details">Close</button></header>
      <div className="fid-detail-body">
        <section><h3>Measurements & production</h3><p className="fid-detail-measurement">{formatMeasurements(prospect.measurements)}</p><p>{productionSummary(prospect)}</p></section>
        <section><h3>Role & versatility</h3><p>{safeText(prospect.projectedRole, "Projected role unavailable")} • {humanize(prospect.reviewStatus, "Review status unavailable")}</p></section>
        <section><h3>Scouting snapshot</h3><div className="fid-scouting"><div><strong>Primary strengths</strong>{prospect.strengths.length ? prospect.strengths.map((item, index) => <p key={index}>{safeText(item.statement)}</p>) : <p>Strength evidence is unavailable.</p>}</div><div><strong>Primary concerns</strong>{prospect.concerns.length ? prospect.concerns.map((item, index) => <p key={index}>{safeText(item.statement)}</p>) : <p>Concern evidence is unavailable.</p>}</div></div></section>
        <section><h3>Testing & evidence</h3><dl className="fid-detail-grid"><div><dt>Testing</dt><dd>{humanize(prospect.testingStatus?.status)}</dd></div><div><dt>Evidence</dt><dd>{prospect.evidenceSummary?.count ?? 0} records • {humanize(prospect.evidenceSummary?.scoutingCompleteness)}</dd></div></dl></section>
        <section><h3>Limitations under review</h3><WarningChips warnings={prospect.warnings} complete /><ul className="fid-limitations">{prospect.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></section>
      </div>
      <footer><label className="fid-ack"><input type="checkbox" checked={acknowledged} onChange={() => dispatch({ type: "WARNING_ACKNOWLEDGED" })} /><span>I understand eligibility and declaration status remain unresolved.</span></label><button className="fid-primary" disabled={!state.pickContext.onTheClock} onClick={() => { dispatch({ type: "FIXTURE_SELECTION_PROPOSED", prospectRef: prospect.prospectRef }); setConfirming(true); }}>Select prospect</button></footer>
      {confirming && <SelectionConfirmation prospect={prospect} ready={ready} onCancel={() => setConfirming(false)} onConfirm={() => onConfirmed(prospect)} />}
    </section>
  </div>;
}

function MobileContext({ state }) { return <div className="fid-mobile-context" aria-label="Current fixture draft context"><span><small>On the clock</small><strong>{state.teamContext.abbreviation}</strong></span><span><small>Round</small><strong>{state.session.currentRound}</strong></span><span><small>Pick</small><strong>{state.session.currentPick}</strong></span><span><small>Overall</small><strong>#{state.session.overallPick}</strong></span><em>Fixture preview</em></div>; }

export default function DraftRoomPreview() {
  const [state, dispatch] = useReducer(reduceDraftRoomState, draftRoomFixture.initialState); const [tab, setTab] = useState("prospects"); const [filtersOpen, setFiltersOpen] = useState(false); const [announcement, setAnnouncement] = useState("");
  const openerRef = useRef(null); const workspaceRef = useRef(null); const prospects = selectProspects(state); const details = draftRoomFixture.prospects.details; const selected = state.selectedProspectRef ? details[state.selectedProspectRef] : null;
  const positions = useMemo(() => [...new Set(state.prospects.map((prospect) => prospect.officialPosition))].sort(), [state.prospects]); const programs = useMemo(() => [...new Set(state.prospects.map(programName))].sort(), [state.prospects]);
  const activeFilterCount = [state.filters.searchQuery, state.filters.position !== "ALL", state.filters.program !== "ALL", state.filters.watchedOnly].filter(Boolean).length;
  const open = (ref, trigger) => { openerRef.current = trigger; dispatch({ type: "PROSPECT_OPENED", prospectRef: ref }); };
  const close = () => { dispatch({ type: "PROSPECT_CLOSED" }); requestAnimationFrame(() => openerRef.current?.focus()); };
  const confirm = (prospect) => { const pick = state.pickContext.overallPick; dispatch({ type: "FIXTURE_SELECTION_CONFIRMED", prospectRef: prospect.prospectRef }); dispatch({ type: "PROSPECT_CLOSED" }); setAnnouncement(""); requestAnimationFrame(() => { setAnnouncement(`${prospect.displayName} selected by ${state.teamContext.displayName} with pick ${pick}.`); workspaceRef.current?.focus(); }); };
  const resetFilters = () => dispatch({ type: "FILTERS_RESET" });
  return <main className="fid-preview">
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    <header className="fid-pick-header"><div><span className="fid-preview-badge">Fixture preview • Not production</span><h1>Draft Operations Center</h1><p>2027 prospects remain under review. Eligibility and declaration are unconfirmed; selections are not saved or production-integrated.</p></div><div className="fid-pick-context"><span>Team<strong>{state.teamContext.abbreviation}</strong></span><span>Round<strong>{state.session.currentRound}</strong></span><span>Pick<strong>{state.session.currentPick}</strong></span><span>Overall<strong>#{state.session.overallPick}</strong></span></div></header>
    <MobileContext state={state} />
    <nav className="fid-mobile-tabs" aria-label="Draft room views">{[["prospects", "Prospects"], ["history", "History"], ["class", "Your Class"]].map(([id, label]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <div className="fid-layout" aria-hidden={selected ? "true" : undefined} inert={selected ? true : undefined}>
      <aside className="fid-rail"><section><span className="fid-kicker">On the clock • synthetic context</span><h2>{state.teamContext.displayName} <small>{state.teamContext.abbreviation}</small></h2><p>Round {state.pickContext.round} • Pick {state.pickContext.pickInRound} • Overall #{state.pickContext.overallPick}</p><div className="fid-needs">{state.teamContext.needs.map((need) => <span key={need.position}>{need.position}</span>)}</div><p className="fid-limit">Fixture needs only. Roster, scheme, philosophy, and team intelligence are unavailable.</p></section><section className="fid-trade-note"><span className="fid-kicker">Trade Center</span><p>Available in a future release. This preview focuses on player evaluation and fixture selection.</p></section></aside>
      <section ref={workspaceRef} tabIndex="-1" className={`fid-workspace ${tab === "prospects" ? "is-active" : ""}`} aria-labelledby="prospects-heading">
        <div className="fid-section-heading"><div><span className="fid-kicker">Available prospects</span><h2 id="prospects-heading">Fixture cohort</h2><p>{prospects.length} available • fixture order is not a ranking</p></div><button className="fid-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</button></div>
        <div className={`fid-controls ${filtersOpen ? "is-open" : ""}`}><label><span>Search</span><input type="search" value={state.filters.searchQuery} onChange={(event) => dispatch({ type: "SEARCH_CHANGED", query: event.target.value })} placeholder="Name or program" /></label><label><span>Position</span><select value={state.filters.position} onChange={(event) => dispatch({ type: "FILTER_CHANGED", filter: "position", value: event.target.value })}><option value="ALL">All positions</option>{positions.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Program</span><select value={state.filters.program} onChange={(event) => dispatch({ type: "FILTER_CHANGED", filter: "program", value: event.target.value })}><option value="ALL">All programs</option>{programs.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Sort</span><select value={state.filters.sort} onChange={(event) => dispatch({ type: "SORT_CHANGED", sort: event.target.value })}>{Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="fid-toggle" aria-pressed={state.filters.watchedOnly} onClick={() => dispatch({ type: "FILTER_CHANGED", filter: "watchedOnly", value: !state.filters.watchedOnly })}>Watched only</button><button className="fid-secondary" onClick={resetFilters}>Reset filters</button></div>
        {activeFilterCount > 0 && <div className="fid-active-filters" role="status">{activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"} <button onClick={resetFilters}>Clear all</button></div>}
        {prospects.length ? <div className="fid-prospect-list">{prospects.map((prospect) => <ProspectCard key={prospect.prospectRef} prospect={prospect} watched={state.watchedProspectRefs.includes(prospect.prospectRef)} onOpen={open} onWatch={(ref, watched) => dispatch({ type: watched ? "PROSPECT_UNWATCHED" : "PROSPECT_WATCHED", prospectRef: ref })} />)}</div> : <EmptyState title="No matching prospects" action={<button className="fid-secondary" onClick={resetFilters}>Clear filters</button>}>Try a broader search or clear the current filters to return to the fixture cohort.</EmptyState>}
      </section>
      <section className={`fid-summary-panel fid-history-panel ${tab === "history" ? "is-active" : ""}`}><span className="fid-kicker">Chronological session log</span><h2>Draft History</h2><DraftHistory state={state} /></section>
      <section className={`fid-summary-panel fid-class-panel ${tab === "class" ? "is-active" : ""}`}><span className="fid-kicker">{state.teamContext.displayName}</span><h2>Your Draft Class</h2><YourClass state={state} details={details} /></section>
    </div>
    {selected && <ProspectDetail prospect={selected} state={state} dispatch={dispatch} onClose={close} onConfirmed={confirm} />}
  </main>;
}
