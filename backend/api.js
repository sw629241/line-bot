import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 日誌中間件
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // 捕獲響應
    const originalSend = res.send;
    res.send = function(body) {
        console.log(`[${new Date().toISOString()}] Response:`, body);
        return originalSend.call(this, body);
    };
    
    next();
});

// 配置文件路徑
const CONFIG_PATH = {
    'sxi-bot': path.join(__dirname, 'sxi-bot-config.json'),
    'fas-bot': path.join(__dirname, 'fas-bot-config.json')
};

// 速率限制配置
const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 分鐘
    maxRequests: 10 // 每個 IP 最多 10 個請求
};

// 存儲請求記錄
const requestLog = new Map();

/**
 * 速率限制中間件
 */
function rateLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    
    // 獲取該 IP 的請求記錄
    let requests = requestLog.get(ip) || [];
    
    // 清理過期的請求記錄
    requests = requests.filter(time => now - time < RATE_LIMIT.windowMs);
    
    // 檢查請求數量是否超過限制
    if (requests.length >= RATE_LIMIT.maxRequests) {
        return res.status(429).json({
            error: '請求過於頻繁，請稍後再試',
            retryAfter: Math.ceil((RATE_LIMIT.windowMs - (now - requests[0])) / 1000)
        });
    }
    
    // 添加新的請求記錄
    requests.push(now);
    requestLog.set(ip, requests);
    
    next();
}

// 定期清理過期的請求記錄
setInterval(() => {
    const now = Date.now();
    for (const [ip, requests] of requestLog.entries()) {
        const validRequests = requests.filter(time => now - time < RATE_LIMIT.windowMs);
        if (validRequests.length === 0) {
            requestLog.delete(ip);
        } else {
            requestLog.set(ip, validRequests);
        }
    }
}, RATE_LIMIT.windowMs);

/**
 * 讀取配置文件
 */
async function readConfig(botId) {
    try {
        const configPath = CONFIG_PATH[botId];
        if (!configPath) {
            throw new Error('Invalid bot ID');
        }
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading config for ${botId}:`, error);
        throw error;
    }
}

/**
 * 保存配置文件
 */
async function writeConfig(botId, config) {
    try {
        const configPath = CONFIG_PATH[botId];
        if (!configPath) {
            throw new Error('Invalid bot ID');
        }
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
        return config;
    } catch (error) {
        console.error(`Error writing config for ${botId}:`, error);
        throw error;
    }
}

/**
 * 驗證配置格式
 */
function validateConfig(config) {
    if (!config || typeof config !== 'object') {
        return false;
    }

    // 檢查必要的配置項
    const requiredFields = ['categories', 'sensitiveWords'];
    return requiredFields.every(field => field in config);
}

// API 路由

/**
 * 獲取機器人配置
 * GET /api/bots/:botId/config
 */
router.get('/bots/:botId/config', rateLimiter, async (req, res) => {
    try {
        const { botId } = req.params;
        const config = await readConfig(botId);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 保存機器人配置
 * POST /api/bots/:botId/config
 */
router.post('/bots/:botId/config', rateLimiter, async (req, res) => {
    try {
        const { botId } = req.params;
        const config = req.body;

        if (!validateConfig(config)) {
            return res.status(400).json({ error: 'Invalid configuration format' });
        }

        const savedConfig = await writeConfig(botId, config);
        res.json(savedConfig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 測試訊息
 * POST /api/bots/:botId/test
 */
router.post('/bots/:botId/test', rateLimiter, async (req, res) => {
    try {
        const { botId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`[${botId}] 開始測試訊息:`, message);

        // 讀取機器人配置
        const config = await readConfig(botId);
        console.log(`[${botId}] 載入配置成功:`, JSON.stringify(config, null, 2));

        // 調用 GPT 服務
        const { analyzeMessage } = await import('./gpt.js');
        console.log(`[${botId}] 開始調用 GPT 服務...`);
        
        const result = await analyzeMessage(message, config.categories);
        console.log(`[${botId}] GPT 分析結果:`, JSON.stringify(result, null, 2));

        // 驗證結果格式
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid GPT response format');
        }

        // 確保所有必要字段都存在
        const requiredFields = ['category', 'intent', 'confidence', 'keywords', 'isSensitive', 'generatedResponse'];
        const missingFields = requiredFields.filter(field => !(field in result));
        
        if (missingFields.length > 0) {
            console.warn(`[${botId}] GPT 響應缺少字段:`, missingFields);
            // 補充缺失的字段
            missingFields.forEach(field => {
                switch (field) {
                    case 'category':
                        result.category = 'chat';
                        break;
                    case 'intent':
                        result.intent = '';
                        break;
                    case 'confidence':
                        result.confidence = 0;
                        break;
                    case 'keywords':
                        result.keywords = [];
                        break;
                    case 'isSensitive':
                        result.isSensitive = false;
                        break;
                    case 'generatedResponse':
                        result.generatedResponse = '';
                        break;
                }
            });
        }

        res.json(result);
    } catch (error) {
        console.error('測試訊息錯誤:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

import { botStatus } from './config.js';

// 獲取機器人狀態
router.get('/bot-status', (req, res) => {
    res.json(botStatus);
});

// 更新機器人狀態
router.put('/bot-status/:botType', (req, res) => {
    const { botType } = req.params;
    const { enabled } = req.body;
    
    if (botType in botStatus) {
        botStatus[botType].enabled = enabled;
        res.json({ status: 'success', botType, enabled });
    } else {
        res.status(400).json({ error: 'Invalid bot type' });
    }
});

export default router;