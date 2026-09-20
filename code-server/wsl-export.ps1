# ╔══════════════════════════════════════════════════════════════════╗
# ║  wsl-export.ps1 — Snapshot a MosgarageCS distro                  ║
# ║                                                                  ║
# ║  Usage:                                                          ║
# ║    .\scripts\wsl-export.ps1 -Variant base                        ║
# ║    .\scripts\wsl-export.ps1 -Variant full -OutDir D:\Backups     ║
# ╚══════════════════════════════════════════════════════════════════╝
param(
    [ValidateSet("latest","base","sdk","python","full")]
    [string]$Variant = "base",

    [string]$OutDir = ".\dist\snapshots"
)

$ErrorActionPreference = "Stop"

$DistroName = if ($Variant -eq "latest") { "MosgarageCS" } else { "MosgarageCS-$Variant" }
$Timestamp  = (Get-Date -Format "yyyyMMdd-HHmmss")
$OutFile    = Join-Path $OutDir "$DistroName-$Timestamp.tar.gz"

function Step { param([string]$m) Write-Host "▸ $m" -ForegroundColor Cyan }
function Ok   { param([string]$m) Write-Host "✓ $m" -ForegroundColor Green }
function Fail { param([string]$m) Write-Host "✗ $m" -ForegroundColor Red; exit 1 }

$exists = (wsl --list --quiet 2>$null) -contains $DistroName
if (-not $exists) {
    Fail "Distro '$DistroName' not found.`nAvailable: $(wsl --list --quiet)"
}

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

Step "Exporting $DistroName → $OutFile ..."
wsl --export $DistroName $OutFile

$sizeMB = [math]::Round((Get-Item $OutFile).Length / 1MB, 1)
Ok "Snapshot saved: $OutFile ($sizeMB MB)"

Write-Host ""
Write-Host "  Restore from this snapshot:" -ForegroundColor White
Write-Host "    wsl --unregister $DistroName" -ForegroundColor DarkGray
Write-Host "    wsl --import $DistroName `$env:USERPROFILE\WSL\$DistroName $OutFile --version 2" -ForegroundColor DarkGray
Write-Host ""
