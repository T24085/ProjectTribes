@echo off
echo Creating desktop shortcut for Tribes Donation Server...

REM Get the current directory
set "CURRENT_DIR=%~dp0"
set "BATCH_FILE=%CURRENT_DIR%start-donation-server.bat"

REM Get desktop path
set "DESKTOP=%USERPROFILE%\Desktop"

REM Create the shortcut
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\Tribes Donation Server.lnk'); $Shortcut.TargetPath = '%BATCH_FILE%'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'Start Tribes Professional League Donation Server'; $Shortcut.Save()"

echo.
echo ✅ Desktop shortcut created!
echo You can now double-click "Tribes Donation Server" on your desktop
echo to start the donation server.
echo.
pause
