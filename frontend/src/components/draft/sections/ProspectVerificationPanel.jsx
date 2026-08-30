import { useMemo } from "react";
import { getProspectVerificationCenterRecord } from "../../../data/footballIntelligence/verificationCenter/ProspectVerificationCenterModel.js";
import "./ProspectVerificationPanel.css";

function Status({ label, value }) {
  const state = value === "VERIFIED" || value === "ELIGIBLE" ? "good" : value === "NOT_ELIGIBLE" ? "blocked" : "pending";
  return <div className="verification_status_row"><span>{label}</span><strong data-state={state}>{String(value || "UNKNOWN").replaceAll("_", " ")}</strong></div>;
}

export default function ProspectVerificationPanel({ player }) {
  const record = useMemo(() => getProspectVerificationCenterRecord(player), [player]);
  if (!player) return <div className="prospect_verification_empty">Select a prospect to review verification status.</div>;
  if (!record) return <div className="prospect_verification_empty">Verification record pending for this runtime prospect.</div>;

  return (
    <section className="prospect_verification_panel">
      <div className="verification_gate_banner" data-ready={record.footballIntelligenceEligible ? "true" : "false"}>
        <div><span>Football Intelligence Gate</span><strong>{record.footballIntelligenceEligible ? "READY" : "LOCKED"}</strong></div>
        <p>{record.footballIntelligenceEligible ? "Identity and draft eligibility gates are satisfied." : record.gateReason.replaceAll("_", " ")}</p>
      </div>
      <div className="verification_status_grid">
        <Status label="Identity" value={record.identityStatus} />
        <Status label="Program" value={record.programStatus} />
        <Status label="Position" value={record.positionStatus} />
        <Status label="2027 Eligibility" value={record.eligibilityStatus} />
      </div>
      {record.earliestDraftYear ? <p className="verification_eligibility_note">Earliest verified draft year: <strong>{record.earliestDraftYear}</strong></p> : null}
      <div className="verification_evidence_block">
        <h3>Evidence & Authority</h3>
        {record.authority ? <a href={record.authority.url} target="_blank" rel="noreferrer"><strong>{record.authority.publisher}</strong><span>{String(record.authority.type || "Authority").replaceAll("_", " ")}</span></a> : <p>No authoritative roster verification registered yet.</p>}
        {record.supportingEvidence.map((evidence, index) => <a key={`${evidence.url}-${index}`} href={evidence.url} target="_blank" rel="noreferrer"><strong>{evidence.publisher || "Supporting evidence"}</strong><span>{evidence.note || evidence.supports || String(evidence.type || "Evidence").replaceAll("_", " ")}</span></a>)}
      </div>
      {record.findings.length ? <div className="verification_findings"><h3>Findings</h3>{record.findings.map((finding, index) => <div key={`${finding.rule}-${index}`}><strong>{String(finding.rule).replaceAll("_", " ")}</strong><span>{finding.sourceValue && finding.verifiedValue ? `${finding.sourceValue} → ${finding.verifiedValue}` : finding.severity || "Review"}</span></div>)}</div> : null}
    </section>
  );
}
