import { useMemo, useState } from "react";
import {
  createProspectVerificationCenterSummary,
  listProspectVerificationCenterRecords,
  listProspectVerificationQueue,
} from "../data/footballIntelligence/verificationCenter/ProspectVerificationCenterModel.js";
import "../styles/prospect-verification-center.css";

const label = (value) => String(value || "UNKNOWN").replaceAll("_", " ");

export default function ProspectVerificationCenter() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("REVIEW");
  const records = useMemo(() => listProspectVerificationCenterRecords({ draftYear: 2027 }), []);
  const queue = useMemo(() => listProspectVerificationQueue({ draftYear: 2027 }), []);
  const summary = useMemo(() => createProspectVerificationCenterSummary(records), [records]);
  const visible = useMemo(() => {
    const base = filter === "ALL" ? records : filter === "VERIFIED" ? records.filter((r) => r.identityStatus === "VERIFIED") : filter === "NOT_ELIGIBLE" ? records.filter((r) => r.eligibilityStatus === "NOT_ELIGIBLE") : queue;
    const q = query.trim().toLowerCase();
    return q ? base.filter((r) => [r.displayName, r.position, r.program, r.applicationProspectRef].some((v) => String(v).toLowerCase().includes(q))) : base;
  }, [filter, query, queue, records]);

  return <main className="pvc_shell">
    <header className="pvc_header"><div><span>Football Intelligence Platform</span><h1>Prospect Verification Center</h1><p>Identity, roster, program and draft-eligibility control plane for the 2027 application catalog.</p></div><div className="pvc_release">MDS-5B.7</div></header>
    <section className="pvc_metrics">
      <article><span>Catalog</span><strong>{summary.totalProspects}</strong><small>Application prospects</small></article>
      <article><span>Identity Verified</span><strong>{summary.identityVerified}</strong><small>{summary.sourceReported} source-reported</small></article>
      <article><span>Eligibility Pending</span><strong>{summary.eligibilityPending}</strong><small>{summary.eligibilityNotEligible} not eligible</small></article>
      <article><span>FIE Ready</span><strong>{summary.footballIntelligenceReady}</strong><small>Verification gate passed</small></article>
    </section>
    <section className="pvc_controls"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search prospect, school, position or reference"/><div>{[["REVIEW","Review Queue"],["VERIFIED","Verified"],["NOT_ELIGIBLE","Not Eligible"],["ALL","All"]].map(([id,text])=><button key={id} className={filter===id?"active":""} onClick={()=>setFilter(id)}>{text}</button>)}</div></section>
    <section className="pvc_table_wrap"><div className="pvc_table_header"><span>Prospect</span><span>Identity</span><span>Eligibility</span><span>FIE Gate</span></div><div className="pvc_rows">{visible.map((record)=><article key={record.applicationProspectRef} className="pvc_row"><div><strong>{record.displayName}</strong><span>{record.position} · {record.program}</span><code>{record.applicationProspectRef}</code></div><div><b data-state={record.identityStatus === "VERIFIED"?"good":"pending"}>{label(record.identityStatus)}</b><span>{record.authority?.publisher || "Authoritative source pending"}</span></div><div><b data-state={record.eligibilityStatus === "ELIGIBLE"?"good":record.eligibilityStatus === "NOT_ELIGIBLE"?"blocked":"pending"}>{label(record.eligibilityStatus)}</b><span>{record.earliestDraftYear ? `Earliest: ${record.earliestDraftYear}` : "Draft-year review required"}</span></div><div><b data-state={record.footballIntelligenceEligible?"good":"blocked"}>{record.footballIntelligenceEligible?"READY":"LOCKED"}</b><span>{label(record.gateReason)}</span></div></article>)}{!visible.length?<p className="pvc_empty">No prospects match this view.</p>:null}</div></section>
  </main>;
}
