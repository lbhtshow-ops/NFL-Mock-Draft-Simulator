
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.resolve(root, "services/fieDecisionApi/server.mjs");

const JS_EXTENSIONS = new Set([".js", ".mjs", ".jsx"]);
const visited = new Set();
const unresolved = [];
const incompatible = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function walk(file) {
  const full = path.resolve(file);
  if (visited.has(full)) return;
  visited.add(full);

  if (!fs.existsSync(full)) {
    unresolved.push({
      importer: rel(full),
      specifier: "<entry missing>",
    });
    return;
  }

  if (!JS_EXTENSIONS.has(path.extname(full))) return;

  const source = fs.readFileSync(full, "utf8");

  const dependencyPattern =
    /(?:from\s*|import\s*\(\s*|import\s+)(["'])(\.[^"']+)\1/g;

  for (const match of source.matchAll(dependencyPattern)) {
    const specifier = match[2];
    const base = path.resolve(path.dirname(full), specifier);

    if (specifier.endsWith(".json")) {
      const around = source.slice(
        Math.max(0, match.index - 80),
        Math.min(source.length, match.index + 220)
      );

      const staticOkay =
        /with\s*\{\s*type\s*:\s*["']json["']\s*\}/.test(around);

      const dynamicOkay =
        /import\s*\([^)]*\.json[^)]*,\s*\{\s*with\s*:\s*\{\s*type\s*:\s*["']json["']/.test(around);

      if (!staticOkay && !dynamicOkay) {
        incompatible.push({
          importer: rel(full),
          specifier,
        });
      }

      continue;
    }

    if (path.extname(base)) {
      if (fs.existsSync(base) && JS_EXTENSIONS.has(path.extname(base))) {
        walk(base);
      } else if (!fs.existsSync(base)) {
        unresolved.push({
          importer: rel(full),
          specifier,
        });
      }
      continue;
    }

    let resolved = null;

    for (const ext of [".js", ".mjs", ".jsx"]) {
      const candidate = `${base}${ext}`;
      if (fs.existsSync(candidate)) {
        resolved = candidate;
        break;
      }
    }

    if (!resolved && fs.existsSync(base) && fs.statSync(base).isDirectory()) {
      for (const indexName of ["index.js", "index.mjs", "index.jsx"]) {
        const candidate = path.join(base, indexName);
        if (fs.existsSync(candidate)) {
          resolved = candidate;
          break;
        }
      }
    }

    if (resolved) {
      walk(resolved);
    }
  }
}

walk(entry);

const tests = [
  {
    name: "entry-exists",
    passed: fs.existsSync(entry),
  },
  {
    name: "json-imports-use-explicit-type",
    passed: incompatible.length === 0,
    detail: incompatible.slice(0, 20),
  },
  {
    name: "reachable-module-resolution-remains-clean",
    passed: unresolved.length === 0,
    detail: unresolved.slice(0, 20),
  },
];

const failed = tests.filter((test) => !test.passed);

console.log(
  JSON.stringify(
    {
      suite:
        "LBHT FIE Decision API Node JSON Module Compatibility Diagnostics",
      reachableModules: visited.size,
      passed: tests.length - failed.length,
      failed: failed.length,
      tests,
    },
    null,
    2
  )
);

if (failed.length) {
  process.exitCode = 1;
}
