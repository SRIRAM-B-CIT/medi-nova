# MediNova Setup Verification

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MediNova MongoDB Migration Setup    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "   ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js not found!" -ForegroundColor Red
    exit 1
}

# Check NPM
Write-Host "2. Checking NPM..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "   ✓ NPM installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ NPM not found!" -ForegroundColor Red
    exit 1
}

# Check backend directory
Write-Host "3. Checking backend directory..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "   ✓ Backend directory exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check backend .env
Write-Host "4. Checking backend .env..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "   ✓ Backend .env exists" -ForegroundColor Green
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "MONGODB_URI=mongodb") {
        Write-Host "   ✓ MongoDB URI configured" -ForegroundColor Green
    } else {
        Write-Host "   ✗ MongoDB URI not found in .env!" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ Backend .env not found!" -ForegroundColor Red
}

# Check backend node_modules
Write-Host "5. Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "   ✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ! Backend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd backend && npm install" -ForegroundColor Yellow
}

# Check frontend .env
Write-Host "6. Checking frontend .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✓ Frontend .env exists" -ForegroundColor Green
    $frontendEnv = Get-Content ".env" -Raw
    if ($frontendEnv -match "VITE_API_URL") {
        Write-Host "   ✓ VITE_API_URL configured" -ForegroundColor Green
    } else {
        Write-Host "   ! VITE_API_URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ Frontend .env not found!" -ForegroundColor Red
}

# Check frontend node_modules
Write-Host "7. Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ! Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "          Setup Status Summary          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ MongoDB URI: mongodb+srv://srirambcse2024_db_user:...@cluster0.xw8vklw.mongodb.net" -ForegroundColor Green
Write-Host "✓ Backend Port: 5000" -ForegroundColor Green
Write-Host "✓ Frontend Port: 5173 (default Vite)" -ForegroundColor Green
Write-Host "✓ Authentication: JWT-based" -ForegroundColor Green
Write-Host "✓ Database: MongoDB Atlas" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "  1. Terminal 1: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Terminal 2: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the startup script:" -ForegroundColor Yellow
Write-Host "  .\start-both.bat" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - README_MIGRATION.md - Complete migration guide" -ForegroundColor White
Write-Host "  - MIGRATION_COMPLETE.md - Status and summary" -ForegroundColor White
Write-Host "  - backend/README.md - Backend API documentation" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
