# Start both Backend and Frontend
Write-Host "Starting Full Stack Application..." -ForegroundColor Cyan

# Start Backend in background
Write-Host "Starting .NET Backend..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location "dotnet_core_backend\GameBackend.API"
    dotnet run
}

# Wait a moment for backend to start
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Next.js Frontend..." -ForegroundColor Blue
Set-Location "src"
npm run dev

# Cleanup background job when frontend stops
Stop-Job $backendJob
Remove-Job $backendJob
