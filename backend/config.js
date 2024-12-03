import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { logger } from './utils.js';

// 初始化環境變數
dotenv.config();

// 檔案路徑配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);

// 確保必要目錄存在
const ensureDirectories = async () => {
    const dirs = [
        join(ROOT_DIR, 'logs'),
        join(ROOT_DIR, 'frontend'),
        join(ROOT_DIR, 'backend')
    ];
    
    for (const dir of dirs) {
        await mkdir(dir, { recursive: true });
    }
};

// 加載環境變量
config();

// 配置文件路徑
const CONFIG_FILES = {
    'sxi-bot': join(__dirname, 'sxi-bot-config.json'),
    'fas-bot': join(__dirname, 'fas-bot-config.json')
};

// 加載 bot 配置
async function loadBotConfig(botType) {
    try {
        const configPath = CONFIG_FILES[botType];
        if (!configPath) {
            throw new Error(`Invalid bot type: ${botType}`);
        }
        
        const configData = await readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        logger.error(`Error loading bot configuration for ${botType}:`, error);
        return null;
    }
}

// 基本配置
const baseConfig = {
    port: process.env.PORT || 3000,
    
    // LINE Bot 配置
    line: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
        channelAccessToken2: process.env.LINE_CHANNEL_ACCESS_TOKEN_2,
        channelSecret2: process.env.LINE_CHANNEL_SECRET_2
    },
    
    // OpenAI 配置
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 150
    },
    
    // CORS 配置
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
};

// 導出配置加載函數
export async function loadConfig() {
    try {
        // 加載兩個 bot 的配置
        const [sxiBotConfig, fasBotConfig] = await Promise.all([
            loadBotConfig('sxi-bot'),
            loadBotConfig('fas-bot')
        ]);

        return {
            ...baseConfig,
            bots: {
                'sxi-bot': sxiBotConfig,
                'fas-bot': fasBotConfig
            }
        };
    } catch (error) {
        logger.error('Error loading configuration:', error);
        throw error;
    }
}

// 導出配置文件路徑
export const configPaths = CONFIG_FILES;

// LINE Bot 配置
const lineConfig = {
    primary: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET
    },
    secondary: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_2,
        channelSecret: process.env.LINE_CHANNEL_SECRET_2
    }
};

// OpenAI 配置
const openaiConfig = {
    apiKey: process.env.OPENAI_API_KEY
};

// 伺服器配置
const serverConfig = {
    port: process.env.PORT || 3000,
    cors: {
        enabled: true
    },
    static: {
        route: '/frontend',
        options: {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                } else if (path.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                }
            }
        }
    }
};

// 類別配置
const categoryConfig = {
    required: ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive']
};

// 日誌配置
const loggerConfig = {
    info: (...args) => {
        console.log(new Date().toISOString(), 'INFO:', ...args);
    },
    error: (...args) => {
        console.error(new Date().toISOString(), 'ERROR:', ...args);
    }
};

// 導出配置
export {
    ensureDirectories,
    lineConfig,
    openaiConfig,
    serverConfig,
    categoryConfig,
    loggerConfig,
    ROOT_DIR
};