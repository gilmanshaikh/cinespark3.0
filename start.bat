@echo off
title CineSpark 3.0
cls

echo.
echo  =====================================================
echo   CineSpark 3.0  -  Starting Frontend and Backend
echo  =====================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Download it from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  Starting Backend  ... http://localhost:5000
cd /d "%~dp0server"
start "CineSpark Backend" cmd /k "npm run dev"

echo  Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo  Starting Frontend ... http://localhost:5173
cd /d "%~dp0client"
start "CineSpark Frontend" cmd /k "npm run dev"

echo.
echo  =====================================================
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo  =====================================================
echo.
echo  Both servers are running in separate windows.
echo  Press any key to close this launcher window.
echo.
pause >nul
