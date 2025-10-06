@echo off
title Test Server Setup
echo.
echo ========================================
echo   Testing Server Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

echo.
echo Checking if package.json exists...
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this from the project directory
    pause
    exit /b 1
) else (
    echo ✅ package.json found
)

echo.
echo Checking if node_modules exists...
if not exist "node_modules" (
    echo ⚠️ node_modules not found - will install dependencies
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules found
)

echo.
echo ========================================
echo   All checks passed! Ready to start server.
echo ========================================
echo.
echo Press any key to start the server...
pause

echo.
echo Starting server...
echo.
echo If the server starts successfully, you should see:
echo - "Server running on http://localhost:3000"
echo - "Ngrok tunnel active: https://..."
echo - Webhook URLs for Twitch setup
echo.
echo Press Ctrl+C to stop the server when you're done testing.
echo.

call npm start

echo.
echo ========================================
echo Server has stopped.
echo ========================================
pause
