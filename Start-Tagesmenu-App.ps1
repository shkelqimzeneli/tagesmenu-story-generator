$ErrorActionPreference = 'SilentlyContinue'

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($port in @(4300, 5173)) {
  $processIds = Get-NetTCPConnection -LocalPort $port -State Listen |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force
  }
}

Start-Sleep -Milliseconds 700

Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'server' -WorkingDirectory $projectDir -WindowStyle Hidden
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev', '--', '--host', '127.0.0.1' -WorkingDirectory $projectDir -WindowStyle Hidden

Start-Sleep -Seconds 4
Start-Process 'http://127.0.0.1:5173/'
