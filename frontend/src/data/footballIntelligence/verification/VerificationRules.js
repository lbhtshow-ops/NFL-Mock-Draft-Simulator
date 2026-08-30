import { PROSPECT_VERIFICATION_RULE } from "./ProspectVerificationContract.js";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

export function evaluateDeterministicVerificationRules({ applicationProspectRef, sourceIdentity, verifiedIdentity, sourceMetadata } = {}) {
  const findings = [];
  if (!String(applicationProspectRef || "").startsWith("app-prospect:")) {
    findings.push({ rule: PROSPECT_VERIFICATION_RULE.MALFORMED_APPLICATION_REFERENCE, severity: "HIGH" });
  }
  if (!sourceMetadata?.publisher || !sourceMetadata?.sourceId) {
    findings.push({ rule: PROSPECT_VERIFICATION_RULE.MISSING_SOURCE_PROVENANCE, severity: "MEDIUM" });
  }
  if (verifiedIdentity?.program && sourceIdentity?.program && normalize(verifiedIdentity.program) !== normalize(sourceIdentity.program)) {
    findings.push({
      rule: PROSPECT_VERIFICATION_RULE.PROGRAM_MISMATCH,
      severity: "HIGH",
      sourceValue: sourceIdentity.program,
      verifiedValue: verifiedIdentity.program,
    });
  }
  if (verifiedIdentity?.position && sourceIdentity?.position && normalize(verifiedIdentity.position) !== normalize(sourceIdentity.position)) {
    findings.push({
      rule: PROSPECT_VERIFICATION_RULE.POSITION_MISMATCH,
      severity: "HIGH",
      sourceValue: sourceIdentity.position,
      verifiedValue: verifiedIdentity.position,
    });
  }
  return Object.freeze(findings.map((finding) => Object.freeze(finding)));
}
