# LINE Bot 專案配置文檔

## 專案基本資訊

### 環境變數
```
LINE_CHANNEL_ACCESS_TOKEN=你的主要頻道存取權杖
LINE_CHANNEL_SECRET=你的主要頻道密鑰
LINE_CHANNEL_ACCESS_TOKEN_2=你的次要頻道存取權杖
LINE_CHANNEL_SECRET_2=你的次要頻道密鑰
PORT=80
NODE_ENV=production
```

### API 端點
- `GET /health`: 健康檢查
- `POST /webhook1`: 主要 Bot webhook
- `POST /webhook2`: 次要 Bot webhook
- `GET /admin`: 管理介面
- `GET /admin/api/get-config/:botId`: 獲取 Bot 配置
- `POST /admin/api/save-config/:botId`: 保存 Bot 配置
- `POST /admin/api/test/:botId/:category`: 測試回應

## 系統環境配置

### 基礎環境
- **環境**: 生產環境
- **主要程式語言**: JavaScript
- **執行環境**: Node.js
- **部署方式**: Docker 搭配 Nginx 代理管理器

### 伺服器配置
- **網域**: linebot.sxi.com.tw
- **埠口**: 80 (內部), 443 (SSL/TLS)
- **SSL**: 已啟用 Let's Encrypt
- **代理管理器**: nginx-proxy-manager

### 端點配置
所有端點均已配置並測試成功：
- **主應用程式**: `https://linebot.sxi.com.tw/`
- **健康檢查**: `https://linebot.sxi.com.tw/health`
- **管理面板**: `https://linebot.sxi.com.tw/admin`
- **主要 Webhook**: `https://linebot.sxi.com.tw/webhook1`
- **次要 Webhook**: `https://linebot.sxi.com.tw/webhook2`

### 環境變數
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE 主要機器人存取令牌
- `LINE_CHANNEL_SECRET`: LINE 主要機器人密鑰
- `LINE_CHANNEL_ACCESS_TOKEN_2`: LINE 次要機器人存取令牌
- `LINE_CHANNEL_SECRET_2`: LINE 次要機器人密鑰
- `OPENAI_API_KEY`: OpenAI API 密鑰

### 外部服務整合
- **訊息 API**: LINE Messaging API (主要和次要)
- **代理服務**: Nginx 代理管理器
- **SSL 提供者**: Let's Encrypt

### 安全配置
- **SSL/TLS**: 已啟用並強制用於所有路由
- **HSTS**: 已啟用，max-age=63072000
- **代理標頭**:
  - X-Forwarded-Scheme
  - X-Forwarded-Proto
  - X-Forwarded-For
  - X-Real-IP

### 部署架構
- Docker 容器化
- Nginx 反向代理與 SSL 終止
- 單一埠口 (80) 容器通訊
- SSL/TLS 由 Nginx Proxy Manager 處理

### 監控配置
- 健康檢查端點配置
- 存取日誌： `/data/logs/proxy-host-2_access.log`
- 錯誤日誌： `/data/logs/proxy-host-2_error.log`

## 系統變更記錄

### 2024-01 更新
#### 1. 管理介面優化
- **即時刪除功能**：
  * 規則刪除後立即生效，不需要額外保存
  * 前端和後端資料同步機制改善
  * 相關文件：`admin.js`, `configService.js`

- **狀態提示改進**：
  * 新增頂部通知欄（Alert）顯示操作結果
  * 支援成功/錯誤訊息自動消失（5秒）
  * 相關文件：`admin.js`, `admin.html`

#### 2. 資料處理優化
- **設定檔案緩存**：
  * 新增 configCache 機制避免重複讀取
  * 緩存在面板切換時重置
  * 相關文件：`configService.js`

- **資料結構調整**：
  * 類別設定從陣列改為物件格式
  * categories 結構變更：`[{...}]` -> `{key: {...}}`
  * 相關文件：`server.js`, `configService.js`

#### 3. API 整合更新
- **設定保存流程**：
  * 新增目錄自動創建功能
  * 改進錯誤處理和回饋機制
  * 相關文件：`app.js`

#### 4. 重要注意事項
- 舊版配置文件需要進行格式轉換
- 建議在更新後重新保存所有設定
- 確保所有 bot 目錄具有適當的讀寫權限

## 系統架構

### 專案結構
```
linebot/
├── admin/                    # 管理介面
│   ├── components/          # UI 組件
│   │   ├── header.html     # 頁面頭部
│   │   ├── bot-selector.html    # Bot 選擇器
│   │   ├── category-tabs.html   # 類別標籤
│   │   ├── gpt-settings.html    # GPT 設定區塊
│   │   ├── reply-rules.html     # 回覆規則區塊
│   │   └── test-area.html       # 測試區域
│   ├── sxi-bot/            # SXI Bot 配置
│   │   └── config.json     # Bot 設定檔
│   ├── fas-bot/            # FAS Bot 配置
│   │   └── config.json     # Bot 設定檔
│   ├── admin.html          # 管理介面主頁面
│   ├── admin.js            # 管理介面主要邏輯
│   ├── styles.css          # 管理介面樣式
│   ├── messageService.js   # 訊息處理服務
│   ├── configService.js    # 配置管理服務
│   ├── apiService.js       # API 服務
│   ├── ui.js              # UI 互動邏輯
│   └── server.js          # 後端服務器
├── logs/                   # 日誌目錄
│   └── primary_webhook_events.log  # Webhook 事件日誌
├── app.js                 # 主應用程式入口
├── index.html            # 主頁面
├── .env                  # 環境變數配置
├── docker-compose.yml    # Docker 配置
├── Dockerfile           # Docker 建構檔
├── package.json         # 專案依賴配置
└── package-lock.json    # 依賴版本鎖定
```

### 1. 核心模塊

#### 1.1 入口模塊 (`app.js`)
- **功能職責**：
  * 服務器配置和啟動
  * 路由管理和靜態文件服務
  * 管理面板和 Webhook API 端點配置
  * 環境變量管理
- **主要依賴**：
  * Express.js
  * @line/bot-sdk
  * dotenv

#### 1.2 後端核心 (`/admin/server.js`)
- **功能職責**：
  * LINE Webhook 事件處理
  * OpenAI API 調用
  * 配置文件管理
  * 系統日誌記錄
- **主要依賴**：
  * @line/bot-sdk
  * openai
  * fs/promises
  * path

#### 1.3 前端核心 (`/admin/messageService.js`)
- **功能職責**：
  * GPT 設置管理
  * 消息測試和格式化
  * 前端事件處理
- **主要依賴**：
  * window.bot：配置操作
  * window.admin：管理功能
  * window.ui：界面交互
  * window.api：API 調用

#### 1.4 API 服務 (`/admin/apiService.js`)
- **功能職責**：
  * API 請求統一處理
  * 外部服務整合
  * 配置管理接口
- **主要功能**：
  * `callLineAPI(endpoint, data)`
  * `callOpenAI(messages)`
  * `handleWebhook(req, res)`

#### 1.5 管理界面 (`/admin/admin.js`)
- **功能職責**：
  * 管理面板渲染
  * 用戶界面事件處理
  * 前端狀態管理
- **主要功能**：
  * `initialize()`
  * `handleEvents()`
  * `updateUI()`

### 2. 數據流

#### 2.1 前端流程
```
用戶操作 -> messageService.js 處理 -> apiService.js 請求 -> admin.js 更新界面
```

#### 2.2 後端流程
```
LINE Webhook -> server.js 處理 -> OpenAI 生成 -> LINE 回覆
```

### 3. 配置系統

#### 3.1 機器人配置 (`/admin/[bot-id]/config.json`)
```json
{
  "categories": {
    "products": {
      "systemPrompt": string,    # GPT 系統提示詞
      "examples": string,        # 對話範例
      "rules": [
        {
          "keywords": string,    # 關鍵字
          "response": string,    # 回應內容
          "ratio": number,       # 動態生成比例 (0-100)
          "style": string       # 回應風格 (friendly, humorous, professional 等)
        }
      ]
    },
    "prices": { ... },
    "shipping": { ... },
    "promotions": { ... },
    "chat": { ... },
    "sensitive": { ... }
  }
}
```

## 配置規範

### 命名規範
- 類別名稱統一使用複數形式：
  - ✅ 正確：`products`, `prices`, `promotions`
  - ❌ 錯誤：`product`, `price`, `promotion`

### 必要類別
系統要求以下類別必須存在：
- `products`: 產品相關查詢
- `prices`: 價格相關查詢
- `shipping`: 運送相關查詢
- `promotions`: 促銷活動查詢
- `chat`: 一般對話
- `sensitive`: 敏感詞處理

### 類別配置結構
每個類別必須包含以下屬性：
```json
{
  "systemPrompt": "GPT 系統提示詞",
  "examples": "對話範例",
  "rules": [
    {
      "keywords": "關鍵字",
      "response": "回應內容",
      "ratio": 50,
      "style": "friendly"
    }
  ]
}
```

- `systemPrompt`: 字串，定義 GPT 的行為準則
- `examples`: 字串，提供對話範例
- `rules`: 陣列，包含回應規則
  - `keywords`: 觸發關鍵字
  - `response`: 預設回應內容
  - `ratio`: 動態生成比例 (0-100)
  - `style`: 回應風格 (friendly/professional/humorous)

### 配置驗證
系統會在以下時機驗證配置：
1. 載入配置時
2. 保存配置時
3. 測試訊息時

如果配置無效，系統會提供具體的錯誤訊息，指出：
- 缺少哪些必要類別
- 哪些類別缺少必要屬性
- 屬性格式是否正確

## 版本信息
- 最後更新：2024-12-02
