# AI 開發上下文記錄

## 專案當前狀態
### 1. 核心功能概述
- 雙 webhook 架構 (sxi-bot, fas-bot)
- GPT 整合的對話處理系統
- 基於規則的回覆機制
- 管理介面用於配置維護

### 2. 最近的重要更改
#### 管理介面優化
- **即時刪除功能**：
  * 規則刪除後立即生效，不需要額外保存
  * 前端和後端資料同步機制改善
  * 相關文件：`admin.js`, `configService.js`

- **狀態提示改進**：
  * 新增頂部通知欄（Alert）顯示操作結果
  * 支援成功/錯誤訊息自動消失（5秒）
  * 相關文件：`admin.js`, `admin.html`

#### 配置系統更新
- **預設回應改進**：
  * 統一了不確定問題的回應格式
  * 移除了多餘的標點符號
  * 相關文件：`sxi-bot/config.json`

- **回應風格優化**：
  * 產品類別回應風格從「專業」改為「幽默」
  * 保持回應內容準確性的同時增加親和力
  * 相關文件：`sxi-bot/config.json`

#### 資料處理優化
- **設定檔案緩存**：
  * 新增 configCache 機制避免重複讀取
  * 緩存在面板切換時重置
  * 相關文件：`configService.js`

### 3. 已知問題和限制
- 舊版配置文件需要格式轉換
- 確保所有 bot 目錄具有適當的讀寫權限
- 配置保存時需注意目錄自動創建功能

## 開發重點提醒
### 1. 程式碼注意事項
- 類別設定從陣列改為物件格式：`{key: {...}}`
- 配置驗證發生在：載入、保存、測試訊息時
- 使用緩存機制避免重複讀取配置

### 2. 重要的業務邏輯
- 回覆生成使用動態比例系統 (0-100%)
- 敏感詞檢查優先於其他處理
- GPT 回應需遵循設定的語言風格

### 3. 待優化項目
- 配置文件格式轉換工具
- 錯誤處理和回饋機制
- 自動化測試覆蓋

## 系統整合注意事項
### 1. 外部服務依賴
- LINE Messaging API
- OpenAI API
- Nginx 反向代理

### 2. 關鍵配置提醒
- 環境變數完整性檢查
- SSL 證書狀態
- Webhook URL 設定

## 專案重構計劃
### 1. 階段一：代碼分析
- **已發現問題**：
  * 類別命名不一致（單數/複數形式混用）
  * 存在循環依賴（ui.js ↔ messageService.js）
  * 組件目錄結構過深
  * 代碼重複（配置檢查邏輯）

### 2. 階段二：新結構規劃
#### 當前檔案結構
```
linebot/
├── frontend/              # 新實現
│   ├── admin.html         # 管理介面主頁面
│   ├── admin.js           # 管理介面初始化
│   ├── ui.js              # UI 相關功能
│   ├── api.js             # API 調用服務
│   ├── messageService.js  # 訊息處理服務
│   ├── styles.css         # 樣式檔案
│   ├── bot-selector.html  # Bot 選擇器組件
│   ├── category-tabs.html # 類別標籤組件
│   ├── gpt-settings.html  # GPT 設定組件
│   ├── reply-rules.html   # 回覆規則組件
│   └── test-area.html     # 測試區域組件
│
├── backend/              # 後端服務
│   ├── server.js         # Express 服務器
│   ├── line.js           # LINE Bot 功能
│   ├── gpt.js            # GPT 功能
│   ├── utils.js          # 通用工具
│   ├── config.js         # 配置管理
│   ├── sxi-bot-config.json  # SXI Bot 配置文件
│   └── fas-bot-config.json  # FAS Bot 配置文件
│
├── logs/                # 日誌文件
│   └── primary_webhook_events.log
│
├── app.js              # 主程式入口
├── docker-compose.yml  # Docker 配置
├── Dockerfile         # Docker 建構文件
├── .env              # 環境變數
└── package.json      # 專案配置
```

#### 遷移狀態追蹤

1. **已完成遷移**
   - [✓] admin.html -> frontend/admin.html
   - [✓] admin.js -> frontend/admin.js（簡化版）
   - [✓] ui.js -> frontend/ui.js（重構版）
   - [✓] apiService.js -> frontend/api.js（重構版）
   - [✓] messageService.js -> frontend/messageService.js（重構版）
   - [✓] styles.css -> frontend/styles.css
   - [✓] UI 組件模板

2. **待遷移項目**
   - [ ] configService.js 功能整合到 api.js
   - [ ] server.js 遷移到 backend
   - [ ] Bot 配置文件遷移到 backend/configs
   - [ ] 日誌系統重構

3. **需要保留的功能**
   - 配置緩存機制（來自 configService.js）
   - 狀態提示系統（來自 admin.js）
   - 表單驗證（來自 ui.js）
   - 錯誤處理機制
   - 日誌記錄功能

4. **遷移注意事項**
   - 確保配置文件路徑更新
   - 保持 API 端點一致性
   - 維護正確的錯誤處理
   - 確保功能向後相容

### 3. 階段三：重構步驟
1. **準備階段**
   - [✓] 創建新的目錄結構
   - [✓] 移動 styles.css 到 frontend
   - [✓] 分離 messageService

2. **代碼遷移**
   - 前端遷移進度：
     - [✓] styles.css 移動完成
     - [✓] messageService.js 創建完成
     - [✓] api.js 重構完成
     - [ ] admin.js 待優化
     - [ ] ui.js 待重構

3. **統一規範**
   - 類別名稱統一使用複數形式
   - 檔案命名使用連字符（kebab-case）
   - 變數命名使用駝峰式（camelCase）

4. **測試與驗證**
   - 每個模組遷移後進行功能測試
   - 確保所有 API 端點正常運作
   - 驗證 webhook 功能
   - 測試管理介面的所有功能

### 4. 重要注意事項
- 保持舊檔案直到新結構完全測試通過
- 確保配置檔案路徑的正確性
- 維護正確的模組依賴關係
- 注意 API 路徑的一致性
- 確保 LINE Bot 服務不中斷

### 5. 待處理問題
- 統一類別命名約定
- 解決循環依賴問題
- 簡化配置檢查邏輯
- 優化錯誤處理機制

### 6. 完成標準
- 所有功能正常運作
- 沒有冗餘代碼
- 沒有循環依賴
- 檔案結構符合新規劃
- 代碼風格統一
- 所有測試通過
