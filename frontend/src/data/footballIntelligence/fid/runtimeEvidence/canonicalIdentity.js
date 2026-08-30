import {
  REF_V1_CANONICALIZATION_PROFILES,
  REF_V1_CANONICALIZATION_VERSION,
  REF_V1_CONTENT_IDENTITY_PREFIX,
  REF_V1_CONTRACT_MODE,
  REF_V1_DIGEST_ENCODING,
  REF_V1_HASH_ALGORITHM,
} from "./runtimeEvidenceConstants.js";
import { deepFreeze } from "./contractSupport.js";

const CONTRACTS = Object.freeze([
  "GovernedOperationEvidenceManifest", "RuntimeEvidenceExecutionPlan", "RuntimeEvidenceObservationPlan",
  "RuntimeEvidencePackage", "RuntimeEvidenceClaimAssessment", "RuntimeEvidenceCustodyRecord", "RuntimeEvidenceReviewRecord",
]);
const EXCLUDED_FIELDS = Object.freeze(["validation", "contentIdentity", "derivedContentIdentity", "calculatedDigest", "verificationStatus"]);
const SENSITIVE_KEY = /^(?:password|passwd|access_?token|refresh_?token|api_?key|private_?key|connection_?string|authorization_?header|cookie|cookies|credentials?|raw_?credentials?|environment|environment_?dump|raw_?environment|role_?graph)$/i;
const AMBIGUOUS_KEY = /^(?:__proto__|prototype|constructor)$/;

export class RefCanonicalizationError extends TypeError {
  constructor(code, path, message = code) { super(message); this.name = "RefCanonicalizationError"; this.code = code; this.path = path; }
}

const fail = (code, path, message) => { throw new RefCanonicalizationError(code, path, message); };
const keyPath = (path, key) => `${path}.${key}`;

function canonical(value, path, ancestors) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("NON_FINITE_NUMBER", path);
    if (Object.is(value, -0)) fail("AMBIGUOUS_NEGATIVE_ZERO", path);
    return JSON.stringify(value);
  }
  if (typeof value === "undefined") fail("UNDEFINED_VALUE", path);
  if (typeof value === "function") fail("EXECUTABLE_VALUE", path);
  if (typeof value === "symbol") fail("SYMBOL_VALUE", path);
  if (typeof value === "bigint") fail("BIGINT_VALUE", path);
  if (typeof value !== "object") fail("UNSUPPORTED_VALUE", path);
  if (ancestors.has(value)) fail("CIRCULAR_REFERENCE", path);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) fail("NON_PLAIN_OBJECT", path);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (descriptor.get || descriptor.set) fail("EXECUTABLE_PROPERTY", keyPath(path, key));
    if (SENSITIVE_KEY.test(key)) fail("SENSITIVE_FIELD_VIOLATION", keyPath(path, key));
    if (AMBIGUOUS_KEY.test(key)) fail("AMBIGUOUS_FIELD", keyPath(path, key));
    if (!descriptor.enumerable && !(Array.isArray(value) && key === "length")) fail("NON_ENUMERABLE_FIELD", keyPath(path, key));
  }
  if (Object.getOwnPropertySymbols(value).length) fail("SYMBOL_KEY", path);
  ancestors.add(value);
  let result;
  if (Array.isArray(value)) {
    if (Object.keys(value).some((key) => !/^(0|[1-9]\d*)$/.test(key))) fail("AMBIGUOUS_ARRAY_FIELD", path);
    for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(value, index)) fail("SPARSE_ARRAY", `${path}[${index}]`);
    result = `[${value.map((item, index) => canonical(item, `${path}[${index}]`, ancestors)).join(",")}]`;
  } else {
    const keys = Object.keys(value).sort();
    result = `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key], keyPath(path, key), ancestors)}`).join(",")}}`;
  }
  ancestors.delete(value);
  return result;
}

export function canonicalizeRefValue(value) { return canonical(value, "$", new Set()); }

export function utf8Bytes(value) {
  if (typeof value !== "string") fail("STRING_REQUIRED", "$", "UTF-8 conversion requires a string.");
  return new TextEncoder().encode(value);
}

function assertBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) fail("BYTE_SEQUENCE_REQUIRED", "$", "Exact artifact identity requires Uint8Array bytes.");
}

export async function sha256Hex(bytes, cryptoProvider = globalThis.crypto) {
  assertBytes(bytes);
  if (!cryptoProvider?.subtle?.digest) fail("SHA256_PROVIDER_UNAVAILABLE", "$", "Web Crypto SHA-256 is unavailable.");
  const digest = await cryptoProvider.subtle.digest(REF_V1_HASH_ALGORITHM, bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function isCanonicalSha256Digest(value) { return typeof value === "string" && /^[0-9A-F]{64}$/.test(value); }

export async function verifyArtifactByteIdentity({ bytes, expectedDigest = null, artifactRef = null, provenanceRef = null }, cryptoProvider = globalThis.crypto) {
  assertBytes(bytes);
  if (expectedDigest !== null && !isCanonicalSha256Digest(expectedDigest)) fail("INVALID_DIGEST_FORMAT", "$.expectedDigest");
  const calculatedDigest = await sha256Hex(bytes, cryptoProvider);
  const matches = expectedDigest === null ? null : calculatedDigest === expectedDigest;
  return deepFreeze({
    profile: REF_V1_CANONICALIZATION_PROFILES.EXACT_ARTIFACT_BYTES, algorithm: REF_V1_HASH_ALGORITHM,
    encoding: REF_V1_DIGEST_ENCODING, artifactRef, provenanceRef, observedByteLength: bytes.byteLength,
    expectedDigest, calculatedDigest, comparisonOutcome: matches === null ? "NOT_REQUESTED" : matches ? "MATCH" : "MISMATCH",
    verificationStatus: matches === null ? "CALCULATED_NOT_COMPARED" : matches ? "LOCALLY_VERIFIED_EXACT_BYTES" : "DIGEST_MISMATCH",
    uncertainty: "LOCAL_BYTE_IDENTITY_DOES_NOT_PROVE_AUTHORIZATION_EXTERNAL_RECEIPT_OR_EXECUTION",
  });
}

export const REF_V1_CONTRACT_IDENTITY_POLICIES = deepFreeze(Object.fromEntries(CONTRACTS.map((contract) => [contract, {
  contract, identityBearingPolicy: "ALL_OWN_DECLARATION_FIELDS_EXCEPT_EXPLICIT_EXCLUSIONS",
  excludedFields: EXCLUDED_FIELDS, exclusionReason: "Validation is derived metadata; identity/digest and verification fields are excluded to prevent self-reference.",
  arrayPolicy: "PRESERVE_DECLARED_ORDER", extensionsIdentityBearing: true,
}])));

export function createStructuredIdentityPayload(declaration) {
  if (!declaration || typeof declaration !== "object" || Array.isArray(declaration)) fail("INVALID_CONTRACT_DECLARATION", "$");
  if (!CONTRACTS.includes(declaration.contract)) fail("UNSUPPORTED_REF_CONTRACT", "$.contract");
  if (declaration.contractMode !== REF_V1_CONTRACT_MODE || declaration.validation?.valid !== true) fail("INVALID_CONTRACT_DECLARATION", "$.validation");
  const content = Object.fromEntries(Object.entries(declaration).filter(([key]) => !EXCLUDED_FIELDS.includes(key)));
  return { domain: "LBHT:REF:STRUCTURED_DECLARATION", canonicalizationVersion: REF_V1_CANONICALIZATION_VERSION, contractType: declaration.contract, contractVersion: declaration.contractVersion, schemaVersion: declaration.schemaVersion, content };
}

export async function deriveRefContentIdentity(declaration, cryptoProvider = globalThis.crypto) {
  const payload = createStructuredIdentityPayload(declaration);
  const canonicalRepresentation = canonicalizeRefValue(payload);
  const digest = await sha256Hex(utf8Bytes(canonicalRepresentation), cryptoProvider);
  return deepFreeze({ profile: REF_V1_CANONICALIZATION_PROFILES.STRUCTURED_REF_DECLARATION, algorithm: REF_V1_HASH_ALGORITHM, encoding: REF_V1_DIGEST_ENCODING, digest, identity: `${REF_V1_CONTENT_IDENTITY_PREFIX}:${declaration.contract}:${digest}`, canonicalizationVersion: REF_V1_CANONICALIZATION_VERSION, canonicalRepresentation });
}
