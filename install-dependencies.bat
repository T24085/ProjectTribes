@echo off
title Install Node.js Dependencies
echo.
echo ========================================
echo   Installing Node.js Dependencies
echo ========================================
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo Node.js is already installed and working!
echo The issue is that the required modules are missing.
echo.
echo Installing the following modules:
echo - express (web server)
echo - crypto (encryption - built into Node.js)
echo - axios (HTTP client)
echo - ngrok (tunnel service)
echo.

echo Running: npm install
echo This may take a few minutes...
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Failed to install dependencies
    echo.
    echo This could be due to:
    echo - Internet connection issues
    echo - npm registry problems
    echo - Permission issues
    echo.
    echo Try running this as Administrator or check your internet connection.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.
echo Now you can run the server:
echo 1. Double-click "Tribes Donation Server" on your desktop
echo 2. Or run "debug-server.bat" to test everything
echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
pause
