import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { loadConfig } from './backend/config.js';
import { handleWebhook, handleTestMessage } from './backend/line.js';
import { logger } from './backend/utils.js';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = loadConfig();

const app = express();

// 設置中間件
app.use(cors(config.cors));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 設置前端目錄的絕對路徑
const frontendPath = path.join(__dirname, 'frontend');
console.log('Frontend directory path:', frontendPath);
console.log('__dirname:', __dirname);

// 檢查 index.html 是否存在
const indexPath = path.join(frontendPath, 'index.html');
console.log('Checking if index.html exists at:', indexPath);
console.log('index.html exists:', existsSync(indexPath));

// 請求日誌中間件
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        url: req.url,
        path: req.path
    });
    console.log('Incoming request:', req.method, req.path);
    console.log('Looking for static file in:', frontendPath);
    next();
});

// 所有請求都先嘗試匹配靜態文件
app.use(express.static(frontendPath));

// LINE Bot Webhook 端點
app.post('/webhook/:botType', (req, res) => {
    const botType = req.params.botType;
    const client = config.lineClients[botType];
    
    if (!client) {
        logger.error(`Invalid bot type: ${botType}`);
        return res.status(400).json({ error: 'Invalid bot type' });
    }
    
    handleWebhook(req, res, botType, client);
});

// 測試消息端點
app.post('/test-message', handleTestMessage);

// 所有其他請求都返回 index.html
app.get('*', (req, res) => {
    console.log('Fallback route for:', req.path);
    console.log('Sending file:', indexPath);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error sending file');
        } else {
            console.log('File sent successfully');
        }
    });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running at http://0.0.0.0:${PORT}`);
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    logger.info(`Serving static files from: ${frontendPath}`);
    console.log(`Serving static files from: ${frontendPath}`);
});
