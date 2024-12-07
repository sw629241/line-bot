import dotenv from 'dotenv';
import { Client } from '@line/bot-sdk';

// 初始化環境變數
dotenv.config();

// 驗證環境變數
const requiredEnvVars = [
    'LINE_CHANNEL_ACCESS_TOKEN_SXI',
    'LINE_CHANNEL_SECRET_SXI',
    'LINE_CHANNEL_ACCESS_TOKEN_FAS',
    'LINE_CHANNEL_SECRET_FAS'
];

// 檢查環境變數
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing LINE bot environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('Some features may not work properly.');
}

// 服務器配置
export const serverConfig = {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 5000,
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-line-signature']
    }
};

// LINE Bot 配置
export const lineConfig = {
    sxi: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_SXI,
        channelSecret: process.env.LINE_CHANNEL_SECRET_SXI
    },
    fas: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_FAS,
        channelSecret: process.env.LINE_CHANNEL_SECRET_FAS
    }
};

// 機器人狀態配置
export const botStatus = {
    sxi: { enabled: true },
    fas: { enabled: true }
};

// 創建 LINE Bot 客戶端
export const lineClients = {
    sxi: new Client(lineConfig.sxi),
    fas: new Client(lineConfig.fas)
};