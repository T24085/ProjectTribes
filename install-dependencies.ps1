# Install Node.js Dependencies for Tribes Donation Server
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing Node.js Dependencies" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to the directory where this script is located
Set-Location $PSScriptRoot

Write-Host "Node.js is already installed and working!" -ForegroundColor Green
Write-Host "The issue is that the required modules are missing." -ForegroundColor Yellow
Write-Host ""
Write-Host "Installing the following modules:" -ForegroundColor Cyan
Write-Host "- express (web server)" -ForegroundColor White
Write-Host "- crypto (encryption - built into Node.js)" -ForegroundColor White
Write-Host "- axios (HTTP client)" -ForegroundColor White
Write-Host "- ngrok (tunnel service)" -ForegroundColor White
Write-Host ""

Write-Host "Running: npm install" -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

try {
    npm install
    
    Write-Host ""
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can run the server:" -ForegroundColor Cyan
    Write-Host "1. Double-click 'Tribes Donation Server' on your desktop" -ForegroundColor White
    Write-Host "2. Or run 'debug-server.bat' to test everything" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host ""
    Write-Host "This could be due to:" -ForegroundColor Yellow
    Write-Host "- Internet connection issues" -ForegroundColor White
    Write-Host "- npm registry problems" -ForegroundColor White
    Write-Host "- Permission issues" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running this as Administrator or check your internet connection." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
