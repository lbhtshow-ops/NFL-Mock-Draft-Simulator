$ErrorActionPreference = "Stop"

Write-Host "`n=== 2D.4A GOVERNANCE ==="
node .\src\engines\diagnostics\NFLPlayerImpactShadowDecisionValidationGovernanceDiagnostics.js
if ($LASTEXITCODE -ne 0) { throw "2D.4A governance failed." }

Write-Host "`n=== 2D.4B CANONICAL PATH PREFLIGHT ==="
node .\scripts\auditCanonicalPlayerImpactPropagationPreflight2D4.mjs
if ($LASTEXITCODE -ne 0) { throw "2D.4B canonical path preflight failed." }

Write-Host "`n=== 2D.4C OUT-OF-SEASON SHADOW DECISION VALIDATION ==="
python .\scripts\auditShadowTeamStrengthDecisionValidation2D4.py
if ($LASTEXITCODE -ne 0) { throw "2D.4C shadow decision validation failed." }

Write-Host "`n=== 2D.4 COMPLETE ==="
