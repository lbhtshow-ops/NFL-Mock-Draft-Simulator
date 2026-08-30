$ErrorActionPreference = "Stop"

Write-Host "`n=== 2D.4-R3A GOVERNANCE ==="
node .\src\engines\diagnostics\NFLPlayerImpactCandidateCalibrationAblationGovernanceDiagnostics.js
if ($LASTEXITCODE -ne 0) { throw "2D.4-R3A governance failed." }

Write-Host "`n=== 2D.4-R3B CANDIDATE CALIBRATION & ABLATION ==="
python .\scripts\auditPlayerImpactCandidateCalibrationAblation2D4R3.py
if ($LASTEXITCODE -ne 0) { throw "2D.4-R3B candidate audit failed." }

Write-Host "`n=== 2D.4-R3 COMPLETE ==="
