$ErrorActionPreference = "Stop"

Write-Host "`n=== 2D.5C-A DIRECTIONAL EXPLAINABILITY DIAGNOSTICS ==="
node .\src\engines\diagnostics\NFLGameIntelligenceDirectionalExplainabilityDiagnostics.js
if ($LASTEXITCODE -ne 0) { throw "2D.5C-A diagnostics failed." }

Write-Host "`n=== 2D.5C-B DECISION API MAPPER DIAGNOSTICS ==="
node .\scripts\diagnoseFIEDecisionApiDirectionalExplainability2D5C.mjs
if ($LASTEXITCODE -ne 0) { throw "2D.5C-B mapper diagnostics failed." }

Write-Host "`n=== 2D.5C-C CONTRACT PREFLIGHT ==="
node .\scripts\auditGameIntelligenceDirectionalExplainability2D5C.mjs
if ($LASTEXITCODE -ne 0) { throw "2D.5C-C preflight failed." }

Write-Host "`n=== 2D.5C COMPLETE ==="
