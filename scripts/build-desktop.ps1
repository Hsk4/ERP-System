# Build ERP System desktop release (no mock data in production bundle)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Installing dependencies (copy backend, no symlinks)..." -ForegroundColor Cyan
bun install --backend=copy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building web frontend (production, empty data)..." -ForegroundColor Cyan
bun run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building Tauri desktop package..." -ForegroundColor Cyan
bunx tauri build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done. Installer output: src-tauri\target\release\bundle\" -ForegroundColor Green
