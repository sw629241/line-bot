import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 添加請求日誌中間件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 設置靜態文件目錄為 frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// 所有請求都返回 index.html
app.get('*', (req, res) => {
    console.log(`Serving index.html for path: ${req.url}`);
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

const PORT = 3001;  // 直接硬編碼端口
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});
