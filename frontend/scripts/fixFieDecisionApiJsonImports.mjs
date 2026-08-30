
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.resolve(root, "services/fieDecisionApi/server.mjs");

if (!fs.existsSync(entry)) {
  throw new Error(
    "Run this script from the canonical Mock Draft Simulator frontend after Sprint 6B is installed."
  );
}

const JS_EXTENSIONS = new Set([".js", ".mjs", ".jsx"]);
const STATIC_IMPORT_RE =
  /(^|\n)(\s*import\s+[^;\n]+?\s+from\s+)(["'])(\.[^"']+\.json)\3(\s*;?)/g;
const SIDE_EFFECT_IMPORT_RE =
  /(^|\n)(\s*import\s+)(["'])(\.[^"']+\.json)\3(\s*;?)/g;
const DYNAMIC_IMPORT_RE =
  /\bimport\s*\(\s*(["'])(\.[^"']+\.json)\1\s*\)/g;

const visited = new Set();
const changesByFile = new Map();
const unresolved = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function discoverModuleGraph(file) {
  const full = path.resolve(file);
  if (visited.has(full)) return;
  visited.add(full);

  if (!fs.existsSync(full)) return;
  if (!JS_EXTENSIONS.has(path.extname(full))) return;

  const source = fs.readFileSync(full, "utf8");

  const dependencyPattern =
    /(?:from\s*|import\s*\(\s*|import\s+)(["'])(\.[^"']+)\1/g;

  for (const match of source.matchAll(dependencyPattern)) {
    const specifier = match[2];
    const base = path.resolve(path.dirname(full), specifier);

    if (path.extname(base)) {
      if (fs.existsSync(base)) {
        if (JS_EXTENSIONS.has(path.extname(base))) {
          discoverModuleGraph(base);
        }
      } else {
        unresolved.push({
          importer: rel(full),
          specifier,
        });
      }
      continue;
    }

    for (const ext of [".js", ".mjs", ".jsx", ".json"]) {
      const candidate = `${base}${ext}`;
      if (fs.existsSync(candidate)) {
        if (JS_EXTENSIONS.has(ext)) {
          discoverModuleGraph(candidate);
        }
        break;
      }
    }

    if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
      for (const indexName of ["index.js", "index.mjs", "index.jsx"]) {
        const candidate = path.join(base, indexName);
        if (fs.existsSync(candidate)) {
          discoverModuleGraph(candidate);
          break;
        }
      }
    }
  }
}

discoverModuleGraph(entry);

function planJsonFixes(file) {
  const source = fs.readFileSync(file, "utf8");
  const edits = [];

  let match;

  STATIC_IMPORT_RE.lastIndex = 0;
  while ((match = STATIC_IMPORT_RE.exec(source))) {
    const fullMatch = match[0];

    if (/\bwith\s*\{\s*type\s*:\s*["']json["']\s*\}/.test(fullMatch)) {
      continue;
    }

    edits.push({
      kind: "static",
      original: fullMatch,
      replacement:
        `${match[1]}${match[2]}${match[3]}${match[4]}${match[3]} with { type: "json" }${match[5]}`,
    });
  }

  SIDE_EFFECT_IMPORT_RE.lastIndex = 0;
  while ((match = SIDE_EFFECT_IMPORT_RE.exec(source))) {
    const fullMatch = match[0];

    if (/\bwith\s*\{\s*type\s*:\s*["']json["']\s*\}/.test(fullMatch)) {
      continue;
    }

    edits.push({
      kind: "side-effect",
      original: fullMatch,
      replacement:
        `${match[1]}${match[2]}${match[3]}${match[4]}${match[3]} with { type: "json" }${match[5]}`,
    });
  }

  DYNAMIC_IMPORT_RE.lastIndex = 0;
  while ((match = DYNAMIC_IMPORT_RE.exec(source))) {
    edits.push({
      kind: "dynamic",
      original: match[0],
      replacement:
        `import(${match[1]}${match[2]}${match[1]}, { with: { type: "json" } })`,
    });
  }

  if (edits.length) {
    changesByFile.set(file, edits);
  }
}

for (const file of visited) {
  if (JS_EXTENSIONS.has(path.extname(file))) {
    planJsonFixes(file);
  }
}

console.log(`Reachable JS/ESM modules scanned: ${visited.size}`);
console.log(`Files requiring JSON import-attribute changes: ${changesByFile.size}`);

for (const [file, edits] of changesByFile) {
  console.log(`\n${rel(file)}`);
  for (const edit of edits) {
    console.log(`  ${edit.kind}: JSON import -> explicit type=json`);
  }
}

if (!changesByFile.size) {
  console.log("\nNo JSON import compatibility changes required.");
  process.exit(0);
}

const timestamp = new Date()
  .toISOString()
  .replaceAll(":", "")
  .replaceAll("-", "")
  .replace(/\..+$/, "");

const backupRoot = path.resolve(
  root,
  "..",
  "backups",
  `FIE-Node-JSON-${timestamp}`
);

for (const [file, edits] of changesByFile) {
  const backup = path.resolve(
    backupRoot,
    path.relative(root, file)
  );

  fs.mkdirSync(path.dirname(backup), {
    recursive: true,
  });

  fs.copyFileSync(file, backup);

  let source = fs.readFileSync(file, "utf8");

  for (const edit of edits) {
    source = source.replace(
      edit.original,
      edit.replacement
    );
  }

  fs.writeFileSync(file, source, "utf8");
}

console.log(
  `\nApplied JSON module compatibility changes to ${changesByFile.size} files.`
);
console.log(`Backup: ${backupRoot}`);
console.log(
  "No JSON data, football logic, scoring rules, model parameters, SQL, or database state were changed."
);
