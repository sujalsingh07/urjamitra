$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "[Urjamitra] Running preflight checks..." -ForegroundColor Blue
node "$root/scripts/preflight.js"
if ($LASTEXITCODE -ne 0) {
	throw "Preflight failed. Fix the reported issue and retry."
}

Write-Host "`n[Urjamitra] Installing dependencies..." -ForegroundColor Yellow

Push-Location "$root/backend"
if (Test-Path "package-lock.json") { npm ci } else { npm install }
Pop-Location

Push-Location "$root/frontend"
if (Test-Path "package-lock.json") { npm ci } else { npm install }
Pop-Location

Write-Host "[Urjamitra] Starting backend and frontend..." -ForegroundColor Green

Start-Process powershell -ArgumentList @('-NoExit', '-Command', "cd '$root/backend'; npm run dev")
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "cd '$root/frontend'; npm start")

Write-Host "`nFrontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend : http://localhost:5001`n" -ForegroundColor Cyan
