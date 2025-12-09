# MongoDB Atlas Backup Script (Simple Version)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MongoDB Atlas Backup Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Please enter your MongoDB Atlas connection string:" -ForegroundColor Yellow
Write-Host "Format: mongodb+srv://username:password@cluster.mongodb.net/..." -ForegroundColor Gray
Write-Host ""
Write-Host "How to get it:" -ForegroundColor Cyan
Write-Host "  1. MongoDB Atlas Dashboard -> Connect -> Connect your application" -ForegroundColor Gray
Write-Host "  2. Or from server/.env file MONGODB_URI" -ForegroundColor Gray
Write-Host ""

# Read MONGODB_URI
$MONGODB_URI = Read-Host "MONGODB_URI"

if ([string]::IsNullOrWhiteSpace($MONGODB_URI)) {
    Write-Host "[ERROR] MONGODB_URI cannot be empty!" -ForegroundColor Red
    exit 1
}

# Read database name (optional)
Write-Host ""
$MONGODB_DB_NAME = Read-Host "Database name (default: coupon_radar)"

if ([string]::IsNullOrWhiteSpace($MONGODB_DB_NAME)) {
    $MONGODB_DB_NAME = "coupon_radar"
}

Write-Host ""
Write-Host "Starting backup..." -ForegroundColor Yellow
Write-Host ""

# Set environment variables and run Node.js script
$env:MONGODB_URI = $MONGODB_URI
$env:MONGODB_DB_NAME = $MONGODB_DB_NAME

$scriptPath = Join-Path $PSScriptRoot "backup_mongodb.js"
node $scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Backup completed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Backup failed, please check error messages." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"

