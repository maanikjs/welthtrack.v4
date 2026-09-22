@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo          WEALTHTRACK STARTER
echo ==========================================
echo.
if not exist "client\node_modules" (
  echo Installing WealthTrack packages...
  call npm --prefix client install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo Installation failed. Make sure Node.js and npm are installed.
    pause
    exit /b 1
  )
)
echo Starting WealthTrack...
start "WealthTrack" /D "%~dp0client" cmd /d /c "npm run dev -- --host 0.0.0.0"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
echo.
echo WealthTrack is running at http://localhost:5173
echo Keep the WealthTrack window open while using the app.
echo.
endlocal
