# 114-1 資料庫管理 - Promoradar 優惠雷達

「Promoradar 優惠雷達」是一個整合各大飲料與連鎖品牌優惠資訊的平台，幫助使用者不用到處翻 IG、官網或海報，就能一次掌握近期有哪些買一送一、折扣或限時活動。系統提供日曆與地圖瀏覽、條件篩選與收藏功能，讓使用者可以依時間、地點與品牌快速找到想要的優惠；同時也提供品牌管理後台，讓商家能上架與管理優惠活動並追蹤使用狀況，縮短行銷曝光與實際消費之間的距離。

## 使用者功能

### User (一般使用者)

- 瀏覽優惠：提供兩種瀏覽模式，可隨時切換。
   - 日曆模式：以月曆呈現，使用者可點擊特定日期查看當日所有可用的優惠活動。
   - 地圖模式：在地圖頁面顯示門市位置與使用者附近的門市，使用者可查看符合當前篩選條件的門市（例如門市、品牌、地址），點擊門市可查看該店可使用的優惠活動。
- 篩選：使用者可依據多重條件進行篩選，包含：優惠主題、優惠活動類型、品牌、是否需要會員。
- 排序：可依「即將到期」、「最新上架」或「品牌排序」等進行排序。
- 搜尋：可輸入品牌名稱或活動關鍵字（如：「買一送一」、「薯條」）快速查找。
- 查看活動詳情：點擊任一優惠可查看詳細資訊，包含：活動條款、適用品項、適用分店、活動期間、截止時間倒數、可否與其他優惠併用，以及優惠總數或每人限量等的限制。
- 關注與收藏：使用者可關注喜愛的品牌，並收藏特定優惠活動，並於收藏頁面查看已收藏項目。
- 成就與使用紀錄
   - 使用者每次點擊「我已使用一次」按鈕，系統便會紀錄一次使用次數，若為限次券，同步顯示「已使用次數」與該優惠的上限（若無則顯示無上線）。
   - 生成「折扣大王排行榜」，增進使用者回報意願與互動性。
   - 成就系統顯示使用者達成的成就，例如:首次使用-使用第一次優惠活動，提供使用者成就感與獎勵機制。


### Admin （品牌經營者）

- 管理商店資訊：對其所屬品牌 (Brand) 和該品牌下的分店 (Store) 的資訊進行新增、修改的操作，包含品牌名稱、品牌分類、分店名稱、地址、是否歇業等。
- 管理優惠活動：對其品牌的優惠活動 (Promotion) 進行新增、修改、發布、取消的操作。
- 名額與用量追蹤：即時查看每個活動的剩餘名額、已使用量、點擊優惠券次數、瀏覽優惠券次數之使用情形。


## 使用方法

### For 所有使用者 (含 Admin)

點擊下方連結開啟

Promoradar 連結：**https://promoradar.vercel.app/**

### For 開發者

#### 1. 前置需求

- Node.js 18+ 
- npm
- Supabase 帳號（資料庫）
- MongoDB Atlas 帳號（行為追蹤）

#### 2. 後端設置
- 資料庫使用 supabase 作為平台來建構，因此可以將 .backup 檔上傳至 supabase 使用。或者若想要直接使用我們建構好的，可寄信至 tca940120@gmail.com 詢問。

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


## 技術細節

### Client-Server 架構

系統採用 RESTful API 架構，前端與後端完全分離。前端透過 HTTP/HTTPS 協定與後端進行溝通，使用 JSON 格式交換資料。後端提供 RESTful API 端點，支援多個使用者同時連線使用系統。

### 資料庫操作

- 關聯式資料庫使用 PostgreSQL（透過 Supabase 託管），後端使用 Supabase 客戶端庫（`@supabase/supabase-js`）對進行資料庫進行操作。Supabase 客戶端庫提供高階 API 來查詢資料或呼叫 stored procedure。
- 非關聯式資料庫使用 MongoDB Atlas (NoSQL)，用於行為追蹤與分析，記錄使用者行為與品牌經營者 admin 的操作。

> 可參考 `server/src/lib/supabaseClient.ts` 中的 Supabase 客戶端初始化，以及 `server/src/repositories/promotionRepository.ts` 中的使用範例。

### 交易管理

針對使用者【記錄使用優惠】的功能，為實現交易管理，系統使用 PostgreSQL stored procedure `claim_promotion()` 來處理。在記錄使用的過程中，如果出現違反資料表限制的情況（例如名額已用完、優惠不在有效期間內等），stored procedure 會拋出例外（RAISE EXCEPTION），此時 PostgreSQL 會自動 ROLLBACK 回滾該次交易，取消之前的所有資料庫異動。反之，若記錄過程順利完成，PostgreSQL 會自動 COMMIT 提交交易，確保使用記錄已成功儲存至資料庫。

> 可參考 `server/sql/transactions.sql` 中的 `claim_promotion()` 函式與 `server/src/services/promotionService.ts` 中的 `claim()` 方法。

### 併行控制

針對【記錄使用優惠】功能，為避免不同使用者同時記錄使用同一個優惠時造成名額超發，在使用者點擊「我已使用一次」按鈕後，系統會透過 `SELECT FOR UPDATE` 鎖定優惠記錄，檢查該優惠是否仍有名額，若仍有名額則新增使用記錄到 `user_promotion` 並解鎖，若無名額，則解鎖並回傳錯誤訊息，以確保名額不會被超發。

> 可參考 `server/sql/transactions.sql` 中的 `claim_promotion()` 函式，該函式使用 `SELECT FOR UPDATE` 實現併行控制。

## 程式說明

### 專案結構

```
promoradar/
├── promoradar/         # 前端 (React + TypeScript + Vite)
├── server/             # 後端 (Node.js + Express + TypeScript)
├── package.json
├── .gitignore
└── README.md
```

### 後端程式說明

**`server/src/index.ts`**

包含後端應用程式的入口點，建立 Express 伺服器並開始監聽指定埠號，接收來自前端的 HTTP 請求。

**`server/src/server.ts`**

建立 Express 應用程式，設定 CORS、JSON 解析、路由與錯誤處理中間件，確保伺服器能正確處理跨來源請求與錯誤回應。

**`server/src/routes/` 資料夾**

定義所有 API 路由端點，將 HTTP 請求對應到對應的控制器方法。包含認證路由、優惠路由、使用者路由、管理員路由與追蹤路由。

**`server/src/controllers/` 資料夾**

處理 HTTP 請求與回應，從請求中提取參數並呼叫對應的服務層方法，將結果回傳給前端。

**`server/src/services/` 資料夾**

處理資料驗證、權限檢查與規則。每個服務對應一個功能（認證、優惠、使用者、管理員、追蹤）。

**`server/src/repositories/` 資料夾**

與資料庫相關的功能，包含資料庫連線管理與查詢操作。使用 Supabase 客戶端庫進行 PostgreSQL 操作，使用 MongoDB 客戶端進行行為追蹤記錄。

**`server/src/middleware/` 資料夾**

處理認證驗證（`requireAuth.ts`）、錯誤處理（`errorHandler.ts`）與 404 處理（`notFoundHandler.ts`）。

**`server/src/lib/` 資料夾**

共用工具庫，例如 Supabase 客戶端初始化（`supabaseClient.ts`）與 MongoDB 客戶端初始化（`mongodbClient.ts`）。

**`server/src/utils/` 資料夾**

所有工具函式，例如密碼雜湊（`password.ts`）與 JWT token 生成與驗證（`token.ts`）。

**`server/sql/transactions.sql`**

包含 PostgreSQL stored procedures，實現交易管理與併行控制功能，例如 `claim_promotion()` 與 `update_promotion_quota()`。

### 前端程式說明

**`promoradar/src/main.tsx`**

前端應用程式的入口點，初始化 React 應用程式並掛載到 DOM。

**`promoradar/src/App.tsx`**

包含應用程式的主要結構，設定路由、導航列、側邊選單與全域狀態提供者（DataProvider、AuthProvider）。

**`promoradar/src/pages/` 資料夾**

包含所有頁面元件，每個頁面對應一個路由。包含首頁（`CalendarHome.tsx`）、優惠詳情頁（`PromotionDetail.tsx`）、地圖頁（`Map.tsx`）、收藏頁（`Wishlist.tsx`）、個人資料頁（`Profile.tsx`）、管理後台（`AdminDashboard.tsx`）與登入頁（`Auth.tsx`）。

**`promoradar/src/components/` 資料夾**

包含可重用的 UI 元件，例如優惠卡片（`PromotionCard.tsx`），可在多個頁面中使用。

**`promoradar/src/lib/` 資料夾**

與後端 API 溝通的功能，包含 API 客戶端設定（`apiClient.ts`）、優惠相關 API（`promoData.ts`）、使用者相關 API（`userApi.ts`）、管理員相關 API（`adminApi.ts`）與行為追蹤 API（`trackingApi.ts`）。

**`promoradar/src/store/` 資料夾**

使用 Zustand 進行狀態管理，包含認證狀態（`useAuth.ts`）、收藏狀態（`usePromotionFavorites.ts`）、使用記錄狀態（`usePromotionUsage.ts`）、品牌關注狀態（`useBrandFollow.ts`）與篩選狀態（`usePromotionFilters.ts`）。

**`promoradar/src/context/` 資料夾**

使用 React Context 提供全域資料，例如優惠、門市、品牌等資料（`DataContext.tsx`），透過 Context Provider 將資料傳遞給所有子元件。

**`promoradar/src/hooks/` 資料夾**

包含自訂 React Hooks，例如 `useFilteredPromotions.ts`，封裝優惠篩選邏輯，讓元件可以重複使用。

**`promoradar/src/config/` 資料夾**

包含設定檔，例如品牌設定（`brands.ts`）與優惠類型設定（`promotionMeta.ts`），定義品牌資訊與優惠類型的顯示方式。

### API 端點

#### 認證
- `POST /api/auth/signup` - 註冊
- `POST /api/auth/login` - 登入

#### 優惠活動
- `GET /api/promotions` - 優惠列表
- `GET /api/promotions/dataset` - 完整資料集
- `GET /api/promotions/:id` - 優惠詳情
- `POST /api/promotions/:id/claim` - 使用優惠

#### 使用者
- `GET /api/user/favorites/promotions` - 收藏的優惠
- `POST /api/user/favorites/promotions/:id` - 收藏/取消收藏優惠
- `GET /api/user/favorites/brands` - 關注的品牌
- `POST /api/user/favorites/brands/:name` - 關注/取消關注品牌
- `GET /api/user/promotion-usage` - 使用記錄
- `GET /api/user/rankings` - 折扣大王排行榜

#### 管理員
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

#### 追蹤
- `POST /api/track` - 記錄使用者行為

## 開發環境

- **作業系統**: Windows 11
- **Node.js**: 18.0.0 或以上版本
- **TypeScript**: 5.5.4 (後端) / 5.9.3 (前端)
- **React**: 19.2.0
- **Express**: 4.19.2
- **@supabase/supabase-js**: 2.42.5
- **jsonwebtoken**: 9.0.2
- **bcryptjs**: 2.4.3
- **PostgreSQL**: 16.4 (透過 Supabase 託管)
- **MongoDB**: 7.0 (透過 MongoDB Atlas 託管)

## 技術棧

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

## 授權

本專案為學術專案，僅供學習使用。
