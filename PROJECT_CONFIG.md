# LINE Bot Project Configuration

## 🔧 System Configuration
- **Environment**: Production
- **Primary Language**: JavaScript
- **Runtime**: Node.js
- **Deployment**: Docker with Nginx Proxy Manager

## 🌐 Server Configuration
- **Domain**: linebot.sxi.com.tw
- **Port**: 80 (internally), 443 (SSL/TLS)
- **SSL**: Enabled with Let's Encrypt
- **Proxy Manager**: nginx-proxy-manager

## 🚪 Endpoints
All endpoints are configured and tested successfully:
- **Main Application**: `https://linebot.sxi.com.tw/`
- **Health Check**: `https://linebot.sxi.com.tw/health`
- **Admin Panel**: `https://linebot.sxi.com.tw/admin`
- **Primary Webhook**: `https://linebot.sxi.com.tw/webhook1`
- **Secondary Webhook**: `https://linebot.sxi.com.tw/webhook2`

## 🔑 Critical Environment Variables
- `LINE_CHANNEL_ACCESS_TOKEN`: Configured 
- `LINE_CHANNEL_SECRET`: Configured 
- `LINE_CHANNEL_ACCESS_TOKEN_2`: Configured 
- `LINE_CHANNEL_SECRET_2`: Configured 

## 🌍 External Services
- **Messaging API**: LINE Messaging API (Primary & Secondary)
- **Proxy Service**: Nginx Proxy Manager
- **SSL Provider**: Let's Encrypt

## 🔗 Webhook Configuration
### Primary Bot (webhook1)
- **URL**: `https://linebot.sxi.com.tw/webhook1`
- **SSL**: Enforced
- **Status**: Verified and Active 

### Secondary Bot (webhook2)
- **URL**: `https://linebot.sxi.com.tw/webhook2`
- **SSL**: Enforced
- **Status**: Verified and Active 

## 🛡️ Security Configurations
- **SSL/TLS**: Enabled and forced for all routes
- **HSTS**: Enabled with max-age=63072000
- **Proxy Headers**:
  - X-Forwarded-Scheme
  - X-Forwarded-Proto
  - X-Forwarded-For
  - X-Real-IP
- **WebSocket Support**: Configured with proper upgrade headers

## 📦 Core Dependencies
- Express.js
- @line/bot-sdk
- Docker
- Nginx Proxy Manager

## 🚀 Deployment Architecture
- Docker containerization
- Nginx reverse proxy with SSL termination
- Single port (80) for container communication
- SSL/TLS handled by Nginx Proxy Manager

## 🔍 Monitoring
- Health check endpoint configured
- Access logs: `/data/logs/proxy-host-2_access.log`
- Error logs: `/data/logs/proxy-host-2_error.log`

## 🔧 Core Functions Documentation

### API Functions (api.js)

#### loadBotConfig(botId)
- **Purpose**: Load bot configuration file
- **Parameters**: 
  - `botId` (string): Bot ID (e.g., 'fas-bot' or 'sxi-bot')
- **Returns**: Promise<Object>
- **Description**: Reads bot configuration from filesystem, returns default config if file doesn't exist

#### callOpenAI(messages)
- **Purpose**: Call OpenAI API
- **Parameters**:
  - `messages` (array): Message array containing role and content
- **Returns**: Promise<string>
- **Description**: Process messages using OpenAI GPT-3.5-turbo model

#### processMessageWithGPT(message, botConfig)
- **Purpose**: Process user message and generate response
- **Parameters**:
  - `message` (string): User message
  - `botConfig` (object): Bot configuration
- **Returns**: Promise<string>
- **Description**: Analyzes user message and generates appropriate response based on configuration

### Webhook Handlers

#### primaryWebhookHandler(req, res)
- **File**: webhook/primary.js
- **Purpose**: Handle primary bot webhook requests
- **Parameters**:
  - `req` (Request): Express request object
  - `res` (Response): Express response object
- **Description**: Processes messages from LINE platform using fas-bot configuration

#### secondaryWebhookHandler(req, res)
- **File**: webhook/secondary.js
- **Purpose**: Handle secondary bot webhook requests
- **Parameters**:
  - `req` (Request): Express request object
  - `res` (Response): Express response object
- **Description**: Processes messages from LINE platform using sxi-bot configuration

### Configuration Structure

#### Bot Configuration Schema
```javascript
{
  categories: {
    products: { systemPrompt: string, examples: string, rules: array },
    prices: { systemPrompt: string, examples: string, rules: array },
    shipping: { systemPrompt: string, examples: string, rules: array },
    promotions: { systemPrompt: string, examples: string, rules: array },
    chat: { systemPrompt: string, examples: string, rules: array },
    noresponse: { systemPrompt: string, examples: string, rules: array }
  }
}
```

### Development Guidelines

1. All asynchronous functions must use async/await syntax
2. Error handling should use try/catch structures
3. All functions should have appropriate error logging
4. Configuration-related functions should handle file-not-found scenarios
5. Webhook handlers should always return appropriate HTTP status codes

## 📝 Last Updated
- Date: 2024-01-09
- Status: All endpoints tested and verified
- SSL: Active and properly configured
