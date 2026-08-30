import { FOOTBALL_ENTITY_TYPES } from "../constants/footballEntityConstants.js";
import { validateFootballEntityCanonicalReference } from "../contracts/FootballEntityReferencePolicy.js";
import { isDraftSelection } from "./DraftSelectionContract.js";
import {
  DRAFT_SELECTION_CANONICAL_NAMESPACE,
  DRAFT_SELECTION_CANONICAL_REFERENCE_PATTERN,
  DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION,
  DRAFT_SELECTION_CANONICAL_REFERENCE_SCHEMA_VERSION,
  DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS,
} from "./draftSelectionReferenceConstants.js";

const freezeEntries = (items) => Object.freeze(items.map((item) => Object.freeze(item)));
const issue = (code, path, message) => ({ code, path, message });
const result = ({ value, normalizedReference = null, namespace = null, draftCycleSegment = null, overallPick = null, classification, errors = [], warnings = [] }) => Object.freeze({
  valid: errors.length === 0,
  canonical: classification === DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS.CANONICAL && errors.length === 0,
  input: value,
  normalizedReference,
  namespace,
  draftCycleSegment,
  overallPick,
  classification,
  errors: freezeEntries(errors),
  warnings: freezeEntries(warnings),
  policyVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION,
  schemaVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_SCHEMA_VERSION,
});

export function normalizeDraftSelectionCanonicalReference(value) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export function isSyntheticDraftSelectionIdentifier(value) {
  const normalized = normalizeDraftSelectionCanonicalReference(value);
  return Boolean(normalized && (/^draft-selection:synthetic(?::|$)/.test(normalized) || /^selection:(?:revision|current|synthetic)(?::|$)/.test(normalized)));
}

export function isLegacyDraftSelectionIdentifier(value) {
  const normalized = normalizeDraftSelectionCanonicalReference(value);
  return Boolean(normalized && !DRAFT_SELECTION_CANONICAL_REFERENCE_PATTERN.test(normalized) && !isSyntheticDraftSelectionIdentifier(normalized) && !normalized.startsWith(`${DRAFT_SELECTION_CANONICAL_NAMESPACE}:`));
}

export function validateDraftSelectionCanonicalReference(value) {
  const normalizedReference = normalizeDraftSelectionCanonicalReference(value);
  const warnings = [];
  if (!normalizedReference) return result({ value, classification: DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS.INVALID, errors: [issue("CANONICAL_SELECTION_REFERENCE_REQUIRED", "selectionRef", "A canonical DraftSelection reference is required.")] });
  if (normalizedReference !== value) warnings.push(issue("CANONICAL_SELECTION_REFERENCE_NORMALIZED", "selectionRef", "Outer whitespace or letter case was normalized."));
  const match = DRAFT_SELECTION_CANONICAL_REFERENCE_PATTERN.exec(normalizedReference);
  if (!match) {
    const classification = isSyntheticDraftSelectionIdentifier(normalizedReference)
      ? DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS.SYNTHETIC
      : isLegacyDraftSelectionIdentifier(normalizedReference)
        ? DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS.LEGACY
        : DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS.INVALID;
    return result({ value, normalizedReference, classification, errors: [issue("INVALID_CANONICAL_SELECTION_REFERENCE", "selectionRef", "Canonical DraftSelection references must use draft-selection:<draft-cycle-segment>:overall-<positive-integer>.")], warnings });
  }
  const [, draftCycleSegment, overallPickText] = match;
  const overallPick = Number(overallPickText);
  const draftCycle = validateFootballEntityCanonicalReference(`draft-cycle:${draftCycleSegment}`, { entityType: FOOTBALL_ENTITY_TYPES.DRAFT_CYCLE });
  const errors = draftCycle.valid ? [] : [issue("INVALID_CANONICAL_DRAFT_CYCLE_SEGMENT", "selectionRef", "The selection reference must contain a valid canonical draft-cycle identity segment.")];
  return result({ value, normalizedReference, namespace: DRAFT_SELECTION_CANONICAL_NAMESPACE, draftCycleSegment, overallPick, classification: DRAFT_SELECTION_IDENTIFIER_CLASSIFICATIONS.CANONICAL, errors, warnings });
}

export function createDraftSelectionCanonicalReference({ draftCycleRef, overallPick } = {}) {
  const cycle = validateFootballEntityCanonicalReference(draftCycleRef, { entityType: FOOTBALL_ENTITY_TYPES.DRAFT_CYCLE });
  if (!cycle.valid || !Number.isInteger(overallPick) || overallPick < 1) return null;
  return `${DRAFT_SELECTION_CANONICAL_NAMESPACE}:${cycle.identitySegment}:overall-${overallPick}`;
}

export function isCanonicalDraftSelectionReference(value) {
  return validateDraftSelectionCanonicalReference(value).canonical;
}

export function validateDraftSelectionIdentityConsistency(value = {}) {
  const reference = validateDraftSelectionCanonicalReference(value?.selectionRef);
  const cycle = validateFootballEntityCanonicalReference(value?.draftCycleRef, { entityType: FOOTBALL_ENTITY_TYPES.DRAFT_CYCLE });
  const errors = [...reference.errors];
  if (!cycle.valid) errors.push(issue("CANONICAL_DRAFT_CYCLE_REFERENCE_REQUIRED", "draftCycleRef", "DraftSelection identity requires a canonical DRAFT_CYCLE reference."));
  if (!Number.isInteger(value?.overallPick) || value.overallPick < 1) errors.push(issue("POSITIVE_OVERALL_PICK_REQUIRED", "overallPick", "DraftSelection identity requires a positive integer overall pick."));
  if (reference.canonical && cycle.valid && reference.draftCycleSegment !== cycle.identitySegment) errors.push(issue("DRAFT_CYCLE_IDENTITY_MISMATCH", "draftCycleRef", "selectionRef and draftCycleRef identify different draft cycles."));
  if (reference.canonical && Number.isInteger(value?.overallPick) && reference.overallPick !== value.overallPick) errors.push(issue("OVERALL_PICK_IDENTITY_MISMATCH", "overallPick", "selectionRef and overallPick identify different selection slots."));
  return Object.freeze({ valid: errors.length === 0, canonical: reference.canonical && errors.length === 0, selectionRef: reference.normalizedReference, draftCycleRef: cycle.normalizedRef, overallPick: value?.overallPick ?? null, errors: freezeEntries(errors), warnings: reference.warnings, policyVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION, schemaVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_SCHEMA_VERSION });
}

export function assessDraftSelectionCanonicalIssuance(value) {
  const consistency = validateDraftSelectionIdentityConsistency(value);
  const errors = [...consistency.errors];
  if (!isDraftSelection(value)) errors.push(issue("INVALID_DRAFT_SELECTION_CONTRACT", "record", "Canonical issuance requires a contract-valid DraftSelection."));
  return Object.freeze({ eligible: errors.length === 0, canonical: consistency.canonical, selectionRef: consistency.selectionRef, errors: freezeEntries(errors), warnings: consistency.warnings, policyVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION, schemaVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_SCHEMA_VERSION });
}

export function validateDraftSelectionRevisionIdentityStability(predecessor, successor) {
  const errors = [];
  if (!isDraftSelection(predecessor) || !isDraftSelection(successor)) errors.push(issue("VALID_DRAFT_SELECTION_REVISIONS_REQUIRED", "records", "Both revisions must satisfy DraftSelectionContract."));
  if (predecessor?.selectionRef !== successor?.selectionRef) errors.push(issue("SELECTION_REFERENCE_CHANGED", "selectionRef", "A successor revision must preserve selectionRef."));
  if (predecessor?.draftCycleRef !== successor?.draftCycleRef) errors.push(issue("DRAFT_CYCLE_IDENTITY_CHANGED", "draftCycleRef", "A successor revision must preserve the identity draft cycle."));
  if (predecessor?.overallPick !== successor?.overallPick) errors.push(issue("OVERALL_PICK_IDENTITY_CHANGED", "overallPick", "A successor revision must preserve the identity overall pick."));
  if (Number.isInteger(predecessor?.selectionRevision) && Number.isInteger(successor?.selectionRevision) && successor.selectionRevision !== predecessor.selectionRevision + 1) errors.push(issue("REVISION_SEQUENCE_INVALID", "selectionRevision", "A successor revision must increment revision by one."));
  return Object.freeze({ valid: errors.length === 0, stable: errors.length === 0, selectionRef: successor?.selectionRef ?? null, errors: freezeEntries(errors), policyVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION });
}

export function assessDraftSelectionIdentifierUniqueness(records = []) {
  const errors = [];
  const refs = new Map(); const slots = new Map(); const revisions = new Set();
  if (!Array.isArray(records)) return Object.freeze({ valid: false, unique: false, errors: freezeEntries([issue("RECORD_COLLECTION_REQUIRED", "records", "An explicit DraftSelection collection is required.")]) });
  records.forEach((record, index) => {
    const consistency = validateDraftSelectionIdentityConsistency(record);
    if (!consistency.valid) errors.push(issue("INVALID_SELECTION_IDENTITY", `records[${index}]`, "Record does not have a consistent canonical selection identity."));
    const ref = consistency.selectionRef; const slot = `${record?.draftCycleRef}\u0000${record?.overallPick}`; const revisionKey = `${ref}\u0000${record?.selectionRevision}`;
    if (revisions.has(revisionKey)) errors.push(issue("DUPLICATE_SELECTION_REVISION", `records[${index}]`, "The same canonical selection revision appears more than once."));
    revisions.add(revisionKey);
    if (refs.has(ref) && refs.get(ref).slot !== slot) errors.push(issue("CANONICAL_REFERENCE_COLLISION", `records[${index}].selectionRef`, "One canonical reference identifies conflicting slots."));
    if (slots.has(slot) && slots.get(slot) !== ref) errors.push(issue("DRAFT_SLOT_COLLISION", `records[${index}]`, "One draft-cycle/overall-pick slot has competing canonical references."));
    refs.set(ref, { slot }); slots.set(slot, ref);
  });
  return Object.freeze({ valid: errors.length === 0, unique: errors.length === 0, recordCount: records.length, errors: freezeEntries(errors), policyVersion: DRAFT_SELECTION_CANONICAL_REFERENCE_POLICY_VERSION });
}

export default Object.freeze({ normalizeDraftSelectionCanonicalReference, createDraftSelectionCanonicalReference, validateDraftSelectionCanonicalReference, validateDraftSelectionIdentityConsistency, isCanonicalDraftSelectionReference, isLegacyDraftSelectionIdentifier, isSyntheticDraftSelectionIdentifier, assessDraftSelectionCanonicalIssuance, validateDraftSelectionRevisionIdentityStability, assessDraftSelectionIdentifierUniqueness });
