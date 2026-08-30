$ErrorActionPreference = "Stop"

Write-Host "`n=== 2D.4-R2A GOVERNANCE ==="
node .\src\engines\diagnostics\NFLPlayerImpactValidationJoinRecoveryGovernanceDiagnostics.js
if ($LASTEXITCODE -ne 0) { throw "2D.4-R2A governance failed." }

Write-Host "`n=== 2D.4-R2B JOIN INPUT PREFLIGHT ==="
node .\scripts\auditValidationJoinInputs2D4R2.mjs
if ($LASTEXITCODE -ne 0) { throw "2D.4-R2B join input preflight failed." }

Write-Host "`n=== 2D.4-R2C FIVE-SEASON SHADOW VALIDATION ==="
python .\scripts\auditShadowTeamStrengthDecisionValidation2D4.py
if ($LASTEXITCODE -ne 0) { throw "2D.4-R2C shadow validation failed." }

Write-Host "`n=== 2D.4-R2 COMPLETE ==="
