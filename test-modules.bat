@echo off
title Test Node.js Modules
echo.
echo ========================================
echo   Testing Node.js Modules
echo ========================================
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo Testing if Node.js can load all required modules...
echo.

node test-node.js

echo.
echo ========================================
echo   Module test completed
echo ========================================
echo.
echo If you saw "All modules loaded successfully!" above,
echo then the modules are working and the issue is elsewhere.
echo.
echo If you saw error messages, those are the problems
echo that need to be fixed.
echo.
pause
