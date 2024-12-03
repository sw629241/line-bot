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
├── backend/                # 後端程式
│   ├── config.js          # 配置和環境變數
│   ├── server.js          # Express 服務器設定
│   ├── line.js            # LINE Bot 相關功能
│   ├── gpt.js             # GPT 相關功能
│   ├── utils.js           # 通用工具函數
│   ├── sxi-bot-config.json # SXI Bot 配置文件
│   └── fas-bot-config.json # FAS Bot 配置文件
│
├── frontend/              # 前端程式
│   ├── admin.html         # 管理介面主頁面
│   ├── admin.js           # 管理介面主要邏輯
│   ├── ui.js              # UI 互動邏輯
│   ├── api.js             # API 調用邏輯
│   ├── styles.css         # 樣式檔案
│   ├── bot-selector.html  # Bot 選擇器模板
│   ├── category-tabs.html # 類別標籤模板
│   ├── gpt-settings.html  # GPT 設定模板
│   ├── reply-rules.html   # 回覆規則模板
│   └── test-area.html     # 測試區域模板
│
├── logs/                  # 日誌目錄
│   ├── info-YYYY-MM-DD.log    # 一般信息日誌
│   ├── error-YYYY-MM-DD.log   # 錯誤日誌
│   ├── debug-YYYY-MM-DD.log   # 調試日誌
│   ├── request-YYYY-MM-DD.log # 請求日誌
│   └── response-YYYY-MM-DD.log # 響應日誌
│
├── app.js                # 主應用程式入口
└── package.json          # 專案配置
```

### API 端點配置
- **主應用程式**: `https://linebot.sxi.com.tw/`
- **健康檢查**: `https://linebot.sxi.com.tw/health`
- **管理面板**: `https://linebot.sxi.com.tw/admin`
- **主要 Webhook**: `https://linebot.sxi.com.tw/webhook1`
- **次要 Webhook**: `https://linebot.sxi.com.tw/webhook2`

## 3. 編碼規範
### 命名規則
- 檔案命名：小寫，使用連字符（例：bot-selector.html）
- 變數命名：駝峰式
- 類別配置：使用複數形式（products, prices）

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
