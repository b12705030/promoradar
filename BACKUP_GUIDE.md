# Supabase 資料庫備份指南

## 方法 1: 使用 Supabase Dashboard（推薦）

### 步驟：
1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 進入 **Database** → **Backups**
4. 點擊 **Download** 下載自動備份
5. 或點擊 **Create backup** 建立手動備份

### 優點：
- 最簡單，不需要安裝任何工具
- 自動備份會定期建立
- 可以直接在 Dashboard 中管理

---

## 方法 2: 使用 pg_dump（命令列）

### 前置需求：
- 安裝 PostgreSQL 客戶端工具（包含 `pg_dump`）
  - Windows: 下載並安裝 [PostgreSQL](https://www.postgresql.org/download/windows/)
  - macOS: `brew install postgresql`
  - Linux: `sudo apt-get install postgresql-client` 或 `sudo yum install postgresql`

### 步驟：

#### 2.1 取得 DATABASE_URL
從您的 `.env` 檔案或 Supabase Dashboard 取得：
- 進入 Supabase Dashboard → **Project Settings** → **Database**
- 複製 **Connection string** 下的 **URI** 格式

格式範例：
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```

#### 2.2 執行備份命令

**Windows (PowerShell):**
```powershell
# 設定環境變數
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# 執行備份（自訂格式，可壓縮）
pg_dump $env:DATABASE_URL -F c -f "supabase_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

# 或備份為 SQL 文字檔
pg_dump $env:DATABASE_URL -f "supabase_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

**Windows (CMD):**
```cmd
set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
pg_dump %DATABASE_URL% -F c -f supabase_backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.dump
```

**macOS/Linux:**
```bash
# 設定環境變數
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# 執行備份（自訂格式，可壓縮）
pg_dump "$DATABASE_URL" -F c -f "supabase_backup_$(date +%Y%m%d_%H%M%S).dump"

# 或備份為 SQL 文字檔
pg_dump "$DATABASE_URL" -f "supabase_backup_$(date +%Y%m%d_%H%M%S).sql"
```

#### 2.3 使用提供的腳本

**Windows:**
1. 編輯 `backup_database.bat`
2. 修改 `DATABASE_URL` 為您的連接字串
3. 雙擊執行或在命令列執行：
   ```cmd
   backup_database.bat
   ```

**macOS/Linux:**
1. 編輯 `backup_database.sh`
2. 修改 `DATABASE_URL` 為您的連接字串
3. 賦予執行權限並執行：
   ```bash
   chmod +x backup_database.sh
   ./backup_database.sh
   ```

### pg_dump 參數說明：
- `-F c`: 自訂格式（壓縮，可選擇性還原）
- `-F p`: 純文字 SQL 格式（可讀，但檔案較大）
- `-f filename`: 指定輸出檔案名稱
- `--schema-only`: 只備份結構，不備份資料
- `--data-only`: 只備份資料，不備份結構

---

## 方法 3: 使用 Supabase CLI

### 前置需求：
安裝 Supabase CLI：
```bash
npm install -g supabase
```

### 步驟：

1. **登入 Supabase**
   ```bash
   supabase login
   ```

2. **連結專案**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   （專案參考 ID 可在 Dashboard 的 Project Settings 中找到）

3. **建立備份**
   ```bash
   supabase db dump -f backup.sql
   ```

---

## 還原備份

### 使用 pg_restore（自訂格式 .dump 檔案）：
```bash
pg_restore -d "$DATABASE_URL" -c backup.dump
```

### 使用 psql（SQL 文字檔）：
```bash
psql "$DATABASE_URL" < backup.sql
```

### 使用 Supabase CLI：
```bash
supabase db reset --db-url "$DATABASE_URL" < backup.sql
```

---

## 注意事項

1. **安全性**：
   - 不要將包含密碼的備份檔提交到 Git
   - 備份檔可能包含敏感資料，請妥善保管

2. **備份大小**：
   - 大型資料庫備份可能需要較長時間
   - 建議使用 `-F c` 格式以減少檔案大小

3. **定期備份**：
   - 建議設定自動化備份（使用 cron 或 Windows Task Scheduler）
   - Supabase 免費方案提供每日自動備份

4. **測試還原**：
   - 定期測試備份檔是否可以成功還原
   - 建議在測試環境中先驗證

---

## 快速參考

### 最簡單的方式（推薦）：
使用 Supabase Dashboard → Database → Backups → Download

### 命令列備份（完整控制）：
```bash
pg_dump "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" \
  -F c -f backup.dump
```

### 命令列還原：
```bash
pg_restore -d "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" \
  -c backup.dump
```

