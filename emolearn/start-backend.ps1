# Start Backend Server for EmoLearn
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   EmoLearn Backend Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path "backend"

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with required configuration" -ForegroundColor Red
    exit 1
}

# Create admin user
Write-Host "Creating admin user..." -ForegroundColor Yellow
npm run seed:admin
Write-Host ""

# Start the server
Write-Host "Starting backend server on port 5000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
npm run dev
