$ErrorActionPreference = "Stop"

Write-Host "`n=== 2D.4-R4A GOVERNANCE ==="
node .\src\engines\diagnostics\NFLPlayerImpactFixedCandidateConfirmationGovernanceDiagnostics.js
if ($LASTEXITCODE -ne 0) { throw "2D.4-R4A governance failed." }

Write-Host "`n=== 2D.4-R4B FIXED CANDIDATE CONFIRMATION ==="
python .\scripts\confirmFixedPlayerImpactCandidate2D4R4.py
if ($LASTEXITCODE -ne 0) { throw "2D.4-R4B fixed candidate confirmation failed." }

Write-Host "`n=== 2D.4-R4 COMPLETE ==="
