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
├── src/                    # Source files
├── admin/                  # Admin panel files
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
