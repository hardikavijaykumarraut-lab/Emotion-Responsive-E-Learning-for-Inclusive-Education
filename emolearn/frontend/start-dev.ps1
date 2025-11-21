$env:NODE_OPTIONS='--openssl-legacy-provider'
Write-Host "Starting development server with NODE_OPTIONS: $env:NODE_OPTIONS"
npm start
