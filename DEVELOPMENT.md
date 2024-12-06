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
│   ├── api.js              # API 前端邏輯
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
│   ├── config.js          # 環境變數和配置管理
│   ├── server.js         # 主入口，服務器配置和路由管理
│   ├── line.js           # LINE Bot 相關邏輯
│   ├── gpt.js            # GPT 交互邏輯
│   ├── api.js            # API 後端邏輯
│   ├── fas-bot-config.json # FAS Bot 配置
│   └── sxi-bot-config.json # SXI Bot 配置
│
├── logs/                  # 日誌目錄
├── data/                  # 數據目錄
├── .env                   # 環境變數
├── app.js                # 主程式入口
└── package.json          # 專案配置
```

### API 端點配置
- **主應用程式**: `https://linebot.sxi.com.tw/`
- **管理面板**: `https://linebot.sxi.com.tw/admin.html`
- **LINE Bot Webhook**: `https://linebot.sxi.com.tw/webhook/:botType`
  - SXI Bot: `botType = sxi`
  - FAS Bot: `botType = fas`

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
   - Forward Hostname: 10.0.0.8
   - Forward Port: 3000

   Custom Locations:
   location: /webhook1
   - Scheme: http
   - Forward Hostname: 10.0.0.8
   - Forward Port: 3000
   ```

2. FAS Bot Webhook
   ```
   Details:
   - Domain Names: linebot.sxi.com.tw
   - Scheme: http
   - Forward Hostname: 10.0.0.8
   - Forward Port: 3000

   Custom Locations:
   location: /webhook2
   - Scheme: http
   - Forward Hostname: 10.0.0.8
   - Forward Port: 3000
   ```

3. 前端應用
   ```
   Details:
   - Domain Names: linebot.sxi.com.tw
   - Scheme: http
   - Forward Hostname: 10.0.0.8
   - Forward Port: 3000

   Custom Locations:
   location: /frontend
   - Scheme: http
   - Forward Hostname: 10.0.0.8
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
- products: 產品資訊
- prices: 產品價格
- shipping: 活動優惠
- promotions: 促銷活動查詢
- chat: 一般對話
- sensitive: 敏感詞

#### GPT回覆格式
{
  "category": "chat",
  "confidence": 0.8,
  "intent": "詢問未知產品",
  "keywords": ["at9"],
  "isSensitive": false,
  "needDefaultResponse": true,  // 新增字段，表示是否需要使用預設回覆
  "generatedResponse": "已通知小編進行回覆，請稍等。"
}

### 安全配置
- SSL/TLS: 已啟用並強制用於所有路由
- HSTS: 已啟用，max-age=63072000
- 代理標頭配置：
  - X-Forwarded-Scheme
  - X-Forwarded-Proto
  - X-Forwarded-For
  - X-Real-IP
----

### 口述補充

將 產品資訊 產品價格 運輸費用 活動優惠 一般對話 敏感詞 視為一個整體類別，UI介面上的分類只是讓使用者容易理解區分。

敏感詞 優先辨識，如果傳回是敏感詞就停止比對，直接回傳 true。

如果不是敏感詞，且不屬於產品資訊、產品價格、運輸費用、活動優惠的訊息，歸類為一般對話，在一般對話中，可以自然地與用戶交談，保持友善和專業的態度

辨識出語意並匹配出關鍵字後，應根據 動態比例 及 語言風格 來產生一條新的訊

當動態比例為0時，只能使用固定回覆的內容回覆，100%相同，包含標點符號。

動態比例 只有固定的 0 50 100 ，抓取固定回覆的核心內容後，假設是50，就是一半是動態生成，一半是固定內容。(100%也是只是固定內容核心訊息帶入，用GPT自己的話再說一次)

語言風格 ，如果動態比例是 0 就不需要語言風格，因為固定回覆內容本身是不容改變，包含標點符號空格等等。
50 100 才會有語言風格帶入。

我想要的效果：

當有匹配的關鍵詞時，根據動態生成比例及語言風格來產生一條新的句子來回覆給客戶。

當匹配不到時且不是敏感詞，就與客人閒聊，碰到無法回答的問題就回覆  <default_response> </default_response> 之間的內容。


