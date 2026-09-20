#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Compresses large, cold files on C: and D: drives using NTFS compression.
    Run this manually whenever you want to free up space.

.USAGE
    Right-click > "Run with PowerShell as Administrator"
    Or: powershell -ExecutionPolicy Bypass -File .\compress-drives.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── CONFIG ────────────────────────────────────────────────────────────────────

# Only compress files NOT accessed within this many days (hot files left alone)
$ColdFileAgeDays = 30

# Only compress files larger than this (in KB)
$MinFileSizeKB = 512

# Folders to compress on each drive
$CompressionTargets = @{
    "C:" = @(
        "C:\Users\$env:USERNAME\Documents",
        "C:\Users\$env:USERNAME\Downloads",
        "C:\Users\$env:USERNAME\Pictures",
        "C:\Users\$env:USERNAME\Videos",
        "C:\Users\$env:USERNAME\Music",
        "C:\Users\$env:USERNAME\Desktop",
        "C:\Users\$env:USERNAME\AppData\Roaming",
        "C:\Temp"
    )
    "D:" = @(
        "D:\"    # Compress everything on D: — narrow this down if needed
    )
}

# Folders to always skip (system-critical or already managed by Windows)
$ExcludedFolders = @(
    "C:\Windows\System32",
    "C:\Windows\SysWOW64",
    "C:\Windows\WinSxS",
    "C:\Program Files\WindowsApps",
    "C:\Users\*\AppData\Local\Temp",
    "$env:LOCALAPPDATA\Packages"
)

# ───────────────────────────────────────────────────────────────────────────────

$LogFile = "$env:USERPROFILE\Logs\compress-drives_$(Get-Date -Format 'yyyy-MM-dd').log"
New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null

function Write-Log {
    param([string]$msg, [string]$level = "INFO")
    $line = "[$(Get-Date -Format 'HH:mm:ss')] [$level] $msg"
    Add-Content -Path $LogFile -Value $line
    switch ($level) {
        "OK"   { Write-Host $line -ForegroundColor Green }
        "WARN" { Write-Host $line -ForegroundColor Yellow }
        "ERR"  { Write-Host $line -ForegroundColor Red }
        default { Write-Host $line -ForegroundColor Cyan }
    }
}

function Compress-Target {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        Write-Log "Path not found, skipping: $Path" "WARN"
        return
    }

    foreach ($excl in $ExcludedFolders) {
        if ($Path -like $excl) {
            Write-Log "Excluded: $Path" "WARN"
            return
        }
    }

    Write-Log "Scanning: $Path"
    $cutoff = (Get-Date).AddDays(-$ColdFileAgeDays)

    $files = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.LastAccessTime -lt $cutoff -and
            $_.Length -gt ($MinFileSizeKB * 1KB) -and
            -not ($_.Attributes -band [System.IO.FileAttributes]::Compressed)
        }

    if (-not $files) {
        Write-Log "No eligible files in: $Path" "OK"
        return
    }

    Write-Log "Found $($files.Count) file(s) to compress in: $Path"
    $savedBytes = 0

    foreach ($file in $files) {
        try {
            $before = $file.Length
            compact /c /i /q "`"$($file.FullName)`"" | Out-Null
            $after  = (Get-Item $file.FullName -ErrorAction SilentlyContinue)?.Length ?? $before
            $savedBytes += ($before - $after)
        } catch {
            Write-Log "Failed: $($file.FullName) — $_" "WARN"
        }
    }

    Write-Log "Saved ~$([math]::Round($savedBytes / 1MB, 2)) MB in: $Path" "OK"
}

# ── Main ───────────────────────────────────────────────────────────────────────

Write-Log "═══ Compression run started ═══"
$startTime = Get-Date

foreach ($drive in $CompressionTargets.Keys) {
    $vol = Get-Volume -DriveLetter $drive.TrimEnd(':') -ErrorAction SilentlyContinue
    if (-not $vol) {
        Write-Log "Drive $drive not found, skipping." "WARN"
        continue
    }
    if ($vol.FileSystem -ne "NTFS") {
        Write-Log "Drive $drive is $($vol.FileSystem) — NTFS compression not supported." "WARN"
        continue
    }

    Write-Log "Drive $drive — $([math]::Round($vol.SizeRemaining/1GB,1)) GB free"

    foreach ($target in $CompressionTargets[$drive]) {
        Compress-Target -Path $target
    }
}

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
Write-Log "═══ Done ($elapsed min) — log: $LogFile ═══" "OK"
Write-Host "`n Log saved to: $LogFile`n" -ForegroundColor Cyan
