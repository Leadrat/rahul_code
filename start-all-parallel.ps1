# Start both Backend and Frontend in parallel terminals
Write-Host "Starting Full Stack Application in Parallel..." -ForegroundColor Cyan

# Get current directory
$rootDir = Get-Location

# Start Backend in new PowerShell window
Write-Host "Starting .NET Backend in new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\dotnet_core_backend\GameBackend.API'; dotnet run"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend in new PowerShell window
Write-Host "Starting Next.js Frontend in new window..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\src'; npm run dev"

Write-Host "Both services started in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5281" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
