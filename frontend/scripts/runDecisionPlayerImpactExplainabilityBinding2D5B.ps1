$ErrorActionPreference = "Stop"

Write-Host "`n=== 2D.5B-A EXPLAINABILITY BINDING DIAGNOSTICS ==="
node .\src\engines\diagnostics\NFLDecisionPlayerImpactExplainabilityBindingDiagnostics.js
if ($LASTEXITCODE -ne 0) {
    throw "2D.5B-A explainability diagnostics failed."
}

Write-Host "`n=== 2D.5B-B CANONICAL BINDING PREFLIGHT ==="
node .\scripts\auditDecisionPlayerImpactExplainabilityBinding2D5B.mjs
if ($LASTEXITCODE -ne 0) {
    throw "2D.5B-B canonical binding preflight failed."
}

Write-Host "`n=== 2D.5B COMPLETE ==="
