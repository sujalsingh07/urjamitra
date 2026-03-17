@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

echo [Urjamitra] Running preflight checks...
node "%ROOT%scripts\preflight.js"
if errorlevel 1 (
  echo [Urjamitra] Preflight failed. Fix the reported issue and retry.
  exit /b 1
)

echo.
echo [Urjamitra] Installing dependencies...

cd /d "%ROOT%backend"
if exist package-lock.json (
  call npm ci
) else (
  call npm install
)

cd /d "%ROOT%frontend"
if exist package-lock.json (
  call npm ci
) else (
  call npm install
)

echo [Urjamitra] Starting backend and frontend...
start "Urjamitra Backend" cmd /k "cd /d "%ROOT%backend" && npm run dev"
start "Urjamitra Frontend" cmd /k "cd /d "%ROOT%frontend" && npm start"

echo.
echo Frontend: http://localhost:3000
echo Backend : http://localhost:5001
echo.

endlocal
