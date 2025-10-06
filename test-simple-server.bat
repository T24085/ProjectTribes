@echo off
title Test Simple Server
echo.
echo ========================================
echo   Testing Simple Server
echo ========================================
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo Testing basic Express server...
echo This will start a simple server on port 3000
echo.
echo If this works, the issue is with the ngrok or other modules.
echo If this fails, the issue is with basic Node.js/Express setup.
echo.

node simple-server.js

echo.
echo ========================================
echo   Simple server test completed
echo ========================================
echo.
pause
