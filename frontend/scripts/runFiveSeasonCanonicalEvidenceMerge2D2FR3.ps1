param(
    [string]$FrontendRoot = "."
)

$ErrorActionPreference = "Stop"
Set-Location $FrontendRoot

$CaliberRoot = ".\data\calibration\historical\expansion-2020-2021\player-impact\caliber"
$MergeRoot = "$CaliberRoot\five-season-evidence"
New-Item -ItemType Directory -Force $MergeRoot | Out-Null

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
            $count = @(Get-Content $ExpectedFile | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count
            Write-Host ("{0} row count: {1}" -f $Name, $count)
            if ($count -le 0) {
                throw ("{0} created an empty artifact: {1}" -f $Name, $ExpectedFile)
            }
        }
    }
}

$MergedObservations = "$MergeRoot\five-season-observations.jsonl"
$MergedSnaps = "$MergeRoot\five-season-resolved-snaps.jsonl"
$MergedDepth = "$MergeRoot\five-season-depth-charts.jsonl"

$Targets = "$CaliberRoot\five-season-player-caliber-targets-v1.jsonl"
$Baselines = "$CaliberRoot\five-season-player-career-baselines-v1.jsonl"
$Bundles = "$CaliberRoot\five-season-player-evaluation-bundles-v1.jsonl"
$Residuals = "$CaliberRoot\five-season-player-caliber-residuals-v1.jsonl"

$Completion = "$CaliberRoot\five-season-canonical-input-completion-r3-v1.jsonl"
$Snapshots = "$CaliberRoot\five-season-canonical-player-caliber-snapshots-r3-v1.jsonl"

Invoke-Step `
    -Name "2D.2F-R3A MERGE FIVE-SEASON OBSERVATIONS" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\mergeFiveSeasonCanonicalEvidence2D2FR3.py",
        "--kind", "observations",
        "--legacy", ".\data\calibration\historical\v1\observations.jsonl",
        "--expansion", ".\data\calibration\historical\expansion-2020-2021\availability\observations-availability.jsonl",
        "--output", $MergedObservations,
        "--report", "$MergeRoot\five-season-observations-merge-report.json"
    ) `
    -ExpectedFile $MergedObservations `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R3B MERGE FIVE-SEASON RESOLVED SNAPS" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\mergeFiveSeasonCanonicalEvidence2D2FR3.py",
        "--kind", "snaps",
        "--legacy", ".\data\calibration\historical\v1\historical-snap-counts-resolved.jsonl",
        "--expansion", ".\data\calibration\historical\expansion-2020-2021\snap-counts\historical-snap-counts-resolved-v1.jsonl",
        "--output", $MergedSnaps,
        "--report", "$MergeRoot\five-season-resolved-snaps-merge-report.json"
    ) `
    -ExpectedFile $MergedSnaps `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R3C MERGE FIVE-SEASON DEPTH CHARTS" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\mergeFiveSeasonCanonicalEvidence2D2FR3.py",
        "--kind", "depth",
        "--legacy", ".\data\calibration\historical\v1\historical-depth-charts.jsonl",
        "--expansion", ".\data\calibration\historical\expansion-2020-2021\depth-charts\historical-depth-charts.jsonl",
        "--output", $MergedDepth,
        "--report", "$MergeRoot\five-season-depth-charts-merge-report.json"
    ) `
    -ExpectedFile $MergedDepth `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R3D CANONICAL INPUT COMPLETION WITH FIVE-SEASON EVIDENCE" `
    -Exe "python" `
    -Arguments @(
        ".\scripts\buildHistoricalCanonicalInputCompletion.py",
        "--targets", $Targets,
        "--career-baselines", $Baselines,
        "--evidence-bundles", $Bundles,
        "--residuals", $Residuals,
        "--resolved-snaps", $MergedSnaps,
        "--observations", $MergedObservations,
        "--depth-charts", $MergedDepth,
        "--output", $Completion,
        "--report", "$CaliberRoot\five-season-canonical-input-completion-r3-v1-report.json"
    ) `
    -ExpectedFile $Completion `
    -RequireNonEmpty

Invoke-Step `
    -Name "2D.2F-R3E CANONICAL CALIBER SNAPSHOTS WITH FIVE-SEASON EVIDENCE" `
    -Exe "node" `
    -Arguments @(
        ".\scripts\generateHistoricalCanonicalPlayerCaliberSnapshots.mjs",
        "--input", $Completion,
        "--observations", $MergedObservations,
        "--output", $Snapshots,
        "--report", "$CaliberRoot\five-season-canonical-player-caliber-snapshots-r3-v1-report.json"
    ) `
    -ExpectedFile $Snapshots `
    -RequireNonEmpty

Write-Host ""
Write-Host "=== 2D.2F-R3F RE-RUN PAIR CALIBER GATE ==="

python .\scripts\buildFiveSeasonShadowReplacementCorpus2D2F.py `
    --legacy-caliber $Snapshots `
    --expansion-caliber $Snapshots

if ($LASTEXITCODE -ne 0) {
    throw ("2D.2F-R3F pair gate failed with exit code {0}" -f $LASTEXITCODE)
}

Write-Host ""
Write-Host "=== 2D.2F-R3 COMPLETE ==="
Write-Host ("Merged observations: {0}" -f $MergedObservations)
Write-Host ("Merged snaps:        {0}" -f $MergedSnaps)
Write-Host ("Merged depth:        {0}" -f $MergedDepth)
Write-Host ("R3 snapshots:        {0}" -f $Snapshots)
