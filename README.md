# LINE Bot 專案

## 概述
基於 Node.js 的 LINE Bot 應用程式，支援雙 webhook（sxi-bot 和 fas-bot），使用 Docker 運行並通過 Nginx 代理管理器進行 SSL 終止。新增了對話管理功能，包括對話記錄查詢、對話內容分析等。

## 功能特點
- 支援雙 LINE Bot 與獨立 webhook
  - `/webhook1`: sxi-bot
  - `/webhook2`: fas-bot
- 通過 Let's Encrypt 實現 SSL/TLS 加密
- Docker 容器化部署
- Nginx 反向代理
- 健康檢查監控
- 管理介面
  - 規則管理與即時預覽
  - 配置自動保存
  - 友善的使用者提示
- 對話管理功能
  - 對話記錄查詢
  - 對話內容分析

## 前置需求
- Docker 和 Docker Compose
- Node.js
- Nginx 代理管理器
- LINE 開發者帳號
- 已配置 DNS 的網域名稱

## 安裝步驟
1. 克隆儲存庫
```bash
git clone [你的儲存庫網址]
cd linebot
```

2. 建立環境檔案
```bash
cp .env.example .env
# 編輯 .env 並填入你的 LINE channel 憑證
```

3. 建構並啟動容器
```bash
docker-compose up -d
```

## 配置說明
- 為你的網域配置 Nginx 代理管理器
- 通過 Let's Encrypt 設置 SSL 憑證
- 在 LINE 開發者控制台配置 webhook 網址：
  - 主要： https://[你的網域]/webhook1
  - 次要： https://[你的網域]/webhook2

## 開發指南
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行測試
npm test

# 建構生產版本
npm run build
```

## 專案結構
```
linebot/
├── admin/              # 管理介面
│   ├── components/     # UI 組件
│   ├── api.js         # API 函數
│   └── admin.js       # 管理邏輯
├── webhook/           # Webhook 處理器
│   ├── primary.js    # 主要 Bot
│   └── secondary.js  # 次要 Bot
├── config/           # 配置檔案
├── test/            # 測試檔案
└── app.js          # 主應用程式
```

## 環境變數
```
LINE_CHANNEL_ACCESS_TOKEN=你的主要頻道存取權杖
LINE_CHANNEL_SECRET=你的主要頻道密鑰
LINE_CHANNEL_ACCESS_TOKEN_2=你的次要頻道存取權杖
LINE_CHANNEL_SECRET_2=你的次要頻道密鑰
PORT=80
NODE_ENV=production
```

## API 端點
- `GET /health`: 健康檢查
- `POST /webhook1`: 主要 Bot webhook
- `POST /webhook2`: 次要 Bot webhook
- `GET /admin`: 管理介面
- `GET /admin/api/get-config/:botId`: 獲取 Bot 配置
- `POST /admin/api/save-config/:botId`: 保存 Bot 配置
- `POST /admin/api/test/:botId/:category`: 測試回應

## 管理介面功能
管理介面提供以下功能：

### Bot 選擇
- 切換不同的 Bot 配置
- 顯示當前活動的 Bot

### 類別管理
支援以下回應類別：
1. 產品資訊
2. 價格查詢
3. 運送資訊
4. 促銷活動
5. 一般對話
6. 無回應處理

### 配置管理
每個類別包含兩個主要部分：
1. GPT 設定
2. 回覆規則

#### GPT 設定
1. **提示詞**
   - 設定 GPT 的基本行為
   - 定義回應風格和限制

2. **範例**
   - 提供對話範例
   - 設定期望的互動模式

#### 回覆規則
1. **關鍵字**
   - 設定觸發條件
   - 支援多關鍵字匹配

2. **匹配率**
   - 設定匹配精確度
   - 範圍：0-100%

3. **回應內容**
   - 設定固定回應文本
   - 支援多行文本

4. **回應風格**
   - 定義回應語氣
   - 可選：專業、友善、簡潔

### 測試功能
- 即時測試訊息回應
- 顯示匹配規則資訊
- 提供回應生成過程

## 部署說明
1. 確保所有環境變數正確配置
2. 使用 docker-compose 進行部署
3. 配置 Nginx 代理和 SSL
4. 驗證 webhook 連接

## 維護指南
- 定期檢查日誌
- 監控系統資源
- 更新 SSL 憑證
- 備份配置檔案

## 故障排除
1. 檢查日誌檔案
2. 驗證環境變數
3. 確認網路連接
4. 測試 webhook 端點

## 貢獻指南
1. Fork 專案
2. 建立特性分支
3. 提交變更
4. 發起合併請求

## 授權
MIT 授權
