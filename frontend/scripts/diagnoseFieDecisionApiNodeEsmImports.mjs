
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.resolve(root, "services/fieDecisionApi/server.mjs");

const supportedExtensions = [".js", ".mjs", ".jsx", ".json"];
const indexCandidates = ["index.js", "index.mjs", "index.jsx"];
const importPattern =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.[^"']+)\2/g;

const visited = new Set();
const unresolved = [];
const incompatible = [];

function resolve(importer, specifier) {
  const base = path.resolve(path.dirname(importer), specifier);

  if (path.extname(base)) {
    return fs.existsSync(base) ? base : null;
  }

  for (const extension of supportedExtensions) {
    const candidate = `${base}${extension}`;
    if (fs.existsSync(candidate)) {
      incompatible.push({
        file: path.relative(root, importer),
        specifier,
        target: path.relative(root, candidate),
      });
      return candidate;
    }
  }

  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const indexName of indexCandidates) {
      const candidate = path.join(base, indexName);
      if (fs.existsSync(candidate)) {
        incompatible.push({
          file: path.relative(root, importer),
          specifier,
          target: path.relative(root, candidate),
        });
        return candidate;
      }
    }
  }

  unresolved.push({
    file: path.relative(root, importer),
    specifier,
  });

  return null;
}

function scan(file) {
  const normalized = path.resolve(file);
  if (visited.has(normalized)) return;
  visited.add(normalized);

  if (!fs.existsSync(normalized)) {
    unresolved.push({
      file: path.relative(root, normalized),
      specifier: "<entry missing>",
    });
    return;
  }

  if (![".js", ".mjs", ".jsx"].includes(path.extname(normalized))) {
    return;
  }

  const source = fs.readFileSync(normalized, "utf8");

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[3];
    if (!specifier.startsWith(".")) continue;

    const target = resolve(normalized, specifier);
    if (target) scan(target);
  }
}

scan(entry);

const tests = [
  {
    name: "entry-exists",
    passed: fs.existsSync(entry),
  },
  {
    name: "no-extensionless-reachable-imports",
    passed: incompatible.length === 0,
    detail: incompatible.slice(0, 20),
  },
  {
    name: "no-unresolved-reachable-imports",
    passed: unresolved.length === 0,
    detail: unresolved.slice(0, 20),
  },
];

const failed = tests.filter((test) => !test.passed);

console.log(
  JSON.stringify(
    {
      suite:
        "LBHT FIE Decision API Node ESM Compatibility Diagnostics",
      reachableModules:
        visited.size,
      passed:
        tests.length - failed.length,
      failed:
        failed.length,
      tests,
    },
    null,
    2
  )
);

if (failed.length) {
  process.exitCode = 1;
}
