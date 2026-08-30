param(
    [string]$FrontendRoot = "."
)

$ErrorActionPreference = "Stop"
Set-Location $FrontendRoot

$WorkRoot = ".\data\calibration\historical\expansion-2020-2021\player-impact\caliber"
New-Item -ItemType Directory -Force $WorkRoot | Out-Null

function Invoke-Step {
    param(
        [string]$Name,
        [string]$Exe,
        [string[]]$Arguments,
        [string]$ExpectedFile = $null,
        [switch]$RequireNonEmpty
    )

    Write-Host ""
    Write-Host ("=== {0} ===" -f $Name)

    & $Exe @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw ("{0} failed with exit code {1}" -f $Name, $LASTEXITCODE)
    }

    if ($ExpectedFile) {
        if (-not (Test-Path $ExpectedFile)) {
            throw ("{0} did not create expected file: {1}" -f $Name, $ExpectedFile)
        }

        if ($RequireNonEmpty) {
            $rowCount = @(Get-Content $ExpectedFile | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count
            Write-Host ("{0} row count: {1}" -f $Name, $rowCount)

            if ($rowCount -le 0) {
                throw ("{0} created an empty artifact: {1}" -f $Name, $ExpectedFile)
            }
        }
    }
}

$Targets = "$WorkRoot\five-season-player-caliber-targets-v1.jsonl"
$Baselines = "$WorkRoot\five-season-player-career-baselines-v1.jsonl"
$Bundles = "$WorkRoot\five-season-player-evaluation-bundles-v1.jsonl"
$Residuals = "$WorkRoot\five-season-player-caliber-residuals-v1.jsonl"
$Completion = "$WorkRoot\five-season-canonical-input-completion-v1.jsonl"
$Snapshots = "$WorkRoot\five-season-canonical-player-caliber-snapshots-v1.jsonl"

Invoke-Step `
    -Name "2D.2F-R1A BUILD FIVE-SEASON CALIBER TARGETS" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\buildFiveSeasonCaliberTargets2D2FR1.py",
        "--shadow-corpus", ".\data\calibration\historical\expansion-2020-2021\player-impact\five-season-shadow-replacement-corpus-v1.jsonl",
        "--legacy-observations", ".\data\calibration\historical\v1\observations-availability.jsonl",
        "--expansion-observations", ".\data\calibration\historical\expansion-2020-2021\availability\observations-availability.jsonl",
        "--output", $Targets,
        "--report", "$WorkRoot\five-season-player-caliber-targets-v1-report.json"
    ) `
    -ExpectedFile $Targets `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R1B CAREER BASELINES" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\buildHistoricalPlayerCareerBaselineBundles.py",
        "--targets", $Targets,
        "--player-stats", ".\data\calibration\historical\v1\historical-player-stats-2019-2024.jsonl",
        "--lookback-seasons", "3",
        "--output", $Baselines,
        "--report", "$WorkRoot\five-season-player-career-baselines-v1-report.json"
    ) `
    -ExpectedFile $Baselines `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R1C EVALUATION EVIDENCE BUNDLES" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\buildHistoricalPlayerEvaluationEvidenceBundles.py",
        "--targets", $Targets,
        "--player-stats", ".\data\calibration\historical\v1\historical-player-stats-2019-2024.jsonl",
        "--output", $Bundles,
        "--report", "$WorkRoot\five-season-player-evaluation-bundles-v1-report.json"
    ) `
    -ExpectedFile $Bundles `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R1D RESIDUAL TARGET AUDIT" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\auditHistoricalPlayerCaliberResidualTargets.py",
        "--targets", $Targets,
        "--career-baselines", $Baselines,
        "--replacement-identities", ".\data\calibration\historical\v1\expected-replacement-identities-v1.jsonl",
        "--depth-charts", ".\data\calibration\historical\v1\historical-depth-charts.jsonl",
        "--snap-counts-resolved", ".\data\calibration\historical\v1\historical-snap-counts-resolved.jsonl",
        "--output", $Residuals,
        "--report", "$WorkRoot\five-season-player-caliber-residuals-v1-report.json"
    ) `
    -ExpectedFile $Residuals

Invoke-Step `
    -Name "2D.2F-R1E CANONICAL INPUT COMPLETION" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\buildHistoricalCanonicalInputCompletion.py",
        "--targets", $Targets,
        "--career-baselines", $Baselines,
        "--evidence-bundles", $Bundles,
        "--residuals", $Residuals,
        "--resolved-snaps", ".\data\calibration\historical\v1\historical-snap-counts-resolved.jsonl",
        "--observations", ".\data\calibration\historical\v1\observations.jsonl",
        "--depth-charts", ".\data\calibration\historical\v1\historical-depth-charts.jsonl",
        "--output", $Completion,
        "--report", "$WorkRoot\five-season-canonical-input-completion-v1-report.json"
    ) `
    -ExpectedFile $Completion `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R1F CANONICAL CALIBER SNAPSHOTS" `
    -Exe "node" `
    -Arguments @(
        ".\scripts\generateHistoricalCanonicalPlayerCaliberSnapshots.mjs",
        "--input", $Completion,
        "--observations", ".\data\calibration\historical\v1\observations.jsonl",
        "--output", $Snapshots,
        "--report", "$WorkRoot\five-season-canonical-player-caliber-snapshots-v1-report.json"
    ) `
    -ExpectedFile $Snapshots `
    -RequireNonEmpty

Write-Host ""
Write-Host "=== 2D.2F-R1 COMPLETE ==="
Write-Host ("Target artifact:   {0}" -f $Targets)
Write-Host ("Snapshot artifact: {0}" -f $Snapshots)
