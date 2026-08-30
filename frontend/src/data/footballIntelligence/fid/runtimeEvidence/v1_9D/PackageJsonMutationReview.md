# package.json mutation review

Node parsing passes. Textual and semantic comparison to HEAD show exactly one change: production `dependencies.pg = "8.22.0"`. It has no caret, tilde, or tag. No script, `engines`, direct dependency, dev dependency, name, version, module type, or other metadata changed. Classification: `EXACT_EXPECTED_PG_DEPENDENCY_MUTATION`.

