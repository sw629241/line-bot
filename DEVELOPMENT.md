# 開發文檔

## 1. 開發環境
### 基礎環境
- **環境**: 生產環境
- **主要程式語言**: JavaScript
- **執行環境**: Node.js
- **部署方式**: nginx-proxy-manager

### 環境變數配置
```env
# LINE Bot Configuration (sxi-bot)
LINE_CHANNEL_ACCESS_TOKEN_SXI=頻道存取權杖
LINE_CHANNEL_SECRET_SXI=頻道密鑰

# LINE Bot Configuration (fas-bot)
LINE_CHANNEL_ACCESS_TOKEN_FAS=頻道存取權杖
LINE_CHANNEL_SECRET_FAS=頻道密鑰

# OpenAI Configuration
OPENAI_API_KEY=OpenAI API金鑰

# Server Configuration
PORT=3000
```

## 2. 系統架構
### 專案結構
```
linebot/
├── frontend/                # 前端程式碼
│   ├── index.html          # 靜態首頁
│   ├── admin.html          # 管理介面
│   ├── admin.js            # 管理介面邏輯
│   ├── api.js              # API 調用
│   ├── messageService.js   # 訊息處理服務
│   ├── ui.js              # UI 相關功能
│   ├── styles.css         # 樣式表
│   ├── bot-selector.html  # Bot 選擇器組件
│   ├── category-tabs.html # 分類標籤組件
│   ├── gpt-settings.html  # GPT 設定組件
│   ├── reply-rules.html   # 回覆規則組件
│   └── test-area.html     # 測試區域組件
│
├── backend/                # 後端程式碼
│   ├── config.js          # 配置管理
│   ├── gpt.js            # GPT 服務整合
│   ├── line.js           # LINE Bot 核心功能
│   ├── server.js         # 伺服器設定
│   ├── utils.js          # 工具函數
│   ├── webhook1.js       # Bot 1 的 webhook 處理
│   ├── webhook2.js       # Bot 2 的 webhook 處理
│   ├── fas-bot-config.json # FAS Bot 配置
│   └── sxi-bot-config.json # SXI Bot 配置
│
├── .env                   # 環境變數
├── app.js                # 主程式入口
└── package.json          # 專案配置
```

### API 端點配置
- **主應用程式**: `https://linebot.sxi.com.tw/`
- **健康檢查**: `https://linebot.sxi.com.tw/health`
- **管理面板**: `https://linebot.sxi.com.tw/admin`
- **主要 Webhook**: `https://linebot.sxi.com.tw/webhook1`
- **次要 Webhook**: `https://linebot.sxi.com.tw/webhook2`

## 3. Nginx Proxy Manager 設定
### 安裝資訊
- 管理介面: `http://10.0.0.8:81`(必須使用10.0.0.8)
- 預設帳號: `admin@example.com`
- 預設密碼: `changeme`

### Proxy Host 配置

1. SXI Bot Webhook
   ```
   Details:
   - Domain Names: linebot.sxi.com.tw
   - Scheme: http
   - Forward Hostname: localhost
   - Forward Port: 3000

   Custom Locations:
   location: /webhook1
   - Scheme: http
   - Forward Hostname: localhost
   - Forward Port: 3000
   ```

2. FAS Bot Webhook
   ```
   Details:
   - Domain Names: linebot.sxi.com.tw
   - Scheme: http
   - Forward Hostname: localhost
   - Forward Port: 3000

   Custom Locations:
   location: /webhook2
   - Scheme: http
   - Forward Hostname: localhost
   - Forward Port: 3000
   ```

3. 前端應用
   ```
   Details:
   - Domain Names: linebot.sxi.com.tw
   - Scheme: http
   - Forward Hostname: localhost
   - Forward Port: 3000

   Custom Locations:
   location: /frontend
   - Scheme: http
   - Forward Hostname: localhost
   - Forward Port: 3000
   ```

### 說明
- Domain Names: 設定要使用的域名
- Scheme: 使用的協議（http/https）
- Forward Hostname: 轉發到的主機名稱
- Forward Port: 轉發到的端口
- Custom Locations: 在同一個域名下設定不同的路徑，用於區分不同的服務

### SSL 證書設定
- 證書提供者: Let's Encrypt
- 證書類型: Production（生產環境）
- 域名: linebot.sxi.com.tw
- 強制 SSL: 是
- 自動更新: 是（Let's Encrypt 證書有效期為 90 天，NPM 會自動處理更新）
- 證書文件:
  - 位置: data/letsencrypt/live/npm-1/
  - 文件: cert.pem, chain.pem, fullchain.pem, privkey.pem
  - 存檔位置: data/letsencrypt/archive/npm-1/
- HTTP/2 Support: 是
- HSTS Enabled: 是
- HSTS Subdomains: 否

## 日誌配置
```yaml
容器日誌映射:
  - /data/logs -> ./data/logs     # NPM 系統日誌
  - /app/logs -> ./logs           # 應用程式日誌
```

### 備份策略
- NPM 設定備份位置: `./data/npm_backup`
- 備份內容:
  - Proxy Hosts 設定
  - SSL 證書
  - 存取控制列表

## 4. 編碼規範
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

## 5. 部署說明
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
