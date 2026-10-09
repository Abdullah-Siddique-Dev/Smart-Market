@echo off
title Smart Market OS - Startup
color 0A
echo ========================================
echo   Smart Market OS v1.0.0
echo   Wholesale Distribution ERP
echo ========================================
echo.

REM Get current directory
set APP_DIR=%~dp0

REM Check if Node.js is installed or bundled
set "NODE_CMD=node"
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "%APP_DIR%resources\bin\node.exe" (
        set "NODE_CMD=%APP_DIR%resources\bin\node.exe"
        echo [OK] Using bundled Node.js runtime!
    ) else if exist "%APP_DIR%bin\node.exe" (
        set "NODE_CMD=%APP_DIR%bin\node.exe"
        echo [OK] Using bundled Node.js runtime!
    ) else (
        echo [ERROR] Node.js is not installed!
        echo.
        echo Please install Node.js from: https://nodejs.org
        echo Or ensure resources/bin/node.exe is present.
        echo.
        pause
        exit /b 1
    )
)

REM Start backend server
echo [1/2] Starting backend server...
echo      Port: 4000
cd /d "%APP_DIR%server"
start /B "SmartMarket-Server" %NODE_CMD% dist\server.js

REM Wait for server to initialize
echo      Waiting for server initialization...
timeout /t 5 /nobreak >nul

REM Check if server started
netstat -an | find ":4000" >nul
if %ERRORLEVEL% EQU 0 (
    echo      [OK] Server started successfully!
) else (
    echo      [WARNING] Server might not be running on port 4000
)

echo.
echo [2/2] Launching application...
cd /d "%APP_DIR%"

REM Check if .exe exists
if exist "src-tauri\target\release\smartmarket.exe" (
    start "" "src-tauri\target\release\smartmarket.exe"
    echo      [OK] Application launched!
) else if exist "smartmarket.exe" (
    start "" "smartmarket.exe"
    echo      [OK] Application launched!
) else (
    echo      [ERROR] smartmarket.exe not found!
    echo      Please build the application first.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Smart Market OS is now running!
echo ========================================
echo.
echo   Frontend: http://localhost:1420
echo   Backend API: http://localhost:4000
echo   Database: ./data/smart_market.sqlite
echo.
echo ========================================
echo   Press any key to stop the server...
echo ========================================
pause >nul

REM Stop server when user closes this window
echo.
echo Shutting down Smart Market OS...
taskkill /F /FI "WINDOWTITLE eq SmartMarket-Server*" >nul 2>nul
echo Server stopped.
timeout /t 2 /nobreak >nul
exit
