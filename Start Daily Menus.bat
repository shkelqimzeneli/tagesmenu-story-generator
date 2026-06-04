@echo off
set "APP_DIR=%~dp0"
start "" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%APP_DIR%Start-Tagesmenu-App.ps1"
exit /b
