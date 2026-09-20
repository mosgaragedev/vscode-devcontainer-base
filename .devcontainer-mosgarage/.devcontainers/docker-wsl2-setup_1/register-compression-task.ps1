#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Registers a Windows Scheduled Task that runs compress-drives.ps1
    automatically every week during idle time.

.USAGE
    1. Put compress-drives.ps1 and this file in the same folder.
    2. Right-click > "Run with PowerShell as Administrator"

.NOTES
    - The task runs every Sunday at 3:00 AM
    - Only fires when the PC has been idle for at least 10 minutes
    - To remove the task: Unregister-ScheduledTask -TaskName "NTFS Drive Compression"
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── CONFIG ────────────────────────────────────────────────────────────────────

$TaskName  = "NTFS Drive Compression"
$TaskPath  = "\Custom Maintenance\"
$RunAtTime = "03:00"          # Time of day to run
$RunOnDay  = "Sunday"         # Day of week

# Where the compression script will be installed for the task to call
$StableScriptPath = "C:\ProgramData\CustomMaintenance\compress-drives.ps1"

# ───────────────────────────────────────────────────────────────────────────────

function Write-Step { param($msg) Write-Host "`n[+] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "    OK  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    !!  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "    ERR $msg" -ForegroundColor Red; exit 1 }

# ── Locate compress-drives.ps1 ────────────────────────────────────────────────
Write-Step "Locating compress-drives.ps1"

$sourceScript = Join-Path $PSScriptRoot "compress-drives.ps1"
if (-not (Test-Path $sourceScript)) {
    Write-Fail "compress-drives.ps1 not found next to this script.`nExpected: $sourceScript"
}
Write-Ok "Found: $sourceScript"

# ── Install script to stable location ─────────────────────────────────────────
Write-Step "Installing script to: $StableScriptPath"
New-Item -ItemType Directory -Path (Split-Path $StableScriptPath) -Force | Out-Null
Copy-Item -Path $sourceScript -Destination $StableScriptPath -Force
Write-Ok $StableScriptPath

# ── Build task components ──────────────────────────────────────────────────────
Write-Step "Building Scheduled Task"

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$StableScriptPath`""

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $RunOnDay -At $RunAtTime

$settings = New-ScheduledTaskSettingsSet `
    -RunOnlyIfIdle `
    -IdleDuration   (New-TimeSpan -Minutes 10) `
    -IdleWaitTimeout (New-TimeSpan -Hours 2) `
    -StartWhenAvailable `
    -WakeToRun:$false `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4)

$principal = New-ScheduledTaskPrincipal `
    -UserId    "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel  Highest

# ── Create task folder in Task Scheduler ──────────────────────────────────────
try {
    $svc = New-Object -ComObject Schedule.Service
    $svc.Connect()
    try { $svc.GetFolder("Custom Maintenance") }
    catch { $svc.GetFolder("\").CreateFolder("Custom Maintenance") | Out-Null }
} catch { <# folder may already exist; Register-ScheduledTask handles it #> }

# ── Register the task ─────────────────────────────────────────────────────────
Write-Step "Registering task: $TaskPath$TaskName"

$task = Register-ScheduledTask `
    -TaskName  $TaskName `
    -TaskPath  $TaskPath `
    -Action    $action `
    -Trigger   $trigger `
    -Settings  $settings `
    -Principal $principal `
    -Force

if ($task) {
    Write-Ok "Task registered successfully"
} else {
    Write-Fail "Task registration returned no result — check Task Scheduler manually."
}

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host " Scheduled Task registered" -ForegroundColor White
Write-Host "  Name    : $TaskPath$TaskName"
Write-Host "  Runs    : Every $RunOnDay at $RunAtTime"
Write-Host "  Fires   : Only when idle >= 10 minutes"
Write-Host "  Script  : $StableScriptPath"
Write-Host "  Manage  : Task Scheduler > Task Scheduler Library > Custom Maintenance"
Write-Host "`n  To remove the task:" -ForegroundColor DarkGray
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor DarkGray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray
