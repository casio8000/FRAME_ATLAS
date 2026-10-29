@echo off
chcp 65001 >nul
cd /d "%~dp0"
where powershell.exe >nul 2>nul
if errorlevel 1 (
  start "FRAME ATLAS 3.0 v13.28" "%~dp0index.html"
  exit /b 0
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_local_preview.ps1"
