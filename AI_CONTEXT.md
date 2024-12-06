# LineBot Project Context

## 專案結構
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
│   ├── api.js            # 後端 API 接口處理
│   ├── fas-bot-config.json # FAS Bot 配置
│   └── sxi-bot-config.json # SXI Bot 配置
│
├── logs/                  # 日誌目錄
├── data/                  # 數據目錄
├── .env                   # 環境變數
├── app.js                # 主程式入口
└── package.json          # 專案配置

## 路由結構
- `/` -> frontend/index.html（靜態首頁）
- `/admin.html` -> frontend/admin.html（管理介面）
- `/webhook/:botType` -> 通用 webhook 路徑（支援 'sxi' 和 'fas' 兩種類型）

## 代碼編輯規則

### 1. 文件組織
- 前端代碼統一放在 `frontend/` 目錄
- 後端代碼統一放在 `backend/` 目錄
- 配置文件統一使用 .js 或 .json 格式
- HTML 組件保持獨立文件
- 日誌文件存放在 `logs/` 目錄
- 數據文件存放在 `data/` 目錄

### 2. 命名規範
- 檔案名稱：使用 kebab-case（例：bot-selector.html）
- JavaScript 變數和函數：使用 camelCase
- 類別名稱：使用 PascalCase
- HTML ID/Class：使用 kebab-case

### 3. 代碼風格
- 使用 ES6+ 語法
- 使用 async/await 處理非同步操作
- 善用解構賦值和箭頭函數
- 保持函數單一職責

### 4. 錯誤處理
- 所有 API 調用都需要 try-catch
- 使用統一的錯誤提示機制（Alert 系統）
- 錯誤訊息需要清晰易懂

## 重構規劃重點

### 1. 前端架構
- **UI 組件化**
  * 統一的事件處理機制
  * 表單驗證和提交處理
  * 錯誤提示統一管理
  * 組件之間保持低耦合

- **狀態管理**
  * 統一使用 api.js 管理配置
  * 配置變更即時同步
  * 本地緩存減少請求

- **用戶交互**
  * 統一的提示機制
  * 操作結果即時反饋
  * 表單驗證完整性

### 2. 後端架構
- **配置管理**
  * 統一的配置讀寫接口
  * 配置格式驗證
  * 配置變更日誌

- **API 設計**
  * RESTful 風格
  * 統一的響應格式
  * 錯誤碼規範

- **模組化**
  * 業務邏輯分離
  * 工具函數集中
  * 避免循環依賴

### 3. 性能優化
- 配置緩存機制
- API 響應優化
- 靜態資源管理
- 延遲加載策略

## 開發注意事項
1. 保持代碼簡潔，避免過度設計
2. 及時處理 TODO 和 FIXME 標記
3. 確保錯誤提示明確有用
4. 保持文件及時更新
5. 不要留下垃圾資料夾及文件

## 待優化項目
1. 配置加載機制優化
2. 錯誤處理完整性
3. 日誌記錄系統
4. 測試覆蓋率

## 這次錯誤及修復注意事項

1. 502 Bad Gateway 錯誤
   - 原因：Node.js 服務器綁定到 localhost (127.0.0.1) 而不是所有接口 (0.0.0.0)
   - 解決方案：
     - 在 app.js 中確保服務器監聽 0.0.0.0
     - 在 ecosystem.config.cjs 中設置 HOST 環境變量
     - 確保 Nginx 代理配置正確指向服務器地址和端口

2. LINE Webhook 400 錯誤
   - 可能原因：
     - LINE 簽名驗證失敗
     - Channel Secret 或 Access Token 配置錯誤
     - 環境變量未正確設置
   - 解決方案：
     - 添加詳細的日誌記錄來追踪請求處理過程
     - 改進錯誤處理邏輯，提供更具體的錯誤信息
     - 確保在所有環境中都創建 LINE 客戶端（不僅限於生產環境）
     - 在 CORS 配置中添加 x-line-signature 到允許的標頭列表

3. 配置管理注意事項
   - 環境變量：
     - LINE_CHANNEL_ACCESS_TOKEN_SXI
     - LINE_CHANNEL_SECRET_SXI
     - LINE_CHANNEL_ACCESS_TOKEN_FAS
     - LINE_CHANNEL_SECRET_FAS
   - 確保這些變量在所有環境中都正確設置
   - 使用 dotenv 來管理環境變量
   - 添加環境變量驗證邏輯，及早發現配置問題

4. 日誌記錄最佳實踐
   - 記錄關鍵操作的時間戳
   - 記錄請求標頭和正文（注意敏感信息）
   - 記錄驗證過程的詳細信息
   - 為每個錯誤案例提供明確的錯誤消息
   - 使用結構化的日誌格式便於分析

5. 模塊導入路徑問題
   - 問題描述：
     - 系統報錯找不到 `utils.js` 文件
     - PM2 在啟動時無法正確解析模塊路徑
   - 原因分析：
     - 入口點配置錯誤：原本指向 `backend/server.js`，導致相對路徑解析錯誤
     - Node.js 的模塊解析機制：相對路徑是相對於執行入口文件的位置
   - 解決方案：
     - 將 PM2 的入口點改為 `app.js`
     - 確保所有的導入路徑使用正確的相對路徑
     - 使用 `import.meta.url` 和 `fileURLToPath` 處理 ES 模塊的路徑
   - 最佳實踐：
     - 使用絕對路徑或項目根目錄相對路徑
     - 在配置文件中明確指定入口點
     - 統一使用 ES 模塊語法
     - 添加路徑別名配置以簡化導入

6. 其他注意事項
   - PM2 配置：
     - 使用 `ecosystem.config.cjs` 而不是 `.js` 以支持 CommonJS
     - 設置適當的 `ignore_watch` 以避免不必要的重啟
   - 文件組織：
     - 保持清晰的目錄結構
     - 使用明確的文件命名約定
     - 將共用工具函數集中管理
