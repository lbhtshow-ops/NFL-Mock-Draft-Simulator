import { REF_V1_CONTRACT_MODE, REF_V1_CONTRACT_VERSION, REF_V1_MAX_COLLECTION_SIZE, REF_V1_MAX_EXTENSION_KEYS, REF_V1_SCHEMA_VERSION } from "./runtimeEvidenceConstants.js";

const sensitiveKey = /(password|credential|secret|token|connectionstring|connection_string|privatekey|private_key|rawenvironment|environmentdump|rolegraph|sql)/i;
const executableKey = /(execute|executor|callback|retry|remediat|reconcil|consumeauthorization|grantauthority|networkclient|databaseclient|filesystemwriter)/i;

export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export function validateDeclaration(input, { required = [], arrays = [], uniqueArrays = [], enumFields = {}, forbidden = [] } = {}) {
  const errors = [];
  for (const field of required) if (typeof input[field] !== "string" || !input[field].trim()) errors.push({ code: "REQUIRED_REFERENCE", path: field });
  for (const field of arrays) {
    if (!Array.isArray(input[field])) errors.push({ code: "COLLECTION_REQUIRED", path: field });
    else if (input[field].length > REF_V1_MAX_COLLECTION_SIZE) errors.push({ code: "COLLECTION_LIMIT_EXCEEDED", path: field });
  }
  for (const field of uniqueArrays) if (Array.isArray(input[field]) && new Set(input[field]).size !== input[field].length) errors.push({ code: "DUPLICATE_REFERENCE", path: field });
  for (const [field, allowed] of Object.entries(enumFields)) if (!Object.values(allowed).includes(input[field])) errors.push({ code: "UNSUPPORTED_DECLARATION", path: field });
  for (const field of forbidden) if (input[field] != null) errors.push({ code: "PROHIBITED_FIELD", path: field });
  const visit = (value, path = "") => {
    if (typeof value === "function") { errors.push({ code: "EXECUTABLE_PROHIBITED", path }); return; }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const next = path ? `${path}.${key}` : key;
      if (sensitiveKey.test(key)) errors.push({ code: "SENSITIVE_FIELD_PROHIBITED", path: next });
      if (executableKey.test(key) && child != null && child !== false) errors.push({ code: "BEHAVIOR_FIELD_PROHIBITED", path: next });
      visit(child, next);
    }
  };
  visit(input);
  const extensionKeys = input.extensions && typeof input.extensions === "object" ? Object.keys(input.extensions) : [];
  if (extensionKeys.length > REF_V1_MAX_EXTENSION_KEYS) errors.push({ code: "EXTENSION_LIMIT_EXCEEDED", path: "extensions" });
  if (extensionKeys.some((key) => required.includes(key) || ["contract", "contractVersion", "schemaVersion", "validation"].includes(key))) errors.push({ code: "EXTENSION_OVERRIDE_PROHIBITED", path: "extensions" });
  return errors;
}

export function declaration(contract, owned, errors) {
  return deepFreeze({ contract, contractVersion: REF_V1_CONTRACT_VERSION, schemaVersion: REF_V1_SCHEMA_VERSION, contractMode: REF_V1_CONTRACT_MODE, ...owned, extensions: owned.extensions && typeof owned.extensions === "object" ? { ...owned.extensions } : {}, validation: { valid: errors.length === 0, errors } });
}

