/**
 * API 服務類
 * 處理所有與後端的通信
 */
import { messageService } from './messageService.js';

class ApiService {
    constructor() {
        this.config = null;
        this.initialized = false;
        this.currentBot = 'sxi-bot';
        this.baseUrl = '/api'; // 新的 API 基礎路徑
        this.configCache = new Map();
    }

    /**
     * 發送 HTTP 請求的通用方法
     */
    async sendRequest(method, endpoint, data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`發送請求: ${method} ${url}`, data ? `內容: ${JSON.stringify(data)}` : '');
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`請求成功: ${method} ${url}`, result);
            return result;
        } catch (error) {
            console.error(`請求失敗:`, { method, url, error: error.message });
            throw new Error(`請求失敗: ${error.message}`);
        }
    }

    /**
     * Bot 相關方法
     */
    setCurrentBot(botName) {
        this.currentBot = botName;
        this.config = null; // 清除緩存的配置
        // 切換 bot 時清除該 bot 的緩存
        this.configCache.delete(botName);
    }

    getCurrentBot() {
        return this.currentBot;
    }

    /**
     * 配置相關方法
     */
    async getConfig() {
        try {
            if (this.config) {
                return this.config;
            }
            const response = await fetch(`${this.baseUrl}/config/${this.currentBot}`);
            if (!response.ok) {
                throw new Error('Failed to fetch config');
            }
            this.config = await response.json();
            messageService.setBotConfig(this.config);
            return this.config;
        } catch (error) {
            console.error('獲取配置失敗:', error);
            throw error;
        }
    }

    async saveConfig(config) {
        try {
            const response = await fetch(`${this.baseUrl}/config/${this.currentBot}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });
            if (!response.ok) {
                throw new Error('Failed to save config');
            }
            this.config = config; // 更新緩存
            messageService.setBotConfig(config);
            return await response.json();
        } catch (error) {
            console.error('保存配置失敗:', error);
            throw error;
        }
    }

    async init() {
        console.log('初始化 API 服務...');
        try {
            await this.loadConfig();
            this.initialized = true;
            console.log('API 服務初始化完成');
        } catch (error) {
            console.error('初始化 API 服務失敗:', error);
            throw error;
        }
    }

    async loadConfig() {
        try {
            // 檢查緩存
            const cachedConfig = this.configCache.get(this.currentBot);
            if (cachedConfig) {
                console.log('使用緩存的配置');
                this.config = cachedConfig;
                return cachedConfig;
            }

            console.log(`正在加載 ${this.currentBot} 的配置...`);
            const response = await fetch(`${this.baseUrl}/config/${this.currentBot}`);
            if (!response.ok) {
                throw new Error('Failed to fetch config');
            }
            
            const config = await response.json();
            if (!this.validateConfig(config)) {
                throw new Error('Invalid configuration format');
            }

            // 更新緩存
            this.config = config;
            this.configCache.set(this.currentBot, config);
            return config;
        } catch (error) {
            console.error('加載配置失敗:', error);
            throw error;
        }
    }

    async saveConfig(config) {
        try {
            console.log(`正在保存 ${this.currentBot} 的配置...`);
            if (!this.validateConfig(config)) {
                throw new Error('Invalid configuration format');
            }

            const response = await fetch(`${this.baseUrl}/config/${this.currentBot}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error('Failed to save config');
            }

            // 更新緩存
            this.config = config;
            this.configCache.set(this.currentBot, config);
            
            return await response.json();
        } catch (error) {
            console.error('保存配置失敗:', error);
            throw error;
        }
    }

    validateConfig(config) {
        // 基本結構驗證
        if (!config || typeof config !== 'object') return false;
        if (!config.categories || typeof config.categories !== 'object') return false;

        // 驗證每個類別的結構
        for (const category of Object.values(config.categories)) {
            if (!this.validateCategory(category)) return false;
        }

        return true;
    }

    validateCategory(category) {
        // 驗證類別必要欄位
        if (!category || typeof category !== 'object') return false;
        if (!Array.isArray(category.rules)) return false;
        if (typeof category.systemPrompt !== 'string') return false;
        if (typeof category.examples !== 'string') return false;

        // 驗證規則結構
        for (const rule of category.rules) {
            if (!this.validateRule(rule)) return false;
        }

        return true;
    }

    validateRule(rule) {
        // 驗證規則必要欄位
        if (!rule || typeof rule !== 'object') return false;
        if (typeof rule.keywords !== 'string') return false;
        if (typeof rule.response !== 'string') return false;
        if (![0, 50, 100].includes(Number(rule.ratio))) return false;
        if (!['專業', '親切', '少女', '幽默'].includes(rule.style)) return false;

        return true;
    }

    getCurrentConfig() {
        return this.config;
    }

    clearCache() {
        this.configCache.clear();
    }

    /**
     * GPT 相關方法
     */
    async testMessage(message, category) {
        return await messageService.testMessage(message, category);
    }

    /**
     * 日誌相關方法
     */
    async getLogs(type, date) {
        try {
            const response = await fetch(`${this.baseUrl}/logs/${this.currentBot}/${type}/${date}`);
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            return await response.json();
        } catch (error) {
            console.error('獲取日誌失敗:', error);
            throw error;
        }
    }

    async clearLogs(type, date) {
        try {
            const response = await fetch(`${this.baseUrl}/logs/${this.currentBot}/${type}/${date}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to clear logs');
            }
            return await response.json();
        } catch (error) {
            console.error('清除日誌失敗:', error);
            throw error;
        }
    }
}

// 導出單例
export const api = new ApiService();