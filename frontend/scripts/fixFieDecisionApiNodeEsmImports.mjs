
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.resolve(root, "services/fieDecisionApi/server.mjs");

if (!fs.existsSync(entry)) {
  throw new Error(
    "Run this script from the canonical Mock Draft Simulator frontend after Sprint 6B is installed."
  );
}

const supportedExtensions = [".js", ".mjs", ".jsx", ".json"];
const indexCandidates = ["index.js", "index.mjs", "index.jsx"];

const importPattern =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.[^"']+)\2/g;

const visited = new Set();
const planned = new Map();

function toPosixRelative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function resolveSpecifier(importer, specifier) {
  const base = path.resolve(path.dirname(importer), specifier);

  const explicitExtension = path.extname(base);
  if (explicitExtension) {
    if (fs.existsSync(base) && fs.statSync(base).isFile()) {
      return { target: base, replacement: specifier };
    }
    return null;
  }

  for (const extension of supportedExtensions) {
    const candidate = `${base}${extension}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return {
        target: candidate,
        replacement: `${specifier}${extension}`,
      };
    }
  }

  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const indexName of indexCandidates) {
      const candidate = path.join(base, indexName);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return {
          target: candidate,
          replacement: `${specifier.replace(/\/+$/, "")}/${indexName}`,
        };
      }
    }
  }

  return null;
}

function scan(file) {
  const normalized = path.resolve(file);
  if (visited.has(normalized)) return;
  visited.add(normalized);

  if (!fs.existsSync(normalized)) return;

  const extension = path.extname(normalized);
  if (![".js", ".mjs", ".jsx"].includes(extension)) return;

  const source = fs.readFileSync(normalized, "utf8");
  const changes = [];

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[3];

    if (!specifier.startsWith(".")) continue;

    const resolved = resolveSpecifier(normalized, specifier);
    if (!resolved) continue;

    if (resolved.replacement !== specifier) {
      changes.push({
        from: specifier,
        to: resolved.replacement,
      });
    }

    scan(resolved.target);
  }

  if (changes.length) {
    planned.set(normalized, changes);
  }
}

scan(entry);

const timestamp = new Date()
  .toISOString()
  .replaceAll(":", "")
  .replaceAll("-", "")
  .replace(/\..+$/, "");

const backupRoot = path.resolve(
  root,
  "..",
  "backups",
  `FIE-Node-ESM-${timestamp}`
);

console.log(
  `Reachable JS/ESM modules scanned: ${visited.size}`
);
console.log(
  `Files requiring Node ESM compatibility changes: ${planned.size}`
);

if (!planned.size) {
  console.log("No changes required.");
  process.exit(0);
}

for (const [file, changes] of planned) {
  console.log(`\n${toPosixRelative(file)}`);
  for (const change of changes) {
    console.log(`  ${change.from} -> ${change.to}`);
  }
}

for (const [file, changes] of planned) {
  const relative = path.relative(root, file);
  const backup = path.resolve(backupRoot, relative);

  fs.mkdirSync(path.dirname(backup), {
    recursive: true,
  });

  fs.copyFileSync(file, backup);

  let source = fs.readFileSync(file, "utf8");

  for (const change of changes) {
    const escaped = change.from.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const exactSpecifier = new RegExp(
      `(["'])${escaped}\\1`,
      "g"
    );

    source = source.replace(
      exactSpecifier,
      (whole, quote) =>
        `${quote}${change.to}${quote}`
    );
  }

  fs.writeFileSync(file, source, "utf8");
}

console.log(
  `\nApplied Node ESM compatibility changes to ${planned.size} files.`
);
console.log(`Backup: ${backupRoot}`);
console.log(
  "No business logic, scoring rules, model parameters, SQL, or database state were changed."
);
