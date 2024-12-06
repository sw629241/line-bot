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

我們是全部類別的內容發給 gpt 所以返回的內容不止是 判斷的類別 語義意圖 信心度。
還要他幫我們判別 關鍵字，因為這個部分在怎麼仔細的設定，還是會有變形的詞彙，但指向相同的語意。
所以包括了關鍵詞判斷，假設 訊息是 at5 跟 at5s 的差異，送到GPT後判斷為再問產品，就有 產品類別 的標籤，接著在判斷我們發給他的數據中 產品類別 的 回覆規則 中 的關鍵字 ，發現 at5 和 at5s 比較是吻合語意，再來將固定回覆內容及動態比例及語言風格，合成出一條新的句子返回我們bot，我們bot再發到 line api 回覆給客戶。
所以我們應該還會收到 "生成內容"

動態比例 只有固定的 0 50 100 ，抓取固定回覆的核心內容後，假設是50，就是一半是動態生成，一半是固定內容。(100%也是只是固定內容核心訊息帶入，用他自己的話再說一次)

語言風格 ，如果動態比例是 0 就不需要語言風格，因為固定回覆內容本身是不容改變，包含標點符號空格等等。
50 100 才會有語言風格帶入。

最後是沒有匹配的話，就要判斷是否是 一般談話 或是 敏感詞，這是本次要製作的核心。
回到問題上，如果判斷語意非敏感詞，多數應該要歸類於一般談話，碰到無法回答的問題，例如 at9 的性能如何，GPT數據庫沒有AT9資料，提示詞，類別範例，關鍵字都沒有提及相關資訊，所以GPT 會無法回答，這時候就要回覆 "'已通知....." ，這個部分會在 一般對話 GPT 設定 提示詞中給出具體回應方式。

敏感詞，這個功能理論上要先做，因為只要判別是 敏感詞，GPT 只要判斷出，就直接回傳我們敏感詞，那我們BOT 就將忽略客戶訊息，不做回覆。

sxi-bot 對應 /webhook1 及 /admin/sxi-bot/config.json，fas-bot 對應 /webhook2 及 /admin/fas-bot/config.json，用來切換不同站臺的設定值。

標籤 及 gpt設定 及 回覆規則：
每個標籤中各自包含"gpt設定"及"回覆規則"，因為我們需要 gpt判斷客戶意圖及語義，所以發給gpt的時候是將全部的標籤內容即"GPT設定及回覆規則，發給gpt做判斷，再以 json 格式回覆後，由我們BOT來做後續處理。
流程：訊息 -> gpt 判斷語義意圖後，判斷的類別，判斷類別的信心度，跟據類別比對是否有相應關鍵詞觸發，觸發後跟據固定回覆內容及動態比例及語言風格，來產生一條新的訊息。--> bot -->line api。

gpt設：
1.提示詞，不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"(範例)
#作為該類別無法處理時的應對方式的輔助詞，如 at9 產品性能如何，確定是問產品，不在關鍵詞有匹配，分類範例也沒有相關資訊，也不在閒聊範圍，也不知道 at9 是什麼樣的產品，這時候回應"已通知小編進行回覆，請稍等。"
2.分類範例，主要用QA形式來描述一些，不在關鍵詞內且可能出現的問答參考範例。

回覆規則：
1.關鍵詞，用來觸發 固定回覆 的 語義
2.固定回覆，當動態比例為0時，只能使用固定回覆的內容回覆，100%相同，包含標點符號。
3.動態比例，當設置為100，根據 固定回覆 及 語言風格 ，產生一條全新的話。
4.語言風格，專業、親切、少女(是可愛的增強版，加表情符號等活潑熱情的表現)、幽默。

測試區：
測試的比對範圍是針對所有標籤的，不是測試當前標籤而已。