import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { loadConfig } from './config.js';
import { processMessageWithGPT } from './gpt.js';
import { handleWebhook, handleTestMessage } from './line.js';
import { logger } from './utils.js';

const config = loadConfig();

// Initialize Express app
const app = express();

// 設置中間件
app.use(cors(config.cors));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 請求日誌中間件
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    next();
});

// 設置路由
app.post('/webhook/:botType', (req, res) => {
    const botType = req.params.botType;
    const client = config.lineClients[botType];
    
    if (!client) {
        logger.error(`Invalid bot type: ${botType}`);
        return res.status(400).json({ error: 'Invalid bot type' });
    }
    
    handleWebhook(req, res, botType, client);
});

app.post('/test-message', handleTestMessage);

// 錯誤處理中間件
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 啟動服務器
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Backend server is running at http://0.0.0.0:${PORT}`);
});

export default app;