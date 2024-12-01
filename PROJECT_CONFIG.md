# LINE Bot 專案配置文檔

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

## 系統架構

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
    "product": { 
      "systemPrompt": string,
      "examples": string,
      "rules": array
    },
    "price": { ... },
    "shipping": { ... },
    "promotion": { ... },
    "chat": { ... },
    "sensitive": { ... }
  }
}
```

#### 3.2 界面組件
- **header.html**: 頁面頭部組件
- **bot-selector.html**: Bot 選擇器
- **category-tabs.html**: 類別標籤
- **gpt-settings.html**: GPT 設定區塊
- **reply-rules.html**: 回覆規則區塊
- **test-area.html**: 測試區域

## 開發規範

### 1. 代碼規範
- 使用 async/await 處理異步操作
- 使用 try/catch 進行錯誤處理
- 確保適當的錯誤日誌記錄
- 遵循環境隔離原則：
  * 前端不直接操作文件系統
  * 後端不依賴瀏覽器環境
  * 共享代碼考慮運行環境差異

### 2. 待優化事項
- **重複代碼整合**：
  * 消息處理（processMessageWithGPT）
  * 事件處理（handleMessageEvent 等）
- **建議方案**：
  * 創建共享模塊（types.js, constants.js, utils.js）
  * 抽象消息處理邏輯
  * 實現依賴注入

### 3. 安全考慮
- 所有配置文件操作需進行權限驗證
- API 調用需要適當的錯誤處理
- 敏感信息使用環境變量管理

### 4. 錯誤處理機制
- **Webhook 錯誤處理**：
  * 請求簽名驗證
  * JSON 解析錯誤處理
  * LINE API 錯誤處理
  * OpenAI API 錯誤處理
- **錯誤日誌記錄**：
  * 錯誤類型分類
  * 錯誤堆疊追蹤
  * 請求相關信息記錄
  * 系統狀態記錄

### 5. 安全性更新
- **請求驗證**：
  * LINE Webhook 簽名驗證
  * 請求來源驗證
  * 請求內容驗證
- **錯誤響應**：
  * 統一錯誤響應格式
  * 適當的 HTTP 狀態碼
  * 敏感信息過濾
- **安全標頭**：
  * Content-Security-Policy
  * X-Content-Type-Options
  * X-Frame-Options
  * X-XSS-Protection

### 6. 系統監控
- **性能監控**：
  * 請求響應時間
  * API 調用延遲
  * 系統資源使用
- **錯誤監控**：
  * 錯誤率統計
  * 錯誤類型分析
  * 系統健康狀態
- **日誌管理**：
  * 結構化日誌格式
  * 日誌輪轉策略
  * 日誌分析工具

## 版本信息
- 最後更新：2024-01-09
- 狀態：所有端點已測試和驗證
