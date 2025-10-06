@echo off
title Debug Server - Will Stay Open
echo.
echo ========================================
echo   DEBUG MODE - This window will stay open
echo ========================================
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js found: %NODE_VERSION%
)
echo.

REM Check if package.json exists
echo [2/5] Checking package.json...
if not exist "package.json" (
    echo ❌ ERROR: package.json not found in current directory
    echo Current directory contents:
    dir /b
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo ✅ package.json found
)
echo.

REM Check if server.js exists
echo [3/5] Checking server.js...
if not exist "server.js" (
    echo ❌ ERROR: server.js not found
    echo Current directory contents:
    dir /b
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo ✅ server.js found
)
echo.

REM Install dependencies
echo [4/5] Checking dependencies...
if not exist "node_modules" (
    echo ⚠️ node_modules not found - installing dependencies...
    echo Running: npm install
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Failed to install dependencies
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ node_modules found
)
echo.

REM Test npm start command
echo [5/5] Testing npm start command...
echo Running: npm start
echo.
echo ========================================
echo   STARTING SERVER - Watch for errors below
echo ========================================
echo.
echo If you see errors, they will be displayed here.
echo The server should show:
echo - "Server running on http://localhost:3000"
echo - "Ngrok tunnel active: https://..."
echo.
echo Press Ctrl+C to stop the server when done.
echo.

REM Run npm start and capture any errors
npm start

echo.
echo ========================================
echo   SERVER STOPPED
echo ========================================
echo.
echo The server has stopped. If you didn't see any error messages above,
echo the server may have started successfully and then been stopped.
echo.
echo Press any key to exit...
pause >nul
