# Promoradar Frontend

前端應用程式，使用 React + TypeScript + Vite。

> 📖 完整專案文檔請參考根目錄的 [README.md](../README.md)

## 快速開始

### 安裝與啟動
```bash
npm install

# 開發模式（預設 port 4000）
npm run dev

# 構建生產版本
npm run build

# 預覽生產版本
npm run preview
```

### 環境變數（可選）

建立 `.env` 文件：

```env
VITE_API_BASE=http://localhost:5050/api
```

如果不設置，前端會使用 CSV 作為 fallback 資料來源。

## 專案結構

```
promoradar/
├── src/
│   ├── components/    # 可重用組件
│   ├── config/       # 配置（品牌、活動類型等）
│   ├── context/      # React Context（資料提供者）
│   ├── hooks/        # 自定義 Hooks
│   ├── lib/          # 工具庫（API 調用、資料處理）
│   ├── pages/        # 頁面組件
│   ├── store/        # Zustand 狀態管理
│   └── types/        # TypeScript 類型定義
├── public/           # 靜態資源
└── vite.config.ts    # Vite 配置
```

## 主要頁面

- **儀表板** (`/`) - 優惠活動總覽、分類展示
- **活動日曆** (`/calendar`) - 日曆視圖、每日活動
- **門市地圖** (`/map`) - 地圖顯示、距離排序
- **收藏清單** (`/wishlist`) - 收藏的優惠
- **優惠詳情** (`/promotions/:id`) - 活動詳細資訊
- **帳號中心** (`/profile`) - 使用者資訊、成就、排行榜
- **管理後台** (`/admin`) - 品牌管理（僅管理員）

## 技術棧

- React 19 + TypeScript
- Vite
- Material-UI (MUI)
- React Router
- Zustand（狀態管理）
- Leaflet（地圖）
- dayjs

## 開發注意事項

- 本應用主要針對手機設計，建議使用手機瀏覽器測試
- 支援 PWA，可安裝到主畫面
- 使用 CSV 作為 fallback 資料來源（當 API 不可用時）
