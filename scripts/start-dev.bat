@echo off
setlocal

cd /d "%~dp0.."

echo Starting YatraAI full-stack dev environment...

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed. Please install Node.js first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

start "YatraAI API" cmd /k "cd /d %cd% && npm run dev:api"
start "YatraAI Frontend" cmd /k "cd /d %cd% && npm run dev"

echo.
echo API:      http://localhost:8787
echo Frontend: http://localhost:5173
echo.
echo Demo login: sinchana@example.com / password123
pause
