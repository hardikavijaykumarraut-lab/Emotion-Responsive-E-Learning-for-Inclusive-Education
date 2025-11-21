<#
PowerShell script to archive `.md` files listed in `md-files-to-archive.txt` into `cleanup-archive/`.
By default it performs a dry-run (shows planned moves). Use `-Execute` to actually move files.
Run from repository root: `.	ools\archive-md-files.ps1` (or `.	emplates\archive-md-files.ps1` depending on location).
#>
param(
    [switch]$Execute
)

$repoRoot = (Get-Location).ProviderPath
$listFile = Join-Path $repoRoot "md-files-to-archive.txt"
$archiveRoot = Join-Path $repoRoot "cleanup-archive"

if (-not (Test-Path $listFile)) {
    Write-Error "List file not found: $listFile"
    exit 1
}

$items = Get-Content $listFile | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
if ($items.Count -eq 0) {
    Write-Host "No files listed in $listFile"
    exit 0
}

Write-Host "Archive root: $archiveRoot"
Write-Host "Files listed: $($items.Count)"
Write-Host "Dry-run mode: will only show actions. Use -Execute to actually move files.`n"

foreach ($rel in $items) {
    # Compute source absolute path
    $src = Join-Path $repoRoot $rel
    if (-not (Test-Path $src)) {
        Write-Warning "Source not found, skipping: $rel"
        continue
    }
    $dest = Join-Path $archiveRoot $rel
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        if ($Execute) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null } else { Write-Host "(DRY) Would create directory: $destDir" }
    }

    if ($Execute) {
        Write-Host "Moving: $rel -> $dest"
        Move-Item -LiteralPath $src -Destination $dest -Force
    } else {
        Write-Host "(DRY) Would move: $rel -> $dest"
    }
}

Write-Host "\nDone. To execute for real, run this script again with the -Execute switch."
