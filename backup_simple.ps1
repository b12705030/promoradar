# Simple Supabase Backup Script
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

$DATABASE_URL = "postgresql://postgres:yxul4dj45j004@db.sdkucftvydymdvcoeeup.supabase.co:5432/postgres"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "supabase_backup_$timestamp.dump"

Write-Host "Starting backup..." -ForegroundColor Yellow
Write-Host "Backup file: $backupFile" -ForegroundColor Yellow
Write-Host ""

# Try using environment variables instead
$env:PGHOST = "db.sdkucftvydymdvcoeeup.supabase.co"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "yxul4dj45j004"
$env:PGDATABASE = "postgres"

Write-Host "Attempting backup with environment variables..." -ForegroundColor Cyan
pg_dump -F c -f $backupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host ""
    Write-Host "SUCCESS! Backup completed!" -ForegroundColor Green
    Write-Host "File: $backupFile" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backup location: $(Get-Location)" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "FAILED! Connection error." -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check internet connection" -ForegroundColor Cyan
    Write-Host "2. Verify Supabase project is active" -ForegroundColor Cyan
    Write-Host "3. Try downloading backup from Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "   Dashboard -> Database -> Backups -> Download" -ForegroundColor Gray
    Write-Host "4. Check if firewall is blocking port 5432" -ForegroundColor Cyan
}

