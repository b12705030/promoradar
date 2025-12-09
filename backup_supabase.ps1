# Supabase Database Backup Script
# This script will backup your Supabase PostgreSQL database using pg_dump

# Add PostgreSQL bin to PATH
$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
if ($env:Path -notlike "*$pgBinPath*") {
    $env:Path += ";$pgBinPath"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Supabase Database Backup Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check pg_dump
try {
    $pgDumpVersion = pg_dump --version 2>&1
    Write-Host "[OK] PostgreSQL tool ready: $pgDumpVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] pg_dump not found" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed correctly." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Please enter your Supabase DATABASE_URL:" -ForegroundColor Yellow
Write-Host "Format: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" -ForegroundColor Gray
Write-Host ""
Write-Host "How to get it:" -ForegroundColor Cyan
Write-Host "  1. Supabase Dashboard -> Project Settings -> Database" -ForegroundColor Gray
Write-Host "  2. Click Connection string -> URI" -ForegroundColor Gray
Write-Host "  3. Or from server/.env file DATABASE_URL" -ForegroundColor Gray
Write-Host ""

# Read DATABASE_URL
$DATABASE_URL = Read-Host "DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($DATABASE_URL)) {
    Write-Host "[ERROR] DATABASE_URL cannot be empty!" -ForegroundColor Red
    exit 1
}

# Validate format
if ($DATABASE_URL -notmatch "^postgresql://") {
    Write-Host "[WARNING] DATABASE_URL format may be incorrect" -ForegroundColor Yellow
    $continue = Read-Host "Continue? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
}

# Generate backup filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "supabase_backup_$timestamp.dump"
$backupFileSql = "supabase_backup_$timestamp.sql"

Write-Host ""
Write-Host "Backup options:" -ForegroundColor Yellow
Write-Host "  1. Custom format (compressed, recommended) - File: $backupFile" -ForegroundColor Cyan
Write-Host "  2. SQL text file (readable) - File: $backupFileSql" -ForegroundColor Cyan
Write-Host "  3. Both formats" -ForegroundColor Cyan
Write-Host ""

$backupType = Read-Host "Select backup format (1/2/3, default: 1)"

$success = $false

# Execute backup
if ($backupType -eq "2" -or $backupType -eq "3") {
    Write-Host ""
    Write-Host "Creating SQL text file backup..." -ForegroundColor Yellow
    pg_dump $DATABASE_URL -f $backupFileSql
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFileSql).Length / 1MB
        Write-Host "[SUCCESS] SQL backup completed!" -ForegroundColor Green
        Write-Host "  File: $backupFileSql" -ForegroundColor Green
        Write-Host "  Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        $success = $true
    } else {
        Write-Host "[FAILED] SQL backup failed!" -ForegroundColor Red
    }
}

if ($backupType -eq "1" -or $backupType -eq "3" -or [string]::IsNullOrWhiteSpace($backupType)) {
    Write-Host ""
    Write-Host "Creating custom format backup (compressed)..." -ForegroundColor Yellow
    pg_dump $DATABASE_URL -F c -f $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "[SUCCESS] Custom format backup completed!" -ForegroundColor Green
        Write-Host "  File: $backupFile" -ForegroundColor Green
        Write-Host "  Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        $success = $true
    } else {
        Write-Host "[FAILED] Custom format backup failed!" -ForegroundColor Red
    }
}

Write-Host ""
if ($success) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Backup Completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backup file location: $(Get-Location)" -ForegroundColor Cyan
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Backup Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. DATABASE_URL is correct" -ForegroundColor Yellow
    Write-Host "  2. Network connection is normal" -ForegroundColor Yellow
    Write-Host "  3. Supabase database is accessible" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"
