import { FOOTBALL_ENTITY_TYPES } from "../constants/footballEntityConstants.js";
import { isFootballEntity } from "./FootballEntityContract.js";
import {
  FOOTBALL_ENTITY_CANONICAL_NAMESPACES,
  FOOTBALL_ENTITY_CANONICAL_REFERENCE_MAX_LENGTH,
  FOOTBALL_ENTITY_CANONICAL_REFERENCE_POLICY_VERSION,
  FOOTBALL_ENTITY_CANONICAL_REFERENCE_SCHEMA_VERSION,
  FOOTBALL_ENTITY_CANONICAL_REFERENCE_SEPARATOR,
} from "../constants/footballEntityReferenceConstants.js";

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const namespaceToType = new Map(Object.entries(FOOTBALL_ENTITY_CANONICAL_NAMESPACES).map(([type, namespace]) => [namespace, type]));
const freezeEntries = (items) => Object.freeze(items.map((entry) => Object.freeze(entry)));
const result = (value, normalizedRef, namespace, identitySegment, errors, warnings) => Object.freeze({
  valid: errors.length === 0,
  input: value,
  normalizedRef,
  namespace,
  identitySegment,
  entityType: namespaceToType.get(namespace) ?? null,
  errors: freezeEntries(errors),
  warnings: freezeEntries(warnings),
  policyVersion: FOOTBALL_ENTITY_CANONICAL_REFERENCE_POLICY_VERSION,
  schemaVersion: FOOTBALL_ENTITY_CANONICAL_REFERENCE_SCHEMA_VERSION,
});

export function normalizeFootballEntityCanonicalReference(value) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export function validateFootballEntityCanonicalReference(value, { entityType = null } = {}) {
  const errors = []; const warnings = [];
  const normalizedRef = normalizeFootballEntityCanonicalReference(value);
  if (!normalizedRef) return result(value, null, null, null, [{ code: "CANONICAL_REFERENCE_REQUIRED", path: "canonicalRef", message: "A non-empty canonical reference is required." }], warnings);
  if (normalizedRef !== value) warnings.push({ code: "CANONICAL_REFERENCE_NORMALIZED", path: "canonicalRef", message: "Canonical reference was trimmed or lowercased." });
  if (normalizedRef.length > FOOTBALL_ENTITY_CANONICAL_REFERENCE_MAX_LENGTH) errors.push({ code: "CANONICAL_REFERENCE_TOO_LONG", path: "canonicalRef", message: `Canonical reference exceeds ${FOOTBALL_ENTITY_CANONICAL_REFERENCE_MAX_LENGTH} characters.` });
  const parts = normalizedRef.split(FOOTBALL_ENTITY_CANONICAL_REFERENCE_SEPARATOR);
  if (parts.length !== 2) errors.push({ code: "INVALID_CANONICAL_REFERENCE_STRUCTURE", path: "canonicalRef", message: "Canonical references require exactly one namespace separator." });
  const [namespace = null, identitySegment = null] = parts;
  if (!namespace) errors.push({ code: "CANONICAL_NAMESPACE_REQUIRED", path: "canonicalRef.namespace", message: "Canonical namespace is required." });
  else if (!SEGMENT.test(namespace)) errors.push({ code: "INVALID_CANONICAL_NAMESPACE", path: "canonicalRef.namespace", message: "Canonical namespace contains unsupported characters." });
  else if (!namespaceToType.has(namespace)) errors.push({ code: "UNSUPPORTED_CANONICAL_NAMESPACE", path: "canonicalRef.namespace", message: "Canonical namespace is not governed by FootballEntity." });
  if (!identitySegment) errors.push({ code: "CANONICAL_IDENTITY_SEGMENT_REQUIRED", path: "canonicalRef.identitySegment", message: "Canonical identity segment is required." });
  else if (!SEGMENT.test(identitySegment)) errors.push({ code: "INVALID_CANONICAL_IDENTITY_SEGMENT", path: "canonicalRef.identitySegment", message: "Identity segment must use lowercase letters, numbers, and single hyphens." });
  if (entityType != null && !Object.values(FOOTBALL_ENTITY_TYPES).includes(entityType)) errors.push({ code: "INVALID_ENTITY_TYPE", path: "entityType", message: "Entity type is not governed by FootballEntity." });
  const expectedNamespace = entityType ? FOOTBALL_ENTITY_CANONICAL_NAMESPACES[entityType] : null;
  if (expectedNamespace && namespace && namespace !== expectedNamespace) errors.push({ code: "CANONICAL_NAMESPACE_ENTITY_TYPE_MISMATCH", path: "canonicalRef.namespace", message: `Namespace ${namespace} is incompatible with ${entityType}.` });
  if (entityType === FOOTBALL_ENTITY_TYPES.UNKNOWN) errors.push({ code: "UNKNOWN_ENTITY_TYPE_NOT_ISSUABLE", path: "entityType", message: "UNKNOWN cannot issue a canonical reference." });
  return result(value, normalizedRef, namespace, identitySegment, errors, warnings);
}

export function createFootballEntityCanonicalReference(entityType, identitySegment) {
  const namespace = FOOTBALL_ENTITY_CANONICAL_NAMESPACES[entityType];
  if (!namespace || typeof identitySegment !== "string") return null;
  const validation = validateFootballEntityCanonicalReference(`${namespace}:${identitySegment}`, { entityType });
  return validation.valid ? validation.normalizedRef : null;
}

export function isCanonicalFootballEntityReference(value, options = {}) {
  return validateFootballEntityCanonicalReference(value, options).valid;
}

export function isLegacyFootballEntityIdentifier(value) {
  return typeof value === "string" && Boolean(value.trim()) && !value.includes(FOOTBALL_ENTITY_CANONICAL_REFERENCE_SEPARATOR);
}

export function validateCanonicalFootballEntityIdentity(value) {
  const reference = validateFootballEntityCanonicalReference(value?.entityId, { entityType: value?.entityType ?? null });
  const errors = [...reference.errors]; const warnings = [...reference.warnings];
  const canonicalRef = reference.normalizedRef;
  const aliases = Array.isArray(value?.aliases) ? value.aliases : [];
  aliases.forEach((entry, index) => {
    if (canonicalRef && typeof entry?.alias === "string" && entry.alias.trim().toLowerCase() === canonicalRef) errors.push({ code: "CANONICAL_REFERENCE_ALIAS_CONFLICT", path: `aliases[${index}].alias`, message: "Canonical reference cannot also be an alias." });
    if (entry?.aliasType === "ABBREVIATION" && isCanonicalFootballEntityReference(entry?.alias)) warnings.push({ code: "CANONICAL_SHAPED_ABBREVIATION", path: `aliases[${index}].alias`, message: "An abbreviation remains an alias and is not issued as canonical." });
  });
  return Object.freeze({ valid: errors.length === 0, canonicalRef, legacyCompatible: isLegacyFootballEntityIdentifier(value?.entityId), errors: freezeEntries(errors), warnings: freezeEntries(warnings), policyVersion: FOOTBALL_ENTITY_CANONICAL_REFERENCE_POLICY_VERSION, schemaVersion: FOOTBALL_ENTITY_CANONICAL_REFERENCE_SCHEMA_VERSION });
}

export function isCanonicalFootballEntity(value) {
  return Boolean(isFootballEntity(value) && validateCanonicalFootballEntityIdentity(value).valid);
}

export default Object.freeze({
  normalizeFootballEntityCanonicalReference,
  validateFootballEntityCanonicalReference,
  createFootballEntityCanonicalReference,
  isCanonicalFootballEntityReference,
  isLegacyFootballEntityIdentifier,
  validateCanonicalFootballEntityIdentity,
  isCanonicalFootballEntity,
});
