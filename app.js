import express from 'express';
import { setupServer } from './backend/server.js';
import { serverConfig } from './backend/config.js';

const app = express();

// 添加詳細的請求日誌中間件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    
    // 監聽響應完成事件
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] Response sent with status: ${res.statusCode}`);
    });
    
    next();
});

// 設置服務器（包含所有路由和中間件）
setupServer(app);

// 啟動服務器
const PORT = serverConfig.port;
const HOST = serverConfig.host;

console.log('Starting server with configuration:');
console.log(`Host: ${HOST}`);
console.log(`Port: ${PORT}`);

// 確保服務器綁定到指定的主機和端口
const server = app.listen(PORT, HOST, () => {
    console.log(`Server is now running and listening on ${HOST}:${PORT}`);
    console.log(`Local access via: http://localhost:${PORT}`);
    console.log(`Network access via: http://10.0.0.8:${PORT}`);
    console.log(`Admin interface available at: http://${HOST}:${PORT}/admin.html`);
}).on('error', (error) => {
    console.error('Server error occurred:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please choose a different port.`);
    }
    process.exit(1);
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
