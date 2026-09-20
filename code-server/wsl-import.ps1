# ╔══════════════════════════════════════════════════════════════════╗
# ║  wsl-import.ps1 — Import mosgarage/code-server as a WSL2 distro  ║
# ║                                                                  ║
# ║  Usage:                                                          ║
# ║    .\scripts\wsl-import.ps1                      # base          ║
# ║    .\scripts\wsl-import.ps1 -Variant full        # full stack    ║
# ║    .\scripts\wsl-import.ps1 -Variant sdk -Force  # replace       ║
# ╚══════════════════════════════════════════════════════════════════╝
param(
    [ValidateSet("latest","base","sdk","python","full")]
    [string]$Variant = "base",

    [string]$InstallDir = "",

    # Re-pack the image from Docker before importing
    [switch]$Pack,

    # Unregister existing distro first
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$DistroName  = if ($Variant -eq "latest") { "MosgarageCS" } else { "MosgarageCS-$Variant" }
$TarballPath = ".\dist\mosgarage-cs-$Variant.tar.gz"
$DefaultBase = "$env:USERPROFILE\WSL"

if ([string]::IsNullOrEmpty($InstallDir)) {
    $InstallDir = Join-Path $DefaultBase $DistroName
}

function Step { param([string]$m) Write-Host "▸ $m" -ForegroundColor Cyan }
function Ok   { param([string]$m) Write-Host "✓ $m" -ForegroundColor Green }
function Warn { param([string]$m) Write-Host "⚠ $m" -ForegroundColor Yellow }
function Fail { param([string]$m) Write-Host "✗ $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  mosgarage/code-server — WSL2 Import" -ForegroundColor White
Write-Host "  Variant  : $Variant"
Write-Host "  Distro   : $DistroName"
Write-Host "  Directory: $InstallDir"
Write-Host ""

# ── Pack first if requested ───────────────────────────────────────────────────
if ($Pack) {
    Step "Building and packing variant '$Variant'..."
    wsl -e bash ./scripts/wsl-pack.sh $Variant
}

# ── Tarball check ─────────────────────────────────────────────────────────────
if (-not (Test-Path $TarballPath)) {
    Fail "Tarball not found: $TarballPath`nRun first: make pack TARGET=$Variant"
}

# ── Existing distro ───────────────────────────────────────────────────────────
$exists = (wsl --list --quiet 2>$null) -contains $DistroName
if ($exists) {
    if ($Force) {
        Warn "Unregistering existing '$DistroName' (--Force)..."
        wsl --unregister $DistroName
        # Note: --unregister removes the rootfs but the .vhdx for the
        # workspace volume stays in $InstallDir if you re-import there.
    } else {
        Fail "'$DistroName' already exists. Use -Force to replace it."
    }
}

# ── Install directory ─────────────────────────────────────────────────────────
if (-not (Test-Path $InstallDir)) {
    Step "Creating $InstallDir..."
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# ── Import ────────────────────────────────────────────────────────────────────
Step "Importing $TarballPath..."
wsl --import $DistroName $InstallDir $TarballPath --version 2

Ok "Distro '$DistroName' imported"

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Ready — start your workspace:" -ForegroundColor White
Write-Host ""
Write-Host "    wsl -d $DistroName" -ForegroundColor DarkGray
Write-Host "    wsl -d $DistroName -- mgw start" -ForegroundColor DarkGray
Write-Host "    wsl -d $DistroName -- mgw status" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Services:" -ForegroundColor White
Write-Host "    code-server  →  http://localhost:8080" -ForegroundColor DarkGray
Write-Host "    SSH          →  ssh mosgarage@localhost -p 2222" -ForegroundColor DarkGray
Write-Host "    Agent port   →  7072 (when agent binary is present)" -ForegroundColor DarkGray
Write-Host ""
