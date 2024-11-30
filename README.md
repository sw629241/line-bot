# LINE Bot Project

## Overview
A Node.js-based LINE Bot application with dual webhook support, running in Docker with Nginx Proxy Manager for SSL termination.

## Features
- Dual LINE Bot support with separate webhooks
- SSL/TLS encryption via Let's Encrypt
- Docker containerization
- Nginx reverse proxy
- Health check monitoring

## Prerequisites
- Docker and Docker Compose
- Node.js
- Nginx Proxy Manager
- LINE Developer Account
- Domain name with DNS configured

## Installation
1. Clone the repository
```bash
git clone [your-repository-url]
cd linebot
```

2. Create environment file
```bash
cp .env.example .env
# Edit .env with your LINE channel credentials
```

3. Build and start the containers
```bash
docker-compose up -d
```

## Configuration
- Configure Nginx Proxy Manager for your domain
- Set up SSL certificates through Let's Encrypt
- Configure LINE Developer Console with webhook URLs:
  - Primary: https://[your-domain]/webhook1
  - Secondary: https://[your-domain]/webhook2

## Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment
The application is deployed using Docker and Nginx Proxy Manager:
- Application runs on port 80 inside Docker
- Nginx Proxy Manager handles SSL termination
- All traffic is forced to HTTPS

## Environment Variables
Required environment variables:
- LINE_CHANNEL_ACCESS_TOKEN
- LINE_CHANNEL_SECRET
- LINE_CHANNEL_ACCESS_TOKEN_2
- LINE_CHANNEL_SECRET_2

## Project Structure
```
linebot/
├── src/                # Source files
├── admin/             # Admin panel files
│   ├── admin.html    # Admin interface main file
│   ├── components/   # Interface components directory
│   │   ├── header.html        # Page header
│   │   ├── bot-selector.html  # Bot selector
│   │   ├── category-tabs.html # Category tabs
│   │   ├── gpt-settings.html  # GPT settings block
│   │   ├── reply-rules.html   # Reply rules block
│   │   └── test-area.html     # Test area
│   ├── js/          # Backend JavaScript files
│   │   ├── admin.js # Main admin logic
│   │   ├── api.js   # API call functionality
│   │   ├── bot.js   # Bot configuration management
│   │   ├── gpt.js   # GPT related functionality
│   │   └── ui.js    # UI operation functionality
│   ├── fas-bot/     # FAS Bot configuration
│   │   └── config.json
│   └── sxi-bot/     # SXI Bot configuration
│       └── config.json
├── docker-compose.yml      # Docker composition
├── Dockerfile             # Docker build instructions
├── app.js                 # Main application file
└── package.json          # Dependencies and scripts
```

## Health Check
Monitor application health at:
```
https://[your-domain]/health
```

## License
[Your License]

# Line Bot with GPT Integration

這是一個整合了 GPT 功能的 Line Bot 專案，包含管理後台界面。

## 專案結構

```
linebot/
├── src/                # 源代碼目錄
│   └── ...            # Bot 相關代碼
├── admin/             # 管理後台目錄
│   ├── admin.html    # 管理界面主文件
│   ├── components/   # 界面組件目錄
│   │   ├── header.html        # 頁面頭部
│   │   ├── bot-selector.html  # Bot 選擇器
│   │   ├── category-tabs.html # 類別標籤
│   │   ├── gpt-settings.html  # GPT 設定區塊
│   │   ├── reply-rules.html   # 回覆規則區塊
│   │   └── test-area.html     # 測試區域
│   ├── js/          # 後台 JavaScript 文件
│   │   ├── admin.js # 主要管理邏輯
│   │   ├── api.js   # API 調用功能
│   │   ├── bot.js   # Bot 配置管理
│   │   ├── gpt.js   # GPT 相關功能
│   │   └── ui.js    # UI 操作功能
│   ├── fas-bot/     # FAS Bot 配置
│   │   └── config.json
│   └── sxi-bot/     # SXI Bot 配置
│       └── config.json
└── ...
```

## 管理後台功能說明

### 模組說明

1. **API 模組** (api.js)
   - 處理所有 API 請求
   - 包含認證和錯誤處理
   - 提供統一的 API 調用介面

2. **GPT 模組** (gpt.js)
   - 管理 GPT 配置
   - 提供測試功能
   - 處理 GPT 回應生成

3. **Bot 模組** (bot.js)
   - 管理 Bot 配置
   - 處理配置的加載和保存
   - 提供 Bot 相關功能

4. **UI 模組** (ui.js)
   - 處理所有 UI 操作
   - 管理動態元素創建
   - 提供提示和警告功能

5. **管理模組** (admin.js)
   - 協調其他模組
   - 管理全局狀態
   - 處理事件監聽

### Bot 配置說明

- **sxi-bot**: 對應 /webhook1 及其配置
- **fas-bot**: 對應 /webhook2 及其配置

### 功能區塊

#### 標籤功能
每個標籤包含：
1. GPT 設定
2. 回覆規則

#### GPT 設定
1. **提示詞**
   - 作為類別的預設回應
   - 處理無法匹配規則時的回覆

2. **分類範例**
   - 使用 Q&A 形式
   - 提供額外的語義理解參考

#### 回覆規則
1. **關鍵詞**
   - 觸發回覆的語義匹配

2. **固定回覆**
   - 當動態比例為 0 時使用
   - 需要完全相同的回覆

3. **動態比例**
   - 0: 使用完全相同的固定回覆
   - 50: 保持核心信息，允許改變表達
   - 100: 基於核心信息生成全新回覆

4. **語言風格**
   - 專業：使用專業術語和精確描述
   - 親切：平易近人的表達方式
   - 少女：活潑可愛，加入表情符號
   - 幽默：輕鬆詼諧的表達方式

### 訊息處理流程

```
用戶訊息 
  ↓
GPT 處理
  - 判斷語義意圖
  - 確定類別
  - 評估信心度
  - 匹配關鍵詞
  - 生成回覆
  ↓
Bot 處理
  ↓
Line API 發送
```

## 開發說明

### 環境變數
需要在 `.env` 文件中配置：
- LINE_CHANNEL_ACCESS_TOKEN
- LINE_CHANNEL_SECRET
- LINE_CHANNEL_ACCESS_TOKEN_2
- LINE_CHANNEL_SECRET_2
- OPENAI_API_KEY

### 安裝和運行
```bash
npm install
npm start
```

管理後台訪問：`http://your-domain/admin`
