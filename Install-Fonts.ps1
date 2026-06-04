$ErrorActionPreference = 'SilentlyContinue'

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $projectDir 'public\fonts'
$targetDir = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
$registryPath = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

Get-ChildItem -LiteralPath $sourceDir -File |
  Where-Object { $_.Extension -in '.ttf', '.otf', '.ttc' } |
  ForEach-Object {
    $targetPath = Join-Path $targetDir $_.Name
    Copy-Item -LiteralPath $_.FullName -Destination $targetPath -Force

    $fontKind = if ($_.Extension -eq '.otf') { 'OpenType' } elseif ($_.Extension -eq '.ttc') { 'TrueType Collection' } else { 'TrueType' }
    $registryName = "$($_.BaseName) ($fontKind)"
    New-ItemProperty -Path $registryPath -Name $registryName -Value $targetPath -PropertyType String -Force | Out-Null
  }
