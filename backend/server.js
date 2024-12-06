import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { lineClients, serverConfig } from './config.js';
import { handleWebhook } from './line.js';
import apiRouter from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

export function setupServer(app) {
    // 設置中間件
    app.use(cors(serverConfig.cors));
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;  // 保存原始請求體用於驗證
        }
    }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // 請求日誌中間件
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        if (req.method === 'POST') {
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('Headers:', req.headers);
        }
        next();
    });

    // 設置靜態文件服務（移到最前面）
    app.use(express.static(FRONTEND_DIR));

    // API 路由
    app.use('/api', apiRouter);

    // LINE Bot webhook 路由
    app.post('/webhook1', (req, res) => {
        const client = lineClients.sxi;
        if (!client) {
            console.error('SXI bot client not configured');
            return res.status(400).json({ error: 'Bot not configured' });
        }
        handleWebhook(req, res, 'sxi', client);
    });

    app.post('/webhook2', (req, res) => {
        const client = lineClients.fas;
        if (!client) {
            console.error('FAS bot client not configured');
            return res.status(400).json({ error: 'Bot not configured' });
        }
        handleWebhook(req, res, 'fas', client);
    });

    // 靜態文件路由
    app.get('/', (req, res) => {
        res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
    });

    app.get('/admin.html', (req, res) => {
        res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
    });

    // 錯誤處理中間件
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    // 404 處理
    app.use((req, res) => {
        console.log('404 Not Found:', req.url);
        res.status(404).json({ error: 'Not Found' });
    });
}