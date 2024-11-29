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

## 📝 Last Updated
- Date: 2024-01-09
- Status: All endpoints tested and verified
- SSL: Active and properly configured
