@echo off
title Creating Smart Market OS Portable Package
color 0B
echo ========================================
echo   Creating Portable Package
echo ========================================
echo.

REM Set variables
set PKG_NAME=SmartMarket-Portable
set PKG_DIR=%~dp0%PKG_NAME%
set SOURCE_DIR=%~dp0

echo [1/7] Creating package directory...
if exist "%PKG_DIR%" rmdir /s /q "%PKG_DIR%"
mkdir "%PKG_DIR%"
echo      [OK] Directory created

echo.
echo [2/7] Copying executable...
if exist "%SOURCE_DIR%src-tauri\target\release\smartmarket.exe" (
    copy "%SOURCE_DIR%src-tauri\target\release\smartmarket.exe" "%PKG_DIR%\" >nul
    copy "%SOURCE_DIR%src-tauri\target\release\smartmarket.exe" "%PKG_DIR%\Smart Market OS.exe" >nul
    if exist "%SOURCE_DIR%src-tauri\target\release\bundle\nsis\Smart Market OS_1.0.0_x64-setup.exe" (
        copy "%SOURCE_DIR%src-tauri\target\release\bundle\nsis\Smart Market OS_1.0.0_x64-setup.exe" "%SOURCE_DIR%" >nul
    )
    echo      [OK] Executable copied
) else (
    echo      [ERROR] smartmarket.exe not found! Build the app first.
    pause
    exit /b 1
)

echo.
echo [3/7] Copying server files...
mkdir "%PKG_DIR%\server"
xcopy "%SOURCE_DIR%server\dist" "%PKG_DIR%\server\dist\" /E /I /Q >nul
xcopy "%SOURCE_DIR%server\node_modules" "%PKG_DIR%\server\node_modules\" /E /I /Q >nul
copy "%SOURCE_DIR%server\package.json" "%PKG_DIR%\server\" >nul
echo      [OK] Server files copied

echo.
echo [3b/7] Bundling Node.js runtime...
mkdir "%PKG_DIR%\resources\bin"
if exist "%SOURCE_DIR%src-tauri\resources\bin\node.exe" (
    copy "%SOURCE_DIR%src-tauri\resources\bin\node.exe" "%PKG_DIR%\resources\bin\" >nul
    echo      [OK] Bundled Node.js runtime copied
)

echo.
echo [4/7] Creating data directory...
mkdir "%PKG_DIR%\data"
mkdir "%PKG_DIR%\data\app-profile"
echo      [OK] Data directory created

echo.
echo [5/7] Copying launcher script...
copy "%SOURCE_DIR%SmartMarket-Launcher.bat" "%PKG_DIR%\START-SMARTMARKET.bat" >nul
echo      [OK] Launcher script copied

echo.
echo [6/7] Creating README file...
(
echo ========================================
echo   Smart Market OS v1.0.0
echo   Portable Edition
echo ========================================
echo.
echo REQUIREMENTS:
echo - Windows 7/8/10/11 ^(64-bit^)
echo - Node.js 18+ installed
echo.
echo INSTALLATION:
echo 1. Install Node.js from https://nodejs.org if not installed
echo 2. Double-click "START-SMARTMARKET.bat"
echo 3. Wait for server to start ^(~5 seconds^)
echo 4. Application will open automatically
echo.
echo DEFAULT LOGIN:
echo - Username: admin
echo - Password: admin123
echo.
echo FILES:
echo - smartmarket.exe         : Frontend application
echo - START-SMARTMARKET.bat   : Launcher script ^(USE THIS^)
echo - server/                 : Backend API
echo - data/                   : Database and files
echo.
echo TROUBLESHOOTING:
echo - If app doesn't start, check if Node.js is installed
echo - If login fails, ensure server started ^(check console^)
echo - Port 4000 must be available
echo - Check data/logs/ for error messages
echo.
echo SUPPORT:
echo Read OPERATIONS_GUIDE.md for complete usage instructions
echo.
echo ========================================
) > "%PKG_DIR%\README.txt"
echo      [OK] README created

echo.
echo [7/7] Creating ZIP archive...
powershell -Command "Compress-Archive -Path '%PKG_DIR%' -DestinationPath '%SOURCE_DIR%%PKG_NAME%.zip' -Force"
if %ERRORLEVEL% EQU 0 (
    echo      [OK] ZIP archive created
) else (
    echo      [WARNING] Could not create ZIP archive
)

echo.
echo ========================================
echo   Package Created Successfully!
echo ========================================
echo.
echo Package location:
echo   Folder: %PKG_DIR%
echo   ZIP:    %PKG_NAME%.zip
echo.
echo Package contents:
dir "%PKG_DIR%" /B
echo.
echo ========================================
echo   Share this folder with other users!
echo ========================================
echo.
pause
