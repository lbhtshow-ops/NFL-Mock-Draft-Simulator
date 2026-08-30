import { isFootballEntity } from "../contracts/FootballEntityContract.js";
import { isCanonicalFootballEntity } from "../contracts/FootballEntityReferencePolicy.js";
import { isDraftSelection } from "../draftSelection/DraftSelectionContract.js";
import { validateDraftSelectionIdentityConsistency } from "../draftSelection/DraftSelectionReferencePolicy.js";
import {
  CANONICAL_RECORD_DOMAIN_PATHS,
  CANONICAL_RECORD_DOMAINS,
  CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION,
  CANONICAL_RECORD_OWNERSHIP_SCHEMA_VERSION,
  CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS,
} from "./canonicalRecordOwnershipConstants.js";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const entry = (code, path, message) => Object.freeze({ code, path, message });
const freeze = (items) => Object.freeze(items);
const revisionFile = (revision) => `revision-${String(revision).padStart(4, "0")}.js`;

export function createCanonicalRecordRevisionPath({ domain, recordSlug, revision } = {}) {
  if (!Object.values(CANONICAL_RECORD_DOMAINS).includes(domain) || !SLUG.test(recordSlug ?? "") || !Number.isInteger(revision) || revision < 1) return null;
  return `${CANONICAL_RECORD_DOMAIN_PATHS[domain]}/${recordSlug}/${revisionFile(revision)}`;
}

export function validateCanonicalRecordRevisionPath(value, { domain = null, recordSlug = null, revision = null } = {}) {
  const errors = [];
  if (typeof value !== "string" || !value.trim()) errors.push(entry("CANONICAL_RECORD_PATH_REQUIRED", "modulePath", "A canonical record module path is required."));
  const normalizedPath = typeof value === "string" ? value.trim().replaceAll("\\", "/") : null;
  if (normalizedPath && CANONICAL_RECORD_PROHIBITED_PATH_SEGMENTS.some((segment) => normalizedPath.split("/").includes(segment))) errors.push(entry("PROHIBITED_CANONICAL_RECORD_PATH", "modulePath", "Canonical records cannot live in a prohibited repository boundary."));
  const expectedPath = createCanonicalRecordRevisionPath({ domain, recordSlug, revision });
  if (!expectedPath) errors.push(entry("INVALID_CANONICAL_RECORD_PATH_INPUT", "modulePath", "Domain, record slug, and revision must identify a governed record path."));
  else if (normalizedPath !== expectedPath) errors.push(entry("CANONICAL_RECORD_PATH_MISMATCH", "modulePath", "Module path does not match the governed domain/revision convention."));
  return Object.freeze({ valid: errors.length === 0, normalizedPath, expectedPath, errors: freeze(errors), policyVersion: CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION });
}

function recordFacts(domain, record) {
  if (domain === CANONICAL_RECORD_DOMAINS.FOOTBALL_ENTITY) return {
    contractValid: isFootballEntity(record), identifierValid: isCanonicalFootballEntity(record), recordId: record?.entityId ?? null,
    revision: record?.versioning?.entityVersion ?? null, verification: record?.verification?.state ?? null, lifecycle: record?.status ?? null,
    verified: ["VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(record?.verification?.state), lifecycleEligible: ["ACTIVE", "HISTORICAL"].includes(record?.status),
    evidenceBacked: Boolean(record?.references?.researchSourceRefs?.length && record?.references?.evidenceArtifactRefs?.length), provenancePresent: Boolean(record?.provenance?.createdBy && record?.provenance?.createdAt),
  };
  if (domain === CANONICAL_RECORD_DOMAINS.DRAFT_SELECTION) return {
    contractValid: isDraftSelection(record), identifierValid: validateDraftSelectionIdentityConsistency(record).valid, recordId: record?.selectionRef ?? null,
    revision: record?.selectionRevision ?? null, verification: record?.verification?.state ?? null, lifecycle: record?.lifecycle?.state ?? null,
    verified: ["VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(record?.verification?.state), lifecycleEligible: record?.lifecycle?.state === "ACTIVE",
    evidenceBacked: Boolean(record?.sourceRefs?.length && record?.evidenceArtifactRefs?.length && record?.reviewRefs?.length), provenancePresent: Boolean(record?.provenance?.createdBy && record?.provenance?.createdAt),
  };
  return { contractValid: false, identifierValid: false, recordId: null, revision: null, verification: null, lifecycle: null, verified: false, lifecycleEligible: false, evidenceBacked: false, provenancePresent: false };
}

export function assessSourceControlledCanonicalRecord(input = {}) {
  const errors = []; const value = isObject(input) ? input : {};
  if (!isObject(input)) errors.push(entry("INVALID_CANONICAL_RECORD_ASSESSMENT_INPUT", "", "Assessment input must be an object."));
  const domain = value.domain; const record = value.record; const facts = recordFacts(domain, record);
  if (!Object.values(CANONICAL_RECORD_DOMAINS).includes(domain)) errors.push(entry("UNSUPPORTED_CANONICAL_RECORD_DOMAIN", "domain", "Canonical record domain is unsupported."));
  if (!facts.contractValid) errors.push(entry("INVALID_PRODUCTION_CONTRACT_RECORD", "record", "Record must satisfy its owning production contract."));
  if (!facts.identifierValid) errors.push(entry("INVALID_CANONICAL_RECORD_IDENTIFIER", "record", "Record identifier must satisfy its domain canonical-reference policy."));
  if (!Number.isInteger(facts.revision) || facts.revision < 1) errors.push(entry("INVALID_CANONICAL_RECORD_REVISION", "record", "Canonical record revision must be a positive integer."));
  if (!facts.verified) errors.push(entry("CANONICAL_RECORD_NOT_VERIFIED", "record.verification", "Source-controlled canonical records must be verified."));
  if (!facts.lifecycleEligible) errors.push(entry("CANONICAL_RECORD_LIFECYCLE_INELIGIBLE", "record.lifecycle", "Record lifecycle is not eligible for canonical production ownership."));
  if (!facts.evidenceBacked && !facts.provenancePresent) errors.push(entry("CANONICAL_RECORD_SUPPORT_REQUIRED", "record", "Evidence references or complete creation provenance are required."));
  if (Array.isArray(value.blockers) && value.blockers.length) errors.push(entry("UNRESOLVED_CANONICAL_RECORD_BLOCKERS", "blockers", "Canonical record blockers must be resolved."));
  if (!Object.isFrozen(record)) errors.push(entry("CANONICAL_RECORD_NOT_IMMUTABLE", "record", "Canonical record module must freeze the constructed record."));
  const recordSlug = value.recordSlug; const path = validateCanonicalRecordRevisionPath(value.modulePath, { domain, recordSlug, revision: facts.revision });
  errors.push(...path.errors);
  const prohibitedPersistenceFields = ["persistenceId", "persistence_id", "databaseRowId", "materializedAt", "databaseAcceptanceMetadata"].filter((key) => Object.hasOwn(record ?? {}, key));
  if (prohibitedPersistenceFields.length) errors.push(entry("PERSISTENCE_METADATA_IN_SOURCE_RECORD", prohibitedPersistenceFields[0], "Persistence-only metadata cannot enter a source-controlled domain record."));
  return Object.freeze({ eligible: errors.length === 0, domain, recordId: facts.recordId, revision: facts.revision, modulePath: path.normalizedPath, contractValid: facts.contractValid, identifierValid: facts.identifierValid, verified: facts.verified, lifecycleEligible: facts.lifecycleEligible, evidenceBacked: facts.evidenceBacked, provenancePresent: facts.provenancePresent, immutable: Object.isFrozen(record), persistencePerformed: false, runtimeRegistrationPerformed: false, errors: freeze(errors), policyVersion: CANONICAL_RECORD_OWNERSHIP_POLICY_VERSION, schemaVersion: CANONICAL_RECORD_OWNERSHIP_SCHEMA_VERSION });
}

export function isEligibleSourceControlledCanonicalRecord(input) {
  return assessSourceControlledCanonicalRecord(input).eligible;
}

export default Object.freeze({ createCanonicalRecordRevisionPath, validateCanonicalRecordRevisionPath, assessSourceControlledCanonicalRecord, isEligibleSourceControlledCanonicalRecord });
