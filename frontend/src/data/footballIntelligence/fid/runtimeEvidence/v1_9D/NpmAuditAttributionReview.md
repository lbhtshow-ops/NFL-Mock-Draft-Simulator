# npm audit attribution review

The captured summary reports 17 vulnerability groups by severity. The operator-provided terminal record names the following affected packages, but repository evidence does not retain advisory IDs, per-package severity, detailed advisory paths, or remediation ranges. Those cells are explicitly unresolved; no second network audit was run.

Every named package/version below existed unchanged in the before lockfile. None is in the resolved pg tree. Thus each named group is inherited and unrelated to the pg runtime path; the count/advisory-detail reconciliation remains limited by the missing full audit capture.

| Affected package (before version) | Severity | Advisory IDs | Dependency path | Before | Introduced/changed by pg | pg path | Remediation available | Authorized | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| @babel/core 7.26.10 | unresolved | unresolved | @vitejs/plugin-react | true | false/false | false | unresolved | false | inherited review |
| @eslint/plugin-kit 0.3.3 | unresolved | unresolved | eslint | true | false/false | false | unresolved | false | inherited review |
| ajv 6.12.6 | unresolved | unresolved | eslint | true | false/false | false | unresolved | false | inherited review |
| axios 1.10.0 | unresolved | unresolved | direct | true | false/false | false | unresolved | false | inherited review |
| brace-expansion 1.1.12 | unresolved | unresolved | eslint > minimatch | true | false/false | false | unresolved | false | inherited review |
| flatted 3.3.3 | unresolved | unresolved | eslint > file-entry-cache | true | false/false | false | unresolved | false | inherited review |
| follow-redirects 1.15.9 | unresolved | unresolved | axios | true | false/false | false | unresolved | false | inherited review |
| form-data 4.0.3 | unresolved | unresolved | axios | true | false/false | false | unresolved | false | inherited review |
| js-yaml 4.1.0 | unresolved | unresolved | eslint | true | false/false | false | unresolved | false | inherited review |
| minimatch 3.1.2 | unresolved | unresolved | eslint | true | false/false | false | unresolved | false | inherited review |
| picomatch 4.0.2 | unresolved | unresolved | vite | true | false/false | false | unresolved | false | inherited review |
| postcss 8.5.3 | unresolved | unresolved | vite | true | false/false | false | unresolved | false | inherited review |
| react-router 7.6.2 | unresolved | unresolved | react-router-dom | true | false/false | false | unresolved | false | inherited review |
| react-router-dom 7.6.2 | unresolved | unresolved | direct | true | false/false | false | unresolved | false | inherited review |
| rollup 4.40.0 | unresolved | unresolved | vite | true | false/false | false | unresolved | false | inherited review |
| vite 6.3.5 | unresolved | unresolved | direct dev | true | false/false | false | unresolved | false | inherited review |
| yaml 1.10.2 | unresolved | unresolved | react-select > emotion > macros > cosmiconfig | true | false/false | false | unresolved | false | inherited review |

Conclusion: `NO_REVIEWED_PG_TREE_ADVISORY_INTRODUCED_BY_THIS_INSTALLATION`. This does not claim that an uncaptured current advisory database contains no pg advisory; it attributes the actual displayed package set and unchanged lock evidence.

