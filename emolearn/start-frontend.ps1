# Start Frontend for EmoLearn
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   EmoLearn Frontend Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "frontend"

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
REACT_APP_API_URL=http://localhost:5000/api
PORT=3000
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host ".env file created!" -ForegroundColor Green
    Write-Host ""
}

# Download models before starting
Write-Host "Downloading face detection models..." -ForegroundColor Green
npm run download-models

# Start the development server
Write-Host "`nStarting development server..." -ForegroundColor Green
Write-Host ""

# Start the React development server
Write-Host "The app will open at http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
npm start
