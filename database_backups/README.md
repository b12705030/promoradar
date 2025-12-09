# 資料庫備份檔案說明

本目錄包含 Promoradar 優惠雷達系統的資料庫備份檔案。

## 📁 備份檔案結構

```
database_backups/
├── README.md                                    # 本說明檔案
├── supabase_backup_20251210_030120.dump        # Supabase (PostgreSQL) 備份
└── mongodb_backup_2025-12-09T19-24-51/         # MongoDB Atlas 備份目錄
    ├── users_behavior.json                      # 使用者行為追蹤資料
    ├── admin_actions.json                       # 管理員操作記錄
    └── backup_info.json                         # 備份資訊
```

## 📊 備份內容說明

### 1. Supabase (PostgreSQL) 備份

**檔案**: `supabase_backup_20251210_030120.dump`  
**大小**: 1.21 MB  
**格式**: PostgreSQL 自訂格式（壓縮）  
**備份時間**: 2025-12-10 03:04:21

#### 包含的資料表：

**業務資料表**：
- `User` - 使用者資料
- `Brand` - 品牌資訊
- `Store` - 門市資料
- `Promotion` - 優惠活動
- `PromotionStore` - 優惠不適用門市
- `Favorite_Brand` - 品牌收藏
- `Favorite_Promotion` - 優惠收藏
- `Admin_Brand` - 品牌管理員
- `User_Promotion` - 使用者優惠使用記錄

**Supabase 系統表**：
- `auth.*` - 認證系統相關表
- `storage.*` - 檔案儲存系統
- `realtime.*` - 即時功能
- `vault.*` - 金鑰管理

### 2. MongoDB Atlas 備份

**目錄**: `mongodb_backup_2025-12-09T19-24-51`  
**資料庫名稱**: `coupon_radar`  
**備份時間**: 2025-12-09 19:24:57  
**總文件數**: 100 筆

#### Collections：

1. **users_behavior** (93 筆)
   - 使用者行為追蹤記錄
   - 包含：點擊、查看、搜尋、篩選、地圖開啟等行為

2. **admin_actions** (7 筆)
   - 管理員操作記錄
   - 包含：建立、更新、刪除優惠、編輯門市等操作

## 🔄 還原方法

### Supabase (PostgreSQL) 還原

#### 前置需求：
- 安裝 PostgreSQL 客戶端工具（包含 `pg_restore`）
- 取得 Supabase 資料庫連接字串

#### 還原步驟：

**Windows PowerShell:**
```powershell
# 將 PostgreSQL bin 加入 PATH
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

# 設定資料庫連接字串
$DATABASE_URL = "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# 還原備份
pg_restore -d $DATABASE_URL -c supabase_backup_20251210_030120.dump
```

**macOS/Linux:**
```bash
# 設定資料庫連接字串
export DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# 還原備份
pg_restore -d "$DATABASE_URL" -c supabase_backup_20251210_030120.dump
```

**參數說明**：
- `-d`: 指定目標資料庫
- `-c`: 在建立物件前先刪除（清理模式）
- `-v`: 詳細輸出（可選）

### MongoDB Atlas 還原

#### 前置需求：
- Node.js 18+
- MongoDB 驅動程式（`mongodb` npm 套件）

#### 還原步驟：

**方法 1: 使用 MongoDB Compass（圖形介面）**
1. 開啟 MongoDB Compass
2. 連接到您的 MongoDB Atlas 叢集
3. 選擇目標資料庫
4. 匯入 JSON 檔案到對應的 collection

**方法 2: 使用 mongoimport（命令列）**
```bash
# 還原 users_behavior
mongoimport --uri "mongodb+srv://USER:PASSWORD@cluster.mongodb.net/coupon_radar" \
  --collection users_behavior \
  --file users_behavior.json \
  --jsonArray

# 還原 admin_actions
mongoimport --uri "mongodb+srv://USER:PASSWORD@cluster.mongodb.net/coupon_radar" \
  --collection admin_actions \
  --file admin_actions.json \
  --jsonArray
```

**方法 3: 使用 Node.js 腳本**
```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://USER:PASSWORD@cluster.mongodb.net/';
const DB_NAME = 'coupon_radar';

async function restore() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  // 還原 users_behavior
  const usersBehavior = JSON.parse(fs.readFileSync('users_behavior.json', 'utf8'));
  await db.collection('users_behavior').insertMany(usersBehavior);
  
  // 還原 admin_actions
  const adminActions = JSON.parse(fs.readFileSync('admin_actions.json', 'utf8'));
  await db.collection('admin_actions').insertMany(adminActions);
  
  await client.close();
}

restore();
```

## ⚠️ 注意事項

1. **安全性**：
   - 備份檔案可能包含敏感資料（使用者資訊、密碼雜湊等）
   - 請妥善保管備份檔案
   - 不要將包含真實密碼的連接字串提交到公開儲存庫

2. **還原前準備**：
   - 還原前請先備份現有資料
   - 確認目標資料庫環境正確
   - 檢查資料庫連接字串是否正確

3. **版本相容性**：
   - Supabase 備份使用 PostgreSQL 自訂格式，需要相容的 `pg_restore` 版本
   - MongoDB 備份為 JSON 格式，相容性較高

4. **資料完整性**：
   - 還原後請驗證資料完整性
   - 檢查關鍵資料表記錄數量
   - 測試應用程式功能是否正常

## 📝 建立新備份

專案根目錄包含備份腳本，可用於建立新的備份。備份完成後，請將備份檔案移動到此目錄 (`database_backups/`)。

### Supabase (PostgreSQL) 備份

**使用互動式腳本（推薦）**：

在專案根目錄執行：

```powershell
.\backup_supabase.ps1
```

腳本會引導您：
1. 輸入 Supabase DATABASE_URL
2. 選擇備份格式（自訂格式或 SQL 文字檔）
3. 自動產生帶時間戳記的備份檔案

**備份檔案位置**：
- 備份檔案會產生在執行腳本的目錄
- 備份完成後，請將 `.dump` 或 `.sql` 檔案移動到 `database_backups/` 目錄

**範例**：
```powershell
# 執行備份
.\backup_supabase.ps1

# 備份完成後，移動檔案到 database_backups 目錄
Move-Item supabase_backup_*.dump database_backups/
```

### MongoDB Atlas 備份

**使用互動式腳本（推薦）**：

在專案根目錄執行：

```powershell
.\backup_mongodb_simple.ps1
```

腳本會引導您：
1. 輸入 MongoDB Atlas 連接字串 (MONGODB_URI)
2. 輸入資料庫名稱（預設：`coupon_radar`）
3. 自動產生帶時間戳記的備份目錄

**備份檔案位置**：
- 備份目錄會產生在執行腳本的目錄，格式：`mongodb_backup_YYYY-MM-DDTHH-mm-ss/`
- 備份完成後，請將整個備份目錄移動到 `database_backups/` 目錄

**範例**：
```powershell
# 執行備份
.\backup_mongodb_simple.ps1

# 備份完成後，移動目錄到 database_backups
Move-Item mongodb_backup_* database_backups/
```

### 其他備份腳本

專案根目錄還包含其他備份腳本：

- `backup_supabase.ps1` - Supabase 備份腳本（完整版，PowerShell）
- `backup_mongodb.js` - MongoDB 備份腳本（Node.js，可直接執行）
- `backup_mongodb_simple.ps1` - MongoDB 備份腳本（簡化版，PowerShell）
- `backup_simple.ps1` - Supabase 備份腳本（簡化版）

詳細使用說明請參考根目錄的 `BACKUP_GUIDE.md`。

## 🔗 相關資源

- [Supabase 文檔](https://supabase.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [MongoDB Atlas 文檔](https://www.mongodb.com/docs/atlas/)
- [pg_restore 文檔](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [mongoimport 文檔](https://www.mongodb.com/docs/database-tools/mongoimport/)

## 📅 備份記錄

| 日期 | Supabase 備份 | MongoDB 備份 | 備註 |
|------|--------------|-------------|------|
| 2025-12-10 | ✅ | ✅ | 初始完整備份 |

---

**最後更新**: 2025-12-10  
**維護者**: Promoradar 開發團隊

