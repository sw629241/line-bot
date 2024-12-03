import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 確保日誌目錄存在
const logDir = path.join(__dirname, '../logs');
await mkdir(logDir, { recursive: true });

// 日誌函數
export const logger = {
    info: (...args) => {
        const timestamp = new Date().toISOString();
        console.log(timestamp, 'INFO:', ...args);
        
        // 這裡可以添加寫入文件的邏輯
    },
    
    error: (...args) => {
        const timestamp = new Date().toISOString();
        console.error(timestamp, 'ERROR:', ...args);
        
        // 這裡可以添加寫入文件的邏輯
    },
    
    debug: (...args) => {
        if (process.env.DEBUG) {
            const timestamp = new Date().toISOString();
            console.debug(timestamp, 'DEBUG:', ...args);
        }
    }
};

// 格式化日期時間
export function formatDateTime(date) {
    return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

// 驗證請求參數
export function validateRequestParams(params, required) {
    const missing = required.filter(param => !params[param]);
    if (missing.length > 0) {
        throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
}

// 安全解析 JSON
export function safeJSONParse(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        logger.error('Error parsing JSON:', error);
        return null;
    }
}

// 延遲函數
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 重試函數
export async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry(fn, retries - 1, delay * 2);
    }
}