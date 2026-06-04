$ErrorActionPreference = 'SilentlyContinue'

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$setupDir = Join-Path $projectDir '.setup'
$playwrightMarker = Join-Path $setupDir 'playwright-chromium-installed'
$fontMarker = Join-Path $setupDir 'fonts-installed'

New-Item -ItemType Directory -Path $setupDir -Force | Out-Null

if (!(Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show(
    "Node.js is missing. Install Node.js 22 or newer, then open the app again.",
    "Tagesmenu Story Generator"
  ) | Out-Null
  Start-Process 'https://nodejs.org/'
  exit 1
}

foreach ($port in @(4300, 5173)) {
  $processIds = Get-NetTCPConnection -LocalPort $port -State Listen |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force
  }
}

Start-Sleep -Milliseconds 700

if (!(Test-Path (Join-Path $projectDir 'node_modules'))) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'install' -WorkingDirectory $projectDir -Wait -WindowStyle Hidden
}

if (!(Test-Path $fontMarker)) {
  $fontInstaller = Join-Path $projectDir 'Install-Fonts.ps1'
  if (Test-Path $fontInstaller) {
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $fontInstaller -WorkingDirectory $projectDir -Wait -WindowStyle Hidden
  }
  New-Item -ItemType File -Path $fontMarker -Force | Out-Null
}

if (!(Test-Path $playwrightMarker)) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'exec', 'playwright', 'install', 'chromium' -WorkingDirectory $projectDir -Wait -WindowStyle Hidden
  New-Item -ItemType File -Path $playwrightMarker -Force | Out-Null
}

Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'server' -WorkingDirectory $projectDir -WindowStyle Hidden
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev', '--', '--host', '127.0.0.1' -WorkingDirectory $projectDir -WindowStyle Hidden

Start-Sleep -Seconds 4
Start-Process 'http://127.0.0.1:5173/'
