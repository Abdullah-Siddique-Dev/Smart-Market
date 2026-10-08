@echo off
cls
color 0A
title Smart Market OS - Launcher

echo.
echo ================================================
echo          SMART MARKET OS v1.0.0
echo      Wholesale Distribution ERP System
echo ================================================
echo.

REM Check Node.js installation
echo [Step 1/3] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/en/download/
    echo.
    echo After installation, restart this script.
    echo.
    pause
    exit /b 1
)

node --version
echo [OK] Node.js is installed!
echo.

REM Start Backend Server
echo [Step 2/3] Starting backend server...
cd /d "%~dp0server"
start /B /MIN node dist\server.js
cd /d "%~dp0"

REM Wait for server to initialize
echo Waiting for server initialization...
timeout /t 5 /nobreak >nul

REM Verify server is running
netstat -an | find ":4000" | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Server is running on port 4000
) else (
    color 0E
    echo [WARNING] Server might not be running!
    echo Continuing anyway...
)
echo.

REM Launch Frontend Application
echo [Step 3/3] Launching Smart Market OS...
if exist "smartmarket.exe" (
    start "" "%~dp0smartmarket.exe"
    echo [OK] Application launched successfully!
) else (
    color 0C
    echo [ERROR] smartmarket.exe not found!
    pause
    exit /b 1
)

echo.
echo ================================================
echo       Smart Market OS is now running!
echo ================================================
echo.
echo   Frontend App: Running
echo   Backend API: http://localhost:4000
echo   Database: ./data/smart_market.sqlite
echo.
echo   Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo ================================================
echo.
echo This window will close in 5 seconds...
echo (Or press any key to close now)
timeout /t 5 >nul
exit
