# LINE Bot 專案配置

## 系統配置
- **環境**: 生產環境
- **主要程式語言**: JavaScript
- **執行環境**: Node.js
- **部署方式**: Docker 搭配 Nginx 代理管理器

## 伺服器配置
- **網域**: linebot.sxi.com.tw
- **埠口**: 80 (內部), 443 (SSL/TLS)
- **SSL**: 已啟用 Let's Encrypt
- **代理管理器**: nginx-proxy-manager

## 端點
所有端點均已配置並測試成功：
- **主應用程式**: `https://linebot.sxi.com.tw/`
- **健康檢查**: `https://linebot.sxi.com.tw/health`
- **管理面板**: `https://linebot.sxi.com.tw/admin`
- **主要 Webhook**: `https://linebot.sxi.com.tw/webhook1`
- **次要 Webhook**: `https://linebot.sxi.com.tw/webhook2`

## 重要環境變數
- `LINE_CHANNEL_ACCESS_TOKEN`: 已配置
- `LINE_CHANNEL_SECRET`: 已配置
- `LINE_CHANNEL_ACCESS_TOKEN_2`: 已配置
- `LINE_CHANNEL_SECRET_2`: 已配置

## 外部服務
- **訊息 API**: LINE Messaging API (主要和次要)
- **代理服務**: Nginx 代理管理器
- **SSL 提供者**: Let's Encrypt

## Webhook 配置
### 主要機器人 (webhook1)
- **網址**: `https://linebot.sxi.com.tw/webhook1`
- **SSL**: 強制啟用
- **狀態**: 已驗證且運作中

### 次要機器人 (webhook2)
- **網址**: `https://linebot.sxi.com.tw/webhook2`
- **SSL**: 強制啟用
- **狀態**: 已驗證且運作中

## 安全配置
- **SSL/TLS**: 已啟用並強制用於所有路由
- **HSTS**: 已啟用，max-age=63072000
- **代理標頭**:
  - X-Forwarded-Scheme
  - X-Forwarded-Proto
  - X-Forwarded-For
  - X-Real-IP

## 核心依賴
- Express.js
- @line/bot-sdk
- Docker
- Nginx Proxy Manager

## 部署架構
- Docker 容器化
- Nginx 反向代理與 SSL 終止
- 單一埠口 (80) 容器通訊
- SSL/TLS 由 Nginx Proxy Manager 處理

## 監控
- 健康檢查端點配置
- 存取日誌： `/data/logs/proxy-host-2_access.log`
- 錯誤日誌： `/data/logs/proxy-host-2_error.log`

## 核心函數文件

### 界面組件 (Components)

#### header.html
- **用途**: 頁面頭部組件
- **功能**: 顯示網站標題和基本樣式設置
- **依賴**: Bootstrap CSS

#### bot-selector.html
- **用途**: Bot 選擇器組件
- **功能**: 提供 Bot 切換功能
- **選項**:
  - SXI Bot
  - FAS Bot

#### category-tabs.html
- **用途**: 類別標籤組件
- **功能**: 提供不同功能類別的導航標籤
- **類別**:
  - 產品資訊
  - 產品價格
  - 運輸費用
  - 活動優惠
  - 一般對話
  - 敏感詞

#### gpt-settings.html
- **用途**: GPT 設定區塊組件
- **功能**:
  - 提示詞設置
  - 分類範例管理
  - GPT 配置保存

#### reply-rules.html
- **用途**: 回覆規則區塊組件
- **功能**:
  - 關鍵詞/句管理
  - 固定回覆設置
  - 動態比例調整
  - 語言風格選擇

#### test-area.html
- **用途**: 測試區域組件
- **功能**:
  - 測試訊息輸入
  - 即時回應測試
  - 測試結果顯示

### API 函數 (api.js)

#### loadBotConfig(botId)
- **目的**: 載入 Bot 配置檔案
- **參數**:
  - `botId` (string): Bot ID (例如 'fas-bot' 或 'sxi-bot')
- **返回**: Promise<Object>
- **描述**: 從檔案系統讀取 Bot 配置，若檔案不存在則返回預設配置

#### callOpenAI(messages)
- **目的**: 呼叫 OpenAI API
- **參數**:
  - `messages` (array): 訊息陣列包含角色和內容
- **返回**: Promise<string>
- **描述**: 使用 OpenAI GPT-3.5-turbo 模型處理訊息

#### processMessageWithGPT(message, botConfig)
- **目的**: 處理用戶訊息並生成回應
- **參數**:
  - `message` (string): 用戶訊息
  - `botConfig` (object): Bot 配置
- **返回**: Promise<string>
- **描述**: 分析用戶訊息並根據配置生成適當的回應

### Webhook 處理器

#### primaryWebhookHandler(req, res)
- **檔案**: webhook/primary.js
- **目的**: 處理主要 Bot Webhook 請求
- **參數**:
  - `req` (Request): Express 請求物件
  - `res` (Response): Express 回應物件
- **描述**: 使用 fas-bot 配置處理來自 LINE 平台的訊息

#### secondaryWebhookHandler(req, res)
- **檔案**: webhook/secondary.js
- **目的**: 處理次要 Bot Webhook 請求
- **參數**:
  - `req` (Request): Express 請求物件
  - `res` (Response): Express 回應物件
- **描述**: 使用 sxi-bot 配置處理來自 LINE 平台的訊息

### 配置結構

#### Bot 配置結構
```javascript
{
  categories: {
    products: { systemPrompt: string, examples: string, rules: array },
    prices: { systemPrompt: string, examples: string, rules: array },
    shipping: { systemPrompt: string, examples: string, rules: array },
    promotions: { systemPrompt: string, examples: string, rules: array },
    chat: { systemPrompt: string, examples: string, rules: array },
    sensitive: { systemPrompt: string, examples: string, rules: array }
  }
}
```

### 開發指南

1. 所有非同步函數必須使用 async/await 語法
2. 錯誤處理應使用 try/catch 結構
3. 所有函數應有適當的錯誤記錄
4. 配置相關函數應處理檔案不存在的情況
5. Webhook 處理器應始終返回適當的 HTTP 狀態碼

## 最後更新
- 日期： 2024-01-09
- 狀態： 所有端點均已測試和驗證
- SSL： 已啟用並正確配置
