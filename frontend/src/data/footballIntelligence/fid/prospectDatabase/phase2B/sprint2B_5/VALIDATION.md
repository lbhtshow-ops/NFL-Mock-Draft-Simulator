# Validation

```powershell
npm.cmd run build
node src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_1/runDiagnostics.mjs
node src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_2/runDiagnostics.mjs
node src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_5/runDiagnostics.mjs
npx.cmd eslint src/App.jsx src/pages/DraftResultsPreview.jsx src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_5/*.js src/data/footballIntelligence/fid/prospectDatabase/phase2B/sprint2B_5/*.mjs
```

Then inspect `/__dev/draft-results-preview` at desktop, tablet, and mobile widths.
