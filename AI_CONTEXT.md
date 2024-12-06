# LINE Bot 專案技術文檔

## 專案架構

### 目錄結構
```
linebot/
├── backend/                # 後端服務
│   ├── api.js             # API 路由和處理
│   ├── config.js          # 配置管理
│   ├── gpt.js             # GPT 整合和處理
│   ├── line.js            # LINE Bot 處理
│   ├── server.js          # 服務器設定
│   └── *-bot-config.json  # 機器人配置文件
├── frontend/              # 前端界面
│   ├── admin.html         # 管理介面
│   ├── admin.js           # 管理邏輯
│   ├── api.js            # API 調用
│   ├── messageService.js  # 訊息處理
│   ├── ui.js             # UI 組件
│   └── styles.css        # 樣式表
└── docker/               # Docker 相關文件
    ├── Dockerfile        # LINE Bot 服務容器
    ├── docker-compose.linebot.yml  # LINE Bot 服務編排
    └── docker-compose.npm.yml      # Nginx 代理管理器編排

### 環境配置
1. 開發環境
   - Node.js v20+
   - PM2 (用於進程管理)
   - Docker & Docker Compose

2. 容器化服務
   - LINE Bot 服務 (Node.js)
   - Nginx Proxy Manager (反向代理)

3. 環境變數
   ```env
   # LINE Bot Configuration (sxi-bot)
   LINE_CHANNEL_ACCESS_TOKEN_SXI=xxx
   LINE_CHANNEL_SECRET_SXI=xxx

   # LINE Bot Configuration (fas-bot)
   LINE_CHANNEL_ACCESS_TOKEN_FAS=xxx
   LINE_CHANNEL_SECRET_FAS=xxx

   # OpenAI Configuration
   OPENAI_API_KEY=xxx

   # Server Configuration
   PORT=5000
   ```

## 開發規範

### 代碼組織
1. 後端代碼
   - 使用 ES Modules (import/export)
   - 按功能模組化分離
   - 配置文件統一管理

2. 前端代碼
   - 模組化 JavaScript
   - 組件式 UI 設計
   - 統一的樣式管理

### 部署流程
1. 開發環境
   ```bash
   npm install
   npm run dev
   ```

2. 生產環境
   ```bash
   # 使用 Docker Compose
   docker-compose -f docker-compose.linebot.yml up -d
   ```

## 注意事項

### 安全性
1. 環境變數
   - 不要在代碼中硬編碼敏感信息
   - 使用 .env 文件管理環境變數
   - 生產環境使用安全的方式傳遞環境變數

2. API 安全
   - LINE Webhook 驗證
   - OpenAI API 密鑰保護
   - 管理介面訪問控制

### 維護建議
1. 日誌管理
   - 使用 PM2 日誌輪轉
   - 定期清理舊日誌
   - 監控錯誤日誌

2. 數據備份
   - 定期備份配置文件
   - 保持環境變數的安全副本
   - 文檔同步更新

3. 性能優化
   - 監控記憶體使用
   - 優化 GPT API 調用
   - 定期檢查並優化數據庫

### 開發建議
1. 代碼風格
   - 使用 ESLint 維護代碼質量
   - 遵循 ES6+ 最佳實踐
   - 保持代碼註釋的完整性

2. 測試策略
   - 單元測試重要功能
   - 集成測試 API 端點
   - 壓力測試關鍵功能

3. 版本控制
   - 使用語義化版本
   - 保持清晰的提交信息
   - 使用功能分支開發
