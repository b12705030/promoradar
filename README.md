# Promoradar 優惠雷達

追蹤各大飲料/速食品牌的優惠資訊，快速掌握進行中與即將開跑的活動。透過優惠雷達探索附近門市、管理收藏與提醒，找到最划算的優惠方案。

## 📋 專案結構

```
db_final_project/
├── promoradar/          # 前端 (React + TypeScript + Vite)
├── server/             # 後端 (Node.js + Express + TypeScript)
└── README.md           # 本文件
```

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- npm 或 yarn
- Supabase 帳號（資料庫）
- MongoDB Atlas 帳號（行為追蹤）

### 本地開發

#### 1. 後端設置

```bash
cd server
npm install

# 複製環境變數範例
cp env.example .env

# 編輯 .env 文件，填入以下變數：
# - DATABASE_URL (Supabase PostgreSQL)
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET (請使用強密鑰)
# - MONGODB_URI (MongoDB Atlas 連接字串)
# - MONGODB_DB_NAME (預設: coupon_radar)

# 啟動開發伺服器
npm run dev
```

後端會在 `http://localhost:5050` 啟動

#### 2. 前端設置

```bash
cd promoradar
npm install

# 建立 .env 文件（可選）
# VITE_API_BASE=http://localhost:5050/api

# 啟動開發伺服器
npm run dev
```

前端會在 `http://localhost:4000` 啟動

## 📦 部署

### 後端部署（推薦：Railway）

1. **準備專案**
   ```bash
   cd server
   npm run build
   ```

2. **部署到 Railway**
   - 註冊 https://railway.app
   - 新建專案 → 從 GitHub 導入（選擇你的 repository）
   - **方式一：使用 Root Directory（推薦）**
     - 導入後，點擊服務（Service）→ Settings → Root Directory
     - 設置 Root Directory 為 `server`
   - **方式二：如果找不到 Root Directory 選項**
     - 專案根目錄已包含 `nixpacks.toml` 配置文件
     - Railway 會自動使用該配置進行構建（會自動切換到 `server/` 目錄）
   - 在 Variables 標籤添加所有環境變數（見上方後端設置）
   - Railway 會自動構建和部署

3. **取得後端網址**
   - 部署完成後，Railway 會提供一個 `.railway.app` 網址
   - 例如：`https://your-backend.railway.app`

### 前端部署（推薦：Vercel）

1. **準備專案**
   ```bash
   cd promoradar
   npm run build
   ```

2. **部署到 Vercel**
   ```bash
   # 安裝 Vercel CLI
   npm i -g vercel

   # 登入並部署
   cd promoradar
   vercel

   # 設置環境變數
   # 在 Vercel 專案設定中添加：
   # VITE_API_BASE=https://your-backend.railway.app/api

   # 生產環境部署
   vercel --prod
   ```

3. **或使用 Vercel Web UI**
   - 連接 GitHub repository
   - 設置 Root Directory 為 `promoradar`
   - 添加環境變數 `VITE_API_BASE`
   - 自動部署

### 環境變數清單

#### 後端（server/.env）
```env
PORT=5050
NODE_ENV=production
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=你的強密鑰
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=coupon_radar
```

#### 前端（promoradar/.env 或 Vercel 環境變數）
```env
VITE_API_BASE=https://your-backend.railway.app/api
```

## 🗄️ 資料庫架構

### Supabase (PostgreSQL)

#### 主要資料表

**Brand（品牌）**
- `brand_name` VARCHAR(100), PK - 品牌名稱（例：Starbucks）
- `name` VARCHAR(100) - 顯示名稱
- `category` VARCHAR(50) - 品牌分類（可選：`Drink-Tea`, `Drink-Milk`, `Drink-Juice`, `Drink-Coffee`, `Convenience_Coffee`, `Dessert`, `Bakery`, `Fast_Food`, `Bubble_Tea`, `Smoothie`, `Ice_Cream`, `Breakfast`, `Other`）
- `logo_url` VARCHAR(255) - Logo 網址
- `primary_color` VARCHAR(7) - 主題色（HEX）
- `secondary_color` VARCHAR(7) - 次要色（HEX）
- `text_color` VARCHAR(7) - 文字色（HEX）

**Brand_Category（品牌分類）**
- `brand_name` VARCHAR(100), FK → `Brand(brand_name)` - 品牌名稱
- `category` VARCHAR(50) - 分類

**Store（門市）**
- `store_id` INT, PK - 分店流水號
- `brand_name` VARCHAR(100), FK → `Brand(brand_name)` - 所屬品牌
- `name` VARCHAR(100) - 分店名稱
- `address` VARCHAR(255) - 地址
- `lat` DECIMAL(10,6) - 緯度
- `lng` DECIMAL(10,6) - 經度
- `region` VARCHAR(50) - 行政區或地區
- `is_active` BOOLEAN - 是否仍營業（預設：TRUE）

**Promotion（優惠活動）**
- `promo_id` INT, PK - 活動流水號
- `brand_name` VARCHAR(100), FK → `Brand(brand_name)` - 所屬品牌
- `title` VARCHAR(150) - 活動標題
- `description` TEXT - 活動內容
- `promo_type` VARCHAR(50) - 活動類型：`Buy1Get1`, `Discount`, `Second_Cup`, `Special_Price`, `Gift_With_Purchase`, `Limited_Offer`, `Seasonal`, `Other`
- `event_tag` VARCHAR(50) - 活動標籤：`Halloween`, `Christmas`, `New_Year`, `Seasonal`, `Limited_Time`, `Member_Exclusive`, `Payment_Promo`, `Food_Waste_Reduction`, `Discount_Festival`, `New_Product`, `Weekend_Deal`, `McDelivery`, `Breakfast`, `Other`
- `start_datetime` TIMESTAMP - 開始時間
- `end_datetime` TIMESTAMP - 結束時間
- `stacking_rule` TEXT - 堆疊規則（注意事項）
- `need_membership` BOOLEAN - 是否會員限定
- `need_code` BOOLEAN - 是否需要輸入序號/條碼
- `per_user_limit` INT - 每位使用者可領/用次數（0 代表不限）
- `global_quota` INT - 活動總名額（NULL 代表不限）
- `daily_quota` INT - 每日名額（NULL 代表不限）
- `status` VARCHAR(20) - 狀態：`Draft`, `Published`, `Canceled`
- `creator_id` INT, FK → `User(user_id)` - 建立活動的 admin

**PromotionStore（優惠不適用門市）**
- `promo_id` INT, FK → `Promotion(promo_id)` - 活動
- `store_id` INT, FK → `Store(store_id)` - 不適用/排除的分店

**User（使用者）**
- `user_id` INT, PK - 使用者流水號
- `username` VARCHAR(50) - 顯示名稱
- `birthdate` DATE - 生日
- `email` VARCHAR(150), UNIQUE - 登入信箱
- `password` VARCHAR(100) - 密碼雜湊
- `created_at` TIMESTAMP - 建立時間
- `is_admin` BOOLEAN - 是否為平台/品牌管理者

**Favorite_Brand（品牌收藏）**
- `user_id` INT, FK → `User(user_id)` - 收藏者
- `brand_name` VARCHAR(100), FK → `Brand(brand_name)` - 被收藏品牌
- `created_at` TIMESTAMP - 收藏時間

**Favorite_Promotion（優惠收藏）**
- `user_id` INT, FK → `User(user_id)` - 收藏者
- `promo_id` INT, FK → `Promotion(promo_id)` - 被收藏優惠
- `created_at` TIMESTAMP - 收藏時間

**Admin_Brand（品牌管理員）**
- `admin_id` INT, FK → `User(user_id)` - 品牌管理者
- `brand_name` VARCHAR(100), FK → `Brand(brand_name)` - 所屬品牌

**User_Promotion（使用者優惠使用記錄）**
- `user_id` INT, FK → `User(user_id)` - 使用者
- `promo_id` INT, FK → `Promotion(promo_id)` - 使用的優惠
- `created_at` TIMESTAMP - 使用/記錄時間

### MongoDB Atlas

#### Collections

**users_behavior（使用者行為追蹤）**
- `user_id` STRING - Supabase `user.user_id`，未登入可用匿名/guest ID
- `action` STRING - 操作類型：`click_promo`, `view_promo`, `search`, `filter`, `open_map`, `open_brand`, `scroll_list`
- `promo_id` STRING - 若與優惠有關，填 Supabase `promotion.promo_id`
- `brand_name` STRING - 若與品牌有關，填 Supabase `brand.brand_name`
- `search_keyword` STRING - 若 `action = "search"`，填使用者輸入的關鍵字
- `tags` [STRING] - 當下瀏覽的主題標籤，對應 `promotion.event_tag`
- `timestamp` DATE - 事件發生時間（由後端寫入 server time）

**admin_actions（品牌後台操作記錄）**
- `admin_id` STRING - 對應 Supabase `admin_brand.admin_id`
- `brand_name` STRING - 該 admin 所屬品牌，對應 Supabase `admin_brand.brand_name`
- `action` STRING - 操作類型：`create_promo`, `update_promo`, `delete_promo`, `edit_store`
- `promo_id` STRING - 若與優惠有關，填 `promotion.promo_id`
- `store_id` STRING - 若與分店有關，填 `store.store_id`
- `timestamp` DATE - 操作時間（由後端寫入 server time）

## 🔑 主要功能

### 使用者功能
- ✅ 瀏覽優惠活動（儀表板、日曆視圖）
- ✅ 搜尋與篩選優惠
- ✅ 收藏優惠與品牌
- ✅ 查看優惠詳情
- ✅ 門市地圖（距離排序、品牌標記）
- ✅ 使用優惠記錄
- ✅ 折扣大王排行榜
- ✅ 使用者成就系統

### 管理員功能
- ✅ 品牌管理（新增、編輯品牌資訊）
- ✅ 門市管理（新增、編輯門市）
- ✅ 優惠活動管理（草稿、發布、取消）
- ✅ 名額管理（總名額、每日名額、使用統計）
- ✅ 優惠不適用門市設定
- ✅ 活動分析（剩餘名額、已使用量、每日使用量）

## 📊 行為追蹤

系統會自動記錄以下行為到 MongoDB：

### 使用者行為 (`users_behavior`)
- `click_promo` - 點擊優惠卡片
- `view_promo` - 查看優惠詳情
- `search` - 搜尋關鍵字
- `filter` - 變更篩選條件
- `open_map` - 打開地圖頁
- `open_brand` - 進入品牌頁
- `scroll_list` - 滾動列表

### 管理員操作 (`admin_actions`)
- `create_promo` - 新增優惠
- `update_promo` - 編輯優惠
- `delete_promo` - 取消優惠
- `edit_store` - 新增/編輯門市

## 🛠️ 技術棧

### 前端
- React 19 + TypeScript
- Vite
- Material-UI (MUI)
- React Router
- Zustand (狀態管理)
- Leaflet (地圖)
- dayjs

### 後端
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL)
- MongoDB Atlas
- JWT 認證
- bcryptjs (密碼雜湊)

## 📝 API 端點

### 認證
- `POST /api/auth/signup` - 註冊
- `POST /api/auth/login` - 登入

### 優惠活動
- `GET /api/promotions` - 優惠列表
- `GET /api/promotions/dataset` - 完整資料集
- `GET /api/promotions/:id` - 優惠詳情
- `POST /api/promotions/:id/claim` - 使用優惠

### 使用者
- `GET /api/user/favorites/promotions` - 收藏的優惠
- `POST /api/user/favorites/promotions/:id` - 收藏/取消收藏優惠
- `GET /api/user/favorites/brands` - 關注的品牌
- `POST /api/user/favorites/brands/:name` - 關注/取消關注品牌
- `GET /api/user/promotion-usage` - 使用記錄
- `GET /api/user/rankings` - 折扣大王排行榜

### 管理員
- `GET /api/admin/brands` - 管理品牌列表
- `POST /api/admin/brands` - 新增品牌
- `PATCH /api/admin/brands/:key` - 更新品牌
- `GET /api/admin/stores` - 門市列表
- `POST /api/admin/stores` - 新增門市
- `PATCH /api/admin/stores/:id` - 更新門市
- `GET /api/admin/promotions` - 優惠列表
- `POST /api/admin/promotions` - 新增優惠
- `PATCH /api/admin/promotions/:id` - 更新優惠
- `POST /api/admin/promotions/:id/publish` - 發布優惠
- `POST /api/admin/promotions/:id/cancel` - 取消優惠
- `GET /api/admin/promotions/:id/quota` - 名額統計
- `GET /api/admin/promotions/:id/exclusions` - 不適用門市
- `PUT /api/admin/promotions/:id/exclusions` - 設定不適用門市

### 追蹤
- `POST /api/track` - 記錄使用者行為

## 🔒 安全注意事項

1. **JWT_SECRET**：請使用強密鑰，建議使用：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **環境變數**：不要將 `.env` 文件提交到 Git

3. **CORS**：在 `server/src/server.ts` 中設置允許的前端域名

4. **MongoDB Network Access**：確保 MongoDB Atlas 允許部署平台的 IP 訪問

## 📄 授權

本專案為學術專案，僅供學習使用。

## 👥 貢獻

歡迎提交 Issue 或 Pull Request！

