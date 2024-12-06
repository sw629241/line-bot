import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件路徑
const CONFIG_PATH = {
    'sxi-bot': path.join(__dirname, 'sxi-bot-config.json'),
    'fas-bot': path.join(__dirname, 'fas-bot-config.json')
};

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
router.get('/bots/:botId/config', async (req, res) => {
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
router.post('/bots/:botId/config', async (req, res) => {
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
router.post('/bots/:botId/test', async (req, res) => {
    try {
        const { botId } = req.params;
        const { message, category } = req.body;

        // 讀取機器人配置
        const config = await readConfig(botId);

        // 這裡應該調用 GPT 服務來處理訊息
        // 暫時返回模擬響應
        const response = {
            message: `Bot ${botId} received message: ${message} for category: ${category}`,
            category,
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;