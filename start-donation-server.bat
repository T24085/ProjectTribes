@echo off
title Tribes Donation Server
echo.
echo ========================================
echo   Tribes Professional League
echo   Donation Server Starting...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this from the project directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the server
echo Starting donation server...
echo.
echo The server will:
echo - Start on localhost:3000
echo - Create an ngrok tunnel
echo - Display webhook URLs for Twitch setup
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
