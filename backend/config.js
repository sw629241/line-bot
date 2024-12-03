import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { logger } from './utils.js';

// 初始化環境變數
dotenv.config();

// 檔案路徑配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);

// 確保必要目錄存在
export async function ensureDirectories() {
    const dirs = [
        join(ROOT_DIR, 'logs'),
        join(ROOT_DIR, 'frontend'),
        join(ROOT_DIR, 'backend')
    ];
    
    for (const dir of dirs) {
        await mkdir(dir, { recursive: true });
    }
}

// LINE Bot 配置
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

// OpenAI 配置
const openaiConfig = {
    apiKey: process.env.OPENAI_API_KEY
};

// 服務器配置
const serverConfig = {
    port: process.env.PORT || 3000,
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
};

// 加載配置
export function loadConfig() {
    return {
        line: lineConfig,
        openai: openaiConfig,
        server: serverConfig
    };
}

// 導出個別配置
export {
    lineConfig,
    openaiConfig,
    serverConfig
};