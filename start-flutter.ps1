# Tic Tac Toe - Flutter Frontend Launcher
# This script helps you run the Flutter mobile app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tic Tac Toe - Flutter Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Flutter is installed
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
$flutterCheck = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutterCheck) {
    Write-Host "ERROR: Flutter is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Flutter from: https://flutter.dev/docs/get-started/install" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Flutter found: $($flutterCheck.Source)" -ForegroundColor Green
Write-Host ""

# Navigate to Flutter project directory
$flutterDir = Join-Path $PSScriptRoot "flutter_frontend"
if (-not (Test-Path $flutterDir)) {
    Write-Host "ERROR: Flutter project directory not found at: $flutterDir" -ForegroundColor Red
    exit 1
}

Set-Location $flutterDir
Write-Host "Working directory: $flutterDir" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path ".dart_tool")) {
    Write-Host "Dependencies not installed. Running 'flutter pub get'..." -ForegroundColor Yellow
    flutter pub get
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Check for connected devices
Write-Host "Checking for connected devices/emulators..." -ForegroundColor Yellow
flutter devices
Write-Host ""

# Prompt user to start backend if not running
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "IMPORTANT: Backend must be running!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "The Flutter app requires the .NET Core backend to be running on http://localhost:5281" -ForegroundColor Yellow
Write-Host ""
Write-Host "To start the backend, open another PowerShell window and run:" -ForegroundColor Cyan
Write-Host "  cd dotnet_core_backend\GameBackend.API" -ForegroundColor White
Write-Host "  dotnet run" -ForegroundColor White
Write-Host ""

$backendRunning = Read-Host "Is the backend already running? (y/n)"
if ($backendRunning -ne 'y') {
    Write-Host ""
    Write-Host "Please start the backend first, then run this script again." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Flutter App..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run the Flutter app
Write-Host "Launching Flutter app..." -ForegroundColor Green
Write-Host "Press 'r' to hot reload, 'R' to hot restart, 'q' to quit" -ForegroundColor Cyan
Write-Host ""

flutter run

# Return to original directory
Set-Location $PSScriptRoot
