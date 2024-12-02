# 開發文檔

## 1. 開發環境
### 基礎環境
- **環境**: 生產環境
- **主要程式語言**: JavaScript
- **執行環境**: Node.js
- **部署方式**: Docker 搭配 Nginx 代理管理器 (NPM)

### 環境變數配置
```env
LINE_CHANNEL_ACCESS_TOKEN=主要頻道存取權杖
LINE_CHANNEL_SECRET=主要頻道密鑰
LINE_CHANNEL_ACCESS_TOKEN_2=次要頻道存取權杖
LINE_CHANNEL_SECRET_2=次要頻道密鑰
PORT=80
NODE_ENV=production
OPENAI_API_KEY=OpenAI API 密鑰
```

## 2. 系統架構
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
│   ├── server.js          # 後端服務器
│   └── .env               # 管理介面環境變數
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

### API 端點配置
- **主應用程式**: `https://linebot.sxi.com.tw/`
- **健康檢查**: `https://linebot.sxi.com.tw/health`
- **管理面板**: `https://linebot.sxi.com.tw/admin`
- **主要 Webhook**: `https://linebot.sxi.com.tw/webhook1`
- **次要 Webhook**: `https://linebot.sxi.com.tw/webhook2`

## 3. 編碼規範
### 命名規則
- 檔案命名：小寫，使用連字符（例：config-service.js）
- 類別名稱：使用複數形式（products, prices）
- 變數命名：駝峰式

### 配置規範
#### 必要類別
- products: 產品相關查詢
- prices: 價格相關查詢
- shipping: 運送相關查詢
- promotions: 促銷活動查詢
- chat: 一般對話
- sensitive: 敏感詞處理

#### 類別配置結構
```json
{
  "categories": {
    "products": {
      "systemPrompt": "不確定的問題，一律回答:\"已通知小編進行回覆，請稍等。\"",
      "examples": "對話範例",
      "rules": [
        {
          "keywords": "關鍵字",
          "response": "回應內容",
          "ratio": 50,
          "style": "幽默"
        }
      ]
    }
  }
}
```

### 回應風格說明
- **幽默**: 使用輕鬆、友善的語氣，適合一般產品查詢
- **專業**: 使用正式、技術性的語氣，適合技術性問題
- **溫和**: 使用親切、耐心的語氣，適合客訴處理
- **簡潔**: 使用簡短、直接的語氣，適合價格和運送查詢

## 4. 部署說明
### Docker 部署
- 使用 docker-compose up -d 啟動
- 通過 Nginx 代理管理器配置 SSL
- 配置 webhook URL

### 安全配置
- SSL/TLS: 已啟用並強制用於所有路由
- HSTS: 已啟用，max-age=63072000
- 代理標頭配置：
  - X-Forwarded-Scheme
  - X-Forwarded-Proto
  - X-Forwarded-For
  - X-Real-IP
