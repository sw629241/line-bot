import express from 'express';
import { middleware } from '@line/bot-sdk';
import { Client } from '@line/bot-sdk';
import cors from 'cors';
import { 
    lineConfig, 
    serverConfig, 
    ensureDirectories,
    loggerConfig
} from './backend/config.js';
import { handleMessageEvent, processMessageWithGPT, handleTestMessage, setupRoutes } from './backend/server.js';

// 確保必要目錄存在
await ensureDirectories();

const app = express();
const { port, cors: corsConfig, static: staticConfig } = serverConfig;

// 啟用 CORS
if (corsConfig.enabled) {
    app.use(cors());
}

// 啟用 JSON 解析中間件
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// 創建 Line clients
const primaryClient = new Client(lineConfig.primary);
const secondaryClient = new Client(lineConfig.secondary);

// 配置靜態檔案服務
app.use(staticConfig.route, express.static('frontend', staticConfig.options));

// 設置 webhook 路由
app.post('/webhook1', middleware(lineConfig.primary), async (req, res) => {
    try {
        const events = req.body.events;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const results = await Promise.all(
            events.map(event => handleMessageEvent(event, 'primary', primaryClient))
        );

        res.json({ results });
    } catch (error) {
        loggerConfig.error('Error handling primary webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/webhook2', middleware(lineConfig.secondary), async (req, res) => {
    try {
        const events = req.body.events;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const results = await Promise.all(
            events.map(event => handleMessageEvent(event, 'secondary', secondaryClient))
        );

        res.json({ results });
    } catch (error) {
        loggerConfig.error('Error handling secondary webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 設置管理介面路由
setupRoutes(app);

// 錯誤處理
app.use((err, req, res, next) => {
    loggerConfig.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// 啟動服務器
app.listen(port, () => {
    loggerConfig.info(`Server is running on port ${port}`);
});

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
    loggerConfig.error('Uncaught Exception:', error);
});
