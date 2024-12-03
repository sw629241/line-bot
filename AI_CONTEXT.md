# LineBot Project Context

## 專案結構
```
linebot/
├── index.html           # 首頁（根目錄靜態頁面）
├── app.js              # 主程式入口
├── package.json        # 專案配置
│
├── frontend/           # 前端代碼
│   ├── admin.html     # 管理介面主頁面
│   ├── admin.js       # 管理介面初始化
│   ├── ui.js          # UI 相關功能
│   ├── api.js         # API 調用服務
│   ├── messageService.js # 訊息處理服務
│   └── styles.css     # 樣式定義
│
└── backend/           # 後端代碼
    ├── webhook1.js    # LINE Bot 1 的 webhook 處理
    ├── webhook2.js    # LINE Bot 2 的 webhook 處理
    ├── config.js      # 配置管理
    ├── line.js        # LINE API 整合
    ├── gpt.js         # GPT 服務整合
    └── utils.js       # 工具函數
```

## 路由結構
- `/` -> index.html（靜態首頁）
- `/admin` -> 管理介面（frontend/admin.html）
- `/admin/api/webhook1` -> LINE Bot 1 的 webhook
- `/admin/api/webhook2` -> LINE Bot 2 的 webhook

## 代碼編輯規則

### 1. 文件組織
- 靜態首頁直接放在根目錄
- 前端代碼統一放在 `frontend/` 目錄
- 後端代碼統一放在 `backend/` 目錄
- 配置文件統一使用 .js 或 .json 格式
- HTML 組件保持獨立文件

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

## 待優化項目
1. 配置加載機制優化
2. 錯誤處理完整性
3. 日誌記錄系統
4. 測試覆蓋率
