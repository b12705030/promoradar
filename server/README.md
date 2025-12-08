# Promo Backend

後端 API 服務，使用 Node.js + Express + TypeScript。

> 📖 完整專案文檔請參考根目錄的 [README.md](../README.md)

## 快速開始

### 安裝與啟動
```bash
npm install
cp env.example .env
# 編輯 .env 填入必要的環境變數

npm run dev   # 開發模式，預設 port 5050
npm run build # 構建生產版本
npm start     # 運行生產版本
```

看到 `[server] listening on port 5050` 代表啟動成功。

## 環境變數

複製 `env.example` 到 `.env` 並填入：

- `DATABASE_URL` - Supabase PostgreSQL 連接字串
- `SUPABASE_URL` - Supabase 專案 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `JWT_SECRET` - JWT 簽名密鑰（請使用強密鑰）
- `MONGODB_URI` - MongoDB Atlas 連接字串（可選，用於行為追蹤）
- `MONGODB_DB_NAME` - MongoDB 資料庫名稱（預設：coupon_radar）

## API 測試

### 認證測試
```bash
# 註冊
curl -X POST http://localhost:5050/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@example.com","password":"demo1234"}'

# 登入
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}'
```

### 優惠活動測試
```bash
# 健康檢查
curl http://localhost:5050/api/health

# 優惠列表
curl http://localhost:5050/api/promotions

# 優惠詳情
curl http://localhost:5050/api/promotions/1

# 使用優惠（需要 JWT token）
curl -X POST http://localhost:5050/api/promotions/1/claim \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 專案結構

```
server/
├── src/
│   ├── config/        # 配置（環境變數）
│   ├── controllers/   # 控制器
│   ├── lib/          # 工具庫（Supabase、MongoDB 客戶端）
│   ├── middleware/   # 中間件（認證、錯誤處理）
│   ├── repositories/ # 資料存取層
│   ├── routes/       # 路由定義
│   ├── services/      # 業務邏輯層
│   └── types/         # TypeScript 類型定義
├── env.example        # 環境變數範例
└── package.json
```

## 資料庫

- **Supabase (PostgreSQL)** - 主要資料庫
- **MongoDB Atlas** - 行為追蹤與分析（可選）

詳細資料庫架構請參考根目錄 README。

