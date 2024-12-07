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
```plaintext
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
│   ├── server.js          # 主入口，服務器配置和路由管理
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

### Proxy Host 配置
```nginx
Details:
- Domain Names: linebot.sxi.com.tw
- Scheme: http
- Forward Hostname: 10.0.0.8
- Forward Port: 3000
```

### SSL 證書設定
- **證書提供者**: Let's Encrypt
- **證書類型**: Production（生產環境）
- **域名**: linebot.sxi.com.tw
- **強制 SSL**: 是
- **自動更新**: 是（Let's Encrypt 證書有效期為 90 天，NPM 會自動處理更新）
- **證書文件**:
  - 位置: `data/letsencrypt/live/npm-1/`
  - 文件: `cert.pem`, `chain.pem`, `fullchain.pem`, `privkey.pem`
  - 存檔位置: `data/letsencrypt/archive/npm-1/`
- **HTTP/2 Support**: 是
- **HSTS Enabled**: 是
- **HSTS Subdomains**: 否

## 4. 日誌與備份

### 日誌配置
```yaml
容器日誌映射:
  - /data/logs -> ./data/logs     # NPM 系統日誌
  - /app/logs -> ./logs           # 應用程式日誌
```

### 備份策略
- **NPM 設定備份位置**: `./data/npm_backup`
- **備份內容**:
  - Proxy Hosts 設定
  - SSL 證書
  - 存取控制列表

## 5. 編碼規範

### 命名規則
- **檔案命名**: 小寫，使用連字符（例：`bot-selector.html`）
- **變數命名**: 駝峰式
- **類別配置**: 使用複數形式（products, prices）

### 配置規範

#### 必要類別
- **products**: 產品資訊
- **prices**: 產品價格
- **shipping**: 活動優惠
- **promotions**: 促銷活動查詢
- **chat**: 一般對話
- **sensitive**: 敏感詞

#### GPT 回覆格式
```json
{
  "category": "chat",
  "confidence": 0.8,
  "intent": "詢問未知產品",
  "keywords": ["at9"],
  "isSensitive": false,
  "needDefaultResponse": true,
  "generatedResponse": "已通知小編進行回覆，請稍等。"
}
```

### 安全配置
- **SSL/TLS**: 已啟用並強制用於所有路由
- **HSTS**: 已啟用，max-age=63072000
- **代理標頭配置**:
  - X-Forwarded-Scheme
  - X-Forwarded-Proto
  - X-Forwarded-For
  - X-Real-IP

## 6. 系統邏輯說明

### 訊息處理流程
1. 將產品資訊、產品價格、運輸費用、活動優惠、一般對話、敏感詞視為一個整體類別
2. UI介面上的分類僅為方便使用者理解和區分
3. 敏感詞優先辨識，如果傳回是敏感詞就停止比對，直接回傳 true
4. 非敏感詞且不屬於產品資訊、產品價格、運輸費用、活動優惠的訊息，歸類為一般對話
5. 在一般對話中，保持友善和專業的態度與用戶交談
6. 辨識出語意並匹配出關鍵字後，根據動態比例及語言風格產生新的訊息


